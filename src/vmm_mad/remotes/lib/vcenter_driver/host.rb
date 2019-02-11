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
#--------------------------------------------------------------------------- #

module VCenterDriver

class HostFolder
    attr_accessor :item, :items

    def initialize(item)
        @item = item
        @items = {}
    end

    def fetch_clusters!
        VIClient.get_entities(@item, 'ClusterComputeResource').each do |item|
            item_name = item._ref
            @items[item_name.to_sym] = ClusterComputeResource.new(item)
        end
    end

    def get_cluster(ref)
        if !@items[ref.to_sym]
            rbvmomi_dc = RbVmomi::VIM::ClusterComputeResource.new(@item._connection, ref)
            @items[ref.to_sym] = ClusterComputeResource.new(rbvmomi_dc)
        end

        @items[ref.to_sym]
    end
end # class HostFolder

class ClusterComputeResource
    attr_accessor :item
    attr_accessor :rp_list

    include Memoize

    def initialize(item, vi_client=nil)
        @item = item
        @vi_client = vi_client
        @rp_list
    end

    def fetch_resource_pools(rp, rp_array = [])
        rp_array << rp

        rp.resourcePool.each do |child_rp|
            fetch_resource_pools(child_rp, rp_array)
        end

        rp_array
    end

    def resource_pools
        if @resource_pools.nil?
            @resource_pools = fetch_resource_pools(@item.resourcePool)
        end

        @resource_pools
    end

    def get_resource_pool_list(rp = @item.resourcePool, parent_prefix = "", rp_array = [])
        current_rp = ""

        if !parent_prefix.empty?
            current_rp << parent_prefix
            current_rp << "/"
        end

        resource_pool, name = rp.collect("resourcePool","name")
        current_rp << name if name != "Resources"

        resource_pool.each do |child_rp|
            get_resource_pool_list(child_rp, current_rp, rp_array)
        end

        rp_info = {}
        rp_info[:name] = current_rp
        rp_info[:ref]  = rp._ref
        rp_array << rp_info if !current_rp.empty?

        rp_array
    end

    def monitor
        total_cpu,
        num_cpu_cores,
        effective_cpu,
        total_memory,
        effective_mem,
        num_hosts,
        num_eff_hosts = @item.collect("summary.totalCpu",
                                      "summary.numCpuCores",
                                      "summary.effectiveCpu",
                                      "summary.totalMemory",
                                      "summary.effectiveMemory",
                                      "summary.numHosts",
                                      "summary.numEffectiveHosts"
        )

        mhz_core = total_cpu.to_f / num_cpu_cores.to_f
        eff_core = effective_cpu.to_f / mhz_core

        free_cpu  = sprintf('%.2f', eff_core * 100).to_f
        total_cpu = num_cpu_cores.to_f * 100
        used_cpu  = sprintf('%.2f', total_cpu - free_cpu).to_f

        total_mem = total_memory.to_i / 1024
        free_mem  = effective_mem.to_i * 1024

        str_info = ""

        # Get cluster name for informative purposes (replace space with _ if any)
        str_info << "VCENTER_NAME=" << self['name'].tr(" ", "_") << "\n"

        # System
        str_info << "HYPERVISOR=vcenter\n"
        str_info << "TOTALHOST=" << num_hosts.to_s << "\n"
        str_info << "AVAILHOST=" << num_eff_hosts.to_s << "\n"

        # CPU
        str_info << "CPUSPEED=" << mhz_core.to_s   << "\n"
        str_info << "TOTALCPU=" << total_cpu.to_s << "\n"
        str_info << "USEDCPU="  << used_cpu.to_s  << "\n"
        str_info << "FREECPU="  << free_cpu.to_s << "\n"

        # Memory
        str_info << "TOTALMEMORY=" << total_mem.to_s << "\n"
        str_info << "FREEMEMORY="  << free_mem.to_s << "\n"
        str_info << "USEDMEMORY="  << (total_mem - free_mem).to_s << "\n"

        str_info << monitor_resource_pools(mhz_core)
    end

    def monitor_resource_pools(mhz_core)

        @rp_list = get_resource_pool_list

        view = @vi_client.vim.serviceContent.viewManager.CreateContainerView({
            container: @item, #View for RPs inside this cluster
            type:      ['ResourcePool'],
            recursive: true
        })

        pc = @vi_client.vim.serviceContent.propertyCollector

        monitored_properties = [
            "config.cpuAllocation.expandableReservation",
            "config.cpuAllocation.limit",
            "config.cpuAllocation.reservation",
            "config.cpuAllocation.shares.level",
            "config.cpuAllocation.shares.shares",
            "config.memoryAllocation.expandableReservation",
            "config.memoryAllocation.limit",
            "config.memoryAllocation.reservation",
            "config.memoryAllocation.shares.level",
            "config.memoryAllocation.shares.shares"
        ]

        filterSpec = RbVmomi::VIM.PropertyFilterSpec(
            :objectSet => [
                :obj => view,
                :skip => true,
                :selectSet => [
                RbVmomi::VIM.TraversalSpec(
                    :name => 'traverseEntities',
                    :type => 'ContainerView',
                    :path => 'view',
                    :skip => false
                )
                ]
            ],
            :propSet => [
                { :type => 'ResourcePool', :pathSet => monitored_properties }
            ]
        )

        result = pc.RetrieveProperties(:specSet => [filterSpec])

        rps = {}
        result.each do |r|
            hashed_properties = r.to_hash
            if r.obj.is_a?(RbVmomi::VIM::ResourcePool)
                rps[r.obj._ref] = hashed_properties
            end
        end

        return "" if rps.empty?

        rp_info = ""

        rps.each{|ref, info|

            # CPU
            cpu_expandable   = info["config.cpuAllocation.expandableReservation"] ? "YES" : "NO"
            cpu_limit        = info["config.cpuAllocation.limit"] == "-1" ? "UNLIMITED" : info["config.cpuAllocation.limit"]
            cpu_reservation  = info["config.cpuAllocation.reservation"]
            cpu_num          = cpu_reservation.to_f / mhz_core
            cpu_shares_level = info["config.cpuAllocation.shares.level"]
            cpu_shares       = info["config.cpuAllocation.shares.shares"]

            # MEMORY
            mem_expandable   = info["config.memoryAllocation.expandableReservation"] ? "YES" : "NO"
            mem_limit        = info["config.memoryAllocation.limit"] == "-1" ? "UNLIMITED" : info["config.memoryAllocation.limit"]
            mem_reservation  = info["config.memoryAllocation.reservation"].to_f
            mem_shares_level = info["config.memoryAllocation.shares.level"]
            mem_shares       = info["config.memoryAllocation.shares.shares"]

            rp_name = rp_list.select { |item| item[:ref] == ref}.first[:name] rescue ""

            rp_name = "Resources" if rp_name.empty?

            rp_info << "\nVCENTER_RESOURCE_POOL_INFO = ["
            rp_info << "NAME=\"#{rp_name}\","
            rp_info << "CPU_EXPANDABLE=#{cpu_expandable},"
            rp_info << "CPU_LIMIT=#{cpu_limit},"
            rp_info << "CPU_RESERVATION=#{cpu_reservation},"
            rp_info << "CPU_RESERVATION_NUM_CORES=#{cpu_num},"
            rp_info << "CPU_SHARES=#{cpu_shares},"
            rp_info << "CPU_SHARES_LEVEL=#{cpu_shares_level},"
            rp_info << "MEM_EXPANDABLE=#{mem_expandable},"
            rp_info << "MEM_LIMIT=#{mem_limit},"
            rp_info << "MEM_RESERVATION=#{mem_reservation},"
            rp_info << "MEM_SHARES=#{mem_shares},"
            rp_info << "MEM_SHARES_LEVEL=#{mem_shares_level}"
            rp_info << "]"
        }

        view.DestroyView

        return rp_info
    end

    def hostname_to_moref(hostname)
        result = filter_hosts

        moref = ""
        result.each do |r|
            if r.obj.name == hostname
                moref = r.obj._ref
                break
            end
        end
        raise "Host #{hostname} was not found" if moref.empty?
        return moref
    end

    def filter_hosts
        view = @vi_client.vim.serviceContent.viewManager.CreateContainerView({
            container: @item, #View for Hosts inside this cluster
            type:      ['HostSystem'],
            recursive: true
        })

        pc = @vi_client.vim.serviceContent.propertyCollector

        monitored_properties = [
            "name",
            "runtime.connectionState",
            "summary.hardware.numCpuCores",
            "summary.hardware.memorySize",
            "summary.hardware.cpuModel",
            "summary.hardware.cpuMhz",
            "summary.quickStats.overallCpuUsage",
            "summary.quickStats.overallMemoryUsage"
        ]

        filterSpec = RbVmomi::VIM.PropertyFilterSpec(
            :objectSet => [
                :obj => view,
                :skip => true,
                :selectSet => [
                RbVmomi::VIM.TraversalSpec(
                    :name => 'traverseEntities',
                    :type => 'ContainerView',
                    :path => 'view',
                    :skip => false
                )
                ]
            ],
            :propSet => [
                { :type => 'HostSystem', :pathSet => monitored_properties }
            ]
        )

        result = pc.RetrieveProperties(:specSet => [filterSpec])
        view.DestroyView # Destroy the view
        return result
    end

    def monitor_host_systems
        host_info = ""
        result = filter_hosts
        hosts = {}
        result.each do |r|
            hashed_properties = r.to_hash
            if r.obj.is_a?(RbVmomi::VIM::HostSystem)
                hosts[r.obj._ref] = hashed_properties
            end
        end

        hosts.each do |ref, info|
            next if info["runtime.connectionState"] != "connected"

            total_cpu = info["summary.hardware.numCpuCores"] * 100
            used_cpu  = (info["summary.quickStats.overallCpuUsage"].to_f / info["summary.hardware.cpuMhz"].to_f) * 100
            used_cpu  = sprintf('%.2f', used_cpu).to_f # Trim precission
            free_cpu  = total_cpu - used_cpu

            total_memory = info["summary.hardware.memorySize"]/1024
            used_memory  = info["summary.quickStats.overallMemoryUsage"]*1024
            free_memory  = total_memory - used_memory

            host_info << "\nHOST=["
            host_info << "STATE=on,"
            host_info << "HOSTNAME=\""  << info["name"].to_s       << "\","
            host_info << "MODELNAME=\"" << info["summary.hardware.cpuModel"].to_s  << "\","
            host_info << "CPUSPEED="    << info["summary.hardware.cpuMhz"].to_s    << ","
            host_info << "MAX_CPU="     << total_cpu.to_s    << ","
            host_info << "USED_CPU="    << used_cpu.to_s     << ","
            host_info << "FREE_CPU="    << free_cpu.to_s     << ","
            host_info << "MAX_MEM="     << total_memory.to_s << ","
            host_info << "USED_MEM="    << used_memory.to_s  << ","
            host_info << "FREE_MEM="    << free_memory.to_s
            host_info << "]"
        end

        return host_info
    end

    def monitor_vms(host_id)

        vc_uuid = @vi_client.vim.serviceContent.about.instanceUuid
        cluster_name = self["name"]
        cluster_ref = self["_ref"]

        # Get info of the host where the VM/template is located
        one_host = VCenterDriver::VIHelper.one_item(OpenNebula::Host, host_id)
        if !one_host
            STDERR.puts "Failed to retieve host with id #{host.id}"
            STDERR.puts e.inspect
            STDERR.puts e.backtrace
        end

        host_id = one_host["ID"] if one_host


        # Extract CPU info and name for each esx host in cluster
        esx_hosts = {}
        @item.host.each do |esx_host|
            info = {}
            info[:name] = esx_host.name
            info[:cpu]  = esx_host.summary.hardware.cpuMhz.to_f
            esx_hosts[esx_host._ref] = info
        end

        @monitored_vms = Set.new
        str_info = ""

        view = @vi_client.vim.serviceContent.viewManager.CreateContainerView({
            container: @item, #View for VMs inside this cluster
            type:      ['VirtualMachine'],
            recursive: true
        })

        pc = @vi_client.vim.serviceContent.propertyCollector

        monitored_properties = [
            "name", #VM name
            "config.template", #To filter out templates
            "summary.runtime.powerState", #VM power state
            "summary.quickStats.hostMemoryUsage", #Memory usage
            "summary.quickStats.overallCpuUsage", #CPU used by VM
            "runtime.host", #ESX host
            "resourcePool", #RP
            "guest.guestFullName",
            "guest.net", #IP addresses as seen by guest tools,
            "guest.guestState",
            "guest.toolsVersion",
            "guest.toolsRunningStatus",
            "guest.toolsVersionStatus2", #IP addresses as seen by guest tools,
            "config.extraConfig", #VM extraconfig info e.g opennebula.vm.running
            "config.hardware.numCPU",
            "config.hardware.memoryMB",
            "config.annotation",
            "datastore"
        ]

        filterSpec = RbVmomi::VIM.PropertyFilterSpec(
            :objectSet => [
                :obj => view,
                :skip => true,
                :selectSet => [
                RbVmomi::VIM.TraversalSpec(
                    :name => 'traverseEntities',
                    :type => 'ContainerView',
                    :path => 'view',
                    :skip => false
                )
                ]
            ],
            :propSet => [
                { :type => 'VirtualMachine', :pathSet => monitored_properties }
            ]
        )

        result = pc.RetrieveProperties(:specSet => [filterSpec])

        vms = {}
        vm_objects = []
        result.each do |r|
            hashed_properties = r.to_hash
            if r.obj.is_a?(RbVmomi::VIM::VirtualMachine)
                #Only take care of VMs, not templates
                if !hashed_properties["config.template"]
                    vms[r.obj._ref] = hashed_properties
                    vm_objects << r.obj
                end
            end
        end

        pm = @vi_client.vim.serviceContent.perfManager

        stats = {}

        max_samples = 9
        refresh_rate = 20 #Real time stats takes samples every 20 seconds

        last_mon_time = one_host["TEMPLATE/VCENTER_LAST_PERF_POLL"]

        if last_mon_time
            interval = (Time.now.to_i - last_mon_time.to_i)
            interval = 3601 if interval < 0
            samples = (interval / refresh_rate)
            samples = 1 if samples == 0
            max_samples =  interval > 3600 ? 9 : samples
        end

        if !vm_objects.empty?
            stats = pm.retrieve_stats(
                    vm_objects,
                    ['net.transmitted','net.bytesRx','net.bytesTx','net.received',
                    'virtualDisk.numberReadAveraged','virtualDisk.numberWriteAveraged',
                    'virtualDisk.read','virtualDisk.write'],
                    {max_samples: max_samples}
            ) rescue {}
        end

        if !stats.empty?
            last_mon_time = Time.now.to_i.to_s
        end

        get_resource_pool_list if !@rp_list

        vm_pool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualMachinePool)

        # opts common to all vms
        opts = {
            pool: vm_pool,
            vc_uuid: vc_uuid,
        }

        vms.each do |vm_ref,info|
            vm_info = ""
            begin
                esx_host = esx_hosts[info["runtime.host"]._ref]
                info[:esx_host_name] = esx_host[:name]
                info[:esx_host_cpu] = esx_host[:cpu]
                info[:cluster_name] = cluster_name
                info[:cluster_ref] = cluster_ref
                info[:vc_uuid] = vc_uuid
                info[:host_id] = host_id
                info[:rp_list] = @rp_list

                # Check the running flag
                running_flag = info["config.extraConfig"].select do |val|
                    val[:key] == "opennebula.vm.running"
                end

                if !running_flag.empty? && running_flag.first
                    running_flag = running_flag[0][:value]
                end

                next if running_flag == "no"

                # retrieve vcenter driver machine
                vm = VCenterDriver::VirtualMachine.new_from_ref(@vi_client, vm_ref, info["name"], opts)
                id = vm.vm_id

                #skip if it's already monitored
                if vm.one_exist?
                    next if @monitored_vms.include? id
                    @monitored_vms << id
                end

                vm.vm_info = info
                vm.monitor(stats)

                vm_name = "#{info["name"]} - #{cluster_name}"
                vm_info << %Q{
                VM = [
                    ID="#{id}",
                    VM_NAME="#{vm_name}",
                    DEPLOY_ID="#{vm_ref}",
                }

                # if the machine does not exist in opennebula it means that is a wild:
                unless vm.one_exist?
                    vm_template_64 = Base64.encode64(vm.vm_to_one(vm_name)).gsub("\n","")
                    vm_info << "VCENTER_TEMPLATE=\"YES\","
                    vm_info << "IMPORT_TEMPLATE=\"#{vm_template_64}\","
                end

                vm_info << "POLL=\"#{vm.info.gsub('"', "\\\"")}\"]"
            rescue Exception => e
                vm_info = error_monitoring(e, vm_ref, info)
            end

            str_info << vm_info
        end

        view.DestroyView # Destroy the view

        return str_info, last_mon_time
    end

    def error_monitoring(e, vm_ref, info = {})
        error_info = ''
        vm_name = info['name'] || nil
        tmp_str = e.inspect
        tmp_str << e.backtrace.join("\n")

        error_info << %Q{
        VM = [
            VM_NAME="#{vm_name}",
            DEPLOY_ID="#{vm_ref}",
        }

        error_info << "ERROR=\"#{Base64.encode64(tmp_str).gsub("\n","")}\"]"

    end

    def monitor_customizations
        customizations = self['_connection'].serviceContent.customizationSpecManager.info

        text = ''

        customizations.each do |c|
            t = "CUSTOMIZATION = [ "
            t << %Q<NAME = "#{c.name}", >
            t << %Q<TYPE = "#{c.type}" ]\n>

            text << t
        end

        text
    end

    def get_dc
        item = @item

        while !item.instance_of? RbVmomi::VIM::Datacenter
            item = item.parent
            if item.nil?
                raise "Could not find the parent Datacenter"
            end
        end

        Datacenter.new(item)
    end

    def self.to_one(cluster, con_ops, rp, one_cluster_id)

        one_host = VCenterDriver::VIHelper.new_one_item(OpenNebula::Host)

        if OpenNebula.is_error?(one_host)
            raise "Could not create host: #{one_host.message}"
        end

        one_cluster_id = -1 if !one_cluster_id

        rc = one_host.allocate(cluster[:cluster_name], 'vcenter', 'vcenter', one_cluster_id.to_i)

        if OpenNebula.is_error?(rc)
            raise "Could not allocate host: #{rc.message}"
        end

        template = "VCENTER_HOST=\"#{con_ops[:host]}\"\n"\
                   "VCENTER_PASSWORD=\"#{con_ops[:password]}\"\n"\
                   "VCENTER_USER=\"#{con_ops[:user]}\"\n"\
                   "VCENTER_CCR_REF=\"#{cluster[:cluster_ref]}\"\n"\
                   "VCENTER_INSTANCE_ID=\"#{cluster[:vcenter_uuid]}\"\n"\
                   "VCENTER_VERSION=\"#{cluster[:vcenter_version]}\"\n"\

        template << "VCENTER_RESOURCE_POOL=\"#{rp}\"" if rp

        rc = one_host.update(template, false)

        if OpenNebula.is_error?(rc)
            update_error = rc.message
            rc = one_host.delete
            if OpenNebula.is_error?(rc)
                raise "Could not update host: #{update_error} "\
                      "and could not delete host: #{rc.message}"
            else
                raise "Could not update host: #{rc.message}"
            end
        end

        return one_host
    end

    def self.new_from_ref(ref, vi_client)
        self.new(RbVmomi::VIM::ClusterComputeResource.new(vi_client.vim, ref), vi_client)
    end
end # class ClusterComputeResource

class ESXHost
    attr_accessor :item

    include Memoize

    PG_CREATE_TIMEOUT = 240 # We will wait for 4 minutes for the pg creation

    def initialize(item, vi_client=nil)
        @net_rollback = []
        @locking = true
        @item = item
        @vi_client = vi_client
    end

    def self.new_from_ref(ref, vi_client)
        self.new(RbVmomi::VIM::HostSystem.new(vi_client.vim, ref), vi_client)
    end

    # Locking function. Similar to flock
    def lock
        hostlockname = @item['name'].downcase.tr(" ", "_")
        if @locking
           @locking_file = File.open("/tmp/vcenter-#{hostlockname}-lock","w")
           @locking_file.flock(File::LOCK_EX)
        end
    end

    # Unlock driver execution mutex
    def unlock
        if @locking
            @locking_file.close
        end
    end

    ########################################################################
    # Check if standard switch exists in host
    ########################################################################

    def vss_exists(vswitch_name)
        vswitches = @item.configManager.networkSystem.networkInfo.vswitch
        return vswitches.select{|vs| vs.name == vswitch_name }.first rescue nil
    end

    ########################################################################
    # Create a standard vcenter switch in an ESX host
    ########################################################################

    def create_vss(name, pnics=nil, num_ports=128, mtu=1500, pnics_available=nil)
        # Get NetworkSystem
        nws = self['configManager.networkSystem']
        vswitchspec = nil
        hostbridge = nil
        nics = []

        if pnics
            pnics = pnics.split(",")
            pnics.each do |pnic|
                #Add nics if not in use
                nics << pnic if pnics_available.include?(pnic)
            end

            if !nics.empty?
                hostbridge = RbVmomi::VIM::HostVirtualSwitchBondBridge(:nicDevice => nics)
            end
        end

        #Create spec
        vswitchspec = RbVmomi::VIM::HostVirtualSwitchSpec(:bridge => hostbridge, :mtu => mtu, :numPorts => num_ports)

        #add vSwitch to the host
        begin
            nws.AddVirtualSwitch(:vswitchName => name, :spec => vswitchspec)
        rescue Exception => e
            raise "The standard vSwitch #{name} could not be created. AddVirtualSwitch failed Reason: #{e.message}."
        end

        @net_rollback << {:action => :delete_sw, :name => name}

        return name
    end

    ########################################################################
    # Update a standard vcenter switch in an ESX host
    ########################################################################
    def update_vss(switch, name, pnics, num_ports, mtu)
        pnics = pnics.split(",") rescue []

        #Backup switch spec for rollback
        orig_spec = switch.spec

        #Compare current configuration and return if switch hasn't changed
        same_switch = false

        switch_has_pnics = switch.spec.respond_to?(:bridge) && switch.spec.bridge.respond_to?(:nicDevice)



        same_switch = switch.spec.respond_to?(:mtu) && switch.spec.mtu == mtu &&
                      switch.spec.respond_to?(:numPorts) && switch.spec.numPorts == num_ports &&
                      (!switch_has_pnics && pnics.empty? ||
                       switch_has_pnics && switch.spec.bridge.nicDevice.uniq.sort == pnics.uniq.sort)
        return if same_switch

        # Let's create a new spec and update the switch
        vswitchspec = nil
        hostbridge = nil
        nws = self['configManager.networkSystem']
        hostbridge = RbVmomi::VIM::HostVirtualSwitchBondBridge(:nicDevice => pnics) if !pnics.empty?
        vswitchspec = RbVmomi::VIM::HostVirtualSwitchSpec(:bridge => hostbridge, :mtu => mtu, :numPorts => num_ports)

        begin
            nws.UpdateVirtualSwitch(:vswitchName => name, :spec => vswitchspec)
        rescue Exception => e
            raise "The standard switch with name #{name} could not be updated. Reason: #{e.message}"
        end

        @net_rollback << {:action => :update_sw, :name => name, :spec => orig_spec}
    end

    ########################################################################
    # Remove a standard vswitch from the host
    ########################################################################
    def remove_vss(vswitch_name)
        nws = self['configManager.networkSystem']

        begin
            nws.RemoveVirtualSwitch(:vswitchName => vswitch_name)
        rescue RbVmomi::VIM::ResourceInUse
            STDERR.puts "The standard switch #{vswitch_name} is in use so it cannot be deleted"
            return nil
        rescue RbVmomi::VIM::NotFound
            STDERR.puts "The standard switch #{vswitch_name} was not found in vCenter"
            return nil
        rescue Exception => e
            raise "There was a failure while deleting a vcenter standard switch #{vswitch_name}. Reason: #{e.message}"
        end

        return vswitch_name
    end

    ########################################################################
    # Get physical nics that are available in a host
    ########################################################################
    def get_available_pnics
        pnics_in_use = []
        pnics_available = []

        # Get pnics in use in standard switches
        @item.config.network.vswitch.each do |vs|
            vs.pnic.each do |pnic|
                pnic.slice!("key-vim.host.PhysicalNic-")
                pnics_in_use << pnic
            end
        end

        # Get pnics in host
        self['config.network'].pnic.each do |pnic|
            pnics_available << pnic.device if !pnics_in_use.include?(pnic.device)
        end

        return pnics_available
    end

    ########################################################################
    # Check if proxy switch exists in host for distributed virtual switch
    ########################################################################

    def proxy_switch_exists(switch_name)
        nws = self['configManager.networkSystem']
        proxy_switches = nws.networkInfo.proxySwitch
        return proxy_switches.select{|ps| ps.dvsName == switch_name }.first rescue nil
    end

    ########################################################################
    # Assign a host to a a distributed vcenter switch (proxy switch)
    ########################################################################

    def assign_proxy_switch(dvs, switch_name, pnics, pnics_available)
        dvs = dvs.item

        # Return if host is already assigned
        return dvs if !dvs['config.host'].select { |host| host.config.host._ref == self['_ref'] }.empty?

        # Prepare spec for DVS reconfiguration
        configSpec = RbVmomi::VIM::VMwareDVSConfigSpec.new
        configSpec.name = switch_name
        configSpec.configVersion = dvs['config.configVersion']

        # Check if host is already assigned to distributed switch
        operation = "add"
        ##operation = "edit" if !dvs['config.host'].select { |host| host.config.host._ref == self['_ref'] }.empty?

        # Add host members to the distributed virtual switch
        host_member_spec = RbVmomi::VIM::DistributedVirtualSwitchHostMemberConfigSpec.new
        host_member_spec.host = @item
        host_member_spec.operation = operation
        host_member_spec.backing = RbVmomi::VIM::DistributedVirtualSwitchHostMemberPnicBacking.new
        host_member_spec.backing.pnicSpec = []

        # If pnics are needed assign pnics for uplinks
        if pnics
            pnics = pnics.split(",")
            # Get uplink portgroup from dvswitch
            uplink_key = dvs['config.uplinkPortgroup'].select{
                |ul| ul.name == "#{switch_name}-uplink-pg"}.first.key rescue nil

            raise "Cannot find the uplink portgroup for #{switch_name}" if !uplink_key

            pnics.each {|pnic|
                pnicSpec = RbVmomi::VIM::DistributedVirtualSwitchHostMemberPnicSpec.new
                pnicSpec.pnicDevice = pnic
                pnicSpec.uplinkPortgroupKey = uplink_key
                host_member_spec.backing.pnicSpec << pnicSpec
            }
        end

        configSpec.host = [host_member_spec]

        # The DVS must be reconfigured
        dvs_reconfigure_task = dvs.ReconfigureDvs_Task(:spec => configSpec)
        dvs_reconfigure_task.wait_for_completion
        if dvs_reconfigure_task.info.state != 'success'
            raise "It wasn't possible to assign host #{self["name"]} as a member of #{switch_name}'"
        end

        return dvs
    end

    ########################################################################
    # Create a standard port group
    ########################################################################

    def create_pg(pgname, vswitch, vlan=0)
        spec = RbVmomi::VIM.HostPortGroupSpec(
          :name => pgname,
          :vlanId => vlan,
          :vswitchName => vswitch,
          :policy => RbVmomi::VIM.HostNetworkPolicy
        )

        nws = self['configManager.networkSystem']

        begin
            nws.AddPortGroup(:portgrp => spec)
        rescue Exception => e
            raise "A port group with name #{pgname} could not be created. Reason: #{e.message}"
        end

        @net_rollback << {:action => :delete_pg, :name => pgname}

        # wait until the network is ready and we have a reference
        networks = @item['network'].select{ |net| net.name == pgname }
        (0..PG_CREATE_TIMEOUT).each do
            break if !networks.empty?
            networks = @item['network'].select{ |net| net.name == pgname }
            sleep 1
        end

        raise "Cannot get VCENTER_NET_REF for new port group" if networks.empty?

        return networks.first._ref
    end

    ########################################################################
    # Check if standard port group exists in host
    ########################################################################

    def pg_exists(pg_name)
        nws = self['configManager.networkSystem']
        portgroups = nws.networkInfo.portgroup
        return portgroups.select{|pg| pg.spec.name == pg_name }.first rescue nil
    end


    ########################################################################
    # Is the switch for the pg different?
    ########################################################################

    def pg_changes_sw?(pg, switch_name)
        return pg.spec.respond_to?(:vswitchName) && pg.spec.vswitchName != switch_name
    end

    ########################################################################
    # Update a standard port group
    ########################################################################

    def update_pg(pg, switch_name, vlan_id)

        if pg.spec.respond_to?(:vlanId) && pg.spec.vlanId != vlan_id

            # Backup original spec
            orig_spec = pg.spec

            # Create new spec
            pg_name = pg.spec.name

            spec = RbVmomi::VIM.HostPortGroupSpec(
                :name => pg_name,
                :vlanId => vlan_id,
                :vswitchName => switch_name,
                :policy => RbVmomi::VIM.HostNetworkPolicy
            )

            nws = self['configManager.networkSystem']

            begin
                nws.UpdatePortGroup(:pgName => pg_name, :portgrp => spec)
            rescue Exception => e
                raise "A port group with name #{pg_name} could not be updated. Reason: #{e.message}"
            end

            # Set rollback operation
            @net_rollback << {:action => :update_pg, :name => pg_name, :spec => orig_spec}
        end
    end

    ########################################################################
    # Remove a standard port group from the host
    ########################################################################

    def remove_pg(pgname)
        nws = self['configManager.networkSystem']

        swname = nil
        begin
            portgroups = nws.networkConfig.portgroup
            portgroups.each {|pg|
                if pg.spec.name == pgname
                    swname = pg.spec.vswitchName
                    break
                end
            }
            nws.RemovePortGroup(:pgName => pgname)
        rescue RbVmomi::VIM::ResourceInUse
            STDERR.puts "The standard portgroup #{pgname} is in use so it cannot be deleted"
            return nil
        rescue RbVmomi::VIM::NotFound
            STDERR.puts "The standard portgroup #{pgname} was not found in vCenter"
            return nil
        rescue Exception => e
            raise "There was a failure while deleting a standard portgroup #{pgname} in vCenter. Reason: #{e.message}"
        end

        return swname
    end

    def network_rollback
        nws = self['configManager.networkSystem']

        @net_rollback.reverse_each do |nr|

            case nr[:action]
                when :update_pg
                    begin
                        nws.UpdatePortGroup(:pgName => nr[:name], :portgrp => nr[:spec])
                    rescue Exception => e
                        raise "A rollback operation for standard port group #{nr[:name]} could not be performed. Reason: #{e.message}"
                    end
                when :update_sw
                    begin
                        nws.UpdateVirtualSwitch(:vswitchName => nr[:name], :spec => nr[:spec])
                    rescue Exception => e
                        raise "A rollback operation for standard switch #{nr[:name]} could not be performed. Reason: #{e.message}"
                    end
                when :delete_sw
                    begin
                        nws.RemoveVirtualSwitch(:vswitchName=> nr[:name])
                    rescue RbVmomi::VIM::ResourceInUse
                        return #Ignore if switch in use
                    rescue RbVmomi::VIM::NotFound
                        return #Ignore if switch not found
                    rescue Exception => e
                        raise "A rollback operation for standard switch #{nr[:name]} could not be performed. Reason: #{e.message}"
                    end
                when :delete_pg
                    begin
                        nws.RemovePortGroup(:pgName => nr[:name])
                    rescue RbVmomi::VIM::ResourceInUse
                        return #Ignore if pg in use
                    rescue RbVmomi::VIM::NotFound
                        return #Ignore if pg not found
                    rescue Exception => e
                        raise "A rollback operation for standard port group #{nr[:name]} could not be performed. Reason: #{e.message}"
                    end
            end
        end
    end


end # class ESXHost

end # module VCenterDriver
