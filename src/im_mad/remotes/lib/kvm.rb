#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require_relative 'process_list'
require_relative 'domain'

ENV['LANG'] = 'C'
ENV['LC_ALL'] = 'C'

#-------------------------------------------------------------------------------
#  KVM Monitor Module. This module provides basic functionality to execute
#  virsh commands and load KVM configuration in remotes/etc/vmm/kvm/kvmrc
#
#  The load_conf should be called before executing virsh commands
#-------------------------------------------------------------------------------
module KVM

    # Constants for KVM virsh commands
    CONF = {
        :dominfo  => 'virsh --connect LIBVIRT_URI --readonly dominfo',
        :domstate => 'virsh --connect LIBVIRT_URI --readonly domstate',
        :list     => 'virsh --connect LIBVIRT_URI --readonly list',
        :dumpxml  => 'virsh --connect LIBVIRT_URI --readonly dumpxml',
        :domstats => 'virsh --connect LIBVIRT_URI --readonly domstats',
        :qemuga   => 'virsh --connect LIBVIRT_URI qemu-agent-command',
        :top      => 'top -b -d2 -n 2 -p ',
        'LIBVIRT_URI' => 'qemu:///system'
    }

    QEMU_GA = {
        :enabled => false,
        :commands => {
            :vm_qemu_ping => "one-$vm_id \'{\"execute\":\"guest-ping\"}\' --timeout 5"
        }
    }

    # Variables to read from kvmrc
    CONF_VARS = ['LIBVIRT_URI']

    # Execute a virsh command using the predefined command strings and URI
    # @param command [Symbol] as defined in the module CONF constant
    def self.virsh(command, arguments)
        cmd = CONF[command].gsub('LIBVIRT_URI', CONF['LIBVIRT_URI'])

        Open3.capture3("#{cmd} #{arguments}")
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
        text, _e, s = KVM.virsh(:list, '')

        if s.exitstatus != 0
            raise 'Error retrieving names. Check Libvirtd service is up.'
        end

        lines = text.split("\n")[2..-1]

        # rubocop:disable Style/RedundantAssignment
        names = lines.map do |line|
            line.split(/\s+/).delete_if {|d| d.empty? }[1]
        end
        # rubocop:enable Style/RedundantAssignment

        names
    end

end

#-------------------------------------------------------------------------------
#  This class represents a qemu domain, information includes:
#    @vm[:name]
#    @vm[:id] from one-<id>, -1 if wild
#    @vm[:uuid]
#    @vm[:deploy_id]
#    @vm[:kvm_state] KVM-qemu state
#    @vm[:reason] reason for state transition
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

    DB_PATH = '/var/tmp/one_db'

    def initialize(name)
        super(name)

        @predictions = true

        path = "#{__dir__}/../../etc/im/kvm-probes.d/forecast.conf"
        conf = YAML.load_file(path)

        @db_retention = Integer(conf['vm']['db_retention'])
    rescue StandardError
        @db_retention = 4
    end

    # Gets the information of the domain, fills the @vm hash using ProcessList
    # and virsh dominfo
    def info
        text, _e, s = KVM.virsh(:dominfo, @name)

        return -1 if s.exitstatus != 0

        lines = text.split("\n")
        hash  = {}

        lines.map do |line|
            parts = line.split(/:\s+/)
            hash[parts[0].upcase] = parts[1]
        end

        @vm[:name] = hash['NAME']
        @vm[:uuid] = hash['UUID']

        @vm[:deploy_id] = hash['UUID']

        m = @vm[:name].match(/^one-(\d*)$/)

        if m
            @vm[:id] = m[1]
        else
            @vm[:id] = -1
        end

        return if @vm[:id] == -1 # Skip wild VMs

        @vm[:kvm_state] = hash['STATE']

        # Domain state

        state  = 'UNKNOWN'
        reason = 'missing'

        if hash['STATE'] == 'paused'
            text, _e, s = KVM.virsh(:domstate, "#{@name} --reason")

            if s.exitstatus == 0
                text =~ /^[^ ]+ \(([^)]+)\)/
                reason = Regexp.last_match(1) || 'missing'
            end

            state = STATE_MAP['paused'][reason] || 'UNKNOWN'
        else
            state = STATE_MAP[hash['STATE']] || 'UNKNOWN'
        end

        @vm[:state]  = state
        @vm[:reason] = reason

        # Get VM virsh dumpxml ONE metadata
        xml, _e, s = KVM.virsh(:dumpxml, @name)

        begin
            dkeys = [:system_datastore, :pci_devices]
            doc   = REXML::Document.new(xml)

            dkeys.each do |k|
                @vm[k] = doc.elements["/domain/metadata/one:vm/one:#{k}"]&.text
            end
        rescue StandardError
            dkeys.each {|key| @vm[key] = nil }
        end if s.success?

        ga_stats
        io_stats
        gpu_stats
    end

    # Convert the output of dumpxml for this domain to an OpenNebula template
    # that can be imported. This method is for wild VMs.
    #
    #   @return [String] OpenNebula template encoded in base64
    def to_one
        xml, _e, s = KVM.virsh(:dumpxml, @name)
        return '' if s.exitstatus != 0

        doc = REXML::Document.new(xml)

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
        base = '/var/tmp/one/im/lib/python/prediction.sh'
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

    # --------------------------------------------------------------------------
    # Libvirt states for the guest are
    #  * 'running' state refers to guests which are currently active on a CPU.
    #  * 'idle' ('blocked') not running or runnable (waiting on I/O or sleeping)
    #  * 'paused' after virsh suspend.
    #  * 'in shutdown' ('shutdown') guest in the process of shutting down.
    #  * 'dying' the domain has not completely shutdown or crashed.
    #  * 'crashed' guests have failed while running and are no longer running.
    #  * 'pmsuspended' suspended by guest power management (e.g. S3 state)
    # --------------------------------------------------------------------------
    STATE_MAP = {
        'running'     => 'RUNNING',
        'idle'        => 'RUNNING',
        'blocked'     => 'RUNNING',
        'in shutdown' => 'RUNNING',
        'shutdown'    => 'RUNNING',
        'dying'       => 'RUNNING',
        'crashed'     => 'FAILURE',
        'pmsuspended' => 'SUSPENDED',
        'paused' => {
            'migrating' => 'RUNNING',
            'saving'    => 'RUNNING',
            'starting up' => 'RUNNING',
            'booted'    => 'RUNNING',
            'I/O error' => 'FAILURE',
            'watchdog'  => 'FAILURE',
            'crashed'   => 'FAILURE',
            'post-copy failed' => 'FAILURE',
            'unknown'   => 'FAILURE',
            'user'      => 'SUSPENDED'
        }
    }

    # List of domain state reasons (for RUNNING) when to skip I/O monitoring
    REASONS_SKIP_IO = ['migrating', 'starting up', 'saving']

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

    # Get the I/O stats of the domain as provided by Libvirt command domstats
    # The metrics are aggregated for all DIKS and NIC
    def io_stats
        @vm[:netrx] = 0
        @vm[:nettx] = 0
        @vm[:diskrdbytes] = 0
        @vm[:diskwrbytes] = 0
        @vm[:diskrdiops]  = 0
        @vm[:diskwriops]  = 0

        return if @vm[:state] != 'RUNNING' ||
                  REASONS_SKIP_IO.include?(@vm[:reason])

        vm_stats, _e, s = KVM.virsh(:domstats, @name)

        return if s.exitstatus != 0

        vm_stats.each_line do |line|
            columns = line.split(/=(\d+)/)

            case columns[0]
            when /rx.bytes/
                @vm[:netrx] += columns[1].to_i
            when /tx.bytes/
                @vm[:nettx] += columns[1].to_i
            when /rd.bytes/
                @vm[:diskrdbytes] += columns[1].to_i
            when /wr.bytes/
                @vm[:diskwrbytes] += columns[1].to_i
            when /rd.reqs/
                @vm[:diskrdiops] += columns[1].to_i
            when /wr.reqs/
                @vm[:diskwriops] += columns[1].to_i
            end
        end
    end

    # Get OS metrics provided by the qemu guest agent
    def ga_stats
        ga_commands = KVM::QEMU_GA[:commands].transform_values do |ga_cmd|
            ga_cmd.gsub('$vm_id', @vm[:id])
        end

        if KVM::QEMU_GA[:enabled]
            ga_commands.each do |ga_info, ga_cmd|
                text, e, s = KVM.virsh(:qemuga, ga_cmd)

                if s.exitstatus != 0
                    @vm[ga_info] = e.chomp
                else
                    begin
                        info = JSON.parse(text)['return']

                        info = info.join(', ') if info.is_a?(Array)
                        info = info.to_s.gsub(/["\[\]]/) { |match| "\\#{match}" } if info.is_a?(Hash)

                        @vm[ga_info] = info
                    rescue JSON::ParserError => e
                        @vm[ga_info] = "Failed to parse command output: #{e}"
                    end
                end
            end
        else
            ga_commands.each_key do |ga_info|
                @vm[ga_info] = 'QEMU Guest Agent monitoring disabled'
            end
        end
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

            text, _e, s = KVM.virsh(:qemuga, "#{@domain_name} '#{exec_ga}' --timeout 15")
            return unless s.success?

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

                text, _e, s = KVM.virsh(:qemuga, "#{@domain_name} '#{stat_ga}' --timeout 15")
                next unless s.success?

                status = JSON.parse(text) rescue nil
                if status&.dig('return', 'exited')
                    return Base64.decode64(status['return']['out-data']) rescue nil
                end
            end
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
