# ---------------------------------------------------------------------------- #
# Copyright 2010-2014, C12G Labs S.L                                           #
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
    # The associated resource pool for this connection
    ########################################################################
    def resource_pool
        return @cluster.resourcePool
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
            rescue ManagedObjectNotFound
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
            rescue ManagedObjectNotFound
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
    def hierarchy
        vc_hosts = {}

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each { |dc|
            ccrs = get_entities(dc.hostFolder, 'ClusterComputeResource')
            vc_hosts[dc.name] = ccrs.collect { |c| c.name }
        }

        return vc_hosts
    end

    ########################################################################
    # Builds a hash with the Datacenter / VM Templates for this VCenter
    # @return [Hash] in the form
    #   { dc_name [String] => }
    ########################################################################
    def vm_templates
        vm_templates = {}

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each { |dc|
            vms = get_entities(dc.vmFolder, 'VirtualMachine')

            tmp = vms.select { |v| v.config.template == true }

            one_tmp = []

            tmp.each { |t|
                vi_tmp = VCenterVm.new(self, t)

                one_tmp << {
                    :name => vi_tmp.vm.name,
                    :uuid => vi_tmp.vm.config.uuid,
                    :host => vi_tmp.vm.runtime.host.parent.name,
                    :one  => vi_tmp.to_one
                }
            }

            vm_templates[dc.name] = one_tmp
        }

        return vm_templates
    end

    ########################################################################
    # Builds a hash with the Datacenter / CCR (Distributed)Networks 
    # for this VCenter
    # @return [Hash] in the form
    #   { dc_name [String] => Networks [Array] }
    ########################################################################
    def vcenter_networks
        vcenter_networks = {}

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each { |dc|
            networks = get_entities(dc.networkFolder, 'Network' )
            one_nets = []

            networks.each { |n|
                one_nets << {
                    :name   => n.name,
                    :bridge => n.name,
                    :type   => "Port Group",
                    :one    => "NAME   = \"#{n[:name]}\"\n" \
                               "BRIDGE = \"#{n[:name]}\"\n" \
                               "VCENTER_TYPE = \"Port Group\""
                }
            }

            networks = get_entities(dc.networkFolder,
                                    'DistributedVirtualPortgroup' )

            networks.each { |n|
                vnet_template = "NAME   = \"#{n[:name]}\"\n" \
                                "BRIDGE = \"#{n[:name]}\"\n" \
                                "VCENTER_TYPE = \"Distributed Port Group\""

                vlan     = n.config.defaultPortConfig.vlan.vlanId
                vlan_str = ""

                if vlan != 0
                    if vlan.is_a? Array
                        vlan.each{|v|
                            vlan_str += v.start.to_s + ".." + v.end.to_s + ","
                        }
                        vlan_str.chop!
                    else
                        vlan_str = vlan.to_s
                    end
                end

                if !vlan_str.empty?
                    vnet_template << "VLAN=\"YES\"\n" \
                                     "VLAN_ID=#{vlan_str}\n"
                end

                one_net = {:name   => n.name,
                           :bridge => n.name,
                           :type   => "Distributed Port Group",
                           :one    => vnet_template}

                one_net[:vlan] = vlan_str if !vlan_str.empty?

                one_nets << one_net
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

        @resource_pool = client.resource_pool
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
    # https://www.vmware.com/support/developer/vc-sdk/visdk25pubs/ReferenceGuide/vim.ComputeResource.Summary.html
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
        @resource_pool.vm.each { |v|
            name   = v.name
            number = -1
            number = name.split('-').last if (name =~ /^one-\d*$/)

            vm = VCenterVm.new(@client, v)
            vm.monitor

            str_info << "\nVM = ["
            str_info << "ID=#{number},"
            str_info << "DEPLOY_ID=\"#{name}\","
            str_info << "POLL=\"#{vm.info}\"]"
        }

        return str_info
    end
end

################################################################################
# This class is a high level abstraction of a VI VirtualMachine class with
# OpenNebula semantics.
################################################################################

class VCenterVm
    attr_reader :vm

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

        @net_rx = 0
        @net_tx = 0
    end

    ############################################################################
    # Deploys a VM
    #  @xml_text XML repsentation of the VM
    ############################################################################
    def self.deploy(xml_text, lcm_state, deploy_id, hostname)
        if lcm_state == "BOOT"
            return clone_vm(xml_text)
        else
            hid         = VIClient::translate_hostname(hostname)
            connection  = VIClient.new(hid)
            vm          = connection.find_vm_template(deploy_id)
            vm.PowerOnVM_Task.wait_for_completion
            return vm.config.uuid
        end
    end

    ############################################################################
    # Cancels a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.cancel(deploy_id, hostname, lcm_state)
        case lcm_state
            when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
                shutdown(deploy_id, hostname, lcm_state)
            when "CANCEL", "LCM_INIT"
                hid         = VIClient::translate_hostname(hostname)
                connection  = VIClient.new(hid)
                vm          = connection.find_vm_template(deploy_id)

                begin
                    vm.PowerOffVM_Task.wait_for_completion
                rescue
                end
                vm.Destroy_Task.wait_for_completion
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
    def self.shutdown(deploy_id, hostname, lcm_state)
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
    # Delete VM snapshot
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.delete_snapshot(deploy_id, hostname, snapshot_name)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        snapshot = vm.snapshot.rootSnapshotList.find {|s|
                      s.name == snapshot_name
                   }.snapshot

        delete_snapshot_hash = {
            :_this => snapshot,
            :removeChildren => true
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

        snapshot = vm.snapshot.rootSnapshotList.find {|s|
                      s.name == snapshot_name
                   }.snapshot

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

        if @state != 'a'
            @used_cpu    = 0
            @used_memory = 0

            @net_rx = 0
            @net_tx = 0

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


    end

    ########################################################################
    #  Generates a OpenNebula IM Driver valid string with the monitor info
    ########################################################################
    def info
      return 'STATE=d' if @state == 'd'

      str_info = ""

      str_info << "GUEST_IP=" << @guest_ip.to_s << " " if @guest_ip
      str_info << "STATE="                      << @state                << " "
      str_info << "USEDCPU="                    << @used_cpu.to_s        << " "
      str_info << "USEDMEMORY="                 << @used_memory.to_s     << " "
      str_info << "NETRX="                      << @net_rx.to_s          << " "
      str_info << "NETTX="                      << @net_tx.to_s          << " "
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
        str = "NAME   = \"#{@vm.name}\"\n"\
              "CPU    = \"#{@vm.config.hardware.numCPU}\"\n"\
              "vCPU   = \"#{@vm.config.hardware.numCPU}\"\n"\
              "MEMORY = \"#{@vm.config.hardware.memoryMB}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE        =\"vcenter\",\n"\
              "  VM_TEMPLATE =\"#{@vm.config.uuid}\"\n"\
              "]\n"\
              "GRAPHICS = [\n"\
              "  TYPE     =\"vnc\",\n"\
              "  LISTEN   =\"0.0.0.0\"\n"\
              "]\n"\
         "SCHED_REQUIREMENTS=\"NAME=\\\"#{@vm.runtime.host.parent.name}\\\"\"\n"
    end

private

    ########################################################################
    # Converts the VI string state to OpenNebula state convention
    # Guest states are:
    # - poweredOff   The virtual machine is currently powered off.
    # - poweredOn    The virtual machine is currently powered on.
    # - suspended    The virtual machine is currently suspended.
    ########################################################################
    def self.state_to_c(state)
        case state
            when 'poweredOn'
                'a'
            when 'suspended'
                'p'
            when 'poweredOff'
                'd'
            else
                '-'
        end
    end

    ########################################################################
    #  Checks if a RbVmomi::VIM::VirtualDevice is a network interface
    ########################################################################
    def self.is_nic?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
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
    def self.clone_vm(xml_text)

        xml = REXML::Document.new xml_text

        pcs = xml.root.get_elements("//USER_TEMPLATE/PUBLIC_CLOUD")

        raise "Cannot find VCenter element in VM template." if pcs.nil?

        template = pcs.find { |t|
            type = t.elements["TYPE"]
            !type.nil? && type.text.downcase == "vcenter"
        }

        raise "Cannot find vCenter element in VM template." if template.nil?

        uuid = template.elements["VM_TEMPLATE"]

        raise "Cannot find VM_TEMPLATE in VCenter element." if uuid.nil?

        uuid = uuid.text

        vmid = xml.root.elements["/VM/ID"].text

        hid = xml.root.elements["//HISTORY_RECORDS/HISTORY/HID"]

        raise "Cannot find host id in deployment file history." if hid.nil?

        context = xml.root.elements["//TEMPLATE/CONTEXT"]

        connection  = VIClient.new(hid)

        vc_template = connection.find_vm_template(uuid)

        relocate_spec = RbVmomi::VIM.VirtualMachineRelocateSpec(
            :diskMoveType => :moveChildMostDiskBacking,
            :pool         => connection.resource_pool)

        clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec(
            :location => relocate_spec,
            :powerOn  => false,
            :template => false)

        begin
            vm = vc_template.CloneVM_Task(
                :folder => vc_template.parent,
                :name   => "one-#{vmid}",
                :spec   => clone_spec).wait_for_completion
        rescue Exception => e

            if !e.message.start_with?('DuplicateName')
                raise "Cannot clone VM Template: #{e.message}"
            end

            vm = connection.find_vm("one-#{vmid}")

            raise "Cannot clone VM Template" if vm.nil?

            vm.Destroy_Task.wait_for_completion
            
            vm = vc_template.CloneVM_Task(
                :folder => vc_template.parent,
                :name   => "one-#{vmid}",
                :spec   => clone_spec).wait_for_completion
        end

        vm_uuid = vm.config.uuid

        vnc_port   = xml.root.elements["/VM/TEMPLATE/GRAPHICS/PORT"]
        vnc_listen = xml.root.elements["/VM/TEMPLATE/GRAPHICS/LISTEN"]

        if !vnc_listen
            vnc_listen = "0.0.0.0"
        else
            vnc_listen = vnc_listen.text
        end

        config_array     = []
        context_vnc_spec = {}

        if vnc_port
            config_array +=
                     [{:key=>"remotedisplay.vnc.enabled", :value=>"TRUE"},
                      {:key=>"remotedisplay.vnc.port", :value=>vnc_port.text},
                      {:key=>"remotedisplay.vnc.ip",   :value=>vnc_listen}]
        end

        if context
            # Remove <CONTEXT> (9) and </CONTEXT>\n (11)
            context_text = "# Context variables generated by OpenNebula\n"
            context.elements.each{|context_element|
                context_text += context_element.name + "='" +
                                context_element.text.gsub("'", "\\'") + "'\n"
            }
            context_text = Base64.encode64(context_text.chop)
            config_array +=
                     [{:key=>"guestinfo.opennebula.context",
                       :value=>context_text}]
        end

        if config_array != []
            context_vnc_spec = {:extraConfig =>config_array}
        end

        # Take care of the NIC section, build the reconfig hash
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

        if !context_vnc_spec.empty? or !nic_spec.empty?
            spec_hash = context_vnc_spec.merge(nic_spec)
            spec      = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
            vm.ReconfigVM_Task(:spec => spec).wait_for_completion
        end

        vm.PowerOnVM_Task.wait_for_completion

        return vm_uuid
    end
end
end
