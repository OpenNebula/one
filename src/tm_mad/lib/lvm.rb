#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

require 'json'
require 'rexml/document'
require 'shellwords'

require_relative 'backup'
require_relative 'datastore'
require_relative '../../datastore/lvm'

module TransferManager

    # LVM utils
    class LVM

        # VM with LVM disk initialization
        class VM < TransferManager::VM

            def initialize(vm_xml, vm_dir)
                disks = Disk.from_vm(vm_xml)

                super(vm_xml, vm_dir, disks)
            end

        end

        # LVM disks
        class Disk

            # DON'T CHANGE THIS CONSTANT; will break existing incremental backups
            INC_SNAP_PREFIX  = 'one_backup_'

            attr_reader :id, :vmid, :lv

            # @param vm_xml [String, REXML::Element]
            # @param disk_xml [String, REXML::Document, REXML::Element]
            # @return [Disk]
            def initialize(vm_xml, disk_xml)
                vm_xml = REXML::Document.new(vm_xml) if vm_xml.is_a?(String)
                disk_xml = REXML::Document.new(disk_xml) if disk_xml.is_a?(String)

                @tm_mad = disk_xml.elements['TM_MAD'].text

                @vm   = vm_xml
                @vmid = @vm.elements['TEMPLATE/VMID'].text
                @id   = disk_xml.elements['DISK_ID'].text.to_i
                @size = disk_xml.elements['SIZE'].text.to_i

                imageid = disk_xml.elements['IMAGE_ID']&.text
                is_persistent = disk_xml.elements['PERSISTENT']&.text&.downcase == 'yes'
                imgds_id = disk_xml.elements['DATASTORE_ID'].text.to_i
                sysds_id = @vm.elements['HISTORY_RECORDS/HISTORY[last()]/DS_ID'].text.to_i

                if @tm_mad == 'lvm'
                    # Volatile disks carry the system DS as their DATASTORE_ID
                    vgds_id =
                        if imageid
                            imgds_id
                        else
                            @vm.elements[
                                'TEMPLATE/DISK[TM_MAD="lvm"]/DATASTORE_ID'
                            ].text.to_i
                        end

                    @vgname = "vg-one-#{vgds_id}"
                    @is_thin = true
                    if is_persistent
                        @lvname   = "img-one-#{imageid}"
                        @poolname = "img-one-#{imageid}-pool"
                    else
                        @lvname   = "vm-one-#{@vmid}-#{@id}"
                        @poolname = "vm-one-#{@vmid}-pool"
                    end
                else
                    @vgname   = "vg-one-#{sysds_id}"
                    @is_thin  = disk_xml.elements['LVM_THIN_ENABLE']&.text&.downcase == 'yes'
                    @lvname   = "lv-one-#{@vmid}-#{@id}"
                    @poolname = "lv-one-#{@vmid}-pool" if @is_thin
                end

                @pool = MAD::ThinPool.new(@vgname, @poolname) if @is_thin

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

                interactive = bc.elements['INTERACTIVE']&.text if bc
                @interactive = interactive&.casecmp('YES')&.zero? || false
            end

            def qual(lv)
                "#{@vgname}/#{lv}"
            end

            def path(lv)
                "/dev/#{@vgname}/#{lv}"
            end

            # @param backup_dir [String]
            # @param ds [TransferManager::Datastore]
            # @param live [Boolean]
            # @param _format [String, nil] Unused. Included for compatibility with ceph.rb.
            # @return [Disk]
            def backup_cmds(backup_dir, ds, live, _format = nil)
                snap_cmd    = ''
                expo_cmd    = ''
                snap_clup   = ''
                backup_util = '/var/tmp/one/tm/lib/backup_lvmthin.rb'

                if @interactive
                    return backup_cmds_interactive(backup_dir, ds, live, backup_util)
                end

                # Supported configurations
                # Legend: (T)hin, (F)at
                # |      | Live | Poweroff |
                # | Full |    T |       TF |
                # | Incr |    T |        T |
                # rubocop:disable Style/GuardClause
                if @vm_backup_config[:mode] == :full
                    ddst = "#{backup_dir}/disk.#{@id}.0"
                    orig = nil

                    if live
                        if @is_thin
                            # Full, live, thin: create temporary thin snapshot and copy from it
                            snapshot = "#{@lvname}_one_backup"
                            orig = path(snapshot)

                            snap_cmd << lvm_lock_sh(
                                "sudo lvcreate -s -n #{snapshot} #{qual(@lvname)}"
                            )
                            snap_clup << lvm_lock_sh("sudo lvremove -y #{qual(snapshot)}")
                        else
                            # Full, live, non-thin: UNSUPPORTED
                            return
                        end
                    else
                        # Full, offline: just qemu-convert the disk
                        orig = path(@lvname)
                    end

                    expo_cmd << ds.cmd_confinement(<<~EOF, backup_dir)
                        #{lvm_lock_sh("sudo lvchange -K -ay #{orig}").strip}
                        qemu-img convert -m 4 -O qcow2 #{orig} #{ddst}
                    EOF
                elsif @vm_backup_config[:last_increment] == -1
                    # First incremental backup (initial full backup)
                    return unless @is_thin

                    incid     = 0
                    dexp      = "#{backup_dir}/disk.#{@id}.#{incid}"
                    snap_curr = "#{@lvname}_#{INC_SNAP_PREFIX}#{incid}"
                    snap_path = path(snap_curr)

                    snap_cmd << lvm_lock_sh(<<~EOF)
                        sudo lvremove -y #{qual(snap_curr)} || true
                        sudo lvcreate -s -n #{snap_curr} #{qual(@lvname)}
                        #{@pool.adjust_sh if @pool}
                    EOF

                    expo_cmd << ds.cmd_confinement(<<~EOF, backup_dir)
                        sudo lvchange -K -ay #{snap_path}
                        qemu-img convert -m 4 -O qcow2 #{snap_path} #{dexp}
                    EOF

                    snap_clup << lvm_lock_sh("sudo lvchange -K -an #{snap_path}")
                else
                    # Incremental backup
                    return unless @is_thin

                    incid     = @vm_backup_config[:last_increment] + 1
                    dinc      = "#{backup_dir}/disk.#{@id}.#{incid}"
                    snap_curr = "#{@lvname}_#{INC_SNAP_PREFIX}#{incid}"
                    snap_prev = "#{@lvname}_#{INC_SNAP_PREFIX}#{@vm_backup_config[:last_increment]}"

                    snap_cmd << lvm_lock_sh(<<~EOF)
                        sudo lvchange --refresh #{qual(@poolname)}
                        sudo lvremove -y #{qual(snap_curr)} || true
                        sudo lvcreate -s -n #{snap_curr} #{qual(@lvname)}
                        #{@pool.adjust_sh if @pool}
                    EOF

                    expo_cmd << ds.cmd_confinement(
                        "ruby #{backup_util} #{qual(@lvname)} " \
                        "#{qual(snap_prev)} #{qual(snap_curr)} #{dinc}\n",
                        backup_dir
                    )

                    snap_clup << lvm_lock_sh("sudo lvremove -y #{qual(snap_prev)}")
                end
                # rubocop:enable Style/GuardClause

                {
                    :snapshot      => snap_cmd,
                    :export        => expo_cmd,
                    :snapshot_clup => snap_clup,
                    :export_clup   => '',
                    :cleanup       => snap_clup
                }
            end

            def backup_cmds_interactive(backup_dir, ds, live, backup_util)
                snap_cmd  = ''
                expo_cmd  = ''
                snap_clup = ''

                # Supported configurations
                # Legend: (T)hin, (F)at
                # |      | Live | Poweroff |
                # | Full |    T |       TF |
                # | Incr |    T |        T |
                # rubocop:disable Style/GuardClause
                if @vm_backup_config[:mode] == :full
                    ddst = "#{backup_dir}/disk.#{@id}.0"
                    orig = nil

                    if live
                        # Full, live, non-thin: UNSUPPORTED
                        return unless @is_thin

                        snapshot = "#{@lvname}_one_backup"
                        orig = path(snapshot)

                        snap_cmd << lvm_lock_sh(
                            "sudo lvcreate -s -n #{snapshot} #{qual(@lvname)}"
                        )
                        snap_clup << lvm_lock_sh("sudo lvremove -y #{qual(snapshot)}")
                    else
                        orig = path(@lvname)
                    end

                    expo_cmd << ds.cmd_confinement(<<~EOF, backup_dir)
                        #{lvm_lock_sh("sudo lvchange -K -ay #{orig}").strip}
                        #{write_exports(
                            backup_dir,
                            :source   => orig,
                            :target   => ddst,
                            :exporter => 'lvm',
                            :format   => 'qcow2',
                            :mode     => 'full',
                            :size     => @size
                        )}
                    EOF
                elsif @vm_backup_config[:last_increment] == -1
                    # First interactive incremental backup (initial full backup)
                    return unless @is_thin

                    incid     = 0
                    dexp      = "#{backup_dir}/disk.#{@id}.#{incid}"
                    snap_curr = "#{@lvname}_#{INC_SNAP_PREFIX}#{incid}"
                    snap_path = path(snap_curr)

                    snap_cmd << lvm_lock_sh(<<~EOF)
                        sudo lvremove -y #{qual(snap_curr)} || true
                        sudo lvcreate -s -n #{snap_curr} #{qual(@lvname)}
                        #{@pool.adjust_sh if @pool}
                    EOF

                    expo_cmd << ds.cmd_confinement(<<~EOF, backup_dir)
                        #{lvm_lock_sh("sudo lvchange -K -ay #{snap_path}").strip}
                        #{write_exports(
                            backup_dir,
                            :source   => snap_path,
                            :target   => dexp,
                            :exporter => 'lvm',
                            :format   => 'qcow2',
                            :mode     => 'full',
                            :size     => @size
                        )}
                    EOF

                    snap_clup << lvm_lock_sh("sudo lvchange -K -an #{snap_path}")
                else
                    # Interactive incremental backup
                    return unless @is_thin

                    incid     = @vm_backup_config[:last_increment] + 1
                    dinc      = "#{backup_dir}/disk.#{@id}.#{incid}"
                    snap_curr = "#{@lvname}_#{INC_SNAP_PREFIX}#{incid}"
                    snap_prev = "#{@lvname}_#{INC_SNAP_PREFIX}" \
                                "#{@vm_backup_config[:last_increment]}"
                    snap_path = path(snap_curr)

                    snap_cmd << lvm_lock_sh(<<~EOF)
                        sudo lvchange --refresh #{qual(@poolname)}
                        sudo lvremove -y #{qual(snap_curr)} || true
                        sudo lvcreate -s -n #{snap_curr} #{qual(@lvname)}
                        #{@pool.adjust_sh if @pool}
                    EOF

                    expo_cmd << ds.cmd_confinement(
                        "ruby #{backup_util} --interactive #{qual(@lvname)} " \
                        "#{qual(snap_prev)} #{qual(snap_curr)} #{dinc} " \
                        "#{@id} #{@size}\n",
                        backup_dir
                    )

                    snap_clup << lvm_lock_sh("sudo lvchange -K -an #{snap_path}")
                    snap_clup << lvm_lock_sh("sudo lvremove -y #{qual(snap_prev)}")
                end

                {
                    :snapshot      => snap_cmd,
                    :export        => expo_cmd,
                    :snapshot_clup => snap_clup,
                    :export_clup   => '',
                    :cleanup       => snap_clup,
                    :start_onebex  => true
                }
            end

            def write_exports(backup_dir, data)
                exports_path = "#{backup_dir}/interactive_exports.json"
                json_data    = Shellwords.escape(JSON.generate(data))

                <<~EOF
                    ruby -rjson - #{exports_path} #{@id} #{json_data} <<'RUBY'
                        path, disk_id, data = ARGV
                        content = File.exist?(path) ? File.read(path) : ''
                        exports = content.empty? ? {} : JSON.parse(content)
                        exports[disk_id.to_s] = JSON.parse(data)

                        File.open(path, 'w') do |f|
                            f.write(JSON.pretty_generate(exports))
                        end
                    RUBY
                EOF
            end

            # Process:
            # - convert qcow2 to sparse raw (qemu-img)
            # - copy the sparse raw to the thin volume (dd)
            #
            # In theory, one should be able to just use qemu-img to convert the qcow2 and write the
            # result to the thin volume. BUT, currently, the result is that zeroes get written too
            # and the volume gets filled. So that's the reason for this longer process. More info:
            # https://lists.nongnu.org/archive/html/qemu-discuss/2017-02/msg00079.html
            def restore_cmds(qcow_path)
                restore_cmds = <<~EOS
                    qemu-img convert -m 4 -O raw '#{qcow_path}' '#{qcow_path}.raw'
                    rm '#{qcow_path}'
                    dd if='#{qcow_path}.raw' of='#{path(@lvname)}' bs=64k conv=sparse,fsync
                    rm '#{qcow_path}.raw'
                EOS
                cleanup_cmd = "rm -f '#{qcow_path}' '#{qcow_path}.raw'"
                [restore_cmds, cleanup_cmd]
            end

            def lvm_lock_sh(sh)
                MAD::LVMWrapper.with_lvm_lock_sh(@vgname, sh)
            end

            ####################################################################
            ## CLASS METHODS

            # @param vm_xml [String, REXML::Document, REXML::Element]
            # @return [Array(Disk), nil] indexed VM disks (disk id = position in array)
            def self.from_vm(vm_xml)
                vm_xml  = REXML::Document.new(vm_xml) if vm_xml.is_a?(String)
                vm      = vm_xml.root

                indexed_disks = []
                vm.elements.each('TEMPLATE/DISK') do |d|
                    type      = d.elements['TYPE']&.text&.upcase
                    disk_type = d.elements['DISK_TYPE']&.text&.upcase

                    next unless type == 'BLOCK' || (type == 'FS' && disk_type == 'BLOCK')

                    disk = new(vm, d)
                    indexed_disks[disk.id] = disk
                end

                indexed_disks
            end

        end

    end

end
