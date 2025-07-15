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

require_relative 'backup'
require_relative 'datastore'

module TransferManager

    # LVM utils
    class LVM

        # VM with LVM disk initialization
        class VM < TransferManager::VM

            def initialize(vm_xml)
                disks = Disk.from_vm(vm_xml)

                super(vm_xml, disks)
            end

        end

        # LVM disks
        class Disk

            attr_reader :id, :vmid, :lv

            # @param vm_xml [String, REXML::Element]
            # @param disk_xml [String, REXML::Document, REXML::Element]
            # @return [Disk]
            def initialize(vm_xml, disk_xml)
                vm_xml = REXML::Document.new(vm_xml) if vm_xml.is_a?(String)
                disk_xml = REXML::Document.new(disk_xml) if disk_xml.is_a?(String)

                @vm   = vm_xml
                @vmid = @vm.elements['TEMPLATE/VMID'].text
                @id   = disk_xml.elements['DISK_ID'].text.to_i

                @dsid = @vm.elements['HISTORY_RECORDS/HISTORY[last()]/DS_ID'].text.to_i
                @vg   = "vg-one-#{@dsid}"
                @lv   = "lv-one-#{@vmid}-#{@id}"

                @is_thin = disk_xml.elements['LVM_THIN_ENABLE']&.text&.downcase == 'yes'
                if @is_thin
                    @pool = "lv-one-#{@vmid}-pool"
                end

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

            def qual(lv)
                "#{@vg}/#{lv}"
            end

            def path(lv)
                "/dev/#{@vg}/#{lv}"
            end

            # @param backup_dir [String]
            # @param ds [TransferManager::Datastore]
            # @param live [Boolean]
            # @param _format [String, nil] Unused. Included for compatibility with ceph.rb.
            # @return [Disk]
            def backup_cmds(backup_dir, ds, live, _format = nil)
                snap_cmd = ''
                expo_cmd = ''
                clup_cmd = ''

                # Supported configurations
                # Legend: (T)hin, (F)at
                # |      | Live | Poweroff |
                # | Full |    T |       TF |
                # | Incr |    - |        - |
                # rubocop:disable Style/GuardClause
                if @vm_backup_config[:mode] == :full
                    ddst = "#{backup_dir}/disk.#{@id}.0"
                    orig = nil

                    if live
                        if @is_thin
                            # Full, live, thin: create temporary thin snapshot and copy from it
                            snapshot = "#{@lv}_one_backup"
                            orig = path(snapshot)

                            snap_cmd << "sudo lvcreate -s -n #{snapshot} #{qual(@lv)}\n"
                            clup_cmd << "sudo lvremove -y #{qual(snapshot)}\n"
                        else
                            # Full, live, non-thin: UNSUPPORTED
                            return
                        end
                    else
                        # Full, offline: just qemu-convert the disk
                        orig = path(@lv)
                    end

                    expo_cmd << ds.cmd_confinement(<<~EOF, backup_dir)
                        sudo lvchange -K -ay #{orig}
                        qemu-img convert -m 4 -O qcow2 #{orig} #{ddst}
                    EOF

                else
                    # Incremental: not implemented
                    return
                end
                # rubocop:enable Style/GuardClause

                {
                    :snapshot => snap_cmd,
                    :export => expo_cmd,
                    :cleanup => clup_cmd
                }
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
                    dd if='#{qcow_path}.raw' of='#{path(@lv)}' bs=64k conv=sparse
                    rm '#{qcow_path}.raw'
                EOS
                cleanup_cmd = "rm -f '#{qcow_path}' '#{qcow_path}.raw'"
                [restore_cmds, cleanup_cmd]
            end

            ####################################################################
            ## CLASS METHODS

            # @param vm_xml [String, REXML::Document, REXML::Element]
            # @return [Array(Disk), nil] indexed VM disks (disk id = position in array)
            def self.from_vm(vm_xml)
                vm_xml  = REXML::Document.new(vm_xml) if vm_xml.is_a?(String)
                vm      = vm_xml.root

                indexed_disks = []
                vm.elements.each('TEMPLATE/DISK[TYPE="BLOCK"]') do |d|
                    disk = new(vm, d)
                    indexed_disks[disk.id] = disk
                end

                indexed_disks
            end

        end

    end

end
