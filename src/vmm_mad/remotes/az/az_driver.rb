#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION = ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby" if !defined?(RUBY_LIB_LOCATION)
    ETC_LOCATION      = "/etc/one/" if !defined?(ETC_LOCATION)
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
    ETC_LOCATION      = ONE_LOCATION + "/etc/" if !defined?(ETC_LOCATION)
end

AZ_DRIVER_CONF = "#{ETC_LOCATION}/az_driver.conf"
AZ_DRIVER_DEFAULT = "#{ETC_LOCATION}/az_driver.default"

# Load Azure credentials and environment
require 'yaml'
require 'rubygems'
require 'azure'
require 'uri'
require 'tempfile'

$: << RUBY_LIB_LOCATION

require 'CommandManager'
require 'scripts_common'
require 'rexml/document'
require 'VirtualMachineDriver'

# The main class for the Azure driver
class AzureDriver
    ACTION          = VirtualMachineDriver::ACTION
    POLL_ATTRIBUTE  = VirtualMachineDriver::POLL_ATTRIBUTE
    VM_STATE        = VirtualMachineDriver::VM_STATE

    # Azure commands constants
    AZ = {
        :run => {
            :cmd => :create_virtual_machine,
            :args => {
                "INSTANCE_TYPE" => {
                    :opt => 'vm_size'
                },
                "IMAGE" => {
                    :opt => 'image'
                },
                "VM_USER" => {
                    :opt => 'vm_user'
                },
                "VM_PASSWORD" => {
                    :opt => 'password'
                },
                "LOCATION" => {
                    :opt => 'location'
                },
                "STORAGE_ACCOUNT" => {
                    :opt => 'storage_account_name'
                },
                "WIN_RM" => {
                    :opt => 'winrm_transport',
                    :proc => lambda { |str| str.split(",") }
                },
                "CLOUD_SERVICE" => {
                    :opt => 'cloud_service_name'
                },
                "TCP_ENDPOINTS" => {
                    :opt => 'tcp_endpoints'
                },
                "SSHPORT" => {
                    :opt => 'ssh_port'
                },
                "AFFINITY_GROUP" => {
                    :opt => 'affinity_group_name'
                },
                "VIRTUAL_NETWORK_NAME" => {
                    :opt => 'virtual_network_name'
                },
                "SUBNET" => {
                    :opt => 'subnet_name'
                },
                "AVAILABILITY_SET" => {
                    :opt => 'availability_set_name'
                }
            }
        },
        :shutdown => {
            :cmd => :shutdown_virtual_machine
        },
        :reboot => {
            :cmd => :restart_virtual_machine
        },
        :stop => {
            :cmd => :shutdown_virtual_machine
        },
        :start => {
            :cmd => :start_virtual_machine
        },
        :delete => {
            :cmd => :delete_virtual_machine
        }
    }

    # Azure attributes that will be retrieved in a polling action
    AZ_POLL_ATTRS = [
        :availability_set_name,
        :cloud_service_name,
        :data_disks,
        :deployment_name,
        :disk_name,
        :hostname,
        :image,
        :ipaddress,
        :media_link,
        :os_type,
        :role_size,
        :tcp_endpoints,
        :udp_endpoints,
        :virtual_network_name
    ]

    # Azure constructor, loads credentials and endpoint
    def initialize(host)
        @host = host
        @to_inst ={}

        @public_cloud_az_conf  = YAML::load(File.read(AZ_DRIVER_CONF))

        if @public_cloud_az_conf['proxy_uri']
            ENV['HTTP_PROXY'] = @public_cloud_az_conf['proxy_uri']
        end

        @instance_types = @public_cloud_az_conf['instance_types']
        @instance_types.keys.each{ |key|
            @to_inst[key.upcase] = key
        }

        certificate = Tempfile.new("certificate")
        conn_opts = get_connect_info(host)

        access_id     = conn_opts[:id]
        endpoint_addr = conn_opts[:endpoint]
        @region_name   = conn_opts[:region]
        certificate << conn_opts[:cert]

        certificate.close

        # Sanitize region data
        if certificate.nil?
            raise "pem_management_cert not defined for #{host}"
        end

        if access_id.nil?
            raise "subscription_id not defined for #{host}"
        end

        # Set default endpoint if not declared
        if endpoint_addr.nil?
            endpoint_addr="https://management.core.windows.net"
        end
        ###################################################################

        Azure.configure do |config|
          config.management_certificate = certificate.path
          config.subscription_id        = access_id
          config.management_endpoint    = endpoint_addr
        end

		certificate.unlink    # deletes the temp file

        @azure_vms = Azure::VirtualMachineManagementService.new
    end

    def get_host_info(client)
        pool = OpenNebula::HostPool.new(client)
        pool.info
        objects=pool.select {|object| object.name==@host }

        objects.first
    end

    # Check the current template to retrieve
    # conection info needed for Azure
    def get_connect_info(host)
        conn_opts={}
        client   = OpenNebula::Client.new
        xmlhost = get_host_info(client)

        system = OpenNebula::System.new(client)
        config = system.get_configuration
        raise "Error getting oned configuration : #{config.message}" if OpenNebula.is_error?(config)

        token = config["ONE_KEY"]

        conn_opts = {
            :cert => xmlhost["TEMPLATE/AZ_CERT"],
            :id   => xmlhost["TEMPLATE/AZ_ID"]
        }
        #conn_opts = OpenNebula.encrypt(conn_opts, token)
        conn_opts = OpenNebula.decrypt(conn_opts, token)

        conn_opts[:region] = xmlhost["TEMPLATE/REGION_NAME"]
        conn_opts[:endpoint] = xmlhost["TEMPLATE/AZ_ENDPOINT"]


        return conn_opts
    end

    # DEPLOY action
    def deploy(id, host, xml_text, lcm_state, deploy_id)
        if lcm_state == "BOOT" || lcm_state == "BOOT_FAILURE"
            load_default_template_values

            az_info = get_deployment_info(host, xml_text)

            if !az_value(az_info, 'IMAGE')
                raise "Cannot find IMAGE in deployment file"
            end

            csn = az_value(az_info, 'CLOUD_SERVICE')

            csn = "csn#{id}" if !csn

            create_params  = create_params(id,csn,az_info)
            create_options = create_options(id,csn,az_info)
            instance       = nil

            in_silence do
              instance = @azure_vms.create_virtual_machine(create_params,
                                                           create_options)
            end


            if instance.class == Azure::VirtualMachineManagement::VirtualMachine
                puts(instance.vm_name)
            else
                raise "Deployment failure " + instance
            end
        else
            restore(deploy_id)
            deploy_id
        end
    end

    # Shutdown an Azure instance
    def shutdown(deploy_id, lcm_state)
        case lcm_state
          when "SHUTDOWN"
            az_action(deploy_id, :shutdown)
            az_action(deploy_id, :delete)
          when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
            az_action(deploy_id, :shutdown)
        end
    end

    # Reboot an Azure instance
    def reboot(deploy_id)
        az_action(deploy_id, :reboot)
    end

    # Cancel an Azure instance
    def cancel(deploy_id)
        az_action(deploy_id, :delete)
    end

    # Stop an Azure instance
    def save(deploy_id)
        az_action(deploy_id, :shutdown)
    end

    # Resume an Azure instance
    def restore(deploy_id)
        az_action(deploy_id, :start)
    end

    # Get info (IP, and state) for an Azure instance
    def poll(id, deploy_id)
        i = get_instance(deploy_id)
        puts parse_poll(i)
    end

    # Get the info of all Aure instances. An Azure instance must have
    # a name compliant with the "one-####_csn" format, where #### are intengers
    def monitor_all_vms
        totalmemory = 0
        totalcpu    = 0

        host_obj=get_host_info(OpenNebula::Client.new)
        capacity = host_obj.to_hash["HOST"]["TEMPLATE"]["CAPACITY"]
        if !capacity.nil? && Hash === capacity
            capacity.each{ |name, value|
                cpu, mem = instance_type_capacity(name)

                totalmemory += mem * value.to_i
                totalcpu    += cpu * value.to_i
            }
        else
            raise "you must define CAPACITY section properly! check the template"
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


        @azure_vms.list_virtual_machines.each do |vm|
          begin
            poll_data=parse_poll(vm)

            vm_template_to_one = vm_to_one(vm)
            vm_template_to_one = Base64.encode64(vm_template_to_one)
            vm_template_to_one = vm_template_to_one.gsub("\n","")

            if vm.vm_name.start_with?('one-') and
               vm.vm_name.match(/([^_]+)-(.+)/) and
               vm.vm_name.match(/([^_]+)-(.+)/).size > 1

                one_id = vm.vm_name.match(/([^_]+)-(.+)/)[1].split("-")[1]
            end

            vms_info << "VM=[\n"
            vms_info << "  ID=#{one_id || -1},\n"
            vms_info << "  DEPLOY_ID=#{vm.vm_name}-#{vm.cloud_service_name},\n"
            vms_info << "  VM_NAME=#{vm.vm_name},\n"
            vms_info << "  IMPORT_TEMPLATE=\"#{vm_template_to_one}\",\n"
            vms_info << "  POLL=\"#{poll_data}\" ]\n"

            if one_id
                cpu, mem = instance_type_capacity(vm.role_size)
                usedcpu    += cpu
                usedmemory += mem
            end
          rescue
            next
          end
        end

        host_info << "USEDMEMORY=#{usedmemory.round}\n"
        host_info << "USEDCPU=#{usedcpu.round}\n"
        host_info << "FREEMEMORY=#{(totalmemory - usedmemory).round}\n"
        host_info << "FREECPU=#{(totalcpu - usedcpu).round}\n"

        puts host_info
        puts vms_info
    end

private

    # Get the associated capacity of the instance_type as cpu (in 100 percent
    # e.g. 800 for 8 cores) and memory (in KB)
    def instance_type_capacity(name)
        resource = @instance_types[@to_inst[name]] || @instance_types[name]
        return 0, 0 if resource.nil?
        return (resource['cpu'].to_f * 100).to_i ,
               (resource['memory'].to_f * 1024 * 1024).to_i
    end

    # Get the Azure section of the template. If more than one Azure section
    # the LOCATION element is used and matched with the host
    def get_deployment_info(host, xml_text)
        xml = REXML::Document.new xml_text
        az = nil
        all_az_elements = xml.root.get_elements("//USER_TEMPLATE/PUBLIC_CLOUD")

        # Look for an azure location
        # if we find the same LOCATION as @region name
        # means that we have the final location
        all_az_elements.each { |element|
            type = element.elements["TYPE"].text.downcase
            location = element.elements["LOCATION"].text.downcase rescue nil

            next if type  != "azure"

            if location.nil?
                az = element
            elsif location && location == @region_name.downcase
                az = element
                break
            end
        }

        # If we don't find an Azure location raise an error
        if !az
            raise "Cannot find Azure element in VM template "<<
                  "or couldn't find any Azure location matching "<<
                  "one of the templates."
        end

        # If LOCATION not explicitly defined, try to get from host, if not
        # try to use hostname as datacenter
        if !az.elements["LOCATION"]
            location=REXML::Element.new("LOCATION")
            location.text = @region_name || @defaults["LOCATION"] || host
            az.elements << location
        end

        az
    end

    # Retrive the vm information from the Azure instance
    def parse_poll(instance)
        begin
            info =  "#{POLL_ATTRIBUTE[:memory]}=0 " \
                    "#{POLL_ATTRIBUTE[:cpu]}=0 " \
                    "#{POLL_ATTRIBUTE[:nettx]}=0 " \
                    "#{POLL_ATTRIBUTE[:netrx]}=0 "

            state = ""
            if !instance
                state = VM_STATE[:deleted]
            else
                state = case instance.deployment_status
                when "Running", "Starting"
                    VM_STATE[:active]
                when "Suspended", "Stopping",
                    VM_STATE[:paused]
                else
                    VM_STATE[:unknown]
                end
            end
            info << "#{POLL_ATTRIBUTE[:state]}=#{state} "

            AZ_POLL_ATTRS.map { |key|
                value = instance.send(key)
                if !value.nil? && !value.empty?
                    if key.to_s.upcase == "TCP_ENDPOINTS" or
                        key.to_s.upcase == "UDP_ENDPOINTS"
                        value_str = format_endpoints(value)
                    elsif value.kind_of?(Hash)
                        value_str = value.inspect
                    else
                        value_str = value
                    end

                    info << "AZ_#{key.to_s.upcase}="
                    info << "\\\"#{value_str.gsub("\"","")}\\\" "

                end
            }

            info
        rescue
            # Unknown state if exception occurs retrieving information from
            # an instance
            "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:unknown]} "
        end
    end

    def format_endpoints(endpoints)
        endpnt_str = ""

        endpoints.each{|ep|
            endpnt_str += "name=#{ep[:name]}," +
                          "vip=#{ep[:vip]},publicport=#{ep[:public_port]}," +
                          "local_port=#{ep[:local_port]},"  +
                          "local_port=#{ep[:protocol]};"
        }

        endpnt_str.chop
    end

    def create_params(id,csn,az_info)
        params = {
            # Name will always be 'one-<id>-<cloud_service_name>'
            :vm_name => "one-#{id}-#{csn}",
            :vm_user => az_value(az_info, 'VM_USER'),
            :image => az_value(az_info, 'IMAGE'),
            :password => az_value(az_info, 'VM_PASSWORD'),
            :location => az_value(az_info, 'LOCATION')
        }.delete_if { |k, v| v.nil? }
    end

    def create_options(id,csn,az_info)
        options = {
          :storage_account_name => az_value(az_info, 'STORAGE_ACCOUNT'),
          :winrm_transport => az_value(az_info, 'WIN_RM'),
          :cloud_service_name => csn,
          :tcp_endpoints => az_value(az_info, 'TCP_ENDPOINTS'),
       # TODO possibly taking the values from user template
       # and create temp files
       #   :private_key_file => 'c:/private_key.key',
       #   :certificate_file => 'c:/certificate.pem',
          :ssh_port => az_value(az_info, 'SSHPORT'),
          :vm_size => az_value(az_info, 'INSTANCE_TYPE'),
          :affinity_group_name => az_value(az_info, 'AFFINITY_GROUP'),
          :virtual_network_name => az_value(az_info, 'VIRTUAL_NETWORK_NAME'),
          :subnet_name => az_value(az_info, 'SUBNET'),
          :availability_set_name => az_value(az_info, 'AVAILABILITY_SET')
        }.delete_if { |k, v| v.nil? }
    end

    # Execute an Azure command
    # +deploy_id+: String, VM id in Azure
    # +az_action+: Symbol, one of the keys of the Azure hash constant (i.e :run)
    def az_action(deploy_id, az_action)
        name, csn = deploy_id.match(/([^_]+)-(.+)/)[1..-1]

        # Imported VMs do not start with one-
        deploy_id = name if !name.start_with? "one-"

        in_silence do
            @azure_vms.send(AZ[az_action][:cmd], deploy_id, csn)
        end
    end

    # Returns the value of the xml specified by the name or the default
    # one if it does not exist
    # +xml+: REXML Document, containing Azure information
    # +name+: String, xpath expression to retrieve the value
    # +block+: Block, block to be applied to the value before returning it
    def az_value(xml, name, &block)
        value = value_from_xml(xml, name) || @defaults[name]
        if block_given? && value
            block.call(value)
        else
            value
        end
    end

    def value_from_xml(xml, name)
        if xml
            element = xml.elements[name]
            element.text.strip if element && element.text
        end
    end

    # Load the default values that will be used to create a new instance, if
    #   not provided in the template. These values are defined in the AZ_CONF
    #   file
    def load_default_template_values
        @defaults = Hash.new

        if File.exists?(AZ_DRIVER_DEFAULT)
            fd  = File.new(AZ_DRIVER_DEFAULT)
            xml = REXML::Document.new fd
            fd.close()

            return if !xml || !xml.root

            az = xml.root.elements["AZURE"]

            return if !az

            AZ.each {|action, hash|
                if hash[:args]
                    hash[:args].each { |key, value|
                        @defaults[key] = value_from_xml(az, key)
                    }
                end
            }
        end
    end

    def in_silence
        begin
          orig_stderr = $stderr.clone
          orig_stdout = $stdout.clone
          $stderr.reopen File.new('/dev/null', 'w')
          $stdout.reopen File.new('/dev/null', 'w')
          retval = yield
        rescue Exception => e
          $stdout.reopen orig_stdout
          $stderr.reopen orig_stderr
          raise e
        ensure
          $stdout.reopen orig_stdout
          $stderr.reopen orig_stderr
        end
       retval
    end

    # Retrieve the instance from Azure. If OpenNebula asks for it, then the
    # vm_name must comply with the notation name_csn
    def get_instance(deploy_id)
        csn     = deploy_id.match(/([^_]+)-(.+)/)[-1]

        instance = @azure_vms.get_virtual_machine(deploy_id,csn)
        if instance
            return instance
        else
            raise "Instance #{deploy_id} does not exist"
        end
    end

    # Build template for importation
    def vm_to_one(vm)
        cpu, mem = instance_type_capacity(vm.role_size)

        mem = mem.to_i / 1024 # Memory for templates expressed in MB
        cpu = cpu.to_f / 100  # CPU expressed in units

        str = "NAME   = \"Instance from #{vm.vm_name}\"\n"\
              "CPU    = \"#{cpu}\"\n"\
              "vCPU   = \"#{cpu.ceil}\"\n"\
              "MEMORY = \"#{mem}\"\n"\
              "HYPERVISOR = \"AZURE\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE  =\"azure\"\n"\
              "]\n"\
              "IMPORT_VM_ID    = \"#{vm.vm_name}-#{vm.cloud_service_name}\"\n"\
              "SCHED_REQUIREMENTS=\"NAME=\\\"#{@host}\\\"\"\n"\
              "DESCRIPTION = \"Instance imported from Azure, from instance"\
              " #{vm.vm_name}\"\n"

        str
    end
end

