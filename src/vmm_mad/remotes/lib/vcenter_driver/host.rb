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

        # Get cluster name for informative purposes
        str_info << "VCENTER_NAME=" << self['name'] << "\n"

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

            rp_info << "\nRESOURCE_POOL = ["
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
                vm = VirtualMachine.new(v)

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

                extraconfig_vmid = vm["config.extraConfig"].select do |val|
                   val[:key] == "opennebula.vm.id"
                end

                if extraconfig_vmid.size > 0 and extraconfig_vmid[0]
                    number = extraconfig_vmid[0][:value]
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

    def self.to_one(cluster, con_ops)

        one_host = VCenterDriver::VIHelper.new_one_item(OpenNebula::Host)

        if OpenNebula.is_error?(one_host)
            raise "Could not create host: #{one_host.message}"
        end

        rc = one_host.allocate(cluster[:cluster_name], 'vcenter', 'vcenter',
                ::OpenNebula::ClusterPool::NONE_CLUSTER_ID)

        if OpenNebula.is_error?(rc)
            raise "Could not allocate host: #{rc.message}"
        end

        template = "VCENTER_HOST=\"#{con_ops[:host]}\"\n"\
                   "VCENTER_PASSWORD=\"#{con_ops[:password]}\"\n"\
                   "VCENTER_USER=\"#{con_ops[:user]}\"\n"\
                   "VCENTER_CCR_REF=\"#{cluster[:cluster_ref]}\"\n"\
                   "VCENTER_INSTANCE_ID=\"#{cluster[:vcenter_uuid]}\"\n"\
                   "VCENTER_VERSION=\"#{cluster[:vcenter_version]}\"\n"\

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

end # module VCenterDriver
