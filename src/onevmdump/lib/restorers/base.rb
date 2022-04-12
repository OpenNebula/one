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

require 'uri'
require 'ffi-rzmq'

require 'opennebula'

require_relative '../command'
require_relative '../commons'

# Base class with the restorer interface
class BaseRestorer

    # --------------------------------------------------------------------------
    # Constants
    # --------------------------------------------------------------------------

    VALID_STATES = %w[DONE
                      POWEROFF
                      UNDEPLOYED]

    VALID_LCM_STATES = %w[LCM_INIT]

    # --------------------------------------------------------------------------
    # Default configuration options
    # --------------------------------------------------------------------------
    DEFAULT_CONF = {
        :tmp_location => '/var/tmp/one',
        :restore_nics => false
    }

    def initialize(bundle_path, config)
        @config = DEFAULT_CONF.merge(config)

        @bundle_path = bundle_path
        @bundle_name = File.basename(bundle_path)

        @cmd = Command.new(nil, nil)
    end

    def restore
        client = OpenNebula::Client.new(nil, @config[:endpoint])
        tmp_path = decompress_bundle

        vm_xml = OpenNebula::XMLElement.build_xml(
            File.read("#{tmp_path}/vm.xml"),
            'VM'
        )

        vm = OpenNebula::VirtualMachine.new(vm_xml, client)

        @config[:tmpl_name] = "backup-#{vm.id}" unless @config[:tmpl_name]

        new_disks = []
        # Register each bundle disk as a new image
        Dir.glob("#{tmp_path}/backup.disk.*") do |disk|
            disk_id = Integer(disk.split('.')[-1])
            disk_xpath = "/VM//DISK[DISK_ID = #{disk_id}]"

            ds_id   = Integer(vm_xml.xpath("#{disk_xpath}/DATASTORE_ID").text)
            type    = vm_xml.xpath("#{disk_xpath}/IMAGE_TYPE").text

            img_tmpl = ''
            img_tmpl << "NAME=\"#{@config[:tmpl_name]}-disk-#{disk_id}\"\n"
            img_tmpl << "TYPE=\"#{type}\"\n"
            img_tmpl << "PATH=\"#{disk}\"\n"

            img = OpenNebula::Image.new(OpenNebula::Image.build_xml, client)
            rc  = img.allocate(img_tmpl, ds_id)

            img = nil if OpenNebula.is_error?(rc)

            new_disks << {
                :id => disk_id,
                :img => img
            }
        end

        wait_disks_ready(new_disks, client)

        # Important to use XML from the backup
        tmpl_info = generate_template(vm_xml, new_disks)

        tmpl = OpenNebula::Template.new(OpenNebula::Template.build_xml, client)
        rc   = tmpl.allocate(tmpl_info)

        if OpenNebula.is_error?(rc)
            # roll back image creation if one fails
            new_disks.each do |new_disk|
                OpenNebula::Image.new_with_id(new_disk[:img_id], client).delete
            end

            raise "Error creating VM Template from backup: #{rc.message}"
        end

        tmpl.id
    ensure
        # cleanup
        @cmd.run('rm', '-rf', tmp_path) if !tmp_path.nil? && !tmp_path.empty?
    end

    private

    include Commons

    def decompress_bundle
        tmp_path = create_tmp_folder(@config[:tmp_location])

        rc = @cmd.run('tar', '-C', tmp_path, '-xf', @bundle_path)

        raise "Error decompressing bundle file: #{rc[1]}" unless rc[2].success?

        tmp_path
    end

    def generate_template(vm_xml, new_disks)
        template = ''

        begin
            template << "NAME = \"#{@config[:tmpl_name]}\"\n"
            template << "CPU = \"#{vm_xml.xpath('TEMPLATE/CPU').text}\"\n"
            template << "VCPU = \"#{vm_xml.xpath('TEMPLATE/VCPU').text}\"\n"
            template << "MEMORY = \"#{vm_xml.xpath('TEMPLATE/MEMORY').text}\"\n"
            template << "DESCRIPTION = \"VM restored from backup.\"\n"

            # Add disks
            disk_black_list = Set.new(%w[ALLOW_ORPHANS CLONE CLONE_TARGET
                                         CLUSTER_ID DATASTORE DATASTORE_ID
                                         DEV_PREFIX DISK_ID
                                         DISK_SNAPSHOT_TOTAL_SIZE DISK_TYPE
                                         DRIVER IMAGE IMAGE_ID IMAGE_STATE
                                         IMAGE_UID IMAGE_UNAME LN_TARGET
                                         OPENNEBULA_MANAGED ORIGINAL_SIZE
                                         PERSISTENT READONLY SAVE SIZE SOURCE
                                         TARGET TM_MAD TYPE])
            new_disks.each do |disk|
                disk_xpath = "/VM//DISK[DISK_ID = #{disk[:id]}]/*"
                disk_tmpl = "DISK = [\n"

                vm_xml.xpath(disk_xpath).each do |item|
                    # Add every attribute but image related ones
                    next if disk_black_list.include?(item.name)

                    disk_tmpl << "#{item.name} = \"#{item.text}\",\n"
                end

                disk_tmpl << "IMAGE_ID = #{disk[:img].id}]\n"

                template << disk_tmpl
            end

            # Add NICs
            nic_black_list = Set.new(%w[AR_ID BRIDGE BRIDGE_TYPE CLUSTER_ID IP
                                        IP6 IP6_ULA IP6_GLOBAL NAME NETWORK_ID
                                        NIC_ID TARGET VLAN_ID VN_MAD])
            if @config[:restore_nics]
                %w[NIC NIC_ALIAS].each do |type|
                    vm_xml.xpath("/VM//#{type}").each do |nic|
                        nic_tmpl = "#{type} = [\n"

                        nic.xpath('./*').each do |item|
                            next if nic_black_list.include?(item.name)

                            nic_tmpl << "#{item.name} = \"#{item.text}\",\n"
                        end

                        # remove ',\n' for last elem
                        template << nic_tmpl[0..-3] << "]\n"
                    end
                end
            end

            ###########################################################
            # TODO, evaluate what else should be copy from original VM
            ###########################################################
        rescue StandardError => e
            msg = 'Error parsing VM information. '
            msg << "#{e.message}\n#{e.backtrace}" if @config[:debug]

            raise msg
        end

        template
    end

    def wait_disks_ready(disks, client)
        context    = ZMQ::Context.new(1)
        subscriber = context.socket(ZMQ::SUB)

        poller = ZMQ::Poller.new
        poller.register(subscriber, ZMQ::POLLIN)

        uri        = URI(@config[:endpoint])
        error      = false

        subscriber.connect("tcp://#{uri.host}:2101")

        # Subscribe for every IMAGE
        imgs_set = Set.new
        disks.each do |disk|
            if disk[:img].nil?
                error = true
                next
            end

            # subscribe to wait until every image is ready
            img_id = disk[:img].id

            %w[READY ERROR].each do |i|
                key = "EVENT IMAGE #{img_id}/#{i}/"
                subscriber.setsockopt(ZMQ::SUBSCRIBE, key)
            end

            imgs_set.add(Integer(img_id))
        end

        # Wait until every image is ready (or limit retries)
        retries = 60
        key = ''
        content = ''
        while !imgs_set.empty? && retries > 0
            if retries % 10 == 0
                # Check manually in case the event is missed
                imgs_set.clone.each do |id|
                    img = OpenNebula::Image.new_with_id(id, client)
                    img.info

                    next unless %w[READY ERROR].include?(img.state_str)

                    error = true if img.state_str.upcase == 'ERROR'
                    imgs_set.delete(id)
                end
            end

            break if imgs_set.empty?

            # 60 retries * 60 secs timeout (select) 1h timeout worst case
            if !poller.poll(60 * 1000).zero?
                subscriber.recv_string(key)
                subscriber.recv_string(content)

                match = key.match(%r{EVENT IMAGE (?<img_id>\d+)/(?<state>\S+)/})
                img_id = Integer(match[:img_id])

                %w[READY ERROR].each do |i|
                    key = "EVENT IMAGE #{img_id}/#{i}/"
                    subscriber.setsockopt(ZMQ::UNSUBSCRIBE, key)
                end

                error = true if match[:state] == 'ERROR'
                imgs_set.delete(img_id)
            else
                retries -= 1
            end
        end

        raise 'Error allocating new images.' if error
    ensure
        # Close socket
        subscriber.close

        # Rollback - remove every image if error
        if error
            disks.each do |disk|
                disk[:img].delete unless disk[:img].nil?
            end
        end
    end

end
