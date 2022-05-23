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

    # RBDExporter class
    class RBDExporter < BaseExporter

        private

        def export_disk_live(disk_id)
            # Freeze filesystem
            rc = @cmd.run('virsh', '-c', 'qemu:///system', 'domfsfreeze',
                          "one-#{@vm.id}")

            unless rc[2].success?
                raise "Error freezing domain: #{rc[1]}"
            end

            export_disk_cold(disk_id)
        ensure
            @cmd.run('virsh', '-c', 'qemu:///system', 'domfsthaw',
                     "one-#{@vm.id}")
        end

        def export_disk_cold(disk_id)
            path = disk_path(disk_id)

            # Export rbd
            # Assume rbd version 2
            cmd = rbd_cmd(disk_id)
            cmd.append('export', path, "#{@tmp_path}/backup.disk.#{disk_id}")
            rc = @cmd.run(cmd[0], *cmd[1..-1])

            raise "Error exporting '#{path}': #{rc[1]}" unless rc[2].success?
        end

        ########################################################################
        # Helpers
        ########################################################################

        def rbd_cmd(disk_id)
            cmd = ['rbd']
            disk_xpath = "//DISK[DISK_ID = #{disk_id}]"

            # rubocop:disable Layout/LineLength
            ceph_user = @vm.retrieve_xmlelements("#{disk_xpath}/CEPH_USER")[0].text rescue nil
            ceph_key  = @vm.retrieve_xmlelements("#{disk_xpath}/CEPH_KEY")[0].text rescue nil
            ceph_conf = @vm.retrieve_xmlelements("#{disk_xpath}/CEPH_CONF")[0].text rescue nil

            cmd.append('--id', ceph_user)     if !ceph_user.nil? && !ceph_user.empty?
            cmd.append('--keyfile', ceph_key) if !ceph_key.nil?  && !ceph_key.empty?
            cmd.append('--conf', ceph_conf)   if !ceph_conf.nil? && !ceph_conf.empty?
            # rubocop:enable Layout/LineLength

            cmd
        end

        def disk_path(disk_id)
            disk_xpath = "//DISK[DISK_ID = #{disk_id}]"
            source = @vm.retrieve_xmlelements("#{disk_xpath}/SOURCE")[0].text

            if source.nil? || source.empty?
                raise "Error retrieving source from disk #{disk_id}"
            end

            "#{source}-#{@vm.id}-#{disk_id}"
        end

    end

end
