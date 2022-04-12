# -------------------------------------------------------------------------- #
# Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                #
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

    # FileExporter class
    class FileExporter < BaseExporter

        private

        #######################################################################
        # Export methods used by base
        #######################################################################

        def export_disk_live(disk_id)
            type = file_type(disk_path(disk_id))

            case type
            when :qcow2
                export_qcow2_live(disk_id)
            when :raw, :cdrom
                export_raw_live(disk_id)
            end
        end

        def export_disk_cold(disk_id)
            type = file_type(disk_path(disk_id))

            case type
            when :qcow2
                export_qcow2_cold(disk_id)
            when :raw, :cdrom
                export_raw_cold(disk_id)
            end
        end

        #######################################################################
        # RAW export methods
        #######################################################################
        def export_raw_cold(disk_id)
            path = disk_path(disk_id)
            dst_path = "#{@tmp_path}/backup.#{File.basename(path)}"

            @cmd.run('cp', path, dst_path)
        end

        alias export_raw_live export_raw_cold

        #######################################################################
        # QCOWw export methods
        #######################################################################

        def export_qcow2_live(disk_id)
            path = disk_path(disk_id)

            # blockcopy:
            # Copy  a  disk  backing image chain to a destination.
            dst_path = "#{@tmp_path}/backup.#{File.basename(path)}"

            @cmd.run('touch', dst_path) # Create file to set ownership
            rc = @cmd.run('virsh', '-c', 'qemu:///system', 'blockcopy',
                          "one-#{@vm.id}", '--path', path, '--dest',
                          dst_path, '--wait', '--finish')

            raise "Error exporting '#{path}': #{rc[1]}" unless rc[2].success?
        end

        def export_qcow2_cold(disk_id)
            path = disk_path(disk_id)
            dst_path = "#{@tmp_path}/backup.#{File.basename(path)}"

            rc = @cmd.run('qemu-img', 'convert', '-q', '-O', 'qcow2',
                          path, dst_path)

            raise "Error exporting '#{path}': #{rc[1]}" unless rc[2].success?
        end

        #######################################################################
        # Helpers
        #######################################################################

        # Retruns the file type of the given path (it will follow sym links)
        #
        # Supported types:
        #   - :qcow2
        #   - :cdrom
        #   - :raw
        #
        def file_type(path)
            real_path = path
            real_path = "#{@vm_path}/#{readlink(path)}" if symlink?(path)

            raw_type = @cmd.run('file', real_path)[0].strip

            case raw_type
            when /^.*QEMU QCOW2 Image.*$/
                :qcow2
            when /^.*CD-ROM.*$/
                :cdrom
            else
                :raw
            end
        end

        def disk_path(disk_id)
            "#{@vm_path}/disk.#{disk_id}"
        end

        def symlink?(path)
            @cmd.run('test', '-L', path)[2].success?
        end

        def readlink(path)
            @cmd.run('readlink', path)[0].strip
        end

    end

end
