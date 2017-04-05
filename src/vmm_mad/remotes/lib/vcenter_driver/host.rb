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

    include Memoize

    def initialize(item, vi_client=nil)
        @item = item
        @vi_client = vi_client
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

    def get_resource_pool_list(rp = nil, parent_prefix = "", rp_array = [])

        current_rp = ""

        if rp.nil?
            rp = @item.resourcePool
        else
            if !parent_prefix.empty?
                current_rp << parent_prefix
                current_rp << "/"
            end
            current_rp << rp.name
        end

        if rp.resourcePool.size == 0
            rp_info = {}
            rp_info[:name] = current_rp
            rp_info[:ref]  = rp._ref
            rp_array << rp_info
        else
            rp.resourcePool.each do |child_rp|
                get_resource_pool_list(child_rp, current_rp, rp_array)
            end
            rp_info = {}
            rp_info[:name] = current_rp
            rp_info[:ref]  = rp._ref
            rp_array << rp_info if !current_rp.empty?
        end

        rp_array
    end

    def monitor
        #Load the host systems
        summary = @item.summary

        mhz_core = summary.totalCpu.to_f / summary.numCpuCores.to_f
        eff_core = summary.effectiveCpu.to_f / mhz_core

        free_cpu  = sprintf('%.2f', eff_core * 100).to_f
        total_cpu = summary.numCpuCores.to_f * 100
        used_cpu  = sprintf('%.2f', total_cpu - free_cpu).to_f

        total_mem = summary.totalMemory.to_i / 1024
        free_mem  = summary.effectiveMemory.to_i * 1024

        str_info = ""

        # Get cluster name for informative purposes (replace space with _ if any)
        str_info << "VCENTER_NAME=" << self['name'].tr(" ", "_") << "\n"

        # System
        str_info << "HYPERVISOR=vcenter\n"
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


        str_info << monitor_resource_pools(@item.resourcePool, "", mhz_core)
    end

    def monitor_resource_pools(parent_rp, parent_prefix, mhz_core)
        return "" if parent_rp.resourcePool.size == 0

        rp_info = ""

        parent_rp.resourcePool.each{|rp|
            rpcpu     = rp.config.cpuAllocation
            rpmem     = rp.config.memoryAllocation
            # CPU
            cpu_expandable   = rpcpu.expandableReservation ? "YES" : "NO"
            cpu_limit        = rpcpu.limit == "-1" ? "UNLIMITED" : rpcpu.limit
            cpu_reservation  = rpcpu.reservation
            cpu_num          = rpcpu.reservation.to_f / mhz_core
            cpu_shares_level = rpcpu.shares.level
            cpu_shares       = rpcpu.shares.shares

            # MEMORY
            mem_expandable   = rpmem.expandableReservation ? "YES" : "NO"
            mem_limit        = rpmem.limit == "-1" ? "UNLIMITED" : rpmem.limit
            mem_reservation  = rpmem.reservation.to_f
            mem_shares_level = rpmem.shares.level
            mem_shares       = rpmem.shares.shares

            rp_name          = (parent_prefix.empty? ? "" : parent_prefix + "/")
            rp_name         += rp.name

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

            if rp.resourcePool.size != 0
               rp_info << monitor_resource_pools(rp, rp_name, mhz_core)
            end
        }

        return rp_info
    end

    def monitor_host_systems
        host_info = ""

        @item.host.each do |h|
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
            host_info << "HOSTNAME=\""  << h.name.to_s       << "\","
            host_info << "MODELNAME=\"" << hw.cpuModel.to_s  << "\","
            host_info << "CPUSPEED="    << hw.cpuMhz.to_s    << ","
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

    def monitor_vms
        str_info = ""
        @monitored_vms = Set.new
        resource_pools.each do |rp|
            str_info << monitor_vms_in_rp(rp)
        end

        return str_info
    end

    def monitor_vms_in_rp(rp)
        str_info = ""

        host_pool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool)

        ccr_host = {}
        host_pool.each do |host|
            ccr = host['TEMPLATE/VCENTER_CCR_REF']
            ccr_host[ccr] = host['ID'] if ccr
        end

        rp.vm.each do |v|
            begin
                vm = VirtualMachine.new(v, @vi_client)

                number = -1

                # Check the running flag
                running_flag = vm["config.extraConfig"].select do |val|
                    val[:key] == "opennebula.vm.running"
                end

                if running_flag.size > 0 and running_flag[0]
                    running_flag = running_flag[0][:value]
                end

                next if running_flag == "no"

                # Extract vmid if possible
                matches = vm["name"].match(/^one-(\d*)(-(.*))?$/)
                number  = matches[1] if matches

                # Extract vmid from ref and vcenter instance uuid if possible
                vm_id = vm.get_vm_id

                number = vm_id if vm_id

                if number != -1
                    next if @monitored_vms.include? number
                    @monitored_vms << number
                end

                vm.monitor

                next if !vm["config"]

                str_info << %Q{
                VM = [
                    ID="#{number}",
                    VM_NAME="#{vm["name"]} - #{vm["runtime.host.parent.name"]}",
                    DEPLOY_ID="#{vm["_ref"]}",
                }

                if number == -1
                    vm_template_64 = Base64.encode64(vm.to_one).gsub("\n","")

                    str_info << "IMPORT_TEMPLATE=\"#{vm_template_64}\","
                end

                str_info << "POLL=\"#{vm.info.gsub('"', "\\\"")}\"]"
            rescue Exception => e
                STDERR.puts e.inspect
                STDERR.puts e.backtrace
            end
        end

        return str_info.gsub(/^\s+/,"")
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
        same_switch = switch.spec.respond_to?(:mtu) && switch.spec.mtu == mtu &&
                      switch.spec.respond_to?(:numPorts) && switch.spec.mtu == num_ports &&
                      (!pnics || (pnics && switch.spec.respond_to?(:bridge) &&
                      switch.spec.bridge.respond_to?(:nicDevice) &&
                      switch.spec.bridge.nicDevice.uniq.sort == pnics.uniq.sort))
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

        # Prepare spec for DVS reconfiguration
        configSpec = RbVmomi::VIM::VMwareDVSConfigSpec.new
        configSpec.name = switch_name
        configSpec.configVersion = dvs['config.configVersion']

        # Check if host is already assigned to distributed switch
        operation = "add"
        operation = "edit" if !dvs['config.host'].select { |host| host.config.host._ref == self['_ref'] }.empty?

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
