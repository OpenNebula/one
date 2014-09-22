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

    module VCenterDriver

    ################################################################################
    # This class represents a VCenter connection and an associated OpenNebula client
    # The connection is associated to the VCenter backing a given OpenNebula host.
    # For the VCenter driver each OpenNebula host represents a VCenter cluster
    ################################################################################
    class VIClient
        attr_reader :vim, :one, :root, :cluster, :user, :pass, :host

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

            connection = {
                :host     => @one_host["TEMPLATE/VCENTER_HOST"],
                :user     => @one_host["TEMPLATE/VCENTER_USER"],
                :password => @one_host["TEMPLATE/VCENTER_PASSWORD"]
            }

            initialize_vim(connection)

            @root.childEntity.each {|dc|
                ccrs = dc.hostFolder.childEntity.grep(
                    RbVmomi::VIM::ClusterComputeResource)

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
        # OpenNebula client is also initilialize
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
            vms = @dc.vmFolder.childEntity.grep(RbVmomi::VIM::VirtualMachine)

            return vms.find{ |v| v.config.uuid == uuid }
        end

        ########################################################################
        # Builds a hash with the DataCenter / ClusterComputeResource hierarchy
        # for this VCenter.
        # @return [Hash] in the form
        #   {dc_name [String] => ClusterComputeResources Names [Array - String]}
        ########################################################################
        def hierarchy
            vc_hosts = {}

            @root.childEntity.each { |dc|

                ccrs = dc.hostFolder.childEntity.grep(
                    RbVmomi::VIM::ClusterComputeResource)

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

            @root.childEntity.each { |dc|

                vms = dc.vmFolder.childEntity.grep(RbVmomi::VIM::VirtualMachine)

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
                @one = ::OpenNebula::Client.new()
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
                host_info << "TOTALCPU="    << total_cpu.to_s << ","
                host_info << "USEDCPU="     << used_cpu.to_s  << ","
                host_info << "FREECPU="     << free_cpu.to_s << ","
                host_info << "TOTALMEMORY=" << total_memory.to_s << ","
                host_info << "USEDMEMORY="  << used_memory.to_s  << ","
                host_info << "FREEMEMORY="  << free_memory.to_s
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
        def self.deploy(xml_text)

            xml = REXML::Document.new xml_text

            pcs = xml.root.get_elements("//USER_TEMPLATE/PUBLIC_CLOUD")

            raise "Cannot find VCenter element in VM template." if pcs.nil?

            template = pcs.find { |t|
                type = t.elements["TYPE"]
                !type.nil? && type.text.downcase == "vcenter"
            }

            raise "Cannot find VCenter element in VM template." if template.nil?

            uuid = template.elements["VM_TEMPLATE"]

            raise "Cannot find VM_TEMPLATE in VCenter element." if uuid.nil?

            uuid = uuid.text

            vmid = xml.root.elements["/VM/ID"].text

            hid = xml.root.elements["//HISTORY_RECORDS/HISTORY/HID"]

            raise "Cannot find host id in deployment file history." if hid.nil?

            connection  = VIClient.new(hid)

            vc_template = connection.find_vm_template(uuid)

            relocate_spec = RbVmomi::VIM.VirtualMachineRelocateSpec(
                :diskMoveType => :moveChildMostDiskBacking,
                :pool         => connection.resource_pool)

            clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec(
                :location => relocate_spec,
                :powerOn  => true,
                :template => false)

            rc = vc_template.CloneVM_Task(
                :folder => vc_template.parent,
                :name   => "one-#{vmid}",
                :spec   => clone_spec).wait_for_completion

            return rc.config.uuid
        end

        ############################################################################
        # Cancels a VM
        #  @param deploy_id vcenter identifier of the VM
        #  @param hostname name of the host (equals the vCenter cluster)
        ############################################################################
        def self.cancel(deploy_id, hostname)
            hid         = VIClient::translate_hostname(hostname)
            connection  = VIClient.new(hid)

            vm          = connection.find_vm_template(deploy_id)

            vm.TerminateVM
        end

        ############################################################################
        # Saves a VM
        #  @param deploy_id vcenter identifier of the VM
        #  @param hostname name of the host (equals the vCenter cluster)
        ############################################################################
        def self.save(deploy_id, hostname)
            hid         = VIClient::translate_hostname(hostname)
            connection  = VIClient.new(hid)

            vm          = connection.find_vm_template(deploy_id)

            vm.SuspendVM_Task.wait_for_completion
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

            vm.PowerOnVM_Task.wait_for_completion
        end

        ############################################################################
        # Resets a VM
        #  @param deploy_id vcenter identifier of the VM
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
        def self.shutdown(deploy_id, hostname)
            hid         = VIClient::translate_hostname(hostname)
            connection  = VIClient.new(hid)

            vm          = connection.find_vm_template(deploy_id)

            vm.ShutdownGuest.wait_for_completion
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

            vm.RemoveSnapshot_Task(delete_snapshot_hash).wait_for_completion
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

            vm.RevertToSnapshot_Task(revert_snapshot_hash).wait_for_completion
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
        end

        ########################################################################
        #  Generates a OpenNebula IM Driver valid string with the monitor info
        ########################################################################
        def info
          return 'STATE=d' if @state == 'd'

          str_info = ""

          str_info << "STATE="     << @state            << " "
          str_info << "USEDCPU="   << @used_cpu.to_s    << " "
          str_info << "USEDMEMORY="<< @used_memory.to_s << " "
          str_info << "NETRX="     << @net_rx.to_s      << " "
          str_info << "NETTX="     << @net_tx.to_s
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
                  "PUBLIC_CLOUD = [\n"\
                  "  TYPE        =\"vcenter\",\n"\
                  "  VM_TEMPLATE =\"#{@vm.config.uuid}\"\n"\
                  "]\n"\
                  "SCHED_REQUIREMENTS=\"NAME=\\\"#{@vm.runtime.host.parent.name}\\\"\"\n"
        end

    private

        ########################################################################
        #  Converts the VI string state to OpenNebula state convention
        ########################################################################
        def state_to_c(state)
            case state
                when 'poweredOn'
                    'a'
                when 'suspended'
                    'p'
                else
                    'd'
            end
        end
    end
    end
