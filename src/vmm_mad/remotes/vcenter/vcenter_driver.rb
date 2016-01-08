# ---------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

# -------------------------------------------------------------------------#
# Set up the environment for the driver                                    #
# -------------------------------------------------------------------------#
ONE_LOCATION = ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
   BIN_LOCATION = "/usr/bin" if !defined?(BIN_LOCATION)
   LIB_LOCATION = "/usr/lib/one" if !defined?(LIB_LOCATION)
   ETC_LOCATION = "/etc/one/" if !defined?(ETC_LOCATION)
   VAR_LOCATION = "/var/lib/one" if !defined?(VAR_LOCATION)
else
   BIN_LOCATION = ONE_LOCATION + "/bin" if !defined?(BIN_LOCATION)
   LIB_LOCATION = ONE_LOCATION + "/lib" if !defined?(LIB_LOCATION)
   ETC_LOCATION = ONE_LOCATION  + "/etc/" if !defined?(ETC_LOCATION)
   VAR_LOCATION = ONE_LOCATION + "/var/" if !defined?(VAR_LOCATION)
end

ENV['LANG'] = 'C'

$: << LIB_LOCATION+'/ruby/vendors/rbvmomi/lib'
$: << LIB_LOCATION+'/ruby'

require 'rbvmomi'
require 'yaml'
require 'opennebula'
require 'base64'
require 'openssl'
require 'openssl'
require 'VirtualMachineDriver'

module VCenterDriver

################################################################################
# This class represents a VCenter connection and an associated OpenNebula client
# The connection is associated to the VCenter backing a given OpenNebula host.
# For the VCenter driver each OpenNebula host represents a VCenter cluster
################################################################################
class VIClient
    attr_reader :vim, :one, :root, :cluster, :user, :pass, :host

    def get_entities(folder, type, entities=[])
        return nil if folder == []

        folder.childEntity.each do |child|
            name, junk = child.to_s.split('(')

            case name
            when "Folder"
                get_entities(child, type, entities)
            when type
                entities.push(child)
            end
        end

        return entities
    end


    ############################################################################
    # Initializr the VIClient, and creates an OpenNebula client. The parameters
    # are obtained from the associated OpenNebula host
    # @param hid [Integer] The OpenNebula host id with VCenter attributes
    ############################################################################
    def initialize(hid)

        initialize_one

        @one_host = ::OpenNebula::Host.new_with_id(hid, @one)
        rc = @one_host.info

        if ::OpenNebula.is_error?(rc)
            raise "Error getting host information: #{rc.message}"
        end

        password = @one_host["TEMPLATE/VCENTER_PASSWORD"]

        if !@token.nil?
            begin
                cipher = OpenSSL::Cipher::Cipher.new("aes-256-cbc")

                cipher.decrypt
                cipher.key = @token

                password =  cipher.update(Base64::decode64(password))
                password << cipher.final
            rescue
                raise "Error decrypting vCenter password"
            end
        end

        connection = {
            :host     => @one_host["TEMPLATE/VCENTER_HOST"],
            :user     => @one_host["TEMPLATE/VCENTER_USER"],
            :password => password
        }

        initialize_vim(connection)

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each {|dc|
            ccrs = get_entities(dc.hostFolder, 'ClusterComputeResource')

            next if ccrs.nil?

            @cluster = ccrs.find{ |ccr| @one_host.name == ccr.name }

            (@dc = dc; break) if @cluster
        }

        if @dc.nil? || @cluster.nil?
            raise "Cannot find DataCenter or ClusterComputeResource for host."
        end
    end

    ########################################################################
    # Initialize a VIConnection based just on the VIM parameters. The
    # OpenNebula client is also initilialized
    ########################################################################
    def self.new_connection(user_opts)

        conn = allocate

        conn.initialize_one

        conn.initialize_vim(user_opts)

        return conn
    end

    ########################################################################
    # The associated cluster for this connection
    ########################################################################
    def cluster
       @cluster
    end

    ########################################################################
    # The associated cluster for this connection
    ########################################################################
    def rp_confined?
       !@one_host["TEMPLATE/VCENTER_RESOURCE_POOL"].nil?
    end

    ########################################################################
    # The associated resource pool for this connection
    # @return [ResourcePool] an array of resource pools including the default
    #    resource pool. If the connection is confined to a particular
    #    resource pool, then return just that one
    ########################################################################
    def resource_pool
        rp_name = @one_host["TEMPLATE/VCENTER_RESOURCE_POOL"]

       if rp_name.nil?
          rp_array = @cluster.resourcePool.resourcePool
          rp_array << @cluster.resourcePool
          rp_array
       else
          [find_resource_pool(rp_name)]
       end
    end

    ########################################################################
    # Get the default resource pool of the connection. Only valid if
    # the connection is not confined in a resource pool
    # @return ResourcePool the default resource pool
    ########################################################################
    def default_resource_pool
        @cluster.resourcePool
    end

    ########################################################################
    # Searches the desired ResourcePool of the DataCenter for the current
    # connection. Returns a RbVmomi::VIM::ResourcePool or the default pool
    # if not found
    # @param rpool [String] the ResourcePool name
    ########################################################################
    def find_resource_pool(poolName)
        baseEntity = @cluster
        entityArray = poolName.split('/')
        entityArray.each do |entityArrItem|
          if entityArrItem != ''
            if baseEntity.is_a? RbVmomi::VIM::Folder
                baseEntity = baseEntity.childEntity.find { |f|
                                  f.name == entityArrItem
                              } or return @cluster.resourcePool
            elsif baseEntity.is_a? RbVmomi::VIM::ClusterComputeResource
                baseEntity = baseEntity.resourcePool.resourcePool.find { |f|
                                  f.name == entityArrItem
                              } or return @cluster.resourcePool
            elsif baseEntity.is_a? RbVmomi::VIM::ResourcePool
                baseEntity = baseEntity.resourcePool.find { |f|
                                  f.name == entityArrItem
                              } or return @cluster.resourcePool
            else
                return @cluster.resourcePool
            end
          end
        end

        if !baseEntity.is_a?(RbVmomi::VIM::ResourcePool) and
            baseEntity.respond_to?(:resourcePool)
              baseEntity = baseEntity.resourcePool
        end

        baseEntity
    end

    ########################################################################
    # Searches the associated vmFolder of the DataCenter for the current
    # connection. Returns a RbVmomi::VIM::VirtualMachine or nil if not found
    # @param uuid [String] the UUID of the VM or VM Template
    ########################################################################
    def find_vm_template(uuid)
        vms = get_entities(@dc.vmFolder, 'VirtualMachine')

        return vms.find do |v|
            begin
                v.config && v.config.uuid == uuid
            rescue RbVmomi::VIM::ManagedObjectNotFound
                false
            end
        end
    end

    ########################################################################
    # Searches the associated vmFolder of the DataCenter for the current
    # connection. Returns a RbVmomi::VIM::VirtualMachine or nil if not found
    # @param vm_name [String] the UUID of the VM or VM Template
    ########################################################################
    def find_vm(vm_name)
        vms = get_entities(@dc.vmFolder, 'VirtualMachine')

        return vms.find do |v|
            begin
                v.name == vm_name
            rescue RbVmomi::VIM::ManagedObjectNotFound
                false
            end
        end
    end

    ########################################################################
    # Builds a hash with the DataCenter / ClusterComputeResource hierarchy
    # for this VCenter.
    # @return [Hash] in the form
    #   {dc_name [String] => ClusterComputeResources Names [Array - String]}
    ########################################################################
    def hierarchy(one_client=nil)
        vc_hosts = {}

        datacenters = get_entities(@root, 'Datacenter')

        hpool = OpenNebula::HostPool.new((one_client||@one))
        rc    = hpool.info

        datacenters.each { |dc|
            ccrs = get_entities(dc.hostFolder, 'ClusterComputeResource')
            vc_hosts[dc.name] = []
            ccrs.each { |c|
                if !hpool["HOST[NAME=\"#{c.name}\"]"]
                    vc_hosts[dc.name] << c.name
                end
              }
        }

        return vc_hosts
    end

    ########################################################################
    # Builds a hash with the Datacenter / VM Templates for this VCenter
    # @param one_client [OpenNebula::Client] Use this client instead of @one
    # @return [Hash] in the form
    #   { dc_name [String] => }
    ########################################################################
    def vm_templates(one_client=nil)
        vm_templates = {}

        tpool = OpenNebula::TemplatePool.new(
            (one_client||@one), OpenNebula::Pool::INFO_ALL)
        rc = tpool.info
        if OpenNebula.is_error?(rc)
            raise "Error contacting OpenNebula #{rc.message}"
        end

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each { |dc|
            vms = get_entities(dc.vmFolder, 'VirtualMachine')

            tmp = vms.select { |v| v.config && (v.config.template == true) }

            one_tmp = []

            tmp.each { |t|
                vi_tmp = VCenterVm.new(self, t)

                if !tpool["VMTEMPLATE/TEMPLATE/PUBLIC_CLOUD[\
                        TYPE=\"vcenter\" \
                        and VM_TEMPLATE=\"#{vi_tmp.vm.config.uuid}\"]"]
                    hostname = vi_tmp.vm.runtime.host.parent.name
                    one_tmp << {
                        :name => "#{vi_tmp.vm.name} - #{hostname}",
                        :uuid => vi_tmp.vm.config.uuid,
                        :host => hostname,
                        :one  => vi_tmp.to_one
                    }
                end
            }

            vm_templates[dc.name] = one_tmp
        }

        return vm_templates
    end

    ########################################################################
    # Builds a hash with the Datacenter / Virtual Machines for this VCenter
    # @param one_client [OpenNebula::Client] Use this client instead of @one
    # @return [Hash] in the form
    #   { dc_name [String] => }
    ########################################################################
    def running_vms(one_client=nil)
        running_vms = {}

        vmpool = OpenNebula::VirtualMachinePool.new(
            (one_client||@one), OpenNebula::Pool::INFO_ALL)
        rc = vmpool.info

        hostpool = OpenNebula::HostPool.new((one_client||@one))
        rc       = hostpool.info
        if OpenNebula.is_error?(rc)
            raise "Error contacting OpenNebula #{rc.message}"
        end

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each { |dc|
            vms     = get_entities(dc.vmFolder, 'VirtualMachine')
            ccrs    = get_entities(dc.hostFolder, 'ClusterComputeResource')

            vm_list = vms.select { |v|
                # Get rid of VM Templates and VMs not in running state
                v.config &&
                v.config.template != true &&
                v.summary.runtime.powerState == "poweredOn"
            }

            one_tmp = []

            vm_list.each { |v|
                vi_tmp = VCenterVm.new(self, v)

                # Do not reimport VMs deployed by OpenNebula
                # since the core will get confused with the IDs
                next if vi_tmp.vm.name.match(/^one-(\d*)(-(.*))?$/)

                container_hostname = vi_tmp.vm.runtime.host.parent.name

                cluster_name = ccrs.collect { |c|
                  found_host=c.host.select {|h|
                           h.parent.name == container_hostname}
                   found_host.first.parent.name if found_host.size > 0
                }.first

                if !vmpool["VM/USER_TEMPLATE/PUBLIC_CLOUD[\
                        TYPE=\"vcenter\" \
                        and VM_TEMPLATE=\"#{vi_tmp.vm.config.uuid}\"]"]

                    host_id = name_to_id(container_hostname,hostpool,"HOST")[1]

                    one_tmp << {
                        :name => "#{vi_tmp.vm.name} - #{container_hostname}",
                        :uuid => vi_tmp.vm.config.uuid,
                        :host => container_hostname,
                        :host_id => host_id,
                        :one  => vi_tmp.vm_to_one
                    }
                end
            }

            running_vms[dc.name] = one_tmp
        }

        return running_vms
    end

    def name_to_id(name, pool, ename)
            objects=pool.select {|object| object.name==name }

            if objects.length>0
                if objects.length>1
                    return -1, "There are multiple #{ename}s with name #{name}."
                else
                    result = objects.first.id
                end
            else
                return -1, "#{ename} named #{name} not found."
            end

            return 0, result
    end

    ########################################################################
    # Builds a hash with the Datacenter / CCR (Distributed)Networks
    # for this VCenter
    # @param one_client [OpenNebula::Client] Use this client instead of @one
    # @return [Hash] in the form
    #   { dc_name [String] => Networks [Array] }
    ########################################################################
    def vcenter_networks(one_client=nil)
        vcenter_networks = {}

        vnpool = OpenNebula::VirtualNetworkPool.new(
            (one_client||@one), OpenNebula::Pool::INFO_ALL)
        rc     = vnpool.info
        if OpenNebula.is_error?(rc)
            raise "Error contacting OpenNebula #{rc.message}"
        end

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each { |dc|
            networks = get_entities(dc.networkFolder, 'Network' )
            one_nets = []

            networks.each { |n|
                # Skip those not in cluster
                next if !n[:host][0]

                # Networks can be in several cluster, create one per cluster
                Array(n[:host][0]).each{ |host_system|
                    net_name = "#{n.name} - #{host_system.parent.name}"

                    if !vnpool["VNET[BRIDGE=\"#{n[:name]}\"]/\
                            TEMPLATE[VCENTER_TYPE=\"Port Group\"]"]
                        one_nets << {
                            :name    => net_name,
                            :bridge  => n.name,
                            :cluster => host_system.parent.name,
                            :type    => "Port Group",
                            :one     => "NAME   = \"#{net_name}\"\n" \
                                        "BRIDGE = \"#{n[:name]}\"\n" \
                                        "VCENTER_TYPE = \"Port Group\""
                        }
                    end
                }
            }

            networks = get_entities(dc.networkFolder,
                                    'DistributedVirtualPortgroup' )

            networks.each { |n|
                # Skip those not in cluster
                next if !n[:host][0]

                # DistributedVirtualPortgroup can be in several cluster,
                # create one per cluster
                Array(n[:host][0]).each{ |host_system|
                 net_name = "#{n.name} - #{n[:host][0].parent.name}"

                 if !vnpool["VNET[BRIDGE=\"#{n[:name]}\"]/\
                         TEMPLATE[VCENTER_TYPE=\"Distributed Port Group\"]"]
                     vnet_template = "NAME   = \"#{net_name}\"\n" \
                                     "BRIDGE = \"#{n[:name]}\"\n" \
                                     "VCENTER_TYPE = \"Distributed Port Group\""


                     default_pc = n.config.defaultPortConfig

                     has_vlan = false
                     vlan_str = ""

                     if default_pc.methods.include? :vlan
                        has_vlan = default_pc.vlan.methods.include? :vlanId
                     end

                     if has_vlan
                         vlan     = n.config.defaultPortConfig.vlan.vlanId

                         if vlan != 0
                             if vlan.is_a? Array
                                 vlan.each{|v|
                                     vlan_str += v.start.to_s + ".." +
                                                 v.end.to_s + ","
                                 }
                                 vlan_str.chop!
                             else
                                 vlan_str = vlan.to_s
                             end
                         end
                     end

                     if !vlan_str.empty?
                         vnet_template << "VLAN=\"YES\"\n" \
                                          "VLAN_ID=#{vlan_str}\n"
                     end

                     one_net = {:name    => net_name,
                                :bridge  => n.name,
                                :cluster => host_system.parent.name,
                                :type   => "Distributed Port Group",
                                :one    => vnet_template}

                     one_net[:vlan] = vlan_str if !vlan_str.empty?

                     one_nets << one_net
                 end
                }
            }

            vcenter_networks[dc.name] = one_nets
        }

        return vcenter_networks
    end

    def self.translate_hostname(hostname)
        host_pool = OpenNebula::HostPool.new(::OpenNebula::Client.new())
        rc        = host_pool.info
        raise "Could not find host #{hostname}" if OpenNebula.is_error?(rc)

        host = host_pool.select {|host_element| host_element.name==hostname }
        return host.first.id
    end

    ############################################################################
    # Initialize an OpenNebula connection with the default ONE_AUTH
    ############################################################################
    def initialize_one
        begin
            @one   = ::OpenNebula::Client.new()
            system = ::OpenNebula::System.new(@one)

            config = system.get_configuration()

            if ::OpenNebula.is_error?(config)
                raise "Error getting oned configuration : #{config.message}"
            end

            @token = config["ONE_KEY"]
        rescue Exception => e
            raise "Error initializing OpenNebula client: #{e.message}"
        end
    end

    ############################################################################
    # Initialize a connection with vCenter. Options
    # @param options[Hash] with:
    #    :user => The vcenter user
    #    :password => Password for the user
    #    :host => vCenter hostname or IP
    #    :insecure => SSL (optional, defaults to true)
    ############################################################################
    def initialize_vim(user_opts={})
        opts = {
            :insecure => true
        }.merge(user_opts)

        @user = opts[:user]
        @pass = opts[:password]
        @host = opts[:host]

        begin
            @vim  = RbVmomi::VIM.connect(opts)
            @root = @vim.root
        rescue Exception => e
            raise "Error connecting to #{@host}: #{e.message}"
        end
    end
end

################################################################################
# This class is an OpenNebula hosts that abstracts a vCenter cluster. It
# includes the functionality needed to monitor the cluster and report the ESX
# hosts and VM status of the cluster.
################################################################################
class VCenterHost < ::OpenNebula::Host
    attr_reader :vc_client, :vc_root, :cluster, :host, :client

    ############################################################################
    # Initialize the VCenterHost by looking for the associated objects of the
    # VIM hierarchy
    # client [VIClient] to interact with the associated vCenter
    ############################################################################
    def initialize(client)
        @client  = client
        @cluster = client.cluster

        @resource_pools = client.resource_pool
    end

    ########################################################################
    #  Creates an OpenNebula host representing a cluster in this VCenter
    #  @param cluster_name[String] the name of the cluster in the vcenter
    #  @param client [VIClient] to create the host
    #  @return In case of success [0, host_id] or [-1, error_msg]
    ########################################################################
    def self.to_one(cluster_name, client)
        one_host = ::OpenNebula::Host.new(::OpenNebula::Host.build_xml,
            client.one)

        rc = one_host.allocate(cluster_name, 'vcenter', 'vcenter', 'dummy',
                ::OpenNebula::ClusterPool::NONE_CLUSTER_ID)

        return -1, rc.message if ::OpenNebula.is_error?(rc)

        template = "VCENTER_HOST=\"#{client.host}\"\n"\
                   "VCENTER_PASSWORD=\"#{client.pass}\"\n"\
                   "VCENTER_USER=\"#{client.user}\"\n"

        rc = one_host.update(template, false)

        if ::OpenNebula.is_error?(rc)
            error = rc.message

            rc = one_host.delete

            if ::OpenNebula.is_error?(rc)
                error << ". Host #{cluster_name} could not be"\
                    " deleted: #{rc.message}."
            end

            return -1, error
        end

        return 0, one_host.id
    end

    ############################################################################
    # Generate an OpenNebula monitor string for this host. Reference:
    # https://www.vmware.com/support/developer/vc-sdk/visdk25pubs/Reference
    # Guide/vim.ComputeResource.Summary.html
    #   - effectiveCpu: Effective CPU resources (in MHz) available to run
    #     VMs. This is the aggregated from all running hosts excluding hosts in
    #     maintenance mode or unresponsive are not counted.
    #   - effectiveMemory: Effective memory resources (in MB) available to run
    #     VMs. Equivalente to effectiveCpu.
    #   - numCpuCores: Number of physical CPU cores.
    #   - numEffectiveHosts: Total number of effective hosts.
    #   - numHosts:Total number of hosts.
    #   - totalCpu: Aggregated CPU resources of all hosts, in MHz.
    #   - totalMemory: Aggregated memory resources of all hosts, in bytes.
    ############################################################################
    def monitor_cluster
        #Load the host systems
        summary = @cluster.summary

        mhz_core = summary.totalCpu.to_f / summary.numCpuCores.to_f
        eff_core = summary.effectiveCpu.to_f / mhz_core

        free_cpu  = sprintf('%.2f', eff_core * 100).to_f
        total_cpu = summary.numCpuCores.to_f * 100
        used_cpu  = sprintf('%.2f', total_cpu - free_cpu).to_f

        total_mem = summary.totalMemory.to_i / 1024
        free_mem  = summary.effectiveMemory.to_i * 1024

        str_info = ""

        # System
        str_info << "HYPERVISOR=vcenter\n"
        str_info << "PUBLIC_CLOUD=YES\n"
        str_info << "TOTALHOST=" << summary.numHosts.to_s << "\n"
        str_info << "AVAILHOST=" << summary.numEffectiveHosts.to_s << "\n"

        # CPU
        str_info << "CPUSPEED=" << mhz_core.to_s   << "\n"
        str_info << "TOTALCPU=" << total_cpu.to_s << "\n"
        str_info << "USEDCPU="  << used_cpu.to_s  << "\n"
        str_info << "FREECPU="  << free_cpu.to_s << "\n"

        # Memory
        str_info << "TOTALMEMORY=" << total_mem.to_s << "\n"
        str_info << "FREEMEMORY="  << free_mem.to_s << "\n"
        str_info << "USEDMEMORY="  << (total_mem - free_mem).to_s
    end

    ############################################################################
    # Generate a template with information for each ESX Host. Reference:
    # http://pubs.vmware.com/vi-sdk/visdk250/ReferenceGuide/vim.HostSystem.html
    #   - Summary: Basic information about the host, including connection state
    #     - hardware: Hardware configuration of the host. This might not be
    #       available for a disconnected host.
    #     - quickStats: Basic host statistics.
    ############################################################################
    def monitor_host_systems
        host_info = ""

        @cluster.host.each{|h|
            next if h.runtime.connectionState != "connected"

            summary = h.summary
            hw      = summary.hardware
            stats   = summary.quickStats

            total_cpu = hw.numCpuCores * 100
            used_cpu  = (stats.overallCpuUsage.to_f / hw.cpuMhz.to_f) * 100
            used_cpu  = sprintf('%.2f', used_cpu).to_f # Trim precission
            free_cpu  = total_cpu - used_cpu

            total_memory = hw.memorySize/1024
            used_memory  = stats.overallMemoryUsage*1024
            free_memory  = total_memory - used_memory

            host_info << "\nHOST=["
            host_info << "STATE=on,"
            host_info << "HOSTNAME=\""  << h.name.to_s  << "\","
            host_info << "MODELNAME=\"" << hw.cpuModel.to_s  << "\","
            host_info << "CPUSPEED="    << hw.cpuMhz.to_s    << ","
            host_info << "MAX_CPU="    << total_cpu.to_s << ","
            host_info << "USED_CPU="     << used_cpu.to_s  << ","
            host_info << "FREE_CPU="     << free_cpu.to_s << ","
            host_info << "MAX_MEM=" << total_memory.to_s << ","
            host_info << "USED_MEM="  << used_memory.to_s  << ","
            host_info << "FREE_MEM="  << free_memory.to_s
            host_info << "]"
        }

        return host_info
    end

    def monitor_vms
        str_info = ""
        @resource_pools.each{|rp|
          rp.vm.each { |v|
            begin
                name   = v.name
                number = -1

                matches = name.match(/^one-(\d*)(-(.*))?$/)
                number  = matches[1] if matches

                vm = VCenterVm.new(@client, v)
                vm.monitor

                next if !vm.vm.config

                str_info << "\nVM = ["
                str_info << "ID=#{number},"
                str_info << "DEPLOY_ID=\"#{vm.vm.config.uuid}\","
                str_info << "VM_NAME=\"#{name} - "\
                            "#{v.runtime.host.parent.name}\","

                if number == -1
                    vm_template_to_one =
                        Base64.encode64(vm.vm_to_one).gsub("\n","")
                    str_info << "IMPORT_TEMPLATE=\"#{vm_template_to_one}\","
                end

                str_info << "POLL=\"#{vm.info}\"]"
            rescue Exception => e
                STDERR.puts e.inspect
                STDERR.puts e.backtrace
            end
          }
        }

        return str_info
    end

    def monitor_customizations
        customizations = client.vim.serviceContent.customizationSpecManager.info

        text = ''

        customizations.each do |c|
            t = "CUSTOMIZATION = [ "
            t << %Q<NAME = "#{c.name}", >
            t << %Q<TYPE = "#{c.type}" ]\n>

            text << t
        end

        text
    end
end

################################################################################
# This class is a high level abstraction of a VI VirtualMachine class with
# OpenNebula semantics.
################################################################################

class VCenterVm
    attr_reader :vm

    POLL_ATTRIBUTE  = VirtualMachineDriver::POLL_ATTRIBUTE
    VM_STATE        = VirtualMachineDriver::VM_STATE

    ############################################################################
    #  Creates a new VIVm using a RbVmomi::VirtualMachine object
    #    @param client [VCenterClient] client to connect to vCenter
    #    @param vm_vi [RbVmomi::VirtualMachine] it will be used if not nil
    ########################################################################
    def initialize(client, vm_vi )
        @vm     = vm_vi
        @client = client

        @used_cpu    = 0
        @used_memory = 0

        @netrx = 0
        @nettx = 0
    end

    ############################################################################
    # Deploys a VM
    #  @xml_text XML repsentation of the VM
    ############################################################################
    def self.deploy(xml_text, lcm_state, deploy_id, hostname)
        if lcm_state == "BOOT" || lcm_state == "BOOT_FAILURE"
            return clone_vm(xml_text, hostname)
        else
            hid         = VIClient::translate_hostname(hostname)
            connection  = VIClient.new(hid)
            vm          = connection.find_vm_template(deploy_id)

            # Find out if we need to reconfigure capacity
            xml = REXML::Document.new xml_text

            expected_cpu    = xml.root.elements["//TEMPLATE/VCPU"] ? xml.root.elements["//TEMPLATE/VCPU"].text : 1
            expected_memory = xml.root.elements["//TEMPLATE/MEMORY"].text
            current_cpu     = vm.config.hardware.numCPU
            current_memory  = vm.config.hardware.memoryMB

            if current_cpu != expected_cpu or current_memory != expected_memory
                capacity_hash = {:numCPUs  => expected_cpu.to_i,
                                 :memoryMB => expected_memory }
                spec = RbVmomi::VIM.VirtualMachineConfigSpec(capacity_hash)
                vm.ReconfigVM_Task(:spec => spec).wait_for_completion
            end

            vm.PowerOnVM_Task.wait_for_completion
            return vm.config.uuid
        end
    end

    ############################################################################
    # Cancels a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.cancel(deploy_id, hostname, lcm_state, keep_disks)
        case lcm_state
            when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
                shutdown(deploy_id, hostname, lcm_state)
            when "CANCEL", "LCM_INIT", "CLEANUP_RESUBMIT", "SHUTDOWN"
                hid         = VIClient::translate_hostname(hostname)
                connection  = VIClient.new(hid)
                vm          = connection.find_vm_template(deploy_id)

                begin
                    if vm.summary.runtime.powerState == "poweredOn"
                        vm.PowerOffVM_Task.wait_for_completion
                    end
                rescue
                end
                detach_all_disks(vm) if keep_disks
                vm.Destroy_Task.wait_for_completion
            else
                raise "LCM_STATE #{lcm_state} not supported for cancel"
        end
    end


    ############################################################################
    # Saves a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.save(deploy_id, hostname, lcm_state)
        case lcm_state
            when "SAVE_MIGRATE"
                raise "Migration between vCenters cluster not supported"
            when "SAVE_SUSPEND", "SAVE_STOP"
                hid         = VIClient::translate_hostname(hostname)
                connection  = VIClient.new(hid)
                vm          = connection.find_vm_template(deploy_id)

                vm.SuspendVM_Task.wait_for_completion
        end
    end

    ############################################################################
    # Resumes a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.resume(deploy_id, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)
        vm          = connection.find_vm_template(deploy_id)

        vm.PowerOnVM_Task.wait_for_completion
    end

    ############################################################################
    # Reboots a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.reboot(deploy_id, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        vm.RebootGuest.wait_for_completion
    end

    ############################################################################
    # Resets a VM
    #  @param deploy_id vcetranslate_hostnamnter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.reset(deploy_id, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        vm.ResetVM_Task.wait_for_completion
    end

    ############################################################################
    # Shutdown a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.shutdown(deploy_id, hostname, lcm_state, keep_disks)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        case lcm_state
            when "SHUTDOWN"
                begin
                    vm.ShutdownGuest.wait_for_completion
                rescue
                end
                vm.PowerOffVM_Task.wait_for_completion
                detach_all_disks(vm) if keep_disks
                vm.Destroy_Task.wait_for_completion
            when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
                begin
                    vm.ShutdownGuest.wait_for_completion
                rescue
                end
                vm.PowerOffVM_Task.wait_for_completion
        end
    end

    ############################################################################
    # Create VM snapshot
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.create_snapshot(deploy_id, hostname, snapshot_name)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        snapshot_hash = {
            :name => snapshot_name,
            :description => "OpenNebula Snapshot of VM #{deploy_id}",
            :memory => true,
            :quiesce => true
        }

        vm          = connection.find_vm_template(deploy_id)

        vm.CreateSnapshot_Task(snapshot_hash).wait_for_completion

        return snapshot_name
    end

    ############################################################################
    # Find VM snapshot
    #  @param list root list of VM snapshots
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.find_snapshot(list, snapshot_name)
        list.each do |i|
            if i.name == snapshot_name
                return i.snapshot
            elsif !i.childSnapshotList.empty?
                snap = find_snapshot(i.childSnapshotList, snapshot_name)
                return snap if snap
            end
        end

        nil
    end

    ############################################################################
    # Delete VM snapshot
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.delete_snapshot(deploy_id, hostname, snapshot_name)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        list = vm.snapshot.rootSnapshotList

        snapshot = find_snapshot(list, snapshot_name)
        return nil if !snapshot

        delete_snapshot_hash = {
            :_this => snapshot,
            :removeChildren => false
        }

        snapshot.RemoveSnapshot_Task(delete_snapshot_hash).wait_for_completion
    end

    ############################################################################
    # Revert VM snapshot
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.revert_snapshot(deploy_id, hostname, snapshot_name)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        list = vm.snapshot.rootSnapshotList

        snapshot = find_snapshot(list, snapshot_name)
        return nil if !snapshot

        revert_snapshot_hash = {
            :_this => snapshot
        }

        snapshot.RevertToSnapshot_Task(revert_snapshot_hash).wait_for_completion
    end

    ############################################################################
    # Attach NIC to a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param mac MAC address of the NIC to be attached
    #  @param bridge name of the Network in vCenter
    #  @param model model of the NIC to be attached
    #  @param host hostname of the ESX where the VM is running
    ############################################################################
    def self.attach_nic(deploy_id, mac, bridge, model, host)
        hid         = VIClient::translate_hostname(host)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        spec_hash   = calculate_addnic_spec(vm, mac, bridge, model)

        spec        = RbVmomi::VIM.VirtualMachineConfigSpec({:deviceChange =>
                                                              [spec_hash]})

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ############################################################################
    # Detach NIC from a VM
    ############################################################################
    def self.detach_nic(deploy_id, mac, host)
        hid         = VIClient::translate_hostname(host)
        connection  = VIClient.new(hid)

        vm   = connection.find_vm_template(deploy_id)

        nic  = vm.config.hardware.device.find { |d|
                is_nic?(d) && (d.macAddress ==  mac)
        }

        raise "Could not find NIC with mac address #{mac}" if nic.nil?

        spec = {
            :deviceChange => [
                :operation => :remove,
                :device => nic
            ]
        }

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ########################################################################
    #  Initialize the vm monitor information
    ########################################################################
    def monitor
        @summary = @vm.summary
        @state   = state_to_c(@summary.runtime.powerState)

        if @state != VM_STATE[:active]
            @used_cpu    = 0
            @used_memory = 0

            @netrx = 0
            @nettx = 0

            return
        end

        @used_memory = @summary.quickStats.hostMemoryUsage * 1024

        host   = @vm.runtime.host
        cpuMhz = host.summary.hardware.cpuMhz.to_f

        @used_cpu   =
                ((@summary.quickStats.overallCpuUsage.to_f / cpuMhz) * 100).to_s
        @used_cpu   = sprintf('%.2f',@used_cpu).to_s

        # Check for negative values
        @used_memory = 0 if @used_memory.to_i < 0
        @used_cpu    = 0 if @used_cpu.to_i < 0

        @esx_host       = @vm.summary.runtime.host.name
        @guest_ip       = @vm.guest.ipAddress
        @guest_state    = @vm.guest.guestState
        @vmware_tools   = @vm.guest.toolsRunningStatus
        @vmtools_ver    = @vm.guest.toolsVersion
        @vmtools_verst  = @vm.guest.toolsVersionStatus

        guest_ip_addresses = []

        @vm.guest.net.each do |net|
            net.ipConfig.ipAddress.each do |ip|
                guest_ip_addresses << ip.ipAddress
            end if net.ipConfig && net.ipConfig.ipAddress
        end if @vm.guest.net

        @guest_ip_addresses = guest_ip_addresses.join(',')
    end

    ########################################################################
    #  Generates a OpenNebula IM Driver valid string with the monitor info
    ########################################################################
    def info
      return 'STATE=d' if @state == 'd'

      str_info = ""

      str_info << "GUEST_IP=" << @guest_ip.to_s << " " if @guest_ip
      if @guest_ip_addresses && !@guest_ip_addresses.empty?
          str_info << "GUEST_IP_ADDRESSES=\\\"" <<
              @guest_ip_addresses.to_s << "\\\" "
      end
      str_info << "#{POLL_ATTRIBUTE[:state]}="  << @state                << " "
      str_info << "#{POLL_ATTRIBUTE[:cpu]}="    << @used_cpu.to_s        << " "
      str_info << "#{POLL_ATTRIBUTE[:memory]}=" << @used_memory.to_s     << " "
      str_info << "#{POLL_ATTRIBUTE[:netrx]}="  << @netrx.to_s          << " "
      str_info << "#{POLL_ATTRIBUTE[:nettx]}="  << @nettx.to_s          << " "
      str_info << "ESX_HOST="                   << @esx_host.to_s        << " "
      str_info << "GUEST_STATE="                << @guest_state.to_s     << " "
      str_info << "VMWARETOOLS_RUNNING_STATUS=" << @vmware_tools.to_s    << " "
      str_info << "VMWARETOOLS_VERSION="        << @vmtools_ver.to_s     << " "
      str_info << "VMWARETOOLS_VERSION_STATUS=" << @vmtools_verst.to_s   << " "
    end

    ########################################################################
    # Generates an OpenNebula Template for this VCenterVm
    #
    #
    ########################################################################
    def to_one
        cluster_name = @vm.runtime.host.parent.name

        str = "NAME   = \"#{@vm.name} - #{cluster_name}\"\n"\
              "CPU    = \"#{@vm.config.hardware.numCPU}\"\n"\
              "vCPU   = \"#{@vm.config.hardware.numCPU}\"\n"\
              "MEMORY = \"#{@vm.config.hardware.memoryMB}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE        =\"vcenter\",\n"\
              "  VM_TEMPLATE =\"#{@vm.config.uuid}\",\n"\
              "  HOST        =\"#{cluster_name}\"\n"\
              "]\n"\
              "GRAPHICS = [\n"\
              "  TYPE     =\"vnc\",\n"\
              "  LISTEN   =\"0.0.0.0\"\n"\
              "]\n"\
         "SCHED_REQUIREMENTS=\"NAME=\\\"#{cluster_name}\\\"\"\n"

        if @vm.config.annotation.nil? || @vm.config.annotation.empty?
            str << "DESCRIPTION = \"vCenter Template imported by OpenNebula"\
                " from Cluster #{@vm.runtime.host.parent.name}\"\n"
        else
            notes = @vm.config.annotation.gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        case @vm.guest.guestFullName
            when /CentOS/i
                str << "LOGO=images/logos/centos.png"
            when /Debian/i
                str << "LOGO=images/logos/debian.png"
            when /Red Hat/i
                str << "LOGO=images/logos/redhat.png"
            when /Ubuntu/i
                str << "LOGO=images/logos/ubuntu.png"
            when /Windows XP/i
                str << "LOGO=images/logos/windowsxp.png"
            when /Windows/i
                str << "LOGO=images/logos/windows8.png"
            when /Linux/i
                str << "LOGO=images/logos/linux.png"
        end

        return str
    end

    ########################################################################
    # Generates an OpenNebula VirtualMachine for this VCenterVm
    #
    #
    ########################################################################
    def vm_to_one
        host_name = @vm.runtime.host.parent.name

        str = "NAME   = \"#{@vm.name} - #{host_name}\"\n"\
              "CPU    = \"#{@vm.config.hardware.numCPU}\"\n"\
              "vCPU   = \"#{@vm.config.hardware.numCPU}\"\n"\
              "MEMORY = \"#{@vm.config.hardware.memoryMB}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE        =\"vcenter\",\n"\
              "  VM_TEMPLATE =\"#{@vm.config.uuid}\",\n"\
              "  HOST        =\"#{host_name}\"\n"\
              "]\n"\
              "IMPORT_VM_ID    = \"#{@vm.config.uuid}\"\n"\
              "SCHED_REQUIREMENTS=\"NAME=\\\"#{host_name}\\\"\"\n"

        vp     = @vm.config.extraConfig.select{|v|
                                           v[:key]=="remotedisplay.vnc.port"}
        keymap = @vm.config.extraConfig.select{|v|
                                           v[:key]=="remotedisplay.vnc.keymap"}

        if vp.size > 0
            str << "GRAPHICS = [\n"\
                   "  TYPE     =\"vnc\",\n"\
                   "  LISTEN   =\"0.0.0.0\",\n"\
                   "  PORT     =\"#{vp[0][:value]}\"\n"
            str << " ,KEYMAP   =\"#{keymap[0][:value]}\"\n" if keymap[0]
            str << "]\n"
        end

        if @vm.config.annotation.nil? || @vm.config.annotation.empty?
            str << "DESCRIPTION = \"vCenter Virtual Machine imported by"\
                " OpenNebula from Cluster #{@vm.runtime.host.parent.name}\"\n"
        else
            notes = @vm.config.annotation.gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        return str
    end

private

    ########################################################################
    # Converts the VI string state to OpenNebula state convention
    # Guest states are:
    # - poweredOff   The virtual machine is currently powered off.
    # - poweredOn    The virtual machine is currently powered on.
    # - suspended    The virtual machine is currently suspended.
    ########################################################################
    def state_to_c(state)
        case state
            when 'poweredOn'
                VM_STATE[:active]
            when 'suspended'
                VM_STATE[:paused]
            when 'poweredOff'
                VM_STATE[:deleted]
            else
                VM_STATE[:unknown]
        end
    end

    ########################################################################
    #  Checks if a RbVmomi::VIM::VirtualDevice is a network interface
    ########################################################################
    def self.is_nic?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
    end

    ########################################################################
    #  Checks if a RbVmomi::VIM::VirtualDevice is a disk
    ########################################################################
    def self.is_disk?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualDisk).nil?
    end

    ########################################################################
    # Returns the spec to reconfig a VM and add a NIC
    ########################################################################
    def self.calculate_addnic_spec(vm, mac, bridge, model)
        model       = model.nil? ? nil : model.downcase
        network     = vm.runtime.host.network.select{|n| n.name==bridge}
        backing     = nil

        if network.empty?
            raise "Network #{bridge} not found in host #{vm.runtime.host.name}"
        else
            network = network[0]
        end

        card_num = 1 # start in one, we want the next avaliable id

        vm.config.hardware.device.each{ |dv|
            card_num = card_num + 1 if is_nic?(dv)
        }

        nic_card = case model
                        when "virtuale1000", "e1000"
                            RbVmomi::VIM::VirtualE1000
                        when "virtuale1000e", "e1000e"
                            RbVmomi::VIM::VirtualE1000e
                        when "virtualpcnet32", "pcnet32"
                            RbVmomi::VIM::VirtualPCNet32
                        when "virtualsriovethernetcard", "sriovethernetcard"
                            RbVmomi::VIM::VirtualSriovEthernetCard
                        when "virtualvmxnetm", "vmxnetm"
                            RbVmomi::VIM::VirtualVmxnetm
                        when "virtualvmxnet2", "vmnet2"
                            RbVmomi::VIM::VirtualVmxnet2
                        when "virtualvmxnet3", "vmxnet3"
                            RbVmomi::VIM::VirtualVmxnet3
                        else # If none matches, use VirtualE1000
                            RbVmomi::VIM::VirtualE1000
                   end

        if network.class == RbVmomi::VIM::Network
            backing = RbVmomi::VIM.VirtualEthernetCardNetworkBackingInfo(
                        :deviceName => bridge,
                        :network => network)
        else
            port    = RbVmomi::VIM::DistributedVirtualSwitchPortConnection(
                        :switchUuid =>
                                network.config.distributedVirtualSwitch.uuid,
                        :portgroupKey => network.key)
            backing =
              RbVmomi::VIM.VirtualEthernetCardDistributedVirtualPortBackingInfo(
                 :port => port)
        end

        return {:operation => :add,
                :device => nic_card.new(
                            :key => 0,
                            :deviceInfo => {
                                :label => "net" + card_num.to_s,
                                :summary => bridge
                            },
                            :backing => backing,
                            :addressType => mac ? 'manual' : 'generated',
                            :macAddress  => mac
                           )
               }
    end

    ########################################################################
    #  Clone a vCenter VM Template and leaves it powered on
    ########################################################################
    def self.clone_vm(xml_text, hostname)

        xml = REXML::Document.new xml_text
        pcs = xml.root.get_elements("//USER_TEMPLATE/PUBLIC_CLOUD")

        raise "Cannot find VCenter element in VM template." if pcs.nil?

        template = pcs.select { |t|
            type = t.elements["TYPE"]
            !type.nil? && type.text.downcase == "vcenter"
        }

        # If there are multiple vcenter templates, find the right one
        if template.is_a? Array
            all_vcenter_templates = template.clone
            # If there is more than one coincidence, pick the first one
            template = template.select {|t|
                cluster_name = t.elements["HOST"]
                !cluster_name.nil? && cluster_name.text == hostname
            }[0]
            # The template may not reference any specific CLUSTER
            # (referenced to as HOST in the OpenNebula template)
            # Therefore, here take the first one that does not
            # specify a CLUSTER to see if we are lucky
            if template.nil?
                template = all_vcenter_templates.select {|t|
                    t.elements["HOST"].nil?
                }[0]
            end
        end

        raise "Cannot find vCenter element in VM template." if template.nil?

        uuid = template.elements["VM_TEMPLATE"]

        raise "Cannot find VM_TEMPLATE in vCenter element." if uuid.nil?

        uuid         = uuid.text
        vmid         =  xml.root.elements["/VM/ID"].text
        vcenter_name = "one-#{vmid}-#{xml.root.elements["/VM/NAME"].text}"
        hid          = xml.root.elements["//HISTORY_RECORDS/HISTORY/HID"]

        raise "Cannot find host id in deployment file history." if hid.nil?

        context = xml.root.elements["//TEMPLATE/CONTEXT"]
        connection  = VIClient.new(hid)
        vc_template = connection.find_vm_template(uuid)

        if connection.rp_confined?
            rp = connection.resource_pool.first
        else
            rp = connection.default_resource_pool
        end

        relocate_spec = RbVmomi::VIM.VirtualMachineRelocateSpec(
                          :diskMoveType => :moveChildMostDiskBacking,
                          :pool         => rp)

        clone_parameters = {
            :location => relocate_spec,
            :powerOn  => false,
            :template => false
        }

        customization = template.elements["CUSTOMIZATION_SPEC"]

        vim = connection.vim

        if !customization.nil?
        begin
            custom_spec = vim.serviceContent.customizationSpecManager.
                GetCustomizationSpec(:name => customization.text)

            if custom_spec && spec=custom_spec.spec
                clone_parameters[:customization] = spec
            else
                raise "Error getting customization spec"
            end

        rescue
            raise "Customization spec '#{customization.text}' not found"
        end
        end

        clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec(clone_parameters)

        begin
            vm = vc_template.CloneVM_Task(
                   :folder => vc_template.parent,
                   :name   => vcenter_name,
                   :spec   => clone_spec).wait_for_completion
        rescue Exception => e

            if !e.message.start_with?('DuplicateName')
                raise "Cannot clone VM Template: #{e.message}"
            end

            vm = connection.find_vm(vcenter_name)

            raise "Cannot clone VM Template" if vm.nil?

            vm.Destroy_Task.wait_for_completion
            vm = vc_template.CloneVM_Task(
                :folder => vc_template.parent,
                :name   => vcenter_name,
                :spec   => clone_spec).wait_for_completion
        end

        vm_uuid = vm.config.uuid

        # VNC Section

        vnc_port   = xml.root.elements["/VM/TEMPLATE/GRAPHICS/PORT"]
        vnc_listen = xml.root.elements["/VM/TEMPLATE/GRAPHICS/LISTEN"]
        vnc_keymap = xml.root.elements["/VM/TEMPLATE/GRAPHICS/KEYMAP"]

        if !vnc_listen
            vnc_listen = "0.0.0.0"
        else
            vnc_listen = vnc_listen.text
        end

        config_array     = []
        context_vnc_spec = {}

        if vnc_port
            config_array +=
                     [{:key=>"remotedisplay.vnc.enabled",:value=>"TRUE"},
                      {:key=>"remotedisplay.vnc.port",   :value=>vnc_port.text},
                      {:key=>"remotedisplay.vnc.ip",     :value=>vnc_listen}]
        end

        config_array += [{:key=>"remotedisplay.vnc.keymap",
                          :value=>vnc_keymap.text}] if vnc_keymap

        # Context section

        if context
            # Remove <CONTEXT> (9) and </CONTEXT>\n (11)
            context_text = "# Context variables generated by OpenNebula\n"
            context.elements.each{|context_element|
                context_text += context_element.name + "='" +
                                context_element.text.gsub("'", "\\'") + "'\n"
            }

            # OneGate
            onegate_token_flag = xml.root.elements["/VM/TEMPLATE/CONTEXT/TOKEN"]
            if onegate_token_flag and onegate_token_flag.text == "YES"
                # Create the OneGate token string
                vmid_str  = xml.root.elements["/VM/ID"].text
                stime_str = xml.root.elements["/VM/STIME"].text
                str_to_encrypt = "#{vmid_str}:#{stime_str}"

                user_id = xml.root.elements['//CREATED_BY'].text

                if user_id.nil?
                    STDERR.puts {"VMID:#{vmid} CREATED_BY not present" \
                        " in the VM TEMPLATE"}
                    return nil
                end

                user = OpenNebula::User.new_with_id(user_id,
                                                    OpenNebula::Client.new)
                rc   = user.info

                if OpenNebula.is_error?(rc)
                    STDERR.puts {"VMID:#{vmid} user.info" \
                        " error: #{rc.message}"}
                    return nil
                end

                token_password = user['TEMPLATE/TOKEN_PASSWORD']

                if token_password.nil?
                    STDERR.puts {"VMID:#{vmid} TOKEN_PASSWORD not present"\
                        " in the USER:#{user_id} TEMPLATE"}
                    return nil
                end

                cipher = OpenSSL::Cipher::Cipher.new("aes-256-cbc")
                cipher.encrypt
                cipher.key = token_password
                onegate_token = cipher.update(str_to_encrypt)
                onegate_token << cipher.final

                onegate_token_64 = Base64.encode64(onegate_token).chop

                context_text += "ONEGATE_TOKEN='#{onegate_token_64}'\n"
            end

            context_text = Base64.encode64(context_text.chop)
            config_array +=
                     [{:key=>"guestinfo.opennebula.context",
                       :value=>context_text}]
        end

        if config_array != []
            context_vnc_spec = {:extraConfig =>config_array}
        end

        # NIC section, build the reconfig hash

        nics     = xml.root.get_elements("//TEMPLATE/NIC")
        nic_spec = {}

        if !nics.nil?
            nic_array = []
            nics.each{|nic|
               mac    = nic.elements["MAC"].text
               bridge = nic.elements["BRIDGE"].text
               model  = nic.elements["MODEL"] ? nic.elements["MODEL"].text : nil
               nic_array << calculate_addnic_spec(vm, mac, bridge, model)
            }

            nic_spec = {:deviceChange => nic_array}
        end

        # Capacity section

        cpu           = xml.root.elements["//TEMPLATE/VCPU"] ? xml.root.elements["//TEMPLATE/VCPU"].text : 1
        memory        = xml.root.elements["//TEMPLATE/MEMORY"].text
        capacity_spec = {:numCPUs  => cpu.to_i,
                         :memoryMB => memory }

        # Perform the VM reconfiguration
        spec_hash = context_vnc_spec.merge(nic_spec).merge(capacity_spec)
        spec      = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
        vm.ReconfigVM_Task(:spec => spec).wait_for_completion

        # Power on the VM
        vm.PowerOnVM_Task.wait_for_completion

        return vm_uuid
    end

    ############################################################################
    # Detach all disks from a VM
    ############################################################################
    def self.detach_all_disks(vm)
        disks  = vm.config.hardware.device.select { |d| is_disk?(d) }

        return if disks.nil?

        spec = { :deviceChange => [] }

        disks.each{|disk|
            spec[:deviceChange] <<  {
                :operation => :remove,
                :device => disk
            }
        }

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end
end
end
