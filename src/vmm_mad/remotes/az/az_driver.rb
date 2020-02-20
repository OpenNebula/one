#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
# -------------------------------------------------------------------------- #

ONE_LOCATION ||= ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
    ETC_LOCATION      ||= '/etc/one/'
else
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
    ETC_LOCATION      ||= ONE_LOCATION + '/etc/'
end

AZ_DRIVER_CONF = "#{ETC_LOCATION}/az_driver.conf"
AZ_DRIVER_DEFAULT = "#{ETC_LOCATION}/az_driver.default"

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

# Load Azure credentials and environment
require 'yaml'
require 'rubygems'
require 'uri'
require 'tempfile'

require 'CommandManager'
require 'scripts_common'
require 'VirtualMachineDriver'
require 'opennebula'

require 'azure_mgmt_compute'
require 'azure_mgmt_monitor'
require 'azure_mgmt_network'
require 'azure_mgmt_resources'
require 'azure_mgmt_storage'

# The main class for the Azure driver
class AzureDriver

    ACTION          = VirtualMachineDriver::ACTION
    POLL_ATTRIBUTE  = VirtualMachineDriver::POLL_ATTRIBUTE
    VM_STATE        = VirtualMachineDriver::VM_STATE

    Compute = Azure::Compute::Profiles::Latest::Mgmt
    Monitor = Azure::Monitor::Profiles::Latest::Mgmt
    Network = Azure::Network::Profiles::Latest::Mgmt
    Resources = Azure::Resources::Profiles::Latest::Mgmt
    Storage = Azure::Storage::Profiles::Latest::Mgmt

    ComputeModels = Compute::Models
    NetworkModels = Network::Models
    ResourceModels = Resources::Models
    StorageModels = Storage::Models

    MONITOR_METRICS = [
        'Percentage CPU',
        'Network In Total',
        'Network Out Total',
        'OS Disk Read Bytes/sec',
        'OS Disk Read Operations/Sec',
        'OS Disk Write Bytes/sec',
        'OS Disk Write Operations/Sec'
    ]

    AZ_REQUIRED_PARAMS = %w[
        INSTANCE_TYPE
        VM_USER VM_PASSWORD
        IMAGE_PUBLISHER IMAGE_OFFER IMAGE_SKU IMAGE_VERSION
    ]

    # Azure constructor, loads credentials, create azure clients
    def initialize(host)
        @host = host
        @to_inst ={}

        @public_cloud_az_conf = YAML.safe_load(File.read(AZ_DRIVER_CONF))

        if @public_cloud_az_conf['proxy_uri']
            ENV['HTTP_PROXY'] = @public_cloud_az_conf['proxy_uri']
        end

        @instance_types = @public_cloud_az_conf['instance_types']
        @instance_types.keys.each  do |key|
            @to_inst[key.upcase] = key
        end

        @xmlhost = host_info
        @rgroup_name, @rgroup_keep_empty = rgroup_info

        az_conn_opts = connect_info
        @region = az_conn_opts[:region]

        provider = MsRestAzure::ApplicationTokenProvider.new(
            az_conn_opts[:tenant_id],
            az_conn_opts[:client_id],
            az_conn_opts[:client_secret]
        )

        az_conn_opts[:credentials] = MsRest::TokenCredentials.new(provider)

        @compute_client = Compute::Client.new(az_conn_opts)
        @monitor_client = Monitor::Client.new(az_conn_opts)
        @network_client = Network::Client.new(az_conn_opts)
        @resource_client = Resources::Client.new(az_conn_opts)
        @storage_client = Storage::Client.new(az_conn_opts)
    end

    # DEPLOY action
    def deploy(id, host, xml_text, lcm_state, deploy_id)
        @rgroup = create_rgroup(@rgroup_name, @region) \
            unless @resource_client.resource_groups
                                   .check_existence(@rgroup_name)

        if %w[BOOT BOOT_FAILURE].include?(lcm_state)
            @defaults = load_default_template_values

            az_info, context = get_deployment_info(host, xml_text)
            validate_az_info(az_info)

            if az_info['PUBLIC_IP'] == 'YES'
                public_ip = create_public_ip(id, "one-#{id}-public-ip")
            else
                public_ip = nil
            end

            subnet = get_or_create_vnet(id, az_info)

            instance = create_vm(id, subnet, public_ip,
                                 az_info, context['SSH_PUBLIC_KEY'])

            puts instance.name # print DEPLOY_ID
        else
            restore(deploy_id)
            deploy_id
        end
    end

    # Shutdown an Azure instance
    def shutdown(deploy_id, lcm_state)
        case lcm_state
        when 'SHUTDOWN'
            @compute_client.virtual_machines.power_off(@rgroup_name, deploy_id)
            @compute_client.virtual_machines.delete(@rgroup_name, deploy_id)
        when 'SHUTDOWN_POWEROFF', 'SHUTDOWN_UNDEPLOY'
            @compute_client.virtual_machines.delete(@rgroup_name, deploy_id)
        end
        delete_vm_resources(deploy_id)
    end

    # Reboot an Azure instance
    def reboot(deploy_id)
        i = get_instance(deploy_id)
        @compute_client.virtual_machines.restart(@rgroup_name, i.name)
    end

    # Cancel an Azure instance
    def cancel(deploy_id)
        @compute_client.virtual_machines.delete(@rgroup_name, deploy_id)

        delete_vm_resources(deploy_id)
    end

    # Stop an Azure instance
    def save(deploy_id)
        i = get_instance(deploy_id)
        @compute_client.virtual_machines.power_off(@rgroup_name, i.name)
    end

    # Resume an Azure instance
    def restore(deploy_id)
        i = get_instance(deploy_id)

        return if vm_state(i) == 'running'

        @compute_client.virtual_machines.start(@rgroup_name, i.name)
    end

    # Get info (IP, and state) for an Azure instance
    def poll(_id, deploy_id)
        i = get_instance(deploy_id)
        puts parse_poll(i)
    end

    # Get the info of all Aure instances. An Azure instance must have
    # a name compliant with the "one-####" format, where #### are integers
    def monitor_all_vms
        totalmemory = 0
        totalcpu    = 0

        capacity = @xmlhost.to_hash['HOST']['TEMPLATE']['CAPACITY']

        if capacity.nil? || !capacity.is_a?(Hash)
            raise 'You must define CAPACITY section properly! '\
                  'Check the VM template'
        end

        capacity.each do |name, value|
            cpu, mem = instance_type_capacity(name)
            totalmemory += mem * value.to_i
            totalcpu    += cpu * value.to_i
        end

        host_info =  "HYPERVISOR=AZURE\n"
        host_info << "PUBLIC_CLOUD=YES\n"
        host_info << "PRIORITY=-1\n"
        host_info << "TOTALMEMORY=#{totalmemory.round}\n"
        host_info << "TOTALCPU=#{totalcpu}\n"
        host_info << "HOSTNAME=\"#{@host}\"\n"

        vms_info   = "VM_POLL=YES\n"

        usedcpu    = 0
        usedmemory = 0

        work_q = Queue.new

        if @resource_client.resource_groups.check_existence(@rgroup_name)
            @compute_client.virtual_machines
                           .list(@rgroup_name).each {|i| work_q.push i }
            workers = (0...20).map do
                Thread.new do
                    begin
                        while (i = work_q.pop(true))
                            vm_state = vm_state(i)
                            next if vm_state !~ /running|pending/

                            one_id = i.tags['ONE_ID'] if i.tags

                            poll_data = parse_poll(i, vm_state)

                            vm_template_to_one = vm_to_one(i)
                            vm_template_to_one = Base64
                                                 .encode64(vm_template_to_one)
                                                 .gsub("\n", '')

                            vms_info << "VM=[\n"
                            vms_info << "  ID=#{one_id || -1},\n"
                            vms_info << "  DEPLOY_ID=#{i.name},\n"
                            vms_info << "  VM_NAME=#{i.name},\n"
                            vms_info << '  IMPORT_TEMPLATE='\
                                        "\"#{vm_template_to_one}\",\n"
                            vms_info << "  POLL=\"#{poll_data}\" ]\n"

                            next unless one_id

                            name = i.hardware_profile.vm_size
                            cpu, mem = instance_type_capacity(name)
                            usedcpu += cpu
                            usedmemory += mem
                        end
                    rescue ThreadError
                        nil
                    rescue StandardError
                        raise
                    end
                end
            end
            workers.map(&:join)
        end

        host_info << "USEDMEMORY=#{usedmemory.round}\n"
        host_info << "USEDCPU=#{usedcpu.round}\n"
        host_info << "FREEMEMORY=#{(totalmemory - usedmemory).round}\n"
        host_info << "FREECPU=#{(totalcpu - usedcpu).round}\n"

        puts host_info
        puts vms_info
    end

    private

    def host_info
        client = OpenNebula::Client.new
        pool = OpenNebula::HostPool.new(client)
        pool.info

        objects=pool.select {|object| object.name==@host }

        host_id = objects.first.id
        xmlhost = OpenNebula::Host.new_with_id(host_id, client)
        xmlhost.info(true)
        xmlhost
    end

    # Check the host template to retrieve
    # conection info needed for Azure
    def connect_info
        ret = {}

        { 'AZ_SUB'    => :subscription_id,
          'AZ_CLIENT' => :client_id,
          'AZ_SECRET' => :client_secret,
          'AZ_TENANT' => :tenant_id,
          'AZ_REGION' => :region }.each do |attr_name, conn_opt|
            ret[conn_opt] = @xmlhost["TEMPLATE/#{attr_name}"]

            if ret[conn_opt].nil?
                raise "Missing #{attr_name} in azure host template"
            end
        end

        ret
    end

    # AZ resource group is either specified in host template attr AZ_GROUP
    # or it is derived from the rgroup_name_format and host attributes
    def rgroup_info
        rgroup = @xmlhost['TEMPLATE/AZ_RGROUP']
        keep_empty = @xmlhost['TEMPLATE/AZ_RGROUP_KEEP_EMPTY']
        keep_empty = !keep_empty.nil? && keep_empty.upcase == 'YES'

        return rgroup, keep_empty if rgroup

        rgroup_name_format = @public_cloud_az_conf['rgroup_name_format'] || \
                             'one-%<NAME>s-%<ID>s'

        rgroup = format(rgroup_name_format,
                        :NAME    => @xmlhost['NAME'],
                        :CLUSTER => @xmlhost['CLUSTER'],
                        :ID      => @xmlhost['ID'])
        [rgroup, keep_empty]
    end

    # Verify az_info contains all required params
    def validate_az_info(az_info)
        AZ_REQUIRED_PARAMS.each do |param|
            if !az_info.key? param
                raise "Missing #{param} in VM template azure setting " \
                      "or in #{AZ_DRIVER_DEFAULT}"
            end
        end
    end

    # Create azure resource group
    def create_rgroup(rgroup_name, region)
        model = Azure::Resources::Profiles::Latest::Mgmt::Models
        resource_group_params = model::ResourceGroup.new.tap do |rgroup|
            rgroup.location = region
        end

        @resource_client.resource_groups.create_or_update(
            rgroup_name, resource_group_params
        )
    end

    # get the az vnet if defined in the template or create new
    def get_or_create_vnet(id, az_info)
        # Network should already be created on azure
        if az_info['VIRTUAL_NETWORK_NAME']
            begin
                vnets = @network_client.virtual_networks
                                       .get(@rgroup_name,
                                            az_info['VIRTUAL_NETWORK_NAME'])
                vnets.subnets[0]
            rescue StandardError
                raise 'Could not find Azure network '\
                      "#{az_info['VIRTUAL_NETWORK_NAME']}"
            end

        # Create virtual network, read the defaults from VM template
        # or use last resort default (vnet is mandatory in azure)
        else
            name        = az_info['VNET_NAME'] || 'one-vnet'
            addr_prefix = az_info['VNET_ADDR_PREFIX'] || '10.0.0.0/16'
            dns         = az_info['VNET_DNS'] || '8.8.8.8'
            subname     = az_info['VNET_SUBNAME'] || 'default'
            sub_prefix  = az_info['VNET_SUB_PREFIX'] || '10.0.0.0/24'

            model = Azure::Network::Profiles::Latest::Mgmt::Models

            vnet_create_params = model::VirtualNetwork.new.tap do |vnet|
                vnet.location = @region
                vnet.address_space = model::AddressSpace.new.tap do |addr_space|
                    addr_space.address_prefixes = [addr_prefix]
                end
                vnet.dhcp_options = model::DhcpOptions.new.tap do |dhcp|
                    dhcp.dns_servers = [dns]
                end
                vnet.subnets = [
                    model::Subnet.new.tap do |subnet|
                        subnet.name = subname
                        subnet.address_prefix = sub_prefix
                    end
                ]

                vnet.tags = { 'ONE_ID' => id }
            end

            vnet = @network_client.virtual_networks
                                  .create_or_update(@rgroup_name, name,
                                                    vnet_create_params)
            vnet.subnets[0]
        end
    end

    def create_public_ip(id, ip_name)
        public_ip_params = NetworkModels::PublicIPAddress.new.tap do |ip|
            ip.location = @region
            ip.public_ipallocation_method =
                NetworkModels::IPAllocationMethod::Dynamic
            ip.tags = { 'ONE_ID' => id }
        end
        @network_client.public_ipaddresses.create_or_update(
            @rgroup_name, ip_name, public_ip_params
        )
    end

    # Create a Virtual Machine and return it
    # rubocop:disable Layout/LineLength
    def create_vm(id, subnet, public_ip, az_info, ssh_public_key)
        vm_name = "one-#{id}"
        net_ip_conf = NetworkModels::NetworkInterfaceIPConfiguration
        ip_method   = NetworkModels::IPAllocationMethod::Dynamic

        if az_info['SECURITY_GROUP']
            security_group = @network_client.network_security_groups.get(@rgroup_name, az_info['SECURITY_GROUP'])
        end

        if az_info['PROXIMITY_GROUP']
            proximity_group = @compute_client.proximity_placement_groups.get(@rgroup_name, az_info['PROXIMITY_GROUP'])
        end

        if az_info['AVAILABILITY_SET']
            availability_set = @compute_client.availability_sets.get(@rgroup_name, az_info['AVAILABILITY_SET'])
        end

        nic = @network_client.network_interfaces.create_or_update(
            @rgroup_name,
            "#{vm_name}-nic",
            NetworkModels::NetworkInterface.new.tap do |interface|
                interface.location = @region
                interface.network_security_group = security_group if security_group
                interface.ip_configurations = [
                    net_ip_conf.new.tap do |nic_conf|
                        nic_conf.name = "#{vm_name}-nic"
                        nic_conf.private_ipallocation_method = ip_method
                        nic_conf.subnet = subnet
                        nic_conf.public_ipaddress = public_ip \
                            unless public_ip.nil?
                    end
                ]
                interface.tags = { 'ONE_ID' => id }
            end
        )

        vm_create_params = ComputeModels::VirtualMachine.new.tap do |vm|
            vm.location = @region
            vm.os_profile = ComputeModels::OSProfile.new.tap do |os_profile|
                os_profile.computer_name = vm_name
                os_profile.admin_username = az_info['VM_USER']
                os_profile.admin_password = az_info['VM_PASSWORD']
            end

            vm.proximity_placement_groups = proximity_group if proximity_group
            vm.availability_set = availability_set if availability_set

            vm.storage_profile = ComputeModels::StorageProfile.new.tap do |store_profile|
                store_profile.image_reference = ComputeModels::ImageReference.new.tap do |ref|
                    ref.publisher = az_info['IMAGE_PUBLISHER']
                    ref.offer = az_info['IMAGE_OFFER']
                    ref.sku = az_info['IMAGE_SKU']
                    ref.version = az_info['IMAGE_VERSION']
                end
            end

            vm.hardware_profile = ComputeModels::HardwareProfile.new.tap do |hardware|
                # hardware.vm_size = ComputeModels::VirtualMachineSizeTypes::StandardDS2V2
                hardware.vm_size = az_info['INSTANCE_TYPE']
            end

            vm.network_profile = ComputeModels::NetworkProfile.new.tap do |net_profile|
                net_profile.network_interfaces = [
                    ComputeModels::NetworkInterfaceReference.new.tap do |ref|
                        ref.id = nic.id
                        ref.primary = true
                    end
                ]
            end
        end

        if ssh_public_key
            vm_create_params.os_profile.linux_configuration = ComputeModels::LinuxConfiguration.new.tap do |linux|
                linux.disable_password_authentication = true
                linux.ssh = ComputeModels::SshConfiguration.new.tap do |ssh_config|
                    ssh_config.public_keys = [
                        ComputeModels::SshPublicKey.new.tap do |pub_key|
                            pub_key.key_data = ssh_public_key
                            pub_key.path = "/home/#{az_info['VM_USER']}/.ssh/authorized_keys"
                        end
                    ]
                end
            end
        end

        vm_create_params.tags = { 'ONE_ID' => id }

        @compute_client.virtual_machines.create_or_update(@rgroup_name, vm_name.to_s, vm_create_params)
    end
    # rubocop:enable Layout/LineLength

    def delete_vm_resources(deploy_id)
        # delete nic
        @network_client.network_interfaces
                       .delete(@rgroup_name, "#{deploy_id}-nic")

        # delet public_ip (if exists)
        begin
            @network_client.public_ipaddresses
                           .get(@rgroup_name, "#{deploy_id}-public-ip")
        rescue MsRestAzure::AzureOperationError
            nil
        else
            @network_client.public_ipaddresses
                           .delete(@rgroup_name, "#{deploy_id}-public-ip")
        end

        vm_id = deploy_id.split('-').last

        # delete disk
        @compute_client.disks
                       .list_by_resource_group(@rgroup_name).each do |disk|
            if disk.name.start_with?(deploy_id) && disk.tags['ONE_ID'] == vm_id
                @compute_client.disks.delete(@rgroup_name, disk.name)
            end
        end

        # delete vnet (if it was tagged == created by the driver)
        @network_client.virtual_networks.list(@rgroup_name).each do |vnet|
            if vnet.tags['ONE_ID'] == vm_id
                @network_client.virtual_networks.delete(@rgroup_name, vnet.name)
            end
        end

        # if last instance was deleted, delete also the resource group
        vm_list = @compute_client.virtual_machines.list(@rgroup_name)

        @resource_client.resource_groups.delete(@rgroup_name) \
                                      if vm_list.empty? && !@rgroup_keep_empty
    end

    # Get the associated capacity of the instance_type as cpu (in 100 percent
    # e.g. 800 for 8 cores) and memory (in KB)
    def instance_type_capacity(name)
        resource = @instance_types[@to_inst[name]] || @instance_types[name]
        return 0, 0 if resource.nil?

        [(resource['cpu'].to_f * 100).to_i,
         (resource['memory'].to_f * 1024 * 1024).to_i]
    end

    # Get the Azure section of the template. If more than one Azure section
    def get_deployment_info(host, xml_text)
        xml = OpenNebula::XMLElement.new
        xml.initialize_xml(xml_text, 'VM')

        pcs = xml.retrieve_xmlelements('/VM/USER_TEMPLATE/PUBLIC_CLOUD')

        az = {}
        pcs.each do |s|
            public_cloud = s.to_hash['PUBLIC_CLOUD']

            type = public_cloud['TYPE'].downcase rescue nil
            location = public_cloud['LOCATION'].downcase rescue nil

            next if type != 'azure'

            if location.nil?
                az = @defaults.merge public_cloud
            elsif location == @region.downcase
                az = @defaults.merge public_cloud
                break
            end
        end

        # If we don't find an Azure location raise an error
        if !az
            raise 'Cannot find Azure element in VM template '\
                  "or couldn't find any Azure location matching "\
                  'one of the templates.'
        end

        # If LOCATION not explicitly defined, try to get from host, if not
        # try to use hostname as datacenter
        if !az['LOCATION']
            az['LOCATION'] = @region || @defaults['LOCATION'] || host
        end

        context = xml.retrieve_xmlelements('/VM/TEMPLATE/CONTEXT')

        return [az, {}] if context.empty?

        [az, context.first.to_hash['CONTEXT']]
    end

    def vm_state(i)
        az_inst_view = @compute_client.virtual_machines.instance_view(
            @rgroup_name, i.name
        )
        az_inst_view.statuses[-1].code.split('/').last
    end

    def get_cpu_num(instance)
        begin
            type = instance.hardware_profile.vm_size
            @instance_types[type]['cpu']
        rescue StandardError
            1
        end
    end

    # Retrive the vm information from the Azure instance view
    def parse_poll(instance, vm_state)
        info = state = ''

        if !instance
            state = VM_STATE[:deleted]
        else
            case vm_state
            when 'running', 'starting'
                state = VM_STATE[:active]
            when 'suspended', 'stopping'
                state = VM_STATE[:paused]
            else
                state = VM_STATE[:unknown]
            end
        end

        info << "#{POLL_ATTRIBUTE[:state]}=#{state} "

        # include metrics data (azure doesn't give any info about VM memory)
        data = @monitor_client.metrics.list(
            instance.id,
            :metricnames => MONITOR_METRICS.join(','),
            :timespan => 'PT1M', # Period time 1m
            :result_type => 'Data'
        )

        data.value.each do |e|
            value = e.timeseries.first.data.first.average || 0

            case e.name.value
            when 'Percentage CPU'
                cpu_usage = (value * 100 * get_cpu_num(instance)).round
                info << "#{POLL_ATTRIBUTE[:cpu]}=#{cpu_usage} "
            when 'Network In Total'
                info << "#{POLL_ATTRIBUTE[:netrx]}=#{value} "
            when 'Network Out Total'
                info << "#{POLL_ATTRIBUTE[:nettx]}=#{value} "
            else
                # disk data are per sec, just add them for info
                name = e.name.value.gsub(' ', '_').gsub('/', '_').upcase
                info << "#{name}=#{value} "
            end
        end

        # include public_ip if exists
        public_ip = get_instance_public_ip(instance.name)
        info << "AZ_PUBLIC_IPADDRESS=#{public_ip} " if public_ip

        # include private_ip if exists
        private_ip = get_instance_private_ip(instance.name)
        info << "AZ_PRIVATE_IPADDRESS=#{private_ip} " if private_ip

        # put public or private ip to the AZ_IPADDRESS (visible in Sunstone)
        az_ip = public_ip || private_ip || nil
        info << "AZ_IPADDRESS=#{az_ip} " if az_ip

        # Include all attributes for given instance
        flatten_hash(examine(instance)).each do |k, v|
            info << "AZ_#{k.upcase}="
            info << "\\\"#{v}\\\" "
        end

        info
    end

    def get_instance_public_ip(vm_name)
        # poor check for public-ip address
        addr = @network_client
               .public_ipaddresses
               .get(@rgroup_name, "#{vm_name}-public-ip") rescue nil
        addr.ip_address if addr
    end

    def get_instance_private_ip(vm_name)
        nic = @network_client.network_interfaces
                             .get(@rgroup_name, "#{vm_name}-nic") rescue nil

        return unless nic && !nic.ip_configurations.empty?

        nic.ip_configurations.first.private_ipaddress
    end

    # Load the default values that will be used to create a new instance, if
    # not provided in the template. These values are defined in the
    # AZ_DRIVER_DEFAULT file
    def load_default_template_values
        return {} unless File.exist?(AZ_DRIVER_DEFAULT)

        # skip comments
        az_default = File.readlines(AZ_DRIVER_DEFAULT)
                         .reject {|l| l =~ /^#/ }.join

        az = OpenNebula::XMLElement.new
        az.initialize_xml(az_default, 'TEMPLATE')

        return {} unless az

        az.to_hash['TEMPLATE']['AZURE']
    end

    # Retrieve the instance from Azure
    def get_instance(deploy_id)
        instance = @compute_client.virtual_machines.get(@rgroup_name, deploy_id)
        if instance.nil?
            raise "Instance #{deploy_id} does not exist"
        end

        instance
    end

    # Build template for importation
    def vm_to_one(vm)
        cpu, mem = instance_type_capacity(vm.hardware_profile.vm_size)

        mem = mem.to_i / 1024 # Memory for templates expressed in MB
        cpu = cpu.to_f / 100  # CPU expressed in units

        str = "NAME   = \"Instance from #{vm.name}\"\n"\
              "CPU    = \"#{cpu}\"\n"\
              "vCPU   = \"#{cpu.ceil}\"\n"\
              "MEMORY = \"#{mem}\"\n"\
              "HYPERVISOR = \"AZURE\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE  =\"azure\"\n"\
              "]\n"\
              "IMPORT_VM_ID    = \"#{vm.vm_id}\"\n"\
              "SCHED_REQUIREMENTS=\"NAME=\\\"#{@host}\\\"\"\n"\
              'DESCRIPTION = "Instance imported from Azure, from instance'\
              " #{vm.name}\"\n"

        str
    end

    # Transform object to hash
    def examine(obj)
        ret = {}
        obj.instance_variables.each do |instance_variable|
            name = instance_variable[1..-1] # cut leading '@'
            value = obj.send(name)
            if value.is_a? String
                ret[name] = value
            else
                ret[name] = examine(value)
            end
        end
        ret
    end

    # Transform nested hash to level-1 hash, merge keys to single key
    def flatten_hash(hash, delim = '_')
        hash.each_with_object({}) do |(k, v), h|
            if v.is_a? Hash
                flatten_hash(v).map do |h_k, h_v|
                    h["#{k}#{delim}#{h_k}"] = h_v
                end
            else
                h[k] = v
            end
        end
    end

end
