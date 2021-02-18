# rubocop:disable Naming/FileName
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
    end

    def self.from_base64(vm64, hostname, deploy_id = nil)
        vm_xml = Base64.decode64(vm64)

        new(vm_xml, hostname, deploy_id)
    end

    #  Create route and arp proxy
    def activate
        attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']
        process do |nic|
            next if attach_nic_id && attach_nic_id != nic[:nic_id]

            ip("route add #{nic[:ip]}/32 dev #{nic[:bridge]}")
            ip("neighbour add proxy #{nic[:gateway]} dev #{nic[:bridge]}")
        end

        0
    end

    #  Remove route and arp proxy
    def deactivate
        attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']
        process do |nic|
            next if attach_nic_id && attach_nic_id != nic[:nic_id]

            ip("route del #{nic[:ip]}/32 dev #{nic[:bridge]} | true")
            ip("neighbour del proxy #{nic[:gateway]} dev #{nic[:bridge]} " <<
               '| true')

            next if nic[:conf][:keep_empty_bridge]

            ip("link delete #{nic[:bridge]} | true")
        end

        0
    end

    # @return [Bool] True if error, False otherwise
    def assign
        provider = ElasticDriver.provider(@provider, @host)

        return true if provider.nil?

        assigned = []

        attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']
        rc = @vm.each_nic do |nic|
            next if attach_nic_id && attach_nic_id != nic[:nic_id]

            # pass aws_allocation_id if present
            opts = { :alloc_id => nic[:aws_allocation_id] }

            break false \
                unless provider.assign(nic[:ip], nic[:external_ip], opts) == 0

            assigned << [nic[:ip], nic[:external_ip]]
        end

        # rollback
        assigned.each do |ip, ext|
            provider.unassign(ip, ext)
        end unless rc

        !rc
    end

    # Creates provider based on host template and unassign all nic IP
    def unassign
        provider = ElasticDriver.provider(@provider, @host)

        return if provider.nil?

        attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']
        @vm.each_nic do |nic|
            next if attach_nic_id && attach_nic_id != nic[:nic_id]

            provider.unassign(nic[:ip], nic[:external_ip])
        end
    end

    # Factory method to create a VNM provider for the host provision
    #   @param host [OpenNebula::Host]
    #   @return [AWSProvider, PacketProvider, nil] nil
    def self.provider(provider, host)
        case provider.body['provider']
        when 'aws'
            require 'aws_vnm'
            AWSProvider.new(provider, host)
        when 'packet'
            require 'packet_vnm'
            PacketProvider.new(provider, host)
        else
            nil
        end
    rescue StandardError => e
        OpenNebula.log_error(
            "Error creating provider #{provider.body['provider']}:#{e.message}"
        )
        nil
    end

    private

    # Run ip command with given params on @ssh stream
    #   @param params [String]
    #   @return [String] command stdout
    def ip(params)
        commands = VNMMAD::VNMNetwork::Commands.new
        commands.add :ip, params
        commands.run_remote(@ssh)
    end

end
# rubocop:enable Naming/FileName
