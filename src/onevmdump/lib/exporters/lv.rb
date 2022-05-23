# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

require_relative 'base'

# OneVMDump module
#
# Module for exporting VM content into a bundle file
module OneVMDump

    # BlockExporer class
    # It exports the content from LVs into a bundle
    class LVExporter < BaseExporter

        private

        def export_disk_live(disk_id)
            # Freeze filesystem
            rc = @cmd.run('virsh', '-c', 'qemu:///system', 'domfsfreeze',
                          "one-#{@vm.id}")

            unless rc[2].success?
                raise "Error freezing domain: #{rc[1]}"
            end

            # Take LV snapshot
            # TODO: Crete snapshot of proportional size of the disk?
            begin
                lv        = get_device(disk_id)
                snap_name = "#{File.basename(lv)}-backup-snap"

                rc = @cmd.run('sudo', 'lvcreate', '-s', '-L', '1G', '-n',
                              snap_name, lv)
            ensure
                @cmd.run('virsh', '-c', 'qemu:///system', 'domfsthaw',
                         "one-#{@vm.id}")
            end

            unless rc[2].success?
                raise "Error creating snapshot for #{lv}: #{rc[1]}"
            end

            # Dump content
            snap_lv  = "#{File.dirname(lv)}/#{snap_name}"
            dst_path = dst_path(disk_id)
            rc = @cmd.run('dd', "if=#{snap_lv}", "of=#{dst_path}")

            unless rc[2].success?
                raise "Error writting '#{snap_lv}' content into #{dst_path}:" \
                      " #{rc[1]}"
            end
        ensure
            @cmd.run('sudo', 'lvremove', '-f', snap_lv) if snap_lv
        end

        def export_disk_cold(disk_id)
            device = get_device(disk_id)
            dst_path = dst_path(disk_id)
            active = check_active(device)

            # Activate LV
            if !active
                rc = @cmd.run('lvchange', '-ay', device)

                msg = "Error activating '#{device}': #{rc[1]}"
                raise msg unless rc[2].success?
            end

            # Dump content
            rc = @cmd.run('dd', "if=#{device}", "of=#{dst_path}")

            unless rc[2].success?
                raise "Error writting '#{device}' content into" \
                      " #{dst_path}: #{rc[1]}"
            end
        ensure
            # Ensure LV is in the same state as before
            @cmd.run('lvchange', '-an', device) unless active
        end

        ########################################################################
        # Helpers
        ########################################################################

        def get_device(disk_id)
            "/dev/vg-one-#{@sys_ds_id}/lv-one-#{@vm.id}-#{disk_id}"
        end

        def check_active(device)
            @cmd.run('test', '-e', device)[2].success?
        end

        def dst_path(disk_id)
            "#{@tmp_path}/backup.disk.#{disk_id}"
        end

    end

end
