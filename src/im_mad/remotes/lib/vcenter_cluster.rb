#--------------------------------------------------------------------------- #
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

require 'opennebula'
require 'vcenter_driver'
require 'logger'
require 'open3'

def unindent(s)
    m = s.match(/^(\s*)/)
    spaces = m[1].size
    s.gsub!(/^ {#{spaces}}/, '')
end

################################################################################
# Logger
################################################################################
$logger = Logger.new(
    STDERR,
    :level =>
        VCenterDriver::CONFIG[:debug_information] ? Logger::DEBUG : Logger::INFO,
    :datetime_format => '%Y-%m-%d %H:%M:%S',
    :formatter => proc {|severity, datetime, _progname, msg|
        "#{datetime} [#{severity}]: #{msg}\n"
    }
)

#-------------------------------------------------------------------------------
#  Set of vcenter clusters each one representing a opennebula host
#  DataModel
#    @vic    : VCenterDriver::VIClient,
#    @cluster: VCenterDriver::ClusterComputeResource,
#    @host   : OpenNebula::Host
#    @last_system_host:  Timer for last system host message
#    @last_monitor_host: Timer for last monitor host message
#    @last_monitor_vm:   Timer for last monitor VM
#-------------------------------------------------------------------------------
class Cluster

    #---------------------------------------------------------------------------
    # Constants
    #  CLUSTER_PROPERTIES: ESX cluster properties
    #  RP_PROPERTIES: Resource pool properties
    #  VM_STATE_PROPERTIES: Properties for VM state changes
    #  STATE_MAP: vCenter to OpenNebula State mapping
    #---------------------------------------------------------------------------
    CLUSTER_PROPERTIES = [
        'summary.totalCpu',
        'summary.numCpuCores',
        'summary.effectiveCpu',
        'summary.totalMemory',
        'summary.effectiveMemory',
        'summary.numHosts',
        'summary.numEffectiveHosts',
        'summary.overallStatus',
        'configuration.drsConfig.enabled',
        'configuration.dasConfig.enabled'
    ].freeze

    RP_PROPERTIES = [
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
    ].freeze

    VM_STATE_PROPERTIES = [
        'name', # VM name
        'summary.runtime.powerState' # VM power state
    ].freeze

    VM_SYNC_TIME = 300
    VM_MISSING_STATE = 'POWEROFF'.freeze

    STATE_MAP = {
        'poweredOn'  => 'RUNNING',
        'suspended'  => 'POWEROFF',
        'poweredOff' => 'POWEROFF'
    }.freeze

    #---------------------------------------------------------------------------
    #
    #---------------------------------------------------------------------------
    def initialize(hid, onec)
        @host = OpenNebula::Host.new_with_id(hid, onec)
        @onec = onec
        @hid = hid

        rc = @host.info(true)

        if OpenNebula.is_error?(rc)
            raise "Could not get hosts information - #{rc.message}"
        end

        @monitordc = nil

        connect_vcenter
    end

    #-----------------------------------------------------------------------
    #  VI Client Initialization
    #-----------------------------------------------------------------------
    def connect_vcenter
        # Avoid leaving open sessions to vCenter
        @vic.close_connection if @vic
        @vic     = VCenterDriver::VIClient.new(connection, @hid)
        @cluster = VCenterDriver::ClusterComputeResource
                   .new_from_ref(connection[:ccr], @vic)
    end

    #---------------------------------------------------------------------------
    #  HOST PROBES
    #    - system_host:  monitor "static" vCenter cluster information
    #    - monitor_host:  monitor dynamic vCenter cluster information
    #---------------------------------------------------------------------------
    def system_host
        monitor_str  = cluster_info
        monitor_str += hosts_info
        monitor_str += customizations_info
        monitor_str += datastore_info
        monitor_str += vms_info('wild')
        monitor_str += nsx_info_vcenter
        monitor_str += nsx_info

        monitor_str
    end

    def monitor_host
        cluster_monitoring
    end

    # Try connectivity to a vCenter instance and close the connection
    def beacon_host
        @vic.vim.serviceContent.about.instanceUuid
        Time.now.to_s
    end

    #---------------------------------------------------------------------------
    #  VM PROBES
    #    - state_vm:  monitor vm state changes
    #    - monitor_vm:  monitor dynamic VM information
    #    - vcenter_vms_state: retrieves state hash consulting vCenter
    #---------------------------------------------------------------------------
    def monitor_vm
        vms_info('one')
    end

    # Given a deploy_id (vm_ref in vCenter) and a state, check if a VM
    # has changed state compared with the latest known state
    def need_state_sync?(vm_ref, state)
        !@previous_vm_states[vm_ref] or !@previous_vm_states[vm_ref][:state].eql? state
    end

    # Return monitoring string containig the state of VMs
    def state_vm
        current_vm_states = vcenter_vms_state

        # Check if we need a full sync
        full_sync = false
        now = Time.now.to_i
        if @last_sync.nil? || ((now - @last_sync) > VM_SYNC_TIME)
            full_sync = true
            @last_sync = now
        end

        str_info = ''
        str_info << "SYNC_STATE=yes\nMISSING_STATE=#{VM_MISSING_STATE}\n" if full_sync

        current_vm_states.each do |_, vm|
            vm_ref = vm[:deploy_id]

            if full_sync || need_state_sync?(vm_ref, vm[:state])
                str_info << "VM = [ ID=\"#{vm[:id]}\", "
                str_info << "DEPLOY_ID=\"#{vm[:deploy_id]}\", STATE=\"#{vm[:state]}\" ]\n"
            end
        end

        @previous_vm_states = current_vm_states

        str_info
    end

    # Retrieve all known VM states from vCenter
    def vcenter_vms_state
        vc_uuid = @vic.vim.serviceContent.about.instanceUuid

        view = @vic.vim
                   .serviceContent
                   .viewManager
                   .CreateContainerView(
                       {
                           :container => @cluster.item,
                            :type => ['VirtualMachine'],
                            :recursive => true
                       }
                   )

        pc   = @vic.vim.serviceContent.propertyCollector

        result = pc.RetrieveProperties(
            :specSet => [
                RbVmomi::VIM.PropertyFilterSpec(
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
                        {
                            :type    => 'VirtualMachine',
                            :pathSet => VM_STATE_PROPERTIES
                        }
                    ]
                )
            ]
        )

        vms_hash = {}

        result.each do |r|
            next unless r.obj.is_a?(RbVmomi::VIM::VirtualMachine)

            vms_hash[r.obj._ref + '_' + vc_uuid] = r.to_hash
        end

        view.DestroyView

        vmpool = OpenNebula::VirtualMachinePool.new(@onec)
        rc     = vmpool.info(-2)

        return {} if OpenNebula.is_error?(rc)

        vms = {}
        vms_hash.each do |vm_ref, info|
            one_id = -1

            # Add OR to retrieve VMs that are using old deploy ID
            ids    = vmpool.retrieve_xmlelements(
                "/VM_POOL/VM[(DEPLOY_ID = '#{vm_ref}')" \
                ' or ' \
                "(DEPLOY_ID = '#{vm_ref.split('_')[0]}')]"
            )

            ids.select! do |vm|
                hid = vm['HISTORY_RECORDS/HISTORY/HID']

                if hid
                    hid.to_i == @hid
                else
                    false
                end
            end

            one_id = ids[0]['ID'] if ids[0]
            next if one_id.to_i == -1

            vms[vm_ref] = {
                :id        => one_id,
                :name      => "#{info['name']} - #{@cluster.item.name}",
                :deploy_id => vm_ref,
                :state     => STATE_MAP[info['summary.runtime.powerState']] || 'UNKNOWN'
            }
        end

        vms
    end

    #---------------------------------------------------------------------------
    #---------------------------------------------------------------------------
    #  MONITOR INTERFACE & FUNCTIONS
    #---------------------------------------------------------------------------
    #---------------------------------------------------------------------------

    private

    def connection
        vhost = @host['TEMPLATE/VCENTER_HOST']
        vuser = @host['TEMPLATE/VCENTER_USER']
        vpass = @host['TEMPLATE/VCENTER_PASSWORD']
        vccr  = @host['TEMPLATE/VCENTER_CCR_REF']
        vrp   = @host['TEMPLATE/VCENTER_RESOURCE_POOL']
        vport = @host['TEMPLATE/VCENTER_PORT']

        if vhost.nil? || vuser.nil? || vpass.nil? || vccr.nil?
            raise 'Missing vCenter connection parameters in host'
        end

        connection = {
            :host     => vhost,
            :user     => vuser,
            :password => vpass,
            :rp       => vrp,
            :ccr      => vccr
        }

        connection[:port] = vport if vport
        connection
    end

    def cluster_monitoring
        metrics = @cluster.item.collect(*(CLUSTER_PROPERTIES[1]))
        num_cpu_cores = metrics[0].to_f

        resource_usage_summary = @cluster.item.GetResourceUsage()

        real_total_cpu = resource_usage_summary.cpuCapacityMHz.to_f
        real_used_cpu = resource_usage_summary.cpuUsedMHz.to_f
        total_memory  = resource_usage_summary.memCapacityMB.to_i
        used_mem      = resource_usage_summary.memUsedMB.to_i

        if num_cpu_cores > 0
            total_cpu = num_cpu_cores * 100
            used_cpu = (total_cpu * real_used_cpu) / real_total_cpu
        else
            total_cpu = 0
            used_cpu = 0
        end

        free_cpu = total_cpu - used_cpu

        free_mem = total_memory - used_mem

        unindent(<<-EOS)
            HYPERVISOR = vcenter
            USEDMEMORY = "#{used_mem * 1024}"
            FREEMEMORY = "#{free_mem}"
            USEDCPU    = "#{used_cpu.to_i}"
            FREECPU    = "#{free_cpu.to_i}"
        EOS
    end

    def cluster_info
        metrics = @cluster.item.collect(*CLUSTER_PROPERTIES)

        total_cpu      = metrics[0].to_f
        num_cpu_cores  = metrics[1].to_f
        total_memory   = metrics[3].to_i
        num_hosts      = metrics[5]
        num_eff_hosts  = metrics[6]
        overall_status = metrics[7]
        drs_enabled    = metrics[8]
        ha_enabled     = metrics[9]

        if num_cpu_cores > 0
            mhz_core = total_cpu / num_cpu_cores
        else
            mhz_core = 0
        end

        total_cpu = num_cpu_cores * 100
        total_mem = total_memory / 1024

        str_info = unindent(<<-EOS)
            HYPERVISOR   = vcenter
            VCENTER_NAME = "#{@cluster['name'].tr(' ', '_')}"
            STATUS       = "#{overall_status}"
            TOTALHOST    = "#{num_hosts}"
            AVAILHOST    = "#{num_eff_hosts}"
            CPUSPEED     = "#{mhz_core}"
            TOTALCPU     = "#{total_cpu}"
            TOTALMEMORY  = "#{total_mem}"
            VCENTER_DRS  = "#{drs_enabled}"
            VCENTER_HA   = "#{ha_enabled}"
        EOS

        str_info << resource_pool_info(mhz_core)

        if str_info.include?('STATUS=red')
            raise 'vCenter cluster health is red, check vCenter'
        end

        str_info
    end

    #---------------------------------------------------------------------------
    #
    #---------------------------------------------------------------------------
    def resource_pool_info(mhz_core)
        rp_list = @cluster.get_resource_pool_list

        view =
            @vic.vim.serviceContent.viewManager.CreateContainerView(
                {
                    :container => @cluster.item,
                    :type => ['ResourcePool'],
                    :recursive => true
                }
            )

        pc     = @vic.vim.serviceContent.propertyCollector
        result = pc.RetrieveProperties(
            :specSet => [
                RbVmomi::VIM.PropertyFilterSpec(
                    :objectSet => [
                        :obj       => view,
                        :skip      => true,
                        :selectSet => [
                            RbVmomi::VIM.TraversalSpec(
                                :name => 'traverseEntities',
                                :type => 'ContainerView',
                                :path => 'view',
                                :skip => false
                            )
                        ]
                    ],
                    :propSet => [{
                        :type    => 'ResourcePool',
                        :pathSet => RP_PROPERTIES
                    }]
                )
            ]
        )

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
            #-------------------------------------------------------------------
            # CPU
            #-------------------------------------------------------------------
            expandable = info['config.cpuAllocation.expandableReservation']
            limit      = info['config.cpuAllocation.limit']

            if expandable
                cpu_expandable = 'YES'
            else
                cpu_expandable = 'NO'
            end

            if limit == '-1'
                cpu_limit = 'UNLIMITED'
            else
                cpu_limit = limit
            end

            cpu_reservation  = info['config.cpuAllocation.reservation']
            cpu_num          = cpu_reservation.to_f / mhz_core
            cpu_shares_level = info['config.cpuAllocation.shares.level']
            cpu_shares       = info['config.cpuAllocation.shares.shares']

            #-------------------------------------------------------------------
            # MEMORY
            #-------------------------------------------------------------------
            expandable = info['config.memoryAllocation.expandableReservation']
            limit      = info['config.memoryAllocation.limit']

            if expandable
                mem_expandable = 'YES'
            else
                mem_expandable = 'NO'
            end

            if limit == '-1'
                mem_limit = 'UNLIMITED'
            else
                mem_limit = limit
            end

            mem_reservation  = info['config.memoryAllocation.reservation'].to_f
            mem_shares_level = info['config.memoryAllocation.shares.level']
            mem_shares       = info['config.memoryAllocation.shares.shares']

            begin
                rp_name = rp_list.select do |item|
                    item[:ref] == ref
                end.first[:name]
            rescue StandardError
                rp_name = 'Resources'
            end

            rp_info << unindent(<<-EOS)
                VCENTER_RESOURCE_POOL_INFO = [
                    NAME            = "#{rp_name}",
                    CPU_EXPANDABLE  = #{cpu_expandable},
                    CPU_LIMIT       = #{cpu_limit},
                    CPU_RESERVATION = #{cpu_reservation},
                    CPU_RESERVATION_NUM_CORES=#{cpu_num},
                    CPU_SHARES       = #{cpu_shares},
                    CPU_SHARES_LEVEL = #{cpu_shares_level},
                    MEM_EXPANDABLE   = #{mem_expandable},
                    MEM_LIMIT        = #{mem_limit},
                    MEM_RESERVATION  = #{mem_reservation},
                    MEM_SHARES       = #{mem_shares},
                    MEM_SHARES_LEVEL = #{mem_shares_level}
                ]
            EOS
        end

        view.DestroyView

        rp_info
    end

    #---------------------------------------------------------------------------
    #
    #---------------------------------------------------------------------------
    # rubocop:disable Style/FormatStringToken
    def hosts_info
        host_info = ''
        hosts     = {}

        @cluster.filter_hosts.each do |r|
            hp = r.to_hash
            hosts[r.obj._ref] = hp if r.obj.is_a?(RbVmomi::VIM::HostSystem)
        end

        hosts.each do |_ref, info|
            next if info['runtime.connectionState'] != 'connected'

            total_cpu = info['summary.hardware.numCpuCores'] * 100
            used_cpu  = (info['summary.quickStats.overallCpuUsage'].to_f \
                        / info['summary.hardware.cpuMhz'].to_f) * 100
            used_cpu  = format('%.2f', used_cpu).to_f
            free_cpu  = total_cpu - used_cpu

            total_memory = info['summary.hardware.memorySize']/1024
            used_memory  = info['summary.quickStats.overallMemoryUsage']*1024
            free_memory  = total_memory - used_memory

            host_info << unindent(<<-EOS)
                HOST = [
                    STATE = on,
                    HOSTNAME  = "#{info['name']}",
                    MODELNAME = "#{info['summary.hardware.cpuModel']}",
                    CPUSPEED  = "#{info['summary.hardware.cpuMhz']}",
                    MAX_CPU   = "#{total_cpu}",
                    USED_CPU  = "#{used_cpu}",
                    FREE_CPU  = "#{free_cpu}",
                    MAX_MEM   = "#{total_memory}",
                    USED_MEM  = "#{used_memory}",
                    FREE_MEM  = "#{free_memory}"
                ]
            EOS
        end

        host_info
    end
    # rubocop:enable Style/FormatStringToken

    #---------------------------------------------------------------------------
    #
    #---------------------------------------------------------------------------
    def customizations_info
        customs = @cluster['_connection'].serviceContent
                                         .customizationSpecManager
                                         .info
        c_str = ''

        customs.each do |c|
            c_str << unindent(<<-EOS)
                CUSTOMIZATION = [
                    NAME = "#{c.name}",
                    TYPE = "#{c.type}"
                ]
            EOS
        end

        c_str
    end

    #---------------------------------------------------------------------------
    #
    # TODO: Add more than one nsx managers
    #---------------------------------------------------------------------------
    def nsx_info_vcenter
        @nsx_obj = {}

        elist = @vic.vim.serviceContent.extensionManager.extensionList

        elist.each do |ext_list|
            case ext_list.key
            when NSXDriver::NSXConstants::NSXV_EXTENSION_LIST
                parts = ext_list.client[0].url.split('/')

                protocol = parts[0] + '//'
                ip_port  = parts[2]

                @nsx_obj['type']    = NSXDriver::NSXConstants::NSXV
                @nsx_obj['url']     = protocol + ip_port
                @nsx_obj['version'] = ext_list.version
                @nsx_obj['label']   = ext_list.description.label

            when NSXDriver::NSXConstants::NSXT_EXTENSION_LIST
                @nsx_obj['type']    = NSXDriver::NSXConstants::NSXT
                @nsx_obj['url']     = ext_list.server[0].url
                @nsx_obj['version'] = ext_list.version
                @nsx_obj['label']   = ext_list.description.label
            else
                next
            end
        end

        return '' if @nsx_obj.empty?

        unindent(<<-EOS)
            NSX_MANAGER ="#{@nsx_obj['url']}"
            NSX_TYPE    ="#{@nsx_obj['type']}"
            NSX_VERSION ="#{@nsx_obj['version']}"
            NSX_LABEL   ="#{@nsx_obj['label']}"
        EOS
    end

    #---------------------------------------------------------------------------
    # Get a list vCenter datastores morefs
    #---------------------------------------------------------------------------
    def datastore_info
        dc = @cluster.datacenter
        ds = dc.datastore_folder

        ds_info = ''

        ds.fetch!.each do |ref, _ds|
            ds_info << "VCENTER_DS_REF=\"#{ref}\"\n"
        end

        ds_info
    end

    #---------------------------------------------------------------------------
    # Return monitor string
    #   'wilds': VMs in vCenter but not in OpenNebula
    #   'ones' : VMs in OpenNebula
    #---------------------------------------------------------------------------
    def vms_info(vm_type)
        cmd = "#{File.dirname(__FILE__)}/vcenter_monitor_vms.rb #{@host.id} #{vm_type} \"#{connection[:ccr]}\""
        str_info, _stderr, _status = Open3.capture3(cmd)
        str_info
    end

    #---------------------------------------------------------------------------
    # Return NSX info monitoring
    #---------------------------------------------------------------------------
    def nsx_info
        create_nsx_client = true
        nsx_manager = @host['TEMPLATE/NSX_MANAGER'] || @nsx_obj['url']
        nsx_user = @host['TEMPLATE/NSX_USER']
        nsx_password = @host['TEMPLATE/NSX_PASSWORD']
        nsx_type = @host['TEMPLATE/NSX_TYPE'] || @nsx_obj['type']

        [nsx_manager, nsx_user, nsx_password, nsx_type].each do |v|
            next if !v.nil? && !v.empty?

            create_nsx_client = false
            break
        end

        if create_nsx_client
            @nsx_client = NSXDriver::NSXClient.new_child(nsx_manager,
                                                         nsx_user,
                                                         nsx_password,
                                                         nsx_type)
        end

        return '' if @nsx_client.nil?

        #-----------------------------------------------------------------------
        # Transport Zones
        #-----------------------------------------------------------------------
        tz_object = NSXDriver::TransportZone.new_child(@nsx_client)

        nsx_info = 'NSX_TRANSPORT_ZONES = ['

        case nsx_type
        when NSXDriver::NSXConstants::NSXV
            tzs = tz_object.tzs
            tzs.each do |tz|
                nsx_info << "#{tz.xpath('name').text}=\"#{tz.xpath('objectId').text}\","
            end

        when NSXDriver::NSXConstants::NSXT
            tzs = tz_object.tzs
            tzs['results'].each do |tz|
                nsx_info << "#{tz['display_name']}=\"#{tz['id']}\","
            end

        else
            raise "Unknown PortGroup type #{nsx_type}"
        end

        nsx_info.chomp!(',')

        nsx_info << ']'
    end

end

#---------------------------------------------------------------------------
#  Set of vcenter clusters each one representing a opennebula host
#  DataModel
#
#  @clusters = {
#     host_id => {
#       :cluster  => VCenterMonitor::Cluster,
#       :error    => String (last error if any)
#     },
#     ....
#   }
#
#---------------------------------------------------------------------------
class ClusterSet

    #---------------------------------------------------------------------------
    #  Constants
    #    CLUSTER_PROBES: to be executed. Each Cluster needs to respond to this
    #    methods and a correspnding UDP message of that type will be sent
    #---------------------------------------------------------------------------
    CLUSTER_PROBES = [
        :system_host,
        :monitor_host,
        :state_vm,
        :monitor_vm,
        :beacon_host
    ].freeze

    #---------------------------------------------------------------------------
    #
    #---------------------------------------------------------------------------
    def initialize
        @mutex  = Mutex.new
        @client = OpenNebula::Client.new

        @clusters = {}
    end

    # Add a host by id, it access OpenNebula to get connection parameters
    def add(hid, conf)
        return if @mutex.synchronize { @clusters.key?(hid) }

        begin
            cluster = Cluster.new(hid, @client)
            error   = ''
        rescue StandardError => e
            cluster = nil
            error   = e.message

            if !conf.nil?
                mdc = MonitorClient.new(conf[:address], conf[:port], hid)
                mdc.beacon_host_udp(false, error)
            end
        end

        add_host(hid, cluster, error)

        $logger.info("Registered host #{hid} #{error}")
    end

    # Del a host from the @cluster hash
    def del(hid)
        @mutex.synchronize do
            @clusters.delete(hid)
        end

        $logger.info("Unregistered host #{hid}")
    end

    # This function should be called within a synchronized block
    def on_cluster(hid, &block)
        return unless @clusters[hid] && @clusters[hid][:cluster]

        block.call(@clusters[hid][:cluster])
    end

    # One-time initialization of host pool
    def bootstrap
        hpool = OpenNebula::HostPool.new(@client)
        rc    = hpool.info

        if OpenNebula.is_error?(rc)
            # Wait 5 seconds and retry
            sleep 5
            rc = hpool.info
            if OpenNebula.is_error?(rc)
                raise "Could not get hosts information - #{rc.message}"
            end
        end

        $logger.info('Bootstraping list of clusters')

        hpool.each do |h|
            next if h['IM_MAD'] != 'vcenter' || h['STATE'] == '8' # offline

            $logger.info("Adding host #{h.name} (#{h.id})")

            add(h.id, nil)
        end
    end

    #---------------------------------------------------------------------------
    #  TODO: Error signaling
    #    [:cluster] is nil -> error creating clients, only? Send [:error]?
    #---------------------------------------------------------------------------
    def monitor(conf)
        @mutex.synchronize do
            # Get current server raft status, to skip monitor being FOLLOWER
            rc = @client.call('zone.raftstatus')

            if OpenNebula.is_error?(rc)
                # Try to reinit the authentication, in case of authentication error
                @client = OpenNebula::Client.new if rc.errno == OpenNebula::Error::EAUTHENTICATION

                next
            end

            xml_e = OpenNebula::XMLElement.build_xml(
                rc,
                'RAFT'
            )

            xml = OpenNebula::XMLElement.new(xml_e)

            # 0 -> SOLO
            # 3 -> LEADER
            next unless %w[0 3].include?(xml['//STATE'])

            @clusters.each do |id, c|
                if c[:cluster].nil?
                    c[:cluster] = Cluster.new(id, @client) rescue nil
                end

                if c[:monitordc].nil?
                    next if conf[:address].nil? || conf[:port].nil?

                    c[:monitordc] = MonitorClient.new(conf[:address],
                                                      conf[:port],
                                                      id)
                end

                $logger.info("Monitoring cluster #{id}")

                CLUSTER_PROBES.each do |probe_name|
                    begin
                        # Check if the last monitoring time is older than the
                        # configured monitoring frequency for the probe
                        last_mon = c["last_#{probe_name}".to_sym]
                        probe_frequency = conf[probe_name].to_i
                        next unless (Time.now.to_i - last_mon) > probe_frequency

                        # Refresh the vCenter connection
                        # in the least frequent probe
                        if probe_name.eql?(:system_host)
                            c[:cluster].connect_vcenter
                        end

                        $logger.info("\tRunning #{probe_name} probe")

                        probe_result = c[:cluster].send(probe_name).strip
                        next if probe_result.empty?

                        success = true
                    rescue StandardError => e
                        success = false
                        probe_result = e.message
                    end

                    $logger.debug("\tResult(#{success})\n#{probe_result}\n")

                    c[:monitordc].send("#{probe_name}_tcp".to_sym,
                                       success,
                                       probe_result)

                    c["last_#{probe_name}".to_sym] = Time.now.to_i
                end
            end
        end
    end

    private

    # Internal method to access @cluster hash
    def add_host(id, cluster, error)
        @mutex.synchronize do
            @clusters[id] = {
                :cluster           => cluster,
                :error             => error,
                :monitordc         => nil,
                :last_system_host  => 0,
                :last_monitor_host => 0,
                :last_beacon_host  => 0,
                :last_monitor_vm   => 0,
                :last_state_vm     => 0
            }
        end
    end

end
