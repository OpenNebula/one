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

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby' unless defined?(RUBY_LIB_LOCATION)
    GEMS_LOCATION     = '/usr/share/one/gems' unless defined?(GEMS_LOCATION)
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' \
        unless defined?(RUBY_LIB_LOCATION)
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems' \
        unless defined?(GEMS_LOCATION)
end

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'vcenter_driver'

# Gather vCenter cluster monitor info
class VcenterClusterMonitor

    def initialize(host_id)
        begin
            @vi_client = VCenterDriver::VIClient.new_from_host(host_id)

            # Get CCR reference
            client = OpenNebula::Client.new
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.info
            if OpenNebula::is_error? rc
                STDERR.puts rc.message
                exit 1
            end

            ccr_ref = host['TEMPLATE/VCENTER_CCR_REF']

            # Get vCenter Cluster
            @cluster = VCenterDriver::ClusterComputeResource
                       .new_from_ref(ccr_ref, @vi_client)

            cluster_info = monitor
            puts cluster_info
            raise 'vCenter cluster health is on red, check issues on vCenter' \
                if cluster_info.include?('STATUS=red')

            puts monitor_host_systems

            # Retrieve customizations
            begin
                puts monitor_customizations
            rescue StandardError
                # Do not break monitoring on customization error
                puts 'ERROR="Customizations could not be retrieved,' \
                     'please check permissions"'
            end
        rescue StandardError => e
            STDERR.puts "IM poll for vcenter cluster #{host_id} failed due to "\
                        "\"#{e.message}\"\n#{e.backtrace}"
            exit(-1)
        ensure
            @vi_client.close_connection if @vi_client
        end
    end

    def monitor
        total_cpu,
        num_cpu_cores,
        effective_cpu,
        total_memory,
        effective_mem,
        num_hosts,
        num_eff_hosts,
        overall_status,
        drs_enabled,
        ha_enabled= @cluster.item.collect('summary.totalCpu',
                                    'summary.numCpuCores',
                                    'summary.effectiveCpu',
                                    'summary.totalMemory',
                                    'summary.effectiveMemory',
                                    'summary.numHosts',
                                    'summary.numEffectiveHosts',
                                    'summary.overallStatus',
                                    'configuration.drsConfig.enabled',
                                    'configuration.dasConfig.enabled'
        )

        mhz_core = total_cpu.to_f / num_cpu_cores.to_f
        eff_core = effective_cpu.to_f / mhz_core

        free_cpu  = sprintf('%.2f', eff_core * 100).to_f
        total_cpu = num_cpu_cores.to_f * 100
        used_cpu  = sprintf('%.2f', total_cpu - free_cpu).to_f

        total_mem = total_memory.to_i / 1024
        free_mem  = effective_mem.to_i * 1024

        str_info = ''

        # Get cluster name for informative purposes (replace space with _ if any)
        str_info << 'VCENTER_NAME=' << @cluster['name'].tr(' ', '_') << "\n"

        # System
        str_info << "HYPERVISOR=vcenter\n"
        str_info << 'TOTALHOST=' << num_hosts.to_s << "\n"
        str_info << 'AVAILHOST=' << num_eff_hosts.to_s << "\n"
        str_info << 'STATUS=' << overall_status << "\n"

        # CPU
        str_info << 'CPUSPEED=' << mhz_core.to_s   << "\n"
        str_info << 'TOTALCPU=' << total_cpu.to_s << "\n"
        str_info << 'USEDCPU='  << used_cpu.to_s  << "\n"
        str_info << 'FREECPU='  << free_cpu.to_s << "\n"

        # Memory
        str_info << 'TOTALMEMORY=' << total_mem.to_s << "\n"
        str_info << 'FREEMEMORY='  << free_mem.to_s << "\n"
        str_info << 'USEDMEMORY='  << (total_mem - free_mem).to_s << "\n"

        # DRS enabled
        str_info << 'VCENTER_DRS='  << drs_enabled.to_s << "\n"

        # HA enabled
        str_info << 'VCENTER_HA='  << ha_enabled.to_s << "\n"

        str_info << monitor_resource_pools(mhz_core)
    end

    def get_resource_pool_list(rp = @cluster.item.resourcePool, parent_prefix = "", rp_array = [])
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

    def monitor_resource_pools(mhz_core)

        @rp_list = get_resource_pool_list

        view = @vi_client.vim.serviceContent.viewManager.CreateContainerView({
            container: @cluster.item, #View for RPs inside this cluster
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

    def monitor_host_systems
        host_info = ''
        result = @cluster.filter_hosts
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


    def monitor_customizations
        customizations = @cluster['_connection'].serviceContent.customizationSpecManager.info

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

# Gather VMs monitor info
class VcenterVmMonitor

    def initialize(host_id)
        begin
            @vi_client = VCenterDriver::VIClient.new_from_host(host_id)

            # Get CCR reference
            client = OpenNebula::Client.new
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.info
            if OpenNebula::is_error? rc
                STDERR.puts rc.message
                exit 1
            end

            ccr_ref = host['TEMPLATE/VCENTER_CCR_REF']

            # Get vCenter Cluster
            @cluster = VCenterDriver::ClusterComputeResource
                       .new_from_ref(ccr_ref, @vi_client)

            # Print VM monitor info
            vm_monitor_info, last_perf_poll = monitor_vms(host_id)
            if !vm_monitor_info.empty?
                puts 'VM_POLL=YES'
                puts vm_monitor_info
            end

            # Print last VM poll for perfmanager tracking
            puts 'VCENTER_LAST_PERF_POLL=' << last_perf_poll << "\n" \
                if last_perf_poll
        rescue StandardError => e
            STDERR.puts 'IM poll for vcenter cluster #{host_id} failed due to '\
                        "\"#{e.message}\"\n#{e.backtrace}"
            exit(-1)
        ensure
            @vi_client.close_connection if @vi_client
        end
    end

    def monitor_vms(host_id)
        vc_uuid = @vi_client.vim.serviceContent.about.instanceUuid
        cluster_name = @cluster.item['name']
        cluster_ref = @cluster.item

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
        @cluster.item.host.each do |esx_host|
            info = {}
            info[:name] = esx_host.name
            info[:cpu]  = esx_host.summary.hardware.cpuMhz.to_f
            esx_hosts[esx_host._ref] = info
        end

        @monitored_vms = Set.new
        str_info = ''

        view = @vi_client.vim.serviceContent.viewManager.CreateContainerView({
            container: @cluster.item, #View for VMs inside this cluster
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
            rescue StandardError => e
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

    def get_resource_pool_list(rp = @cluster.item.resourcePool, parent_prefix = "", rp_array = [])
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


end

# Gather datastore info
class VcenterDsMonitor

    def initialize(host_id)
        begin
            @vi_client = VCenterDriver::VIClient.new_from_host(host_id)

            # Get CCR reference
            client = OpenNebula::Client.new
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.info
            if OpenNebula::is_error? rc
                STDERR.puts rc.message
                exit 1
            end

            ccr_ref = host['TEMPLATE/VCENTER_CCR_REF']

            # Get vCenter Cluster
            @cluster = VCenterDriver::ClusterComputeResource
                       .new_from_ref(ccr_ref, @vi_client)

            # Print Datastore information
            dc = @cluster.get_dc
            ds_folder = dc.datastore_folder
            @items = ds_folder.fetch!
            puts monitor
        rescue StandardError => e
            STDERR.puts 'IM poll for vcenter cluster #{host_id} failed due to '\
                        "\"#{e.message}\"\n#{e.backtrace}"
            exit(-1)
        ensure
            @vi_client.close_connection if @vi_client
        end
    end

    def monitor
        monitor = ''
        @items.each do |ref, ds|
            monitor << "VCENTER_DS_REF=\"#{ref}\"\n"
        end
        monitor
    end

end

class VcenterWildsMonitor

    def initialize(host_id)
        begin
            @vi_client = VCenterDriver::VIClient.new_from_host(host_id)

            # Get CCR reference
            client = OpenNebula::Client.new
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.info
            if OpenNebula::is_error? rc
                STDERR.puts rc.message
                exit 1
            end

            ccr_ref = host['TEMPLATE/VCENTER_CCR_REF']

            # Get vCenter Cluster
            @cluster = VCenterDriver::ClusterComputeResource
                       .new_from_ref(ccr_ref, @vi_client)

            # Print Datastore information

        rescue StandardError => e
            STDERR.puts 'IM poll for vcenter cluster #{host_id} failed due to '\
                        "\"#{e.message}\"\n#{e.backtrace}"
            exit(-1)
        ensure
            @vi_client.close_connection if @vi_client
        end
    end

end
