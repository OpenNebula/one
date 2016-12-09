module VCenterDriver

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

        rc = one_host.allocate(cluster_name, 'vcenter', 'vcenter',
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

        str_info << monitor_resource_pools(@cluster.resourcePool, "", mhz_core)
    end

    ############################################################################
    # Generate an OpenNebula monitor string for all resource pools of a cluster
    # Reference:
    # http://pubs.vmware.com/vsphere-60/index.jsp#com.vmware.wssdk.apiref.doc
    # /vim.ResourcePool.html
    ############################################################################
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
        # Only monitor from top level (Resource) Resource Pool
        monitor_vms_in_rp(@resource_pools[-1])
    end


    def monitor_vms_in_rp(rp)
        str_info = ""

        if rp.resourcePool.size != 0
            rp.resourcePool.each{|child_rp|
                str_info += monitor_vms_in_rp(child_rp)
            }
        end

        host_cache = {}

        rp.vm.each { |v|
          begin
              # Check cached objects
              if !host_cache[v.runtime.host.to_s]
                  host_cache[v.runtime.host.to_s] =
                         VCenterCachedHost.new v.runtime.host
              end

              host = host_cache[v.runtime.host.to_s]

              name            = v.name
              number          = -1
              vm_extra_config = v.config.extraConfig

              # Check the running flag
              running_flag = v.config.extraConfig.select{|val|
                                         val[:key]=="opennebula.vm.running"}
              if running_flag.size > 0 and running_flag[0]
                  running_flag = running_flag[0][:value]
              end

              next if running_flag == "no"

              # Extract vmid if possible
              matches = name.match(/^one-(\d*)(-(.*))?$/)
              number  = matches[1] if matches
              extraconfig_vmid = v.config.extraConfig.select{|val|
                                         val[:key]=="opennebula.vm.id"}
              if extraconfig_vmid.size > 0 and extraconfig_vmid[0]
                  number = extraconfig_vmid[0][:value]
              end
              vm = VCenterVm.new(@client, v)
              vm.monitor(host)
              next if !vm.vm.config
              str_info << "\nVM = ["
              str_info << "ID=#{number},"
              str_info << "DEPLOY_ID=\"#{vm.vm.config.uuid}\","
              str_info << "VM_NAME=\"#{name} - "\
                          "#{host.cluster_name}\","
              if number == -1
                  vm_template_to_one =
                      Base64.encode64(vm.vm_to_one(host)).gsub("\n","")
                  str_info << "IMPORT_TEMPLATE=\"#{vm_template_to_one}\","
              end
              str_info << "POLL=\"#{vm.info}\"]"
          rescue Exception => e
              STDERR.puts e.inspect
              STDERR.puts e.backtrace
          end
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

    def get_available_ds
        str_info = ""

        datastores = VIClient.get_entities(client.dc.datastoreFolder,
                                           'Datastore')

        storage_pods = VIClient.get_entities(client.dc.datastoreFolder,
                                            'StoragePod')

        storage_pods.each { |sp|
            datastores << sp
            storage_pod_datastores = VIClient.get_entities(sp, 'Datastore')
            if not storage_pod_datastores.empty?
                datastores.concat(storage_pod_datastores)
            end
        }

        datastores.each { |ds|
            str_info += "VCENTER_DATASTORE=\"#{ds.name}\"\n"
        }
        str_info.chomp
    end
end


end
