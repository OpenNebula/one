# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION ||= ENV['ONE_LOCATION'] unless defined? ONE_LOCATION

if !ONE_LOCATION
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
    ETC_LOCATION      ||= '/etc/one/'
    VAR_LOCATION      ||= '/var/lib/one/'
else
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
    ETC_LOCATION      ||= ONE_LOCATION + '/etc/'
    VAR_LOCATION      ||= ONE_LOCATION + '/var/'
end

VCENTER_DRIVER_CONF = "#{VAR_LOCATION}/remotes/etc/vmm/vcenter/vcenterrc"
VCENTER_DATABASE_BASE = "#{VAR_LOCATION}/remotes/im/vcenter.d/"

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
    $LOAD_PATH.reject! {|l| l =~ /(vendor|site)_ruby/ }
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'opennebula'
require 'vcenter_driver'
require 'sqlite3'
require 'yaml'

# Gather vCenter cluster monitor info
class VcenterMonitor

    POLL_ATTRIBUTE = OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE
    VM_STATE = OpenNebula::VirtualMachine::Driver::VM_STATE

    STATE_MAP = {
        'poweredOn' => 'RUNNING',
        'suspended' => 'POWEROFF',
        'poweredOff' => 'POWEROFF'
    }

    DEFAULTS = {
        # :rgroup_name_format => 'one-%<NAME>s-%<ID>s',
        :cache_expire       => 120
    }

    def initialize(host_id)
        @hypervisor = 'vcenter'
        @host_id = host_id

        load_conf = YAML.safe_load(File.read(VCENTER_DRIVER_CONF), [Symbol])
        @vcenter_conf = DEFAULTS
        @vcenter_conf.merge!(load_conf)

        @vi_client = VCenterDriver::VIClient.new_from_host(host_id)
        @vc_uuid = @vi_client.vim.serviceContent.about.instanceUuid
        # Get CCR reference
        @client = OpenNebula::Client.new
        @host = OpenNebula::Host.new_with_id(host_id, @client)
        rc = @host.info
        if OpenNebula.is_error? rc
            STDERR.puts rc.message
            exit 1
        end

        @ccr_ref = @host['TEMPLATE/VCENTER_CCR_REF']

        # Get vCenter Cluster
        @cluster = VCenterDriver::ClusterComputeResource
                   .new_from_ref(@ccr_ref, @vi_client)

        # ----------------------------------------------------------------------
        # create or open cache db
        # ----------------------------------------------------------------------
        db_path = File.join(VCENTER_DATABASE_BASE,
                            "cache_#{@hypervisor}_#{@host_id}.db")
        @db = InstanceCache.new(db_path)
    end

    def monitor_clusters
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
                                          'configuration.dasConfig.enabled')

        mhz_core = total_cpu.to_f / num_cpu_cores.to_f
        eff_core = effective_cpu.to_f / mhz_core

        # rubocop:disable Style/FormatStringToken
        free_cpu  = format('%.2f', eff_core * 100).to_f
        total_cpu = num_cpu_cores.to_f * 100
        used_cpu  = format('%.2f', total_cpu - free_cpu).to_f
        # rubocop:enable Style/FormatStringToken

        total_mem = total_memory.to_i / 1024
        free_mem  = effective_mem.to_i * 1024

        str_info = ''

        # Get cluster name for info purposes (replace space with _ if any)
        str_info << 'VCENTER_NAME=' << @cluster['name'].tr(' ', '_') << "\n"

        # System
        str_info << "HYPERVISOR=vcenter\n"
        str_info << 'TOTALHOST=' << num_hosts.to_s << "\n"
        str_info << 'AVAILHOST=' << num_eff_hosts.to_s << "\n"
        str_info << 'STATUS=' << overall_status << "\n"

        # CPU
        str_info << 'CPUSPEED=' << mhz_core.to_s   << "\n"
        str_info << 'TOTALCPU=' << total_cpu.to_s << "\n"
        str_info << 'USEDCPU=' << used_cpu.to_s  << "\n"
        str_info << 'FREECPU=' << free_cpu.to_s << "\n"

        # Memory
        str_info << 'TOTALMEMORY=' << total_mem.to_s << "\n"
        str_info << 'FREEMEMORY=' << free_mem.to_s << "\n"
        str_info << 'USEDMEMORY=' << (total_mem - free_mem).to_s << "\n"

        # DRS enabled
        str_info << 'VCENTER_DRS=' << drs_enabled.to_s << "\n"

        # HA enabled
        str_info << 'VCENTER_HA=' << ha_enabled.to_s << "\n"

        str_info << monitor_resource_pools(mhz_core)

        raise 'vCenter cluster health is on red, check issues on vCenter' \
            if str_info.include?('STATUS=red')

        str_info
    end

    def monitor_resource_pools(mhz_core)
        @rp_list = @cluster.get_resource_pool_list

        view = @vi_client.vim.serviceContent.viewManager
                         .CreateContainerView({ container: @cluster.item,
                                                type: ['ResourcePool'],
                                                recursive: true })

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

        rps.each do |ref, info|
            # CPU
            # cpu_expandable
            if info['config.cpuAllocation.expandableReservation']
                cpu_expandable = 'YES'
            else
                cpu_expandable = 'NO'
            end
            # cpu_limit
            if info['config.cpuAllocation.limit'] == '-1'
                cpu_limit = 'UNLIMITED'
            else
                cpu_limit = info['config.cpuAllocation.limit']
            end
            cpu_reservation = info['config.cpuAllocation.reservation']
            cpu_num = cpu_reservation.to_f / mhz_core
            cpu_shares_level = info['config.cpuAllocation.shares.level']
            cpu_shares = info['config.cpuAllocation.shares.shares']

            # MEMORY
            # mem_expandable
            if info['config.memoryAllocation.expandableReservation']
                mem_expandable = 'YES'
            else
                mem_expandable = 'NO'
            end
            # mem_limit
            if info['config.memoryAllocation.limit'] == '-1'
                mem_limit = 'UNLIMITED'
            else
                mem_limit = info['config.memoryAllocation.limit']
            end
            mem_reservation = info['config.memoryAllocation.reservation'].to_f
            mem_shares_level = info['config.memoryAllocation.shares.level']
            mem_shares = info['config.memoryAllocation.shares.shares']

            rp_name = rp_list.select {|item| item[:ref] == ref }.first[:name] \
                rescue ''

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

        hosts.each do |_ref, info|
            next if info['runtime.connectionState'] != 'connected'

            total_cpu = info['summary.hardware.numCpuCores'] * 100
            used_cpu  = (info['summary.quickStats.overallCpuUsage'].to_f \
                        / info['summary.hardware.cpuMhz'].to_f) * 100
            # rubocop:disable Style/FormatStringToken
            used_cpu  = format('%.2f', used_cpu).to_f # Trim precission
            # rubocop:enable Style/FormatStringToken
            free_cpu  = total_cpu - used_cpu

            total_memory = info['summary.hardware.memorySize']/1024
            used_memory  = info['summary.quickStats.overallMemoryUsage']*1024
            free_memory  = total_memory - used_memory

            host_info << "\nHOST=["
            host_info << 'STATE=on,'
            host_info << 'HOSTNAME="' << info['name'].to_s << '",'
            host_info << 'MODELNAME="' \
                      << info['summary.hardware.cpuModel'].to_s << '",'
            host_info << 'CPUSPEED=' \
                      << info['summary.hardware.cpuMhz'].to_s << ','
            host_info << 'MAX_CPU=' << total_cpu.to_s << ','
            host_info << 'USED_CPU=' << used_cpu.to_s << ','
            host_info << 'FREE_CPU=' << free_cpu.to_s << ','
            host_info << 'MAX_MEM=' << total_memory.to_s << ','
            host_info << 'USED_MEM=' << used_memory.to_s << ','
            host_info << 'FREE_MEM=' << free_memory.to_s
            host_info << ']'
        end

        host_info
    end

    def monitor_customizations
        customizations = @cluster['_connection'].serviceContent
                                                .customizationSpecManager.info
        text = ''

        customizations.each do |c|
            t = 'CUSTOMIZATION = [ '
            t << %Q<NAME = "#{c.name}", >
            t << %Q<TYPE = "#{c.type}" ]\n>

            text << t
        end

        text
    end

    def wilds
        str_info = ''
        # include wild instances
        vms = vms_data(@db, @vcenter_conf[:cache_expire])
        vms.each do |vm|
            vm_info = ''
            next unless vm[:id] == -1

            begin

                # Check the running flag
                running_flag = vm[:mob].config.extraConfig.select do |val|
                    val[:key] == 'opennebula.vm.running'
                end

                if !running_flag.empty? && running_flag.first
                    running_flag = running_flag[0][:value]
                end

                next if running_flag == 'no'

                vm[:import_template] = vm_to_one(vm[:mob])
                vm_info << %(
                    VM = [
                        ID="#{vm[:id]}",
                        VM_NAME="#{vm[:name]}",
                        DEPLOY_ID="#{vm[:deploy_id]}",
                    )

                vm_template64 = Base64.encode64(vm[:import_template])
                                    .gsub("\n", '')
                vm_info << "IMPORT_TEMPLATE=\"#{vm_template64}\"]"
            rescue StandardError => e
                vm_info = error_monitoring(e, vm)
            end

            str_info << vm_info
        end

        str_info

    end

    def error_monitoring(e, vm)
        error_info = ''
        vm_name = vm[:name] || nil
        vm_ref = vm[:deploy_id] || nil
        tmp_str = e.inspect
        tmp_str << e.backtrace.join("\n")

        error_info << %(
        VM = [
            VM_NAME="#{vm_name}",
            DEPLOY_ID="#{vm_ref}",
        )

        error_info << "ERROR=\"#{Base64.encode64(tmp_str).gsub("\n", '')}\"]"
    end

    #  Generates a OpenNebula IM Driver valid string with the monitor info
    def info(vm)
        used_cpu = @monitor[:used_cpu]
        used_memory = @monitor[:used_memory]
        netrx = @monitor[:netrx]
        nettx = @monitor[:nettx]
        diskrdbytes = @monitor[:diskrdbytes]
        diskwrbytes = @monitor[:diskwrbytes]
        diskrdiops = @monitor[:diskrdiops]
        diskwriops = @monitor[:diskwriops]

        if vm[:mob]
            guest_ip = vm[:mob].guest.ipAddress
            esx_host = vm[:mob].runtime.host.name.to_s
            guest_state = vm[:mob].guest.guestState.to_s
            vmware_tools = vm[:mob].guest.toolsRunningStatus.to_s
            vm_name = vm[:mob].name.to_s
            vmtools_ver = vm[:mob].guest.toolsVersion.to_s
            vmtools_verst = vm[:mob].guest.toolsVersionStatus2.to_s
        end

        # if vm[:mob]
        #     rp_name = vm[:mob][:rp_list]
        #                  .select do |item|
        #                      item[:ref] == vm[:mob]['resourcePool']._ref
        #                  end
        #                  .first[:name] rescue ''

        #     rp_name = 'Resources' if rp_name.empty?
        # else
        #     rp_name = @vm['resourcePool'].name
        # end

        str_info = ''

        str_info << 'GUEST_IP=' << guest_ip.to_s << "\n" if guest_ip

        if @guest_ip_addresses && !@guest_ip_addresses.empty?
            str_info << 'GUEST_IP_ADDRESSES="' << @guest_ip_addresses.to_s \
                        << '" '
        end

        str_info << "#{POLL_ATTRIBUTE[:cpu]}=" << used_cpu.to_s << "\n"
        str_info << "#{POLL_ATTRIBUTE[:memory]}=" << used_memory.to_s << "\n"
        str_info << "#{POLL_ATTRIBUTE[:netrx]}=" << netrx.to_s << "\n"
        str_info << "#{POLL_ATTRIBUTE[:nettx]}=" << nettx.to_s << "\n"

        str_info << 'DISKRDBYTES=' << diskrdbytes.to_s << "\n"
        str_info << 'DISKWRBYTES=' << diskwrbytes.to_s << "\n"
        str_info << 'DISKRDIOPS='  << diskrdiops.to_s  << "\n"
        str_info << 'DISKWRIOPS='  << diskwriops.to_s  << "\n"

        str_info << 'VCENTER_ESX_HOST="' << esx_host << '" ' << "\n"
        str_info << 'VCENTER_GUEST_STATE=' << guest_state << "\n"
        str_info << 'VCENTER_VM_NAME="' << vm_name << '" ' << "\n"
        str_info << 'VCENTER_VMWARETOOLS_RUNNING_STATUS=' << vmware_tools << "\n"
        str_info << 'VCENTER_VMWARETOOLS_VERSION=' << vmtools_ver << "\n"
        str_info << 'VCENTER_VMWARETOOLS_VERSION_STATUS=' \
                    << vmtools_verst << "\n"
        # str_info << 'VCENTER_RP_NAME="' << rp_name << '" '

        # I need modify this Carlos improvement.
        # @vm.info_disks.each do |disk|
        #     str_info << "DISK_#{disk[0]}_ACTUAL_PATH=\"[" <<
        #         disk[1].ds.name << '] ' << disk[1].path << '" '
        # end

        str_info
    end

    def reset_monitor
        @monitor = {
            :used_cpu    => 0,
            :used_memory => 0,
            :netrx       => 0,
            :nettx       => 0,
            :diskrdbytes => 0,
            :diskwrbytes => 0,
            :diskrdiops  => 0,
            :diskwriops  => 0
        }
    end

    # Converts the VI string state to OpenNebula state convention
    # Guest states are:
    # - poweredOff   The virtual machine is currently powered off.
    # - poweredOn    The virtual machine is currently powered on.
    # - suspended    The virtual machine is currently suspended.
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

    def vm_to_one(vm)
        str = "NAME = \"#{vm.name}\"\n"\
              "CPU = \"#{vm.config.hardware.numCPU}\"\n"\
              "vCPU = \"#{vm.config.hardware.numCPU}\"\n"\
              "MEMORY = \"#{vm.config.hardware.memoryMB}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "CONTEXT = [\n"\
              "    NETWORK = \"YES\",\n"\
              "    SSH_PUBLIC_KEY = \"$USER[SSH_PUBLIC_KEY]\"\n"\
              "]\n"\
              "VCENTER_INSTANCE_ID =\"#{@vc_uuid}\"\n"\
              "VCENTER_CCR_REF =\"#{@ccr_ref}\"\n"

        str << "IMPORT_VM_ID =\"#{vm._ref}\"\n"
        str << "DEPLOY_ID =\"#{vm._ref}\"\n"
        @state = vm_state(vm.summary.runtime.powerState)
        str << "IMPORT_STATE =\"#{@state}\"\n"

        # Get DS information
        if !vm.datastore.nil?
            vm.datastore.each do |ds|
                str << "VCENTER_DS_REF = \"#{ds._ref}\"\n"
            end
        end

        vnc_port = nil
        keymap = VCenterDriver::VIHelper.get_default("VM/TEMPLATE/GRAPHICS/KEYMAP")

        vm.config.extraConfig.select do |xtra|
            if xtra[:key].downcase=="remotedisplay.vnc.port"
                vnc_port = xtra[:value]
            end

            if xtra[:key].downcase=="remotedisplay.vnc.keymap"
                keymap = xtra[:value]
            end
        end

        if !vm.config.extraConfig.empty?
            str << "GRAPHICS = [\n"\
                   "  TYPE     =\"vnc\",\n"
            str << "  PORT     =\"#{vnc_port}\",\n" if vnc_port
            str << "  KEYMAP   =\"#{keymap}\",\n" if keymap
            str << "  LISTEN   =\"0.0.0.0\"\n"
            str << "]\n"
        end

        if !vm.config.annotation || vm.config.annotation.empty?
            str << "DESCRIPTION = \"vCenter Template imported by OpenNebula" \
                " from Cluster #{@cluster_name}\"\n"
        else
            notes = vm.config.annotation.gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        case vm.guest.guestFullName
            when /CentOS/i
                str << "LOGO=images/logos/centos.png\n"
            when /Debian/i
                str << "LOGO=images/logos/debian.png\n"
            when /Red Hat/i
                str << "LOGO=images/logos/redhat.png\n"
            when /Ubuntu/i
                str << "LOGO=images/logos/ubuntu.png\n"
            when /Windows XP/i
                str << "LOGO=images/logos/windowsxp.png\n"
            when /Windows/i
                str << "LOGO=images/logos/windows8.png\n"
            when /Linux/i
                str << "LOGO=images/logos/linux.png\n"
        end

        return str
    end

    # Return Datastores information
    def monitor_datastores
        dc = @cluster.get_dc
        ds_folder = dc.datastore_folder
        items = ds_folder.fetch!
        monitor = ''
        items.each do |ref, ds|
            monitor << "VCENTER_DS_REF=\"#{ref}\"\n"
        end
        monitor
    end

    # Get NSX Manager info detected from vCenter side.
    def nsx_info
        nsx_info = ''
        nsx_obj = {}
        # In the future add more than one nsx manager
        extension_list = @vi_client.vim.serviceContent.extensionManager
                                   .extensionList
        extension_list.each do |ext_list|
            if ext_list.key == NSXDriver::NSXConstants::NSXV_EXTENSION_LIST
                nsx_obj['type'] = NSXDriver::NSXConstants::NSXV
                urlFull = ext_list.client[0].url
                urlSplit = urlFull.split("/")
                # protocol = "https://"
                protocol = urlSplit[0] + "//"
                # ipPort = ip:port
                ipPort = urlSplit[2]
                nsx_obj['url'] = protocol + ipPort
                nsx_obj['version'] = ext_list.version
                nsx_obj['label'] = ext_list.description.label
            elsif ext_list.key == NSXDriver::NSXConstants::NSXT_EXTENSION_LIST
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

    # Converts the VI string state to OpenNebula state convention
    # Guest states are:
    # - poweredOff   The virtual machine is currently powered off.
    # - poweredOn    The virtual machine is currently powered on.
    # - suspended    The virtual machine is currently suspended.
    def vm_state(state)
        STATE_MAP[state] || 'UNKNOWN'
    end

    # monitor function used when VMM poll action is called
    def get_vm_monitor_data(vm)
        # Exclude wilds for monitor
        return '' if vm[:id] == -1

        reset_monitor

        cpu_mhz = vm[:mob].runtime.host.summary.hardware.cpuMhz.to_f

        @monitor[:used_memory] = vm[:mob].summary.quickStats.hostMemoryUsage *
                                 1024

        used_cpu = vm[:mob].summary.quickStats.overallCpuUsage.to_f / cpu_mhz
        used_cpu = (used_cpu * 100).to_s
        @monitor[:used_cpu] = format('%.2f', used_cpu).to_s

        # Check for negative values
        @monitor[:used_memory] = 0 if @monitor[:used_memory].to_i < 0
        @monitor[:used_cpu]    = 0 if @monitor[:used_cpu].to_i < 0

        guest_ip_addresses = []
        unless vm[:mob].guest.net.empty?
            vm[:mob].guest.net.each do |net|
                next unless net.ipConfig
                next if net.ipConfig.ipAddress.empty?

                net.ipConfig.ipAddress.each do |ip|
                    guest_ip_addresses << ip.ipAddress
                end
            end
        end
        @guest_ip_addresses = guest_ip_addresses.join(',')

        pm = vm[:mob]._connection.serviceInstance.content.perfManager

        provider = pm.provider_summary(vm[:mob])

        refresh_rate = provider.refreshRate

        stats = {}

        @one_vm = OpenNebula::VirtualMachine
                  .new_with_id(vm[:id], @client)

        if @one_vm['MONITORING/LAST_MON'] &&
            @one_vm['MONITORING/LAST_MON'].to_i != 0
            # Real time data stores max 1 hour. 1 minute has 3 samples
            interval = (Time.now.to_i -
                        @one_vm['MONITORING/LAST_MON'].to_i)

             # If last poll was more than hour ago get 3 minutes,
             # else calculate how many samples since last poll
            if interval > 3600
                samples = 9
            else
                samples = (interval / refresh_rate) + 1
            end
            samples > 0 ? max_samples = samples : max_samples = 1

            stats = pm.retrieve_stats(
                [vm[:mob]],
                ['net.transmitted', 'net.bytesRx', 'net.bytesTx',
                 'net.received', 'virtualDisk.numberReadAveraged',
                 'virtualDisk.numberWriteAveraged', 'virtualDisk.read',
                 'virtualDisk.write'],
                interval => refresh_rate, max_samples => max_samples
            ) rescue {}
        else
            # First poll, get at least latest 3 minutes = 9 samples
            stats = pm.retrieve_stats(
                [vm[:mob]],
                ['net.transmitted', 'net.bytesRx', 'net.bytesTx',
                 'net.received', 'virtualDisk.numberReadAveraged',
                 'virtualDisk.numberWriteAveraged', 'virtualDisk.read',
                 'virtualDisk.write'],
                interval => refresh_rate, max_samples => 9
            ) rescue {}
        end

        if !stats.empty? && !stats.first[1][:metrics].empty?
            metrics = stats.first[1][:metrics]

            nettx_kbpersec = 0
            if metrics['net.transmitted']
                metrics['net.transmitted'].each do |sample|
                    nettx_kbpersec += sample if sample > 0
                end
            end

            netrx_kbpersec = 0
            if metrics['net.bytesRx']
                metrics['net.bytesRx'].each do |sample|
                    netrx_kbpersec += sample if sample > 0
                end
            end

            read_kbpersec = 0
            if metrics['virtualDisk.read']
                metrics['virtualDisk.read'].each do |sample|
                    read_kbpersec += sample if sample > 0
                end
            end

            read_iops = 0
            if metrics['virtualDisk.numberReadAveraged']
                metrics['virtualDisk.numberReadAveraged'].each do |sample|
                    read_iops += sample if sample > 0
                end
            end

            write_kbpersec = 0
            if metrics['virtualDisk.write']
                metrics['virtualDisk.write'].each do |sample|
                    write_kbpersec += sample if sample > 0
                end
            end

            write_iops = 0
            if metrics['virtualDisk.numberWriteAveraged']
                metrics['virtualDisk.numberWriteAveraged'].each do |sample|
                    write_iops += sample if sample > 0
                end
            end

        else
            nettx_kbpersec = 0
            netrx_kbpersec = 0
            read_kbpersec = 0
            read_iops = 0
            write_kbpersec = 0
            write_iops = 0
        end

        # Accumulate values if present
        if @one_item && @one_item['MONITORING/NETTX']
            previous_nettx = @one_item['MONITORING/NETTX'].to_i
        else
            previous_nettx = 0
        end

        if @one_item && @one_item['MONITORING/NETRX']
            previous_netrx = @one_item['MONITORING/NETRX'].to_i
        else
            previous_netrx = 0
        end

        if @one_item && @one_item['MONITORING/DISKRDIOPS']
            previous_diskrdiops = @one_item['MONITORING/DISKRDIOPS'].to_i
        else
            previous_diskrdiops = 0
        end

        if @one_item && @one_item['MONITORING/DISKWRIOPS']
            previous_diskwriops = @one_item['MONITORING/DISKWRIOPS'].to_i
        else
            previous_diskwriops = 0
        end

        if @one_item && @one_item['MONITORING/DISKRDBYTES']
            previous_diskrdbytes = @one_item['MONITORING/DISKRDBYTES'].to_i
        else
            previous_diskrdbytes = 0
        end

        if @one_item && @one_item['MONITORING/DISKWRBYTES']
            previous_diskwrbytes = @one_item['MONITORING/DISKWRBYTES'].to_i
        else
            previous_diskwrbytes = 0
        end

        @monitor[:nettx] = previous_nettx +
                        (nettx_kbpersec * 1024 * refresh_rate).to_i
        @monitor[:netrx] = previous_netrx +
                        (netrx_kbpersec * 1024 * refresh_rate).to_i

        @monitor[:diskrdiops]  = previous_diskrdiops + read_iops
        @monitor[:diskwriops]  = previous_diskwriops + write_iops
        @monitor[:diskrdbytes] = previous_diskrdbytes +
                                (read_kbpersec * 1024 * refresh_rate).to_i
        @monitor[:diskwrbytes] = previous_diskwrbytes +
                                (write_kbpersec * 1024 * refresh_rate).to_i
        @monitor
    end

    def retrieve_vms_data
        # call vms_data
        vms_data(@db, @vcenter_conf[:cache_expire])
    end

    # Either return VMs info from cache db or from public_cloud
    def vms_data(db, time_limit)
        ############### Prepare for cache ##################
        # return fetch_vms_data(:with_monitoring => false) \
        #     if db.expired?(time_limit)

        # db.select_vms
        ############### Prepare for cache ##################

        fetch_vms_data(:with_monitoring => false)
    end

    def fetch_vms_data(with_monitoring: false)
        # opts common to all vms
        opts = {
            vc_uuid: @vc_uuid
        }

        # View for VMs inside this cluster
        view = @vi_client.vim.serviceContent.viewManager
                         .CreateContainerView({ container: @cluster.item,
                                                type: ['VirtualMachine'],
                                                recursive: true })

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
            'guest.net', # IP addresses as seen by guest tools,
            'guest.guestState',
            'guest.toolsVersion',
            'guest.toolsRunningStatus',
            'guest.toolsVersionStatus2', # IP addresses as seen by guest tools,
            'config.extraConfig', # VM extraconfig info.. opennebula.vm.running
            'config.hardware.numCPU',
            'config.hardware.memoryMB',
            'config.annotation',
            'datastore'
        ]

        filter_spec = RbVmomi::VIM.PropertyFilterSpec(
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

        result = pc.RetrieveProperties(:specSet => [filter_spec])

        vms = []
        result.each do |r|
            # Next if it's not a VirtualMachine
            next unless r.obj.is_a?(RbVmomi::VIM::VirtualMachine)

            # Next if it's a template
            next if r.obj.config.template

            one_uuid = r.obj._ref + @vc_uuid
            @vm = VCenterDriver::VirtualMachine
                  .new_from_ref(@vi_client, r.obj._ref, r.obj.name, opts)
            one_id = @vm.get_vm_id

            vm = { :uuid => one_uuid,
                   :id => one_id,
                   :name => "#{r.obj.name} - #{@cluster.item.name}",
                   :deploy_id => r.obj._ref,
                   :state => vm_state(r.obj.summary.runtime.powerState),
                   :type => @hypervisor,
                   :mob =>  r.obj }

            if with_monitoring
                vm[:monitor] = get_vm_monitor_data(vm)
            end
            vms << vm
        end

        view.DestroyView # Destroy the view

        # store to db
        @db.insert(vms)

        vms
    end

    #  Returns VM monitor information
    #
    #  @return [String]
    def probe_vm_monitor
        vms = fetch_vms_data(:with_monitoring => true)

        data = ''
        vms.each do |vm|
            next if vm[:monitor].empty?

            mon_s64 = Base64.strict_encode64(info(vm))
            data << "VM = [ ID=\"#{vm[:id]}\", "
            data << "DEPLOY_ID=\"#{vm[:deploy_id]}\", "
            data << "MONITOR=\"#{mon_s64}\"]\n"
        end

        data
    end

end

# ------------------------------------------------------------------------------
# This class implements a simple local cache to store VM information
# ------------------------------------------------------------------------------
class InstanceCache

    def initialize(path)
        @db = SQLite3::Database.new(path)

        bootstrap
    end

    def execute_retry(query, tries = 5, tsleep = 0.5)
        i=0
        while i < tries
            begin
                return @db.execute(query)
            rescue SQLite3::BusyException
                i += 1
                sleep tsleep
            end
        end
    end

    # TODO: document DB schema
    def bootstrap
        sql = 'CREATE TABLE IF NOT EXISTS vms(uuid VARCHAR(128) PRIMARY KEY,'
        sql << ' id INTEGER, name VARCHAR(128), deploy_id VARCHAR(128),'
        sql << ' state VARCHAR(128), type VARCHAR(128))'
        execute_retry(sql)

        sql = 'CREATE TABLE IF NOT EXISTS timestamp(ts INTEGER PRIMARY KEY)'
        execute_retry(sql)
    end

    def insert(instances)
        execute_retry('DELETE from vms')
        instances.each do |i|
            sql = 'INSERT INTO vms VALUES ('
            sql << "\"#{i[:uuid]}\", "
            sql << "\"#{i[:id]}\", "
            sql << "\"#{i[:name]}\", "
            sql << "\"#{i[:deploy_id]}\", "
            sql << "\"#{i[:state]}\", "
            sql << "\"#{i[:type]}\")"

            execute_retry(sql)
        end

        execute_retry('DELETE from timestamp')
        execute_retry("INSERT INTO timestamp VALUES (#{Time.now.to_i})")
    end

    def select_vms
        vms = []
        execute_retry('SELECT * from vms').each do |vm|
            vms << Hash[[:uuid, :id, :name, :deploy_id, :state, :type].zip(vm)]
        end

        vms
    end

    # return true if the cache data expired
    #
    #   @param[Integer] time_limit time to expire cache data
    #
    #   @return[Boolean]
    def expired?(time_limit)
        ts = execute_retry('SELECT * from timestamp')

        ts.empty? || (Time.now.to_i - time_limit > ts.first.first)
    end

end


############################################################################
#  Module Interface
#  Interface for probe_db - VirtualMachineDB
############################################################################
module DomainList

    def self.state_info(name, id)
        vcm = VcenterMonitor.new(id)

        vms = vcm.retrieve_vms_data
        info = {}
        vms.each do |vm|
            info[vm[:uuid]] = { :id     => vm[:id],
                                :uuid   => vm[:uuid],
                                :name   => vm[:deploy_id],
                                :state  => vm[:state],
                                :hyperv => 'vcenter' }
        end

        info
    end

end
