#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

require 'rexml/document'

require_relative 'datastore'
require_relative 'backup'
require_relative 'shell'

module TransferManager

    # Ceph utils
    class Ceph

        # VM with Ceph disk initialization
        class VM < TransferManager::VM

            def initialize(vm_xml, vm_dir)
                disks = Disk.from_vm(vm_xml)

                super(vm_xml, vm_dir, disks)
            end

        end

        # Ceph disks
        class Disk

            # DON'T CHANGE THIS CONSTANT; will break existing incremental backups
            INC_SNAP_PREFIX  = 'one_backup_'

            attr_reader :id, :vmid, :source, :clone, :rbd_image, :rbd_cmd

            # @param vm_xml [String, REXML::Element]
            # @param disk_xml [String, REXML::Document, REXML::Element]
            # @return [Disk]
            def initialize(vm_xml, disk_xml)
                vm_xml = REXML::Document.new(vm_xml) if vm_xml.is_a?(String)
                disk_xml = REXML::Document.new(disk_xml) if disk_xml.is_a?(String)

                @vm   = vm_xml
                @vmid = @vm.elements['TEMPLATE/VMID'].text
                @id   = disk_xml.elements['DISK_ID'].text.to_i
                @type = disk_xml.elements['TYPE'].text
                @pool = disk_xml.elements['POOL_NAME'].text

                if volatile?
                    @source      = nil
                    @clone       = nil
                    @rbd_image   = "#{@pool}/one-sys-#{@vmid}-#{id}"
                else
                    @source      = disk_xml.elements['SOURCE'].text
                    @clone       = disk_xml.elements['CLONE'].text == 'YES'
                    @rbd_image   =
                        if @clone
                            "#{@source}-#{@vmid}-#{@id}"
                        else
                            @source
                        end
                end

                ceph_user  = disk_xml.elements['CEPH_USER']&.text
                ceph_key   = disk_xml.elements['CEPH_KEY']&.text
                ceph_conf  = disk_xml.elements['CEPH_CONF']&.text

                @ceph_env = []
                @ceph_env << "CEPH_USER=\"#{ceph_user}\"" if ceph_user && !ceph_user.empty?
                @ceph_env << "CEPH_CONF=\"#{ceph_conf}\"" if ceph_conf && !ceph_conf.empty?
                @ceph_env << "CEPH_KEY=\"#{ceph_key}\""   if ceph_key && !ceph_key.empty?

                @ceph_env = @ceph_env.join(' ')

                @rbd_cmd = 'rbd'
                @rbd_cmd += Ceph.xml_opt(disk_xml, 'CEPH_USER', '--id')
                @rbd_cmd += Ceph.xml_opt(disk_xml, 'CEPH_CONF', '--conf')
                @rbd_cmd += Ceph.xml_opt(disk_xml, 'CEPH_KEY', '--keyfile')

                bc   = @vm.elements['BACKUPS/BACKUP_CONFIG']
                mode = bc.elements['MODE']&.text if bc

                @vm_backup_config =
                    if 'INCREMENT'.casecmp?(mode)
                        {
                            :mode => :increment,
                            :last_increment => bc.elements['LAST_INCREMENT_ID'].text.to_i
                        }
                    else
                        {
                            :mode => :full
                        }
                    end
            end

            def volatile?
                ['fs', 'swap'].include?(@type)
            end

            # @param filter [nil, {type: [:prefix, :eq], text: String}]
            def rm_snaps_sh(filter = nil, image = @rbd_image)
                jqfilter =
                    if filter.nil?
                        nil
                    elsif filter[:type] == :prefix
                        ".name | startswith(\"#{filter[:text]}\")"
                    elsif filter[:type] == :eq
                        ".name == \"#{filter[:text]}\""
                    end
                rmfilter = "| select(#{jqfilter})" if jqfilter

                <<~EOF
                    #{@rbd_cmd} snap ls #{image} --format json | \
                        jq -r '.[] #{rmfilter} .name' | \
                        xargs -rn1 sh -c ' \
                            #{@rbd_cmd} snap unprotect #{image}@$1 > /dev/null 2>&1 || true; \
                            #{@rbd_cmd} snap rm #{image}@$1; \
                        ' sh
                EOF
            end

            # @param backup_dir [String]
            # @param ds [TransferManager::Datastore]
            # @param live [Boolean]
            # @param format [String, nil] 'rbd' for rbdiff format, nil for raw
            # @return [Disk]
            def backup_cmds(backup_dir, ds, live, format = nil)
                snap_cmd = ''
                expo_cmd = ''

                snap_clup = ''
                expo_clup = ''

                backup_util = '/var/tmp/one/tm/lib/backup_rbd.rb'

                if @vm_backup_config[:mode] == :full
                    # Full backup
                    draw = "#{backup_dir}/disk.#{@id}.raw"
                    ddst = "#{backup_dir}/disk.#{@id}.0"

                    if live
                        snapshot = "#{@rbd_image}@one_backup"

                        snap_cmd << "#{@rbd_cmd} snap create #{snapshot}\n"
                        expo_cmd << ds.cmd_confinement(
                            "#{@rbd_cmd} export #{snapshot} #{draw}\n",
                            backup_dir
                        )
                        snap_clup << "#{@rbd_cmd} snap rm #{snapshot}\n"
                    else
                        expo_cmd << ds.cmd_confinement(
                            "#{@rbd_cmd} export #{@rbd_image} #{draw}\n",
                            backup_dir
                        )
                    end

                    expo_cmd << ds.cmd_confinement(
                        "qemu-img convert -m 4 -O qcow2 #{draw} #{ddst}\n",
                        backup_dir
                    )

                    expo_clup << "rm -f #{draw}\n"

                    # Remove old incremental snapshots after starting a full one
                    snap_clup << rm_snaps_sh({ :type => :prefix, :text => INC_SNAP_PREFIX })

                elsif @vm_backup_config[:last_increment] == -1
                    # First incremental backup (similar to full but snapshot must be preserved)
                    incid = 0

                    dexp     = "#{backup_dir}/disk.#{@id}.#{incid}"
                    snapshot = "#{@rbd_image}@#{INC_SNAP_PREFIX}#{incid}"

                    snap_cmd << <<~EOF
                        #{rm_snaps_sh({ :type => :prefix, :text => INC_SNAP_PREFIX })}
                        #{@rbd_cmd} snap create #{snapshot}
                        #{@rbd_cmd} snap protect #{snapshot}
                    EOF

                    expo_cmd << ds.cmd_confinement(
                        "env #{@ceph_env} " +
                        "ruby #{backup_util} #{@rbd_image} NONE #{snapshot} #{dexp}\n",
                        backup_dir
                    )
                else
                    # Incremental backup
                    incid = @vm_backup_config[:last_increment] + 1

                    dinc     = "#{backup_dir}/disk.#{@id}.#{incid}"
                    snapshot = "#{@rbd_image}@one_backup_#{incid}"

                    last_snap = "one_backup_#{@vm_backup_config[:last_increment]}"

                    snap_cmd << "#{@rbd_cmd} snap create #{snapshot}\n"
                    snap_cmd << "#{@rbd_cmd} snap protect #{snapshot}\n"

                    if format == 'rbd'
                        dinc += '.rbdiff'

                        expo_cmd << ds.cmd_confinement(
                            "#{@rbd_cmd} export-diff " \
                            "--from-snap #{last_snap} #{snapshot} #{dinc}\n",
                            backup_dir
                        )
                    else
                        expo_cmd << ds.cmd_confinement(
                            "env #{@ceph_env} " +
                            "ruby #{backup_util} #{@rbd_image} #{last_snap} #{snapshot} #{dinc}\n",
                            backup_dir
                        )
                    end

                    old_snapshot = "one_backup_#{@vm_backup_config[:last_increment]}"
                    snap_clup << rm_snaps_sh({ :type => :eq, :text => old_snapshot })
                end

                {
                    :snapshot      => snap_cmd,
                    :export        => expo_cmd,
                    :snapshot_clup => snap_clup,
                    :export_clup   => expo_clup,
                    :cleanup       => snap_clup + expo_clup
                }
            end

            # @param target [String] the RBD image name where to import
            # @param ds [TransferManager::Datastore] the target datastore
            # @param bridge [Boolean, nil] host from where to execute this operation
            # @return [String] the script
            def restore_sh(target, ds, bridge = nil)
                ec_pool_name = ds['TEMPLATE/EC_POOL_NAME']

                # EC parameters (--data-pool) are only accepted in some `rbd` commands. It's not
                # officially documented but at least the following ones require it:
                # - create
                # - import
                rbdec_cmd = @rbd_cmd.clone
                rbdec_cmd << " --data-pool #{ec_pool_name}" unless ec_pool_name.empty?

                <<~EOF
                    # Upload base image and snapshot
                    #{TransferManager::Shell.sshwrap(bridge, "#{rbdec_cmd} import --export-format 2 - #{target}")} < disk.*.rbd2

                    # Apply increments
                    for f in $(ls disk.*.*.rbdiff | sort -k3 -t.); do
                        #{TransferManager::Shell.sshwrap(bridge, "#{@rbd_cmd} import-diff - #{target}")} < $f
                    done

                    # Delete snapshots
                    #{TransferManager::Shell.sshwrap(bridge, rm_snaps_sh({ :type => :prefix, :text => INC_SNAP_PREFIX }, target))}
                EOF
            end

            # @return [String] Shell definitions for functionality related to this disk
            def shdefs
                <<~SCRIPT
                    rbd_rm_image() {
                        image="$1"

                        snapshots="$(#{@rbd_cmd} snap ls "$image" 2>/dev/null| awk 'NR > 1 {print $2}')"
                        for snapshot in $snapshots; do
                            rbd_rm_snapshot "$image@$snapshot"
                        done
                        #{@rbd_cmd} rm "$image"
                    }

                    rbd_rm_snapshot() {
                        snapshot="$1"

                        children="$(#{@rbd_cmd} children "$snapshot" 2>/dev/null)"

                        for child in $children; do
                            rbd_rm_image "$child"
                        done

                        #{@rbd_cmd} snap unprotect "$snapshot"
                        #{@rbd_cmd} snap rm "$snapshot"
                    }
                SCRIPT
            end

            ####################################################################
            ## CLASS METHODS

            # @param vm_xml [String, REXML::Document, REXML::Element]
            # @return [Array(Disk), nil] indexed VM disks (disk id = position in array)
            def self.from_vm(vm_xml)
                vm_xml  = REXML::Document.new(vm_xml) if vm_xml.is_a?(String)
                vm      = vm_xml.root

                indexed_disks = []
                vm.elements.each('TEMPLATE/DISK[TYPE="RBD"]') do |d|
                    disk = new(vm, d)
                    indexed_disks[disk.id] = disk
                end

                indexed_disks
            end

        end

        def self.xml_opt(disk_xml, name, opt)
            opt_val = disk_xml.elements[name].text
            " #{opt} #{opt_val}" unless opt_val.empty?
        rescue StandardError
            ''
        end

    end

end
