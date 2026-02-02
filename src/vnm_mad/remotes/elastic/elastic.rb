# rubocop:disable Naming/FileName
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

require 'vnmmad'
require 'opennebula'
require 'opennebula/oneform_client'
require 'ssh_stream'

# Generic class for elastic providers
class GenericProvider

    def initialize(provider, host)
        @provider = provider
        @host     = host

        @resource_id = host['TEMPLATE/ONEFORM/RESOURCE_ID']
        @connection  = provider[:connection]
    end

    # Assign a private IP to the instance, associate given elastic ip with it
    #   @param ip               [String]  private_ip of the VM
    #   @param external         [String]  public_ip given by the provider
    #   @param opts             [Hash]
    #   @return 0 on success, 1 on error
    def assign(ip, external, opts = {})
        raise NotImplementedError
    end

    #  Unassign a public_ip from an instance
    #   @param ip       [String] the VM private ip
    #   @param external [String] the public ip
    def unassign(ip, external, opts = {})
        raise NotImplementedError
    end

end

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

        client  = OpenNebula::Client.new
        host_id = @vm['/VM/HISTORY_RECORDS/HISTORY/HID']
        @host   = OpenNebula::Host.new_with_id(host_id, client)

        rc = @host.info(true)

        raise rc if OpenNebula.is_error?(rc)

        unless @host.has_elements?('TEMPLATE/ONEFORM/PROVISION_ID')
            OpenNebula::DriverLogger.log_error("No Provision ID found for host #{host_id}")
            exit 1
        end

        provision_id = @host['TEMPLATE/ONEFORM/PROVISION_ID']

        client    = OneForm::Client.new
        document  = client.get_provision(provision_id)

        if document.key?(:err_code)
            STDERR.puts "Error retrieving provision #{provision_id}: #{document[:message]}"
            exit(-1)
        end

        provision   = document[:TEMPLATE][:PROVISION_BODY]
        provider_id = provision[:provider_id]
        document    = client.get_provider(provider_id, :sensitive => true)

        if document.key?(:err_code)
            STDERR.puts "Error retrieving provider #{provider_id}: #{document[:message]}"
            exit(-1)
        end

        @provider = document[:TEMPLATE][:PROVIDER_BODY]
        response  = client.get_provider_location(provider_id)

        if response.key?(:err_code)
            STDERR.puts "Error retrieving provider #{provider_id} " \
            "location: #{response[:message]}"
            exit(-1)
        end

        @provider[:path] = response[:path]

        @assigned      = []
        @unassigned    = []
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
            cmds.add :ip, "neighbour add proxy #{nic[:gateway]} dev #{nic[:bridge]}"

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
            opts = {
                :alloc_id => nic[:aws_allocation_id]
            }

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
    #   @param provider [Hash] provider definition, must include :driver
    #   @param host [OpenNebula::Host]
    #   @return [GenericProvider, nil]
    def self.provider(provider, host)
        cloud = provider[:driver]
        return unless cloud

        provider_path = File.join(provider[:path], 'elastic')

        unless Dir.exist?(provider_path)
            OpenNebula::DriverLogger.log_error(
                "No elastic provider directory found for #{cloud} " \
                "in #{provider_path}"
            )
            return
        end

        begin
            # Require all Ruby files in the provider's elastic directory
            Dir.glob(File.join(provider_path, '*.rb')).sort.each {|file| require file }

            # Get all classes that inherit from GenericProvider
            provider_classes = ObjectSpace.each_object(Class).select do |cls|
                cls < GenericProvider && cls.name && cls.name != 'GenericProvider'
            end

            if provider_classes.empty?
                OpenNebula::DriverLogger.log_error(
                    "No valid subclass of GenericProvider found in #{provider_path}"
                )
                return
            elsif provider_classes.size > 1
                class_names = provider_classes.map(&:name).join(', ')
                OpenNebula::DriverLogger.log_error(
                    'Multiple subclasses of GenericProvider found ' \
                    "(#{class_names}) in #{provider_path}"
                )
                return
            end

            klass = provider_classes.first
            klass.new(provider, host)
        rescue LoadError => e
            OpenNebula::DriverLogger.log_error(
                "Could not load provider files from #{provider_path}: #{e.message}"
            )
        rescue StandardError => e
            OpenNebula::DriverLogger.log_error(
                "Error initializing provider for #{cloud}: #{e.message}"
            )
        end
    end

end
# rubocop:enable Naming/FileName
