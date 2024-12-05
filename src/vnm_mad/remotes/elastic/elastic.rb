# rubocop:disable Naming/FileName
# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'vnmmad'
require 'opennebula'
require 'oneprovision'
require 'ssh_stream'

# Elastic Driver
class ElasticDriver < VNMMAD::VNMDriver

    # Driver name
    DRIVER = 'elastic'

    # Filter to look for NICs managed by this diver
    XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='elastic']"

    XPATH_FILTER_ATTACH_NIC = 'TEMPLATE/NIC[ATTACH="YES"]/NIC_ID'
    XPATH_FILTER_ATTACH_NIC_ALIAS = 'TEMPLATE/NIC_ALIAS[ATTACH="YES"]/NIC_ID'

    def initialize(vm, hostname, deploy_id = nil)
        super(vm, XPATH_FILTER, deploy_id)

        @locking = true
        @ssh     = SshStreamCommand.new(hostname, nil)
        @mapping = {}

        client = OpenNebula::Client.new
        host_id = @vm['/VM/HISTORY_RECORDS/HISTORY/HID']
        @host   = OpenNebula::Host.new_with_id(host_id, client)

        rc = @host.info(true)

        raise rc if OpenNebula.is_error?(rc)

        unless @host.has_elements?('TEMPLATE/PROVISION/ID')
            OpenNebula.log_error("No ID in PROVISION for host #{host_id}")
            exit 1
        end

        provision_id = @host['TEMPLATE/PROVISION/ID']
        provision = OneProvision::Provision.new_with_id(provision_id, client)
        provision.info

        @provider = provision.provider

        @assigned = []
        @unassigned = []
    end

    def self.from_base64(vm64, hostname, deploy_id = nil)
        vm_xml = Base64.decode64(vm64)

        new(vm_xml, hostname, deploy_id)
    end

    def hot_attach?
        @vm[XPATH_FILTER_ATTACH_NIC] || @vm[XPATH_FILTER_ATTACH_NIC_ALIAS]
    end

    #  Create route and arp proxy
    def activate
        cmds     = VNMMAD::VNMNetwork::Commands.new
        provider = ElasticDriver.provider(@provider, @host)

        return 0 unless @assigned.any?

        process_all do |nic|
            next unless @assigned.include?([nic[:ip], nic[:external_ip]])

            cmds.add :ip, "route add #{nic[:ip]}/32 dev #{nic[:bridge]} ||:"
            cmds.add :ip,
                     "neighbour add proxy #{nic[:gateway]} dev #{nic[:bridge]}"

            provider.activate(cmds, nic) if provider.respond_to? :activate
        end

        cmds.run_remote(@ssh)

        0
    end

    #  Remove route and arp proxy
    def deactivate
        cmds     = VNMMAD::VNMNetwork::Commands.new
        provider = ElasticDriver.provider(@provider, @host)

        return 0 unless @unassigned.any?

        process_all do |nic|
            next unless @unassigned.include?([nic[:ip], nic[:external_ip]])

            cmds.add :ip,
                     "route del #{nic[:ip]}/32 dev #{nic[:bridge]} | true"
            cmds.add :ip,
                     "neighbour del proxy #{nic[:gateway]} " \
                     "dev #{nic[:bridge]} | true"

            provider.deactivate(cmds, nic) if provider.respond_to? :deactivate

            # TODO: MUST check if bridge is empty. Move to remote_clean
            # next nic[:conf][:keep_empty_bridge]
            #
            # cmds.add :ip, "link delete #{nic[:bridge]} | true"
        end

        cmds.run_remote(@ssh)

        0
    end

    # @return [Bool] True if error, False otherwise
    def assign
        provider = ElasticDriver.provider(@provider, @host)

        return true if provider.nil?

        rc = @vm.each_nic_all do |nic|
            next if nic[:vn_mad] != DRIVER

            next if hot_attach? &&
                    (nic[:attach].nil? || nic[:attach].upcase != 'YES')

            # pass aws_allocation_id if present
            # pass vultr_ip_id if present
            opts = { :alloc_id => nic[:aws_allocation_id],
                     :vultr_id => nic[:vultr_ip_id] }

            break false \
                unless provider.assign(nic[:ip], nic[:external_ip], opts) == 0

            @assigned << [nic[:ip], nic[:external_ip]]
        end

        unless rc
            # rollback
            @assigned.each do |ip, ext|
                provider.unassign(ip, ext)
            end

            @assigned = []
        end

        !rc
    end

    # Creates provider based on host template and unassign all nic IP
    def unassign
        provider = ElasticDriver.provider(@provider, @host)

        return if provider.nil?

        @vm.each_nic_all do |nic|
            next if nic[:vn_mad] != DRIVER

            next if hot_attach? &&
                    (nic[:attach].nil? || nic[:attach].upcase != 'YES')

            # pass vultr_ip_id if present
            opts = { :vultr_id => nic[:vultr_ip_id] }

            provider.unassign(nic[:ip], nic[:external_ip], opts)

            @unassigned << [nic[:ip], nic[:external_ip]]
        end
    end

    # Factory method to create a VNM provider for the host provision
    #   @param host [OpenNebula::Host]
    #   @return [AWSProvider, EquinixProvider, nil] nil
    def self.provider(provider, host)
        case provider.body['provider']
        when 'aws'
            require 'aws_vnm'
            AWSProvider.new(provider, host)
        when 'equinix'
            require 'equinix_vnm'
            EquinixProvider.new(provider, host)
        when 'vultr_virtual', 'vultr_metal'
            require 'vultr_vnm'
            VultrProvider.new(provider, host)
        else
            nil
        end
    rescue StandardError => e
        OpenNebula.log_error(
            "Error creating provider #{provider.body['provider']}:#{e.message}"
        )
        nil
    end

end
# rubocop:enable Naming/FileName
