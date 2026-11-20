#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

require 'open3'
require 'base64'
require 'json'
require 'yaml'
require 'rexml/document'
require 'sqlite3'
require 'csv'
require 'shellwords'
require 'libvirt'

require_relative 'process_list'
require_relative 'domain'

ENV['LANG'] = 'C'
ENV['LC_ALL'] = 'C'

#-------------------------------------------------------------------------------
#  KVM Monitor Module. This module provides basic functionality to query
#  libvirt and load KVM configuration in remotes/etc/vmm/kvm/kvmrc
#
#  The load_conf should be called before querying libvirt
#-------------------------------------------------------------------------------
module KVM

    CONF = {
        'LIBVIRT_URI' => 'qemu:///system'
    }

    QEMU_GA = {
        :enabled => false,
        :commands => {
            :vm_qemu_ping => {
                :command => "one-$vm_id \'{\"execute\":\"guest-ping\"}\' --timeout 5"
            }
        }
    }

    # Variables to read from kvmrc
    CONF_VARS = ['LIBVIRT_URI']

    # Libvirt connection, shared by all the queries of a probe run. Every new
    # connection consumes two libvirtd timer IDs, and libvirtd stops accepting
    # connections once it has handed out 2^31 of them (OpenNebula/one#8209).
    def self.conn
        @conn ||= Libvirt.open(CONF['LIBVIRT_URI'])
    end

    # @return [Hash] active Libvirt::Domain by name
    def self.domains
        @domains ||= conn.list_all_domains(Libvirt::Connect::LIST_DOMAINS_ACTIVE)
                         .to_h {|domain| [domain.name, domain] }
    end

    # Send a command to the QEMU guest agent of a domain
    # @param name [String] of the domain
    # @param json [String] guest agent command
    # @param timeout [Integer] seconds to wait for the agent, forever by default
    # @return [String] guest agent response (JSON)
    def self.agent_command(name, json, timeout = Libvirt::Domain::QEMU_AGENT_COMMAND_BLOCK)
        domains[name].qemu_agent_command(json, timeout)
    end

    # Syntax of the commands in guestagent.conf, the arguments of virsh
    # qemu-agent-command optionally piped to a shell command:
    #   <domain> '<json>' [--timeout <seconds>] [| <shell command>]
    AGENT_CONF_COMMAND = /\A\s*(\S+)\s+'([^']*)'\s*(?:--timeout\s+(\d+))?\s*(?:\|(.*))?\z/m

    # Run a guest agent command of guestagent.conf
    # @return [Array] output, error message, success
    def self.agent_conf_command(command)
        name, json, timeout, filter = command.match(AGENT_CONF_COMMAND)&.captures

        return ['', "Invalid guest agent command: #{command}", false] unless name
        return ['', "Domain not found: #{name}", false] unless domains[name]

        text =timeout ? agent_command(name, json, timeout.to_i) : agent_command(name, json)

        return [text, '', true] unless filter

        text, e, s = Open3.capture3(filter, :stdin_data => text)

        [text, e, s.success?]
    rescue Libvirt::Error => e
        ['', e.message, false]
    end

    # Loads the rc variables and overrides the default values
    def self.load_conf
        file = "#{__dir__}/../../etc/vmm/kvm/kvmrc"

        env   = `. "#{file}"; env`
        lines = env.split("\n")

        CONF_VARS.each do |var|
            lines.each do |line|
                if (a = line.match(/^(#{var})=(.*)$/))
                    CONF[var] = a[2]
                    break
                end
            end
        end

        ga_conf_path = "#{__dir__}/../../etc/im/kvm-probes.d/guestagent.conf"
        QEMU_GA.merge!(YAML.load_file(ga_conf_path))

        QEMU_GA[:commands].each_key do |ga_info|
            Domain::MONITOR_KEYS << ga_info
        end

        # Normalize string command syntax to filtering syntax with all empty filters
        QEMU_GA[:commands].transform_values! do |value|
            value = { :command => value } if value.is_a?(String)
            { :os_ids => [], :os_types => [], :os_machines => [], :os_versions => [] }.merge(value)
        end
    rescue StandardError
    end

end

#-------------------------------------------------------------------------------
#  Extends ProcessList module defined at process_list.rb
#-------------------------------------------------------------------------------
module ProcessList

    #  Number of seconds to average process usage
    AVERAGE_SECS = 1

    # Regex used to retrieve VMs process info
    PS_REGEX = /-uuid ([a-z0-9\-]+) /

    def self.retrieve_names
        KVM.domains.keys
    rescue Libvirt::Error
        raise 'Error retrieving names. Check Libvirtd service is up.'
    end

end

#-------------------------------------------------------------------------------
#  This class represents a qemu domain, information includes:
#    @vm[:name]
#    @vm[:id] from one-<id>, -1 if wild
#    @vm[:uuid]
#    @vm[:deploy_id]
#    @vm[:reason] libvirt reason for the paused state
#    @vm[:state] OpenNebula state
#    @vm[:netrx]
#    @vm[:nettx]
#    @vm[:diskrdbytes]
#    @vm[:diskwrbytes]
#    @vm[:diskrdiops]
#    @vm[:diskwriops]
#    @vm[ga_info] quemu guest agent information. symbols are dynamic based on guestagent.conf
#
#  This class uses the KVM and ProcessList interface
#-------------------------------------------------------------------------------
class Domain < BaseDomain

    DB_PATH = '/var/lib/one-remotes-db'

    def initialize(name)
        super(name)

        @predictions = true

        path = "#{__dir__}/../../etc/im/kvm-probes.d/forecast.conf"
        conf = YAML.load_file(path)

        @db_retention = Integer(conf['vm']['db_retention'])
    rescue StandardError
        @db_retention = 4
    end

    # Gets the identity and state of the domain. This is all the state probe
    # needs, it runs too often to also gather the metrics
    def state_info
        domain = KVM.domains[@name]

        @vm[:name] = @name
        @vm[:uuid] = domain.uuid

        @vm[:deploy_id] = @vm[:uuid]

        m = @name.match(/^one-(\d*)$/)

        if m
            @vm[:id] = m[1]
        else
            @vm[:id] = -1
        end

        return if @vm[:id] == -1 # Skip wild VMs

        state, reason = domain.state

        if state == Libvirt::Domain::PAUSED
            @vm[:reason] = reason
            @vm[:state]  = PAUSED_STATE_MAP[reason] || 'UNKNOWN'
        else
            @vm[:state] = STATE_MAP[state] || 'UNKNOWN'
        end
    rescue Libvirt::Error
        -1
    end

    # Gets the information of the domain: state, ONE metadata and metrics
    def info
        return -1 if state_info == -1
        return if @vm[:id] == -1 # Skip wild VMs

        doc = REXML::Document.new(KVM.domains[@name].xml_desc)

        [:system_datastore, :pci_devices].each do |k|
            @vm[k] = doc.elements["/domain/metadata/one:vm/one:#{k}"]&.text
        end

        ga_stats
        io_stats(doc)
        gpu_stats
    rescue Libvirt::Error
        -1
    end

    # Convert the output of dumpxml for this domain to an OpenNebula template
    # that can be imported. This method is for wild VMs.
    #
    #   @return [String] OpenNebula template encoded in base64
    def to_one
        doc = REXML::Document.new(KVM.domains[@name].xml_desc)

        name = REXML::XPath.first(doc, '/domain/name').text
        uuid = REXML::XPath.first(doc, '/domain/uuid').text
        vcpu = REXML::XPath.first(doc, '/domain/vcpu').text
        mem  = REXML::XPath.first(doc, '/domain/memory').text.to_i / 1024
        arch = REXML::XPath.first(doc, '/domain/os/type').attributes['arch']

        spice = REXML::XPath.first(doc,
                                   "/domain/devices/graphics[@type='spice']")
        spice = spice.attributes['port'] if spice

        spice_txt = ''
        spice_txt = %(GRAPHICS = [ TYPE="spice", PORT="#{spice}" ]) if spice

        vnc = REXML::XPath.first(doc, "/domain/devices/graphics[@type='vnc']")
        vnc = vnc.attributes['port'] if vnc

        vnc_txt = ''
        vnc_txt = %(GRAPHICS = [ TYPE="vnc", PORT="#{vnc}" ]) if vnc

        features = []
        ['acpi', 'apic', 'pae'].each do |feature|
            if REXML::XPath.first(doc, "/domain/features/#{feature}")
                features << feature
            end
        end

        feat = []
        features.each do |feature|
            feat << %(  #{feature.upcase}="yes")
        end

        features_txt = ''
        features_txt = "FEATURES=[#{feat.join(', ')}]" unless feat.empty?

        tmpl =  "NAME=\"#{name}\"\n"
        tmpl << "CPU=#{vcpu}\n"
        tmpl << "VCPU=#{vcpu}\n"
        tmpl << "MEMORY=#{mem}\n"
        tmpl << "HYPERVISOR=\"kvm\"\n"
        tmpl << "DEPLOY_ID=\"#{uuid}\"\n"
        tmpl << "OS=[ARCH=\"#{arch}\"]\n"
        tmpl << features_txt << "\n" unless features_txt.empty?
        tmpl << spice_txt << "\n" unless spice_txt.empty?
        tmpl << vnc_txt << "\n" unless vnc_txt.empty?

        tmpl
    rescue StandardError
        ''
    end

    # Compute forecast values for the VM metrics
    def predictions
        base = '/var/lib/one-remotes/im/lib/python/prediction.sh'
        cmd  = "#{base} --entity virtualmachine,#{@vm[:id]},#{@vm[:uuid]},#{DB_PATH}"

        o, _e, s = Open3.capture3 cmd

        if s.success?
            o
        else
            ''
        end
    rescue StandardError
        ''
    end

    private

    # Libvirt domain state => OpenNebula state. A domain in shutdown is still
    # running, other states (no state, shut off) are not expected for an active
    # domain
    STATE_MAP = {
        Libvirt::Domain::RUNNING     => 'RUNNING',
        Libvirt::Domain::BLOCKED     => 'RUNNING',
        Libvirt::Domain::SHUTDOWN    => 'RUNNING',
        Libvirt::Domain::CRASHED     => 'FAILURE',
        Libvirt::Domain::PMSUSPENDED => 'SUSPENDED'
    }

    # Reasons of the paused state (virDomainPausedReason) not defined by the
    # libvirt gem
    PAUSED_STARTING_UP     = 11
    PAUSED_POSTCOPY_FAILED = 13

    # Libvirt reason of the paused state => OpenNebula state
    PAUSED_STATE_MAP = {
        Libvirt::Domain::PAUSED_MIGRATION => 'RUNNING',
        Libvirt::Domain::PAUSED_SAVE      => 'RUNNING',
        PAUSED_STARTING_UP                => 'RUNNING',
        Libvirt::Domain::PAUSED_IOERROR   => 'FAILURE',
        Libvirt::Domain::PAUSED_WATCHDOG  => 'FAILURE',
        Libvirt::Domain::PAUSED_CRASHED   => 'FAILURE',
        PAUSED_POSTCOPY_FAILED            => 'FAILURE',
        Libvirt::Domain::PAUSED_UNKNOWN   => 'FAILURE',
        Libvirt::Domain::PAUSED_USER      => 'SUSPENDED'
    }

    # Reasons of the paused state (for RUNNING) when to skip I/O monitoring
    REASONS_SKIP_IO = [
        Libvirt::Domain::PAUSED_MIGRATION,
        Libvirt::Domain::PAUSED_SAVE,
        PAUSED_STARTING_UP
    ]

    # --------------------------------------------------------------------------
    # GPU monitoring system - detects GPUs from PCI devices and collects metrics
    # --------------------------------------------------------------------------
    GPU_VENDORS = {
        'nvidia' => {
            :vendor_id     => '10de',
            :monitor_class => 'NvidiaGPUMonitor'
        }
        # Add new vendors:
        # 'amd' => {
        #     :vendor_id     => '1002',
        #     :monitor_class => 'AMDGPUMonitor'
        # }
    }.freeze

    # Get the I/O stats of the domain, aggregated for all its disks and NICs
    # @param doc [REXML::Document] XML description of the domain
    def io_stats(doc)
        @vm[:netrx] = 0
        @vm[:nettx] = 0
        @vm[:diskrdbytes] = 0
        @vm[:diskwrbytes] = 0
        @vm[:diskrdiops]  = 0
        @vm[:diskwriops]  = 0

        return if @vm[:state] != 'RUNNING' ||
                  REASONS_SKIP_IO.include?(@vm[:reason])

        domain = KVM.domains[@name]

        doc.elements.each('/domain/devices/interface/target') do |target|
            stats = domain.ifinfo(target.attributes['dev'])

            @vm[:netrx] += stats.rx_bytes
            @vm[:nettx] += stats.tx_bytes
        rescue Libvirt::Error
            next
        end

        # An empty device name returns the totals of all the disks
        stats = domain.block_stats('')

        @vm[:diskrdbytes] = stats.rd_bytes
        @vm[:diskwrbytes] = stats.wr_bytes
        @vm[:diskrdiops]  = stats.rd_req
        @vm[:diskwriops]  = stats.wr_req
    rescue Libvirt::Error
    end

    # Get OS metrics provided by the qemu guest agent
    def ga_stats
        if KVM::QEMU_GA[:enabled]
            extract_ga_attributes
            extract_network_attributes

            ga_commands = KVM::QEMU_GA[:commands].transform_values do |ga_cmd_config|
                ga_cmd_config[:command].gsub('$vm_id', @vm[:id])
            end

            ga_commands.each do |ga_info, ga_cmd|
                # Skip commands that don't match VM OS filter
                next unless command_matches_filter?(KVM::QEMU_GA[:commands][ga_info])

                text, e, success = KVM.agent_conf_command(ga_cmd)

                if !success
                    @vm[ga_info] = e.chomp
                else
                    begin
                        info = JSON.parse(text)['return']

                        info = info.join(', ') if info.is_a?(Array)
                        info = info.to_s.gsub(/["\[\]]/) {|match| "\\#{match}" } if info.is_a?(Hash)

                        @vm[ga_info] = info
                    rescue JSON::ParserError => e
                        @vm[ga_info] = "Failed to parse command output: #{e}"
                    end
                end
            end
        else
            KVM::QEMU_GA[:commands].each_key do |ga_info|
                @vm[ga_info] = 'QEMU Guest Agent monitoring disabled'
            end
        end
    end

    # Set OS info from guest agent, unless there's already cached value
    def extract_ga_attributes
        return if @vm[:os_type]

        text = KVM.agent_command(@name, '{"execute":"guest-get-osinfo"}', 10)

        osinfo = JSON.parse(text)['return']
        @vm[:os_id]      = osinfo['id'] || 'unknown'
        @vm[:os_type]    = @vm[:os_id] == 'mswindows' ? 'mswindows' : 'posix'
        @vm[:os_version] = osinfo['version-id'] || 'unknown'
        @vm[:os_machine] = osinfo['machine'] || 'unknown'
    rescue Libvirt::Error
    end

    # Get network information
    def extract_network_attributes
        net_text = KVM.agent_command(@name, '{"execute":"guest-network-get-interfaces"}')

        net_info  = JSON.parse(net_text)['return']
        guest_ips = []

        net_info.each do |info|
            next if info['name'] == 'lo'
            next unless info.keys.include? 'ip-addresses'

            info['ip-addresses'].map do |ip|
                next if ['127.0.0.1', '::1'].include? ip['ip-address']
                next unless %w(ipv4 ipv6).include? ip['ip-address-type']

                guest_ips.append(ip['ip-address'])
            end
        end

        return if guest_ips.empty?

        @vm[:guest_ip_addresses] = guest_ips.join(',')
    rescue StandardError
    end

    # Check if command should run on given VM (OS filters)
    def command_matches_filter?(ga_cmd_config)
        # AND logic: run if ALL filters are either empty or match the VM value
        [
            [ga_cmd_config[:os_ids], @vm[:os_id]],
            [ga_cmd_config[:os_types], @vm[:os_type]],
            [ga_cmd_config[:os_versions], @vm[:os_version]],
            [ga_cmd_config[:os_machines], @vm[:os_machine]]
        ].all? {|filter, value| filter.empty? || filter.include?(value) }
    end

    # Detects if VM has GPU by parsing PCI devices from domain metadata
    # Returns hash with vendor and device_id, or nil if no GPU found
    def vm_has_gpu?
        return unless @vm[:pci_devices]

        pci_devices_string = @vm[:pci_devices].strip
        return if pci_devices_string.empty?

        pci_devices_string.split(',').map(&:strip).each do |pci_device|
            parts = pci_device.split(':')
            next if parts.size < 3

            vendor_id = parts[0].downcase
            device_id = parts[1].downcase

            GPU_VENDORS.each do |vendor_name, config|
                if vendor_id == config[:vendor_id].downcase
                    return { :vendor => vendor_name, :device_id => device_id }
                end
            end
        end

        nil
    end

    # NVIDIA GPU Monitor implementation
    # --------------------------------------------------------------------------
    # Collects GPU metrics from VMs using nvidia-smi via QEMU guest agent
    # Must implement collect_metrics() returning hash with:
    # :utilization, :memory_utilization, :memory_free, :power_usage, and :count keys
    class NvidiaGPUMonitor

        # Map nvidia-smi query fields to internal metric names
        NVIDIA_METRIC_MAP = {
            'gpu_uuid'            => :gpu_uuid,           # Unique GPU identifier
            'utilization.gpu'     => :utilization,        # % of time GPU cores busy
            'utilization.memory'  => :memory_utilization, # % of time memory busy (bandwidth usage)
            'power.draw'          => :power_usage,        # Power consumption (in Watts)
            'memory.free'         => :memory_free         # VRAM not allocated (in MiB)
            # 'memory.used'         => :memory_used,         # VRAM allocated (in MiB)
            # 'memory.total'        => :memory_total,        # Total installed VRAM (in MiB)
            # 'temperature.gpu'     => :temperature,         # Core GPU temperature (in Celsius)
            # 'utilization.encoder' => :encoder_utilization, # % usage of the video encoder engine
            # 'utilization.decoder' => :decoder_utilization, # % usage of the video decoder engine
        }.freeze

        NVIDIA_FIELDS = NVIDIA_METRIC_MAP.keys.freeze

        def initialize(domain_name, device_id = nil)
            @domain_name = domain_name
            @device_id   = device_id # Store for future model specific logic
        end

        def collect_metrics
            2.times do
                fields  = NVIDIA_FIELDS.join(',')
                command = "nvidia-smi --query-gpu=#{fields} --format=csv,noheader,nounits"
                output  = run_guest_command(command)

                if output && !output.empty?
                    return parse_nvidia_smi_output(output)
                end

                sleep 1
            end
            nil
        end

        private

        def run_guest_command(command, timeout = 2.0, poll_interval = 0.2)
            exec_ga = {
                'execute'   => 'guest-exec',
                'arguments' => {
                    'path' => '/bin/sh',
                    'arg'  => ['-c', command],
                    'capture-output' => true
                }
            }.to_json

            text = KVM.agent_command(@domain_name, exec_ga, 15)

            response = JSON.parse(text) rescue nil
            return unless response&.dig('return', 'pid')

            pid     = response['return']['pid']
            elapsed = 0.0

            while elapsed < timeout
                sleep poll_interval
                elapsed += poll_interval

                stat_ga = {
                    'execute'   => 'guest-exec-status',
                    'arguments' => { 'pid' => pid }
                }.to_json

                text = KVM.agent_command(@domain_name, stat_ga, 15)

                status = JSON.parse(text) rescue nil
                if status&.dig('return', 'exited')
                    return Base64.decode64(status['return']['out-data']) rescue nil
                end
            end
            nil
        rescue Libvirt::Error
            nil
        end

        def parse_nvidia_smi_output(text)
            return if !text || text.empty?

            devices = []

            CSV.parse(text, :headers => false) do |row|
                next if row.size < NVIDIA_FIELDS.size

                device_data = {}
                row.each_with_index do |value, i|
                    field_name = NVIDIA_FIELDS[i]
                    metric_key = NVIDIA_METRIC_MAP[field_name]

                    if metric_key == :gpu_uuid
                        device_data[metric_key] = value&.strip
                    else
                        device_data[metric_key] = parse_numeric(value)
                    end
                end
                devices << device_data
            end

            return if devices.empty?

            aggregate_gpu_metrics(devices)
        end

        def parse_numeric(value)
            return 0.0 if value.nil? || value.strip.empty? || value.strip.downcase == 'n/a'

            cleaned = value.strip.gsub(/[^\d.-]/, '')
            cleaned.to_f
        rescue StandardError
            0.0
        end

        def aggregate_gpu_metrics(devices)
            return {} if devices.empty?

            gpu_count = devices.size
            agg = Hash.new(0.0)

            devices.each do |gpu|
                gpu.each do |key, value|
                    next if key == :gpu_uuid

                    agg[key] += value
                end
            end

            # Average utilization metrics
            avg_keys = [:utilization, :memory_utilization]
            avg_keys.each {|k| agg[k] = (agg[k] / gpu_count).round(2) if agg[k] > 0 }

            agg[:count] = gpu_count
            agg.transform_values {|v| v.round(2) }
        end

    end

    # Get the VM GPU stats
    # The metrics are aggregated for all GPUs
    # Only sets GPU metrics if VM actually has a GPU
    def gpu_stats
        return unless @vm[:state] == 'RUNNING'

        gpu_info = vm_has_gpu?
        return unless gpu_info

        vendor_config = GPU_VENDORS[gpu_info[:vendor]]
        monitor_class = Object.const_get("Domain::#{vendor_config[:monitor_class]}")
        monitor = monitor_class.new(@name, gpu_info[:device_id])

        stats = monitor.collect_metrics
        if stats
            @vm[:gpu_utilization] = stats[:utilization] || 0.0
            @vm[:gpu_memory_utilization] = stats[:memory_utilization] || 0.0
            @vm[:gpu_memory_free] = stats[:memory_free] || 0.0
            @vm[:gpu_power_usage] = stats[:power_usage] || 0.0
            @vm[:gpu_count] = stats[:count] || 0
        end
    rescue StandardError => e
        STDERR.puts "Warning: Failed to get GPU stats for VM #{@name}: #{e.message}"
    end

end

#-------------------------------------------------------------------------------
# This module provides a basic interface to get the list of domains in
# the system and convert the information to be added to monitor or system
# messages.
#
# It also gathers the state information of the domains for the state probe
#-------------------------------------------------------------------------------
module DomainList

    ############################################################################
    #  Module Interface
    ############################################################################
    def self.info
        domains = KVMDomains.new

        domains.info
        domains.to_sql
        domains.to_monitor
    end

    def self.wilds_info
        domains = KVMDomains.new

        domains.wilds_info
        domains.wilds_to_monitor
    end

    def self.state_info(_host, _host_id)
        domains = KVMDomains.new

        domains.state_info
    end

    ############################################################################
    # This is the implementation class for the module logic
    ############################################################################
    class KVMDomains < BaseDomains

        include KVM
        include ProcessList

        # Get the list of VMs with only their identity and state
        #
        #   @return [Hash] with KVM Domain classes indexed by their uuid
        def state_info
            info_each(false) do |name|
                vm = Domain.new name

                next if vm.state_info == -1

                vm
            end
        end

        # Get the list of wild VMs (not known to OpenNebula) and their monitor
        # information including process usage
        #
        #   @return [Hash] with KVM Domain classes indexed by their uuid
        def wilds_info
            info_each(true) do |name|
                next if name =~ /^one-\d+/

                vm = Domain.new name

                next if vm.info == -1

                t = vm.to_one

                vm[:template] = Base64.strict_encode64(t) unless t.empty?

                vm
            end
        end

        # Return a message string with wild VM information
        def wilds_to_monitor
            mon_s = ''

            @vms.each do |_uuid, vm|
                next if vm[:id] != -1 || vm[:template].empty?

                mon_s << "VM = [ID=\"#{vm[:id]}\", DEPLOY_ID=\"#{vm[:deploy_id]}\","
                mon_s << " VM_NAME=\"#{vm.name}\","
                mon_s << " IMPORT_TEMPLATE=\"#{vm[:template]}\"]\n"
            end

            mon_s
        end

    end

end
