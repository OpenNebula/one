# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

##############################################################################
# Module VCenterDriver
##############################################################################
module VCenterDriver

    require 'json'
    require 'nsx_driver'

    ##########################################################################
    # Class HostFolder
    ##########################################################################
    class HostFolder

        attr_accessor :item, :items

        def initialize(item)
            @item = item
            @items = {}
        end

        def fetch_clusters!
            VIClient
                .get_entities(
                    @item,
                    'ClusterComputeResource'
                ).each do |item|
                item_name = item._ref
                @items[item_name.to_sym] = ClusterComputeResource.new(item)
            end
        end

        def get_cluster(ref)
            if !@items[ref.to_sym]
                rbvmomi_dc =
                    RbVmomi::VIM::ClusterComputeResource
                    .new(
                        @item._connection,
                        ref
                    )
                @items[ref.to_sym] =
                    ClusterComputeResource
                    .new(
                        rbvmomi_dc
                    )
            end

            @items[ref.to_sym]
        end

    end
    # class HostFolder

    ##########################################################################
    # Class ClusterComputeResource
    ##########################################################################
    class ClusterComputeResource

        attr_accessor :item
        attr_accessor :rp_list

        include Memoize

        def initialize(item, vi_client = nil)
            @item = item
            @vi_client = vi_client
            @rp_list # rubocop:disable Lint/Void
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

        def get_resource_pool_list(
            rp = @item
                .resourcePool,
            parent_prefix = '',
            rp_array = []
        )
            current_rp = ''

            if !parent_prefix.empty?
                current_rp << parent_prefix
                current_rp << '/'
            end

            resource_pool, name = rp.collect('resourcePool', 'name')
            current_rp << name if name != 'Resources'

            resource_pool.each do |child_rp|
                get_resource_pool_list(child_rp, current_rp, rp_array)
            end

            rp_info = {}
            rp_info[:name] = current_rp
            rp_info[:ref]  = rp._ref
            rp_array << rp_info unless current_rp.empty?

            rp_array
        end

        def nsx_get
            nsx_info = ''
            nsx_obj = {}
            # In the future add more than one nsx manager
            extension_list =
                @vi_client
                .vim
                .serviceContent
                .extensionManager
                .extensionList
            extension_list.each do |ext_list|
                case ext_list.key
                when NSXDriver::NSXConstants::NSXV_EXTENSION_LIST
                    nsx_obj['type'] = NSXDriver::NSXConstants::NSXV
                    url_full = ext_list.client[0].url
                    url_split = url_full.split('/')
                    # protocol = "https://"
                    protocol = url_split[0] + '//'
                    # ip_port = ip:port
                    ip_port = url_split[2]
                    nsx_obj['url'] = protocol + ip_port
                    nsx_obj['version'] = ext_list.version
                    nsx_obj['label'] = ext_list.description.label
                when NSXDriver::NSXConstants::NSXT_EXTENSION_LIST
                    nsx_obj['type'] = NSXDriver::NSXConstants::NSXT
                    nsx_obj['url'] = ext_list.server[0].url
                    nsx_obj['version'] = ext_list.version
                    nsx_obj['label'] = ext_list.description.label
                else
                    next
                end
            end
            unless nsx_obj.empty?
                nsx_info << "NSX_MANAGER=\"#{nsx_obj['url']}\"\n"
                nsx_info << "NSX_TYPE=\"#{nsx_obj['type']}\"\n"
                nsx_info << "NSX_VERSION=\"#{nsx_obj['version']}\"\n"
                nsx_info << "NSX_LABEL=\"#{nsx_obj['label']}\"\n"
            end
            nsx_info
        end

        def nsx_ready?
            @one_item =
                VCenterDriver::VIHelper
                .one_item(
                    OpenNebula::Host,
                    @vi_client
                    .instance_variable_get(
                        :@host_id
                    ).to_i
                )

            # Check if NSX_MANAGER is into the host template
            if [nil, ''].include?(@one_item['TEMPLATE/NSX_MANAGER'])
                @nsx_status = "NSX_STATUS = \"Missing NSX_MANAGER\"\n"
                return false
            end

            # Check if NSX_USER is into the host template
            if [nil, ''].include?(@one_item['TEMPLATE/NSX_USER'])
                @nsx_status = "NSX_STATUS = \"Missing NSX_USER\"\n"
                return false
            end

            # Check if NSX_PASSWORD is into the host template
            if [nil, ''].include?(@one_item['TEMPLATE/NSX_PASSWORD'])
                @nsx_status = "NSX_STATUS = \"Missing NSX_PASSWORD\"\n"
                return false
            end

            # Check if NSX_TYPE is into the host template
            if [nil, ''].include?(@one_item['TEMPLATE/NSX_TYPE'])
                @nsx_status = "NSX_STATUS = \"Missing NSX_TYPE\"\n"
                return false
            end

            # Try a connection as part of NSX_STATUS
            nsx_client = NSXDriver::NSXClient
                         .new_from_id(
                             @vi_client
                             .instance_variable_get(
                                 :@host_id
                             ).to_i
                         )

            if @one_item['TEMPLATE/NSX_TYPE'] == NSXDriver::NSXConstants::NSXV
                # URL to test a connection
                url = '/api/2.0/vdn/scopes'
                begin
                    if nsx_client.get(url)
                        @nsx_status = "NSX_STATUS = \"OK\"\n"
                        return true
                    else
                        @nsx_status =
                            "NSX_STATUS = \"Response code incorrect\"\n"
                        return false
                    end
                rescue StandardError
                    @nsx_status = 'NSX_STATUS = "Error connecting to ' \
                                  "NSX_MANAGER\"\n"
                    return false
                end
            end

            nxs_type = @one_item['TEMPLATE/NSX_TYPE']
            return unless nxs_type == NSXDriver::NSXConstants::NSXT

            # URL to test a connection
            url = '/api/v1/transport-zones'
            begin
                if nsx_client.get(url)
                    @nsx_status = "NSX_STATUS = \"OK\"\n"
                    true
                else
                    @nsx_status =
                        "NSX_STATUS = \"Response code incorrect\"\n"
                    false
                end
            rescue StandardError
                @nsx_status = 'NSX_STATUS = "Error connecting to '\
                                "NSX_MANAGER\"\n"
                false
            end
        end

        def tz_get
            @nsx_status = ''
            if !nsx_ready?
                tz_info = @nsx_status
            else
                tz_info = "NSX_STATUS = OK\n"
                tz_info << 'NSX_TRANSPORT_ZONES = ['

                nsx_client =
                    NSXDriver::NSXClient
                    .new_from_id(
                        @vi_client
                        .instance_variable_get(
                            :@host_id
                        ).to_i
                    )
                tz_object = NSXDriver::TransportZone.new_child(nsx_client)

                # NSX request to get Transport Zones
                case @one_item['TEMPLATE/NSX_TYPE']
                when NSXDriver::NSXConstants::NSXV
                    tzs = tz_object.tzs
                    tzs.each do |tz|
                        tz_info << tz.xpath('name').text << '="'
                        tz_info << tz.xpath('objectId').text << '",'
                    end
                    tz_info.chomp!(',')
                when NSXDriver::NSXConstants::NSXT
                    r = tz_object.tzs
                    r['results'].each do |tz|
                        tz_info << tz['display_name'] << '="'
                        tz_info << tz['id'] << '",'
                    end
                    tz_info.chomp!(',')
                else
                    raise "Unknown Port Group type \
                    #{@one_item['TEMPLATE/NSX_TYPE']}"
                end
                tz_info << ']'
                return tz_info
            end
            tz_info
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
            ha_enabled= @item.collect('summary.totalCpu',
                                      'summary.numCpuCores',
                                      'summary.effectiveCpu',
                                      'summary.totalMemory',
                                      'summary.effectiveMemory',
                                      'summary.numHosts',
                                      'summary.numEffectiveHosts',
                                      'summary.overallStatus',
                                      'configuration.drsConfig.enabled',
                                      'configuration.dasConfig.enabled')

            mhz_core = total_cpu.to_f / num_cpu_cores.to_f
            eff_core = effective_cpu.to_f / mhz_core

            free_cpu  = format('%.2f', eff_core * 100).to_f # rubocop:disable Style/FormatStringToken
            total_cpu = num_cpu_cores.to_f * 100
            used_cpu  = format('%.2f', total_cpu - free_cpu).to_f # rubocop:disable Style/FormatStringToken

            total_mem = total_memory.to_i / 1024
            free_mem  = effective_mem.to_i * 1024

            str_info = ''

            # Get cluster name for informative purposes
            # (replace space with _ if any)
            str_info << 'VCENTER_NAME=' << self['name'].tr(' ', '_') << "\n"

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
            str_info << 'VCENTER_DRS=' << drs_enabled.to_s << "\n"

            # HA enabled
            str_info << 'VCENTER_HA=' << ha_enabled.to_s << "\n"

            # NSX info
            str_info << nsx_get
            str_info << tz_get

            str_info << monitor_resource_pools(mhz_core)
        end

        def monitor_resource_pools(mhz_core)
            @rp_list = get_resource_pool_list

            view =
                @vi_client
                .vim
                .serviceContent
                .viewManager
                .CreateContainerView(
                    {
                        :container => @item, # View for RPs inside this cluster
                    :type => ['ResourcePool'],
                    :recursive => true
                    }
                )

            pc = @vi_client.vim.serviceContent.propertyCollector

            monitored_properties = [
                'config.cpuAllocation.expandableReservation',
                'config.cpuAllocation.limit',
                'config.cpuAllocation.reservation',
                'config.cpuAllocation.shares.level',
                'config.cpuAllocation.shares.shares',
                'config.memoryAllocation.expandableReservation',
                'config.memoryAllocation.limit',
                'config.memoryAllocation.reservation',
                'config.memoryAllocation.shares.level',
                'config.memoryAllocation.shares.shares'
            ]

            filter_spec = RbVmomi::VIM.PropertyFilterSpec(
                :objectSet => [
                    { :obj => view,
                    :skip => true,
                    :selectSet => [
                        RbVmomi::VIM.TraversalSpec(
                            :name => 'traverseEntities',
                            :type => 'ContainerView',
                            :path => 'view',
                            :skip => false
                        )
                    ] }
                ],
                :propSet => [
                    {
                        :type => 'ResourcePool',
                         :pathSet => monitored_properties
                    }
                ]
            )

            result = pc.RetrieveProperties(:specSet => [filter_spec])

            rps = {}
            result.each do |r|
                hashed_properties = r.to_hash
                if r.obj.is_a?(RbVmomi::VIM::ResourcePool)
                    rps[r.obj._ref] = hashed_properties
                end
            end

            return '' if rps.empty?

            rp_info = ''

            rps.each  do |ref, info|
                # CPU
                if info['config.cpuAllocation.expandableReservation']
                    cpu_expandable = 'YES'
                else
                    cpu_expandable = 'NO'
                end
                if info['config.cpuAllocation.limit'] == '-1'
                    cpu_limit = 'UNLIMITED'
                else
                    cpu_limit = info['config.cpuAllocation.limit']
                end
                cpu_reservation  = info['config.cpuAllocation.reservation']
                cpu_num          = cpu_reservation.to_f / mhz_core
                cpu_shares_level = info['config.cpuAllocation.shares.level']
                cpu_shares       = info['config.cpuAllocation.shares.shares']

                # MEMORY
                if info['config.memoryAllocation.expandableReservation']
                    mem_expandable = 'YES'
                else
                    mem_expandable = 'NO'
                end
                if info['config.memoryAllocation.limit'] == '-1'
                    mem_limit = 'UNLIMITED'
                else
                    mem_limit = info['config.memoryAllocation.limit']
                end
                mem_reservation =
                    info['config.memoryAllocation.reservation'].to_f
                mem_shares_level =
                    info['config.memoryAllocation.shares.level']
                mem_shares =
                    info['config.memoryAllocation.shares.shares']

                rp_name =
                    @rp_list
                    .select do |item|
                        item[:ref] == ref
                    end.first[:name] rescue ''

                rp_name = 'Resources' if rp_name.empty?

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
                rp_info << ']'
            end

            view.DestroyView

            rp_info
        end

        def hostname_to_moref(hostname)
            result = filter_hosts

            moref = ''
            result.each do |r|
                if r.obj.name == hostname
                    moref = r.obj._ref
                    break
                end
            end
            raise "Host #{hostname} was not found" if moref.empty?

            moref
        end

        def filter_hosts
            view =
                @vi_client
                .vim
                .serviceContent
                .viewManager
                .CreateContainerView(
                    {
                        # View for Hosts inside this cluster
                        :container => @item,
                        :type => ['HostSystem'],
                        :recursive => true
                    }
                )

            pc = @vi_client.vim.serviceContent.propertyCollector

            monitored_properties = [
                'name',
                'runtime.connectionState',
                'summary.hardware.numCpuCores',
                'summary.hardware.memorySize',
                'summary.hardware.cpuModel',
                'summary.hardware.cpuMhz',
                'summary.quickStats.overallCpuUsage',
                'summary.quickStats.overallMemoryUsage'
            ]

            filter_spec = RbVmomi::VIM.PropertyFilterSpec(
                :objectSet => [
                    { :obj => view,
                    :skip => true,
                    :selectSet => [
                        RbVmomi::VIM.TraversalSpec(
                            :name => 'traverseEntities',
                            :type => 'ContainerView',
                            :path => 'view',
                            :skip => false
                        )
                    ] }
                ],
                :propSet => [
                    { :type => 'HostSystem', :pathSet => monitored_properties }
                ]
            )

            result = pc.RetrieveProperties(:specSet => [filter_spec])
            view.DestroyView # Destroy the view
            result
        end

        def monitor_host_systems
            host_info = ''
            result = filter_hosts
            hosts = {}
            result.each do |r|
                hashed_properties = r.to_hash
                if r.obj.is_a?(RbVmomi::VIM::HostSystem)
                    hosts[r.obj._ref] = hashed_properties
                end
            end

            hosts.each do |_ref, info|
                next if info['runtime.connectionState'] != 'connected'

                total_cpu = info['summary.hardware.numCpuCores'] * 100
                used_cpu  =
                    (
                        info['summary.quickStats.overallCpuUsage']
                        .to_f / info['summary.hardware.cpuMhz']
                        .to_f
                    ) * 100
                # Trim precission
                used_cpu  = format('%.2f', used_cpu).to_f # rubocop:disable Style/FormatStringToken
                free_cpu  = total_cpu - used_cpu

                total_memory =
                    info['summary.hardware.memorySize']/1024
                used_memory =
                    info['summary.quickStats.overallMemoryUsage']*1024
                free_memory = total_memory - used_memory

                host_info <<  "\nHOST=["
                host_info <<  'STATE=on,'
                host_info << 'HOSTNAME="' <<
                    info['name'].to_s << '",'
                host_info <<
                    'MODELNAME="' <<
                    info['summary.hardware.cpuModel'].to_s << '",'
                host_info << 'CPUSPEED=' <<
                    info['summary.hardware.cpuMhz'].to_s << ','
                host_info << 'MAX_CPU='     << total_cpu.to_s    << ','
                host_info << 'USED_CPU='    << used_cpu.to_s     << ','
                host_info << 'FREE_CPU='    << free_cpu.to_s     << ','
                host_info << 'MAX_MEM='     << total_memory.to_s << ','
                host_info << 'USED_MEM='    << used_memory.to_s  << ','
                host_info << 'FREE_MEM='    << free_memory.to_s
                host_info << ']'
            end

            host_info
        end

        def monitor_vms(host_id, vm_type)
            vc_uuid = @vi_client.vim.serviceContent.about.instanceUuid
            cluster_name = self['name']
            cluster_ref = self['_ref']

            # Get info of the host where the VM/template is located
            one_host =
                VCenterDriver::VIHelper
                .one_item(
                    OpenNebula::Host,
                    host_id
                )
            if !one_host
                STDERR.puts "Failed to retieve host with id #{host.id}"
                if VCenterDriver::CONFIG[:debug_information]
                    STDERR.puts "#{message} #{e.backtrace}"
                end
            end

            esx_hosts = {}
            @item.host.each do |esx_host|
                esx_hosts[esx_host._ref] = {
                    :name => esx_host.name,
                    :cpu  => esx_host.summary.hardware.cpuMhz.to_f
                }
            end

            monitored_vms = Set.new
            str_info = ''

            view =
                @vi_client
                .vim
                .serviceContent
                .viewManager
                .CreateContainerView(
                    {
                        :container => @item, # View for VMs inside this cluster
                        :type => ['VirtualMachine'],
                        :recursive => true
                    }
                )

            pc = @vi_client.vim.serviceContent.propertyCollector

            monitored_properties = [
                'name', # VM name
                'config.template', # To filter out templates
                'summary.runtime.powerState', # VM power state
                'summary.quickStats.hostMemoryUsage', # Memory usage
                'summary.quickStats.overallCpuUsage', # CPU used by VM
                'runtime.host', # ESX host
                'resourcePool', # RP
                'guest.guestFullName',
                # IP addresses as seen by guest tools,
                'guest.net',
                'guest.guestState',
                'guest.toolsVersion',
                'guest.toolsRunningStatus',
                # IP addresses as seen by guest tools,
                'guest.toolsVersionStatus2',
                # VM extraconfig info e.g opennebula.vm.running
                'config.extraConfig',
                'config.hardware.numCPU',
                'config.hardware.memoryMB',
                'config.annotation',
                'datastore'
            ]

            filter_spec = RbVmomi::VIM.PropertyFilterSpec(
                :objectSet => [
                    { :obj => view,
                    :skip => true,
                    :selectSet => [
                        RbVmomi::VIM.TraversalSpec(
                            :name => 'traverseEntities',
                            :type => 'ContainerView',
                            :path => 'view',
                            :skip => false
                        )
                    ] }
                ],
                :propSet => [
                    {
                        :type => 'VirtualMachine',
                         :pathSet => monitored_properties
                    }
                ]
            )

            result = pc.RetrieveProperties(:specSet => [filter_spec])

            vms = {}
            vm_objects = []
            result.each do |r|
                hashed_properties = r.to_hash
                next unless r.obj.is_a?(RbVmomi::VIM::VirtualMachine)

                # Only take care of VMs, not templates
                if !hashed_properties['config.template']
                    vms[r.obj._ref + '_' + vc_uuid] = hashed_properties
                    vm_objects << r.obj
                end
            end

            pm = @vi_client.vim.serviceContent.perfManager

            stats = {}

            max_samples = 9
            refresh_rate = 20 # Real time stats takes samples every 20 seconds

            last_mon_time = one_host['TEMPLATE/VCENTER_LAST_PERF_POLL']

            if last_mon_time
                interval = (Time.now.to_i - last_mon_time.to_i)
                interval = 3601 if interval < 0
                samples = (interval / refresh_rate)
                samples = 1 if samples == 0
                interval > 3600 ? max_samples = 9 : max_samples = samples
            end

            if !vm_objects.empty?
                stats = pm.retrieve_stats(
                    vm_objects,
                    [
                        'net.transmitted',
                        'net.bytesRx',
                        'net.bytesTx',
                        'net.received',
                        'virtualDisk.numberReadAveraged',
                        'virtualDisk.numberWriteAveraged',
                        'virtualDisk.read',
                        'virtualDisk.write'
                    ],
                    {
                        :max_samples => max_samples
                    }
                ) rescue {}
            end

            if !stats.empty?
                last_mon_time = Time.now.to_i.to_s
            end

            @rp_list ||= get_resource_pool_list

            vm_pool =
                VCenterDriver::VIHelper
                .one_pool(
                    OpenNebula::VirtualMachinePool
                )
            # We filter to retrieve only those VMs
            # running in the host that we are monitoring
            host_vms =
                vm_pool
                .retrieve_xmlelements(
                    "/VM_POOL/VM[HISTORY_RECORDS/HISTORY/HID='#{host_id}']"
                )

            vms.each do |vm_ref, info|
                vm_info = ''
                begin
                    esx_host = esx_hosts[info['runtime.host']._ref]
                    info[:esx_host_name] = esx_host[:name]
                    info[:esx_host_cpu] = esx_host[:cpu]
                    info[:cluster_name] = cluster_name
                    info[:cluster_ref] = cluster_ref
                    info[:vc_uuid] = vc_uuid
                    info[:host_id] = host_id
                    info[:rp_list] = @rp_list

                    # Check the running flag
                    running_flag = info['config.extraConfig'].select do |val|
                        val[:key] == 'opennebula.vm.running'
                    end

                    if !running_flag.empty? && running_flag.first
                        running_flag = running_flag[0][:value]
                    end

                    next if running_flag == 'no'

                    id = -1
                    # Find the VM by its deploy_id,
                    # which in the vCenter driver is
                    # the vCenter managed object reference
                    found_vm =
                        host_vms
                        .select do |vm|
                            vm['DEPLOY_ID'] == vm_ref ||
                            vm['DEPLOY_ID'] == VIHelper.get_deploy_id(vm_ref)
                        end.first
                    id = found_vm['ID'] if found_vm

                    # skip if it is a wild and
                    # we are looking for OpenNebula VMs
                    next if (vm_type == 'ones') && (id == -1)
                    # skip if it is not a wild and we are looking for wilds
                    next if (vm_type == 'wilds') && (id != -1)
                    # skip if already monitored
                    next if monitored_vms.include? vm_ref

                    monitored_vms << vm_ref

                    vm =
                        VCenterDriver::VirtualMachine
                        .new(
                            @vi_client,
                            vm_ref,
                            id
                        )
                    vm.vm_info = info
                    vm.monitor(stats)

                    vm_name = "#{info['name']} - #{cluster_name}"
                    vm_info << "VM = [ ID=\"#{id}\", "
                    vm_info << "VM_NAME=\"#{vm_name}\", "
                    vm_info << "DEPLOY_ID=\"#{vm_ref}\", "

                    # if the machine does not exist in
                    # opennebula it means that is a wild:
                    if vm.one_exist?
                        mon_s64 = Base64.strict_encode64(vm.info)
                        vm_info << "MONITOR=\"#{mon_s64}\"]\n"
                    else
                        vm_template64 =
                            Base64
                            .encode64(
                                vm.vm_to_one(vm_name)
                            ).gsub("\n", '')
                        vm_info << 'VCENTER_TEMPLATE="YES",'
                        vm_info << "IMPORT_TEMPLATE=\"#{vm_template64}\"]\n"
                    end
                rescue StandardError => e
                    vm_info = error_monitoring(e, id, vm_ref, vc_uuid, info)
                end

                str_info << vm_info
            end

            view.DestroyView # Destroy the view

            [str_info, last_mon_time]
        end

        def error_monitoring(e, id, vm_ref, _vc_uuid, info = {})
            error_info = ''
            vm_name = info['name'] || nil
            tmp_str = e.inspect
            tmp_str << e.backtrace.join("\n")

            error_info << "VM = [ ID=\"#{id}\", "
            error_info << "VM_NAME=\"#{vm_name}\", "
            error_info << "DEPLOY_ID=\"#{vm_ref}\", "
            error_info <<
                "ERROR=\"#{Base64.encode64(tmp_str).gsub("\n", '')}\"]\n"
        end

        def monitor_customizations
            customizations =
                self['_connection']
                .serviceContent
                .customizationSpecManager
                .info

            text = ''

            customizations.each do |c|
                t = 'CUSTOMIZATION = [ '
                t << %(NAME = "#{c.name}", )
                t << %(TYPE = "#{c.type}" ]\n)

                text << t
            end

            text
        end

        def datacenter # rubocop:disable Naming/AccessorMethodName
            item = @item

            until item.instance_of? RbVmomi::VIM::Datacenter
                item = item.parent
                if item.nil?
                    raise 'Could not find the parent Datacenter'
                end
            end

            Datacenter.new(item)
        end

        def self.to_one(cluster, con_ops, rp, one_cluster_id)
            one_host = VCenterDriver::VIHelper.new_one_item(OpenNebula::Host)

            if OpenNebula.is_error?(one_host)
                raise "Could not create host: #{one_host.message}"
            end

            one_cluster_id ||= -1

            rc = one_host
                 .allocate(
                     cluster[:cluster_name],
                     'vcenter',
                     'vcenter',
                     one_cluster_id.to_i
                 )

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

            template << "VCENTER_PORT=\"#{con_ops[:port]}\"" if con_ops[:port]

            rc = one_host.update(template, false)

            if OpenNebula.is_error?(rc)
                update_error = rc.message
                rc = one_host.delete

                unless OpenNebula.is_error?(rc)
                    raise "Could not update host: #{rc.message}"; end

                raise "Could not update host: #{update_error} "\
                          "and could not delete host: #{rc.message}"
            end

            rc = one_host.offline

            if OpenNebula.is_error?(rc)
                update_error = rc.message
                rc = one_host.delete

                unless OpenNebula.is_error?(rc)
                    raise "Could not offline host: #{rc.message}"; end

                raise "Could not offline host: #{update_error} "\
                          "and could not delete host: #{rc.message}"
            end

            rc = one_host.enable

            if OpenNebula.is_error?(rc)
                update_error = rc.message
                rc = one_host.delete

                unless OpenNebula.is_error?(rc)
                    raise "Could not enable host: #{rc.message}"; end

                raise "Could not enable host: #{update_error} "\
                          "and could not delete host: #{rc.message}"
            end

            one_host
        end

        def self.new_from_ref(ref, vi_client)
            new(
                RbVmomi::VIM::ClusterComputeResource
                .new(
                    vi_client.vim,
                    ref
                ),
                vi_client
            )
        end

    end
    # class ClusterComputeResource

    ##########################################################################
    # Class ESXHost
    ##########################################################################
    class ESXHost

        attr_accessor :item

        include Memoize

        PG_CREATE_TIMEOUT = 240 # We will wait for 4 minutes for the pg creation

        def initialize(item, vi_client = nil)
            @net_rollback = []
            @locking = true
            @item = item
            @vi_client = vi_client
        end

        def self.new_from_ref(ref, vi_client)
            new(RbVmomi::VIM::HostSystem.new(vi_client.vim, ref), vi_client)
        end

        # Locking function. Similar to flock
        def lock
            hostlockname = @item['name'].downcase.tr(' ', '_')

            return unless @locking

            @locking_file =
                File
                .open("/tmp/vcenter-#{hostlockname}-lock", 'w')
            @locking_file.flock(File::LOCK_EX)
        end

        # Unlock driver execution mutex
        def unlock
            return unless @locking

            @locking_file.close
        end

        ########################################################################
        # Check if standard switch exists in host
        ########################################################################

        def vss_exists(vswitch_name)
            vswitches = @item.configManager.networkSystem.networkInfo.vswitch
            vswitches.select {|vs| vs.name == vswitch_name }.first rescue nil
        end

        ########################################################################
        # Create a standard vcenter switch in an ESX host
        ########################################################################

        def create_vss(
            name,
            num_ports,
            pnics = nil,
            mtu = 1500,
            pnics_available = nil
        )
            # Get NetworkSystem
            nws = self['configManager.networkSystem']
            hostbridge = nil
            nics = []

            num_ports = 128 if num_ports.nil?

            if pnics
                pnics = pnics.split(',')
                pnics.each do |pnic|
                    # Add nics if not in use
                    nics << pnic if pnics_available.include?(pnic)
                end

                if !nics.empty?
                    hostbridge =
                        RbVmomi::VIM::HostVirtualSwitchBondBridge(
                            :nicDevice => nics
                        )
                end
            end

            # Create spec
            vswitchspec =
                RbVmomi::VIM::HostVirtualSwitchSpec(
                    :bridge => hostbridge,
                    :mtu => mtu,
                    :numPorts => num_ports
                )

            # add vSwitch to the host
            begin
                nws.AddVirtualSwitch(:vswitchName => name, :spec => vswitchspec)
            rescue StandardError => e
                raise "The standard vSwitch #{name} could not be \
                created. AddVirtualSwitch failed Reason: #{e.message}."
            end

            @net_rollback << { :action => :delete_sw, :name => name }

            name
        end

        ########################################################################
        # Update a standard vcenter switch in an ESX host
        ########################################################################
        def update_vss(switch, name, pnics, num_ports, mtu)
            pnics = pnics.split(',') rescue []

            # Backup switch spec for rollback
            orig_spec = switch.spec

            # Compare current configuration and return if switch hasn't changed
            switch_has_pnics = switch
                               .spec
                               .respond_to?(
                                   :bridge
                               ) && switch
                               .spec
                               .bridge
                               .respond_to?(
                                   :nicDevice
                               )

            same_switch = switch.spec.respond_to?(:mtu) && switch
                          .spec
                          .mtu == mtu &&
                          switch
                          .spec
                          .respond_to?(
                              :numPorts
                          ) && switch.spec.numPorts == num_ports &&
                          (!switch_has_pnics && pnics.empty? ||
                           switch_has_pnics && switch
                           .spec
                           .bridge
                           .nicDevice
                           .uniq
                           .sort == pnics.uniq.sort)
            return if same_switch

            # Let's create a new spec and update the switch
            hostbridge = nil
            nws = self['configManager.networkSystem']
            unless pnics.empty?
                hostbridge =
                    RbVmomi::VIM::HostVirtualSwitchBondBridge(
                        :nicDevice => pnics
                    )
            end
            vswitchspec =
                RbVmomi::VIM::HostVirtualSwitchSpec(
                    :bridge => hostbridge,
                    :mtu => mtu,
                    :numPorts => num_ports
                )
            begin
                nws
                    .UpdateVirtualSwitch(
                        :vswitchName => name,
                        :spec => vswitchspec
                    )
            rescue StandardError => e
                raise "The standard switch with name #{name} \
                could not be updated. Reason: #{e.message}"
            end

            @net_rollback << {
                :action => :update_sw,
                :name => name,
                :spec => orig_spec
            }
        end

        ########################################################################
        # Remove a standard vswitch from the host
        ########################################################################
        def remove_vss(vswitch_name)
            nws = self['configManager.networkSystem']

            begin
                nws.RemoveVirtualSwitch(:vswitchName => vswitch_name)
            rescue RbVmomi::VIM::ResourceInUse
                STDERR.puts "The standard switch #{vswitch_name} \
                is in use so it cannot be deleted"
                return
            rescue RbVmomi::VIM::NotFound
                STDERR.puts "The standard switch #{vswitch_name} \
                was not found in vCenter"
                return
            rescue StandardError => e
                raise "There was a failure while deleting a vcenter \
                standard switch #{vswitch_name}. Reason: #{e.message}"
            end

            vswitch_name
        end

        ########################################################################
        # Get physical nics that are available in a host
        ########################################################################
        def available_pnics
            pnics_in_use = []
            pnics_available = []

            # Get pnics in use in standard switches
            @item.config.network.vswitch.each do |vs|
                vs.pnic.each do |pnic|
                    next unless pnic.instance_of?(String)

                    pnic.slice!('key-vim.host.PhysicalNic-')
                    pnics_in_use << pnic
                end
            end

            # Get pnics in host
            self['config.network'].pnic.each do |pnic|
                next if pnics_in_use
                        .include?(pnic.device)

                pnics_available << pnic
                                   .device
            end

            pnics_available
        end

        ########################################################################
        # Get networks inside a host
        ########################################################################
        def pg_inside_host
            pg_inside = {}

            # Get pnics in use in standard switches
            @item.config.network.vswitch.each do |vs|
                pg_inside[vs.name] = []
                vs.portgroup.each do |pg|
                    pg.slice!('key-vim.host.PortGroup-')
                    pg_inside[vs.name] << pg
                end
            end

            pg_inside
        end

        ########################################################################
        # Check if proxy switch exists in host for distributed virtual switch
        ########################################################################

        def proxy_switch_exists(switch_name)
            nws = self['configManager.networkSystem']
            proxy_switches = nws.networkInfo.proxySwitch
            proxy_switches
                .select {|ps| ps.dvsName == switch_name }
                .first rescue nil
        end

        ########################################################################
        # Assign a host to a a distributed vcenter switch (proxy switch)
        ########################################################################

        def assign_proxy_switch(dvs, switch_name, pnics, _pnics_available)
            dvs = dvs.item

            # Return if host is already assigned
            return dvs unless dvs['config.host']
                              .select do |host|
                                  host.config.host._ref == self['_ref']
                              end.empty?

            # Prepare spec for DVS reconfiguration
            config_spec = RbVmomi::VIM::VMwareDVSConfigSpec.new
            config_spec.name = switch_name
            config_spec.configVersion = dvs['config.configVersion']

            # Check if host is already assigned to distributed switch
            operation = 'add'
            # #operation = "edit" if !dvs['config.host'].select
            # { |host| host.config.host._ref == self['_ref'] }.empty?

            # Add host members to the distributed virtual switch
            host_member_spec =
                RbVmomi::VIM::DistributedVirtualSwitchHostMemberConfigSpec
                .new
            host_member_spec.host = @item
            host_member_spec.operation = operation
            host_member_spec.backing =
                RbVmomi::VIM::DistributedVirtualSwitchHostMemberPnicBacking
                .new
            host_member_spec.backing.pnicSpec = []

            # If pnics are needed assign pnics for uplinks
            if pnics
                pnics = pnics.split(',')
                # Get uplink portgroup from dvswitch
                uplink_key = dvs['config.uplinkPortgroup'].select do |ul|
                                 ul.name == "#{switch_name}-uplink-pg"
                             end.first.key rescue nil

                unless uplink_key
                    raise "Cannot find the uplink portgroup for #{switch_name}"
                end

                pnics.each do |pnic|
                    pnic_spec =
                        RbVmomi::VIM::DistributedVirtualSwitchHostMemberPnicSpec
                        .new
                    pnic_spec.pnicDevice = pnic
                    pnic_spec.uplinkPortgroupKey = uplink_key
                    host_member_spec.backing.pnicSpec << pnic_spec
                end
            end

            config_spec.host = [host_member_spec]

            # The DVS must be reconfigured
            dvs_reconfigure_task = dvs.ReconfigureDvs_Task(:spec => config_spec)
            dvs_reconfigure_task.wait_for_completion
            if dvs_reconfigure_task.info.state != 'success'
                raise "It wasn't possible to assign host \
                #{self['name']} as a member of #{switch_name}'"
            end

            dvs
        end

        ########################################################################
        # Create a standard port group
        ########################################################################

        def create_pg(pgname, vswitch, vlan = 0)
            spec = RbVmomi::VIM.HostPortGroupSpec(
                :name => pgname,
                :vlanId => vlan,
                :vswitchName => vswitch,
                :policy => RbVmomi::VIM.HostNetworkPolicy
            )

            nws = self['configManager.networkSystem']

            begin
                nws.AddPortGroup(:portgrp => spec)
            rescue StandardError => e
                raise "A port group with name #{pgname} \
                could not be created. Reason: #{e.message}"
            end

            @net_rollback << { :action => :delete_pg, :name => pgname }

            # wait until the network is ready and we have a reference
            networks = @item['network'].select {|net| net.name == pgname }
            (0..PG_CREATE_TIMEOUT).each do
                break unless networks.empty?

                networks = @item['network'].select {|net| net.name == pgname }
                sleep 1
            end

            if networks.empty?
                raise 'Cannot get VCENTER_NET_REF for new port group'
            end

            networks.first._ref
        end

        ########################################################################
        # Check if standard port group exists in host
        ########################################################################

        def pg_exists(pg_name)
            nws = self['configManager.networkSystem']
            portgroups = nws.networkInfo.portgroup
            portgroups.select {|pg| pg.spec.name == pg_name }.first rescue nil
        end

        ########################################################################
        # Is the switch for the pg different?
        ########################################################################

        def pg_changes_sw?(pg, switch_name)
            pg
                .spec
                .respond_to?(
                    :vswitchName
                ) && pg
                    .spec
                    .vswitchName != switch_name
        end

        ########################################################################
        # Update a standard port group
        ########################################################################

        def update_pg(pg, switch_name, vlan_id)
            unless pg.spec.respond_to?(:vlanId) && pg.spec.vlanId != vlan_id
                return; end

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
            rescue StandardError => e
                raise "A port group with name #{pg_name} \
                could not be updated. Reason: #{e.message}"
            end

            # Set rollback operation
            @net_rollback << {
                :action => :update_pg,
                :name => pg_name,
                    :spec => orig_spec
            }
        end

        ########################################################################
        # Remove a standard port group from the host
        ########################################################################

        def remove_pg(pgname)
            nws = self['configManager.networkSystem']

            swname = nil
            begin
                portgroups = nws.networkConfig.portgroup
                portgroups.each do |pg|
                    if pg.spec.name == pgname
                        swname = pg.spec.vswitchName
                        break
                    end
                end
                nws.RemovePortGroup(:pgName => pgname)
            rescue RbVmomi::VIM::ResourceInUse
                STDERR.puts "The standard portgroup \
                #{pgname} is in use so it cannot be deleted"
                return
            rescue RbVmomi::VIM::NotFound
                STDERR.puts "The standard portgroup \
                #{pgname} was not found in vCenter"
                return
            rescue StandardError => e
                raise "There was a failure while \
                deleting a standard portgroup #{pgname} \
                in vCenter. Reason: #{e.message}"
            end

            swname
        end

        def network_rollback
            nws = self['configManager.networkSystem']

            @net_rollback.reverse_each do |nr|
                case nr[:action]
                when :update_pg
                    begin
                        nws
                            .UpdatePortGroup(
                                :pgName => nr[:name],
                                :portgrp => nr[:spec]
                            )
                    rescue StandardError => e
                        raise "A rollback operation for standard \
                        port group #{nr[:name]} could not \
                        be performed. Reason: #{e.message}"
                    end
                when :update_sw
                    begin
                        nws
                            .UpdateVirtualSwitch(
                                :vswitchName => nr[:name],
                                :spec => nr[:spec]
                            )
                    rescue StandardError => e
                        raise "A rollback operation for standard \
                        switch #{nr[:name]} could not \
                        be performed. Reason: #{e.message}"
                    end
                when :delete_sw
                    begin
                        nws.RemoveVirtualSwitch(:vswitchName=> nr[:name])
                    rescue RbVmomi::VIM::ResourceInUse
                        next # Ignore if switch in use
                    rescue RbVmomi::VIM::NotFound
                        next # Ignore if switch not found
                    rescue StandardError => e
                        raise "A rollback operation for standard \
                        switch #{nr[:name]} could not \
                        be performed. Reason: #{e.message}"
                    end
                when :delete_pg
                    begin
                        nws.RemovePortGroup(:pgName => nr[:name])
                    rescue RbVmomi::VIM::ResourceInUse
                        next # Ignore if pg in use
                    rescue RbVmomi::VIM::NotFound
                        next # Ignore if pg not found
                    rescue StandardError => e
                        raise "A rollback operation for \
                        standard port group #{nr[:name]} could \
                        not be performed. Reason: #{e.message}"
                    end
                end
            end
        end

    end
    # class ESXHost

end
# module VCenterDriver
