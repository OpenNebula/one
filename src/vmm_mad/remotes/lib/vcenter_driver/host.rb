module VCenterDriver

class HostFolder
    attr_accessor :item, :clusters

    def initialize(item)
        @item = item
        @clusters = {}
    end

    def fetch_clusters!
        VIClient.get_entities(@item, 'ClusterComputeResource').each do |item|
            _, item_name, _ = item.to_s.split('"')
            @clusters[item_name.to_sym] = ClusterComputeResource.new(item)
        end
    end

    def get_cluster(ref)
        if !@clusters[ref.to_sym]
            rbvmomi_dc = RbVmomi::VIM::ClusterComputeResource.new(@vcenter_client.vim, ref)
            @clusters[ref.to_sym] = ClusterComputeResource.new(rbvmomi_dc)
        end

        @clusters[ref.to_sym]
    end
end # class HostFolder

class ClusterComputeResource
    attr_accessor :item

    def initialize(item)
        @item = item
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
                    DEPLOY_ID="#{vm["config.uuid"]}",
                }

                if number == -1
                    vm_template_64 = Base64.encode64(vm.to_one).gsub("\n","")

                    str_info << "IMPORT_TEMPLATE=\"#{vm_template_64}\","
                end

                str_info << "POLL=\"#{vm.info}\"]"
            rescue Exception => e
                STDERR.puts e.inspect
                STDERR.puts e.backtrace
            end
        end

        return str_info.gsub(/^\s+/,"")
    end

    def self.new_from_ref(vi_client, ref)
        self.new(RbVmomi::VIM::ClusterComputeResource.new(vi_client.vim, ref))
    end
end # class ClusterComputeResource

end # module VCenterDriver
