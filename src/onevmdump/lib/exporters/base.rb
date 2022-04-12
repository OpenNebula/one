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

require_relative '../command'
require_relative '../commons'

# Base class with the exporters interface
class BaseExporter

    # --------------------------------------------------------------------------
    # Default configuration options
    # --------------------------------------------------------------------------
    DEFAULT_CONF = {
        # workaround: using "//" as libvirt needs the path to match exactly
        :ds_location   => '/var/lib/one//datastores',
        :remote_host   => nil,
        :remote_user   => nil,
        :destination_path => nil,
        :destination_host => nil,
        :destination_user => nil
    }

    VALID_STATES = %w[ACTIVE
                      POWEROFF
                      UNDEPLOYED]

    VALID_LCM_STATES = %w[LCM_INIT
                          RUNNING
                          BACKUP
                          BACKUP_POWEROFF
                          BACKUP_UNDEPLOYED]

    def initialize(vm, config)
        @vm = vm
        @config = DEFAULT_CONF.merge(config)

        # Will raise an error if invalid state/lcm_state
        check_state(@vm)

        # Check if the action needs to be live
        @live = running?

        # Get System DS ID from last history record
        begin
            last_hist_rec = Nokogiri.XML(@vm.get_history_record(-1))
            @sys_ds_id = Integer(last_hist_rec.xpath('//DS_ID').text)
        rescue StandardError
            raise 'Cannot retrieve system DS ID. The last history record' \
                  ' might be corrupted or it might not exists.'
        end

        # Get Command
        @cmd = Command.new(@config[:remote_user], @config[:remote_host])

        # Build VM folder path
        @vm_path  = "#{@config[:ds_location]}/#{@sys_ds_id}/#{@vm.id}"
        @tmp_path = create_tmp_folder(@vm_path)
    end

    def export
        # Export disks
        @vm.retrieve_xmlelements('//DISK/DISK_ID').each do |disk_id|
            disk_id = Integer(disk_id.text)

            if @live
                export_disk_live(disk_id)
            else
                export_disk_cold(disk_id)
            end
        end

        # Dump VM xml to include it in the final bundle
        @cmd.run_redirect_output('echo', "#{@tmp_path}/vm.xml", nil, @vm.to_xml)

        create_bundle
    ensure
        cleanup
    end

    def cleanup
        @cmd.run('rm', '-rf', @tmp_path)
    end

    private

    include Commons

    def gen_bundle_name
        return "'#{@config[:destination_path]}'" if @config[:destination_path]

        timestamp = Time.now.strftime('%s')
        "/tmp/onevmdump-#{@vm.id}-#{timestamp}.tar.gz"
    end

    def create_bundle
        bundle_name = gen_bundle_name
        cmd = "tar -C #{@tmp_path} -czS"

        if @config[:destination_host].nil? || @config[:destination_host].empty?
            dst = " -f #{bundle_name} ."
        else
            destination_user = @config[:destination_user]
            if !destination_user.nil? && !destination_user.empty?
                usr = "-l '#{destination_user}'"
            end

            dst = " - . | ssh '#{@config[:destination_host]}' #{usr}" \
                  " \"cat - > #{bundle_name}\""
        end

        cmd << dst

        rc = @cmd.run_insecure(cmd)

        raise "Error creating bundle file: #{rc[1]}" unless rc[2].success?

        bundle_name
    end

end
