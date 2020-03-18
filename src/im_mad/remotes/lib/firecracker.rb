#!/usr/bin/env ruby

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

$LOAD_PATH.unshift "#{File.dirname(__FILE__)}/../../vmm/firecracker/"

require 'json'
require 'base64'
require 'client'

#-------------------------------------------------------------------------------
#  Firecracker Monitor Module. This module provides basic functionality to
#  retrieve Firecracker instances information
#-------------------------------------------------------------------------------
module Firecracker

    ###########################################################################
    # MicroVM metrics/info related methods
    ###########################################################################

    def self.flush_metrics(uuid)
        begin
            socket = "/srv/jailer/firecracker/#{uuid}/root/api.socket"
            client = FirecrackerClient.new(socket)

            data = '{"action_type": "FlushMetrics"}'
            client.put('actions', data)
        rescue StandardError, FirecrackerError
            return false
        end

        true
    end

    def self.metrics(uuid)
        metrics_path = "/srv/jailer/firecracker/#{uuid}/root/metrics.fifo"

        # clear previos logs
        File.open(metrics_path, 'w') {|file| file.truncate(0) }

        # Flush metrics
        flush_metrics(uuid)

        # Read metrics
        metrics_f = File.read(metrics_path).split("\n")[-1]
        metrics_f.tr!("\u0000", '')

        JSON.parse(metrics_f)
    end

    def self.machine_config(uuid)
        begin
            socket = "/srv/jailer/firecracker/#{uuid}/root/api.socket"
            client = FirecrackerClient.new(socket)

            response = client.get('machine-config')
        rescue StandardError, FirecrackerError
            return
        end

        ###################################################################
        # Machine config will return a JSON with the following information
        # {
        #     "vcpu_count": <int>,
        #     "mem_size_mib": <int>,
        #     "ht_enabled": <bool>,    # Todo, support it
        #     "cpu_template": <string> # Todo, support it
        # }
        ###################################################################

        response
    end

    def self.general_info(uuid)
        begin
            socket = "/srv/jailer/firecracker/#{uuid}/root/api.socket"
            client = FirecrackerClient.new(socket)

            response = client.get('')
        rescue StandardError, FirecrackerError
            return
        end

        ###################################################################
        # General info will return a JSON with the following information
        # {
        #     "id": <string>          # (e.g "one-352")
        #     "state": <string>,      # Check Domain::STATE_MAP
        #     "vmm_version": <string> # (e.g "0.20.0")
        # }
        ###################################################################

        response
    end

    def self.retrieve_info(uuid)
        vm_info = {}

        vm_info.merge!(machine_config(uuid))
        vm_info.merge!(general_info(uuid))
    end

end

#-------------------------------------------------------------------------------
#  This module gets the pid, memory and cpu usage of a set of process that
#  includes a -uuid argument (qemu-kvm vms).
#
#  Usage is computed based on the fraction of jiffies used by the process
#  relative to the system during AVERAGE_SECS (1s)
#-------------------------------------------------------------------------------
module ProcessList

    #  Number of seconds to average process usage
    AVERAGE_SECS = 1

    # list of process indexed by uuid, each entry:
    #    :pid
    #    :memory
    #    :cpu
    def self.process_list
        pids  = []
        procs = {}
        ps    = `ps auxwww`

        ps.each_line do |l|
            m = l.match(/firecracker.+(one-\d+)/)
            next unless m

            l = l.split(/\s+/)

            swap = `cat /proc/#{l[1]}/status 2>/dev/null | grep VmSwap`
            swap = swap.split[1] || 0

            procs[m[1]] = {
                :pid => l[1],
                :memory => l[5].to_i + swap.to_i
            }

            pids << l[1]
        end

        cpu = cpu_info(pids)

        procs.each {|_i, p| p[:cpu] = cpu[p[:pid]] || 0 }

        procs
    end

    def self.retrieve_names
        ps = `ps auxwww`
        domains = []

        ps.each_line do |l|
            m = l.match(/firecracker.+(one-\d+)/)
            next unless m

            domains << m[1]
        end

        domains
    end

    # Get cpu usage in 100% for a set of PIDs
    #   param[Array] pids of the arrys to compute the CPU usage
    #   result[Array] array of cpu usage
    def self.cpu_info(pids)
        multiplier = Integer(`grep -c processor /proc/cpuinfo`) * 100

        cpu_ini = {}

        j_ini = jiffies

        pids.each do |pid|
            cpu_ini[pid] = proc_jiffies(pid).to_f
        end

        sleep AVERAGE_SECS

        cpu_j = jiffies - j_ini

        cpu = {}

        pids.each do |pid|
            cpu[pid] = (proc_jiffies(pid) - cpu_ini[pid]) / cpu_j
            cpu[pid] = (cpu[pid] * multiplier).round(2)
        end

        cpu
    end

    # CPU tics used in the system
    def self.jiffies
        stat = File.open('/proc/stat', 'r') {|f| f.readline }

        j = 0

        stat.split(' ')[1..-3].each {|num| j += num.to_i }

        j
    rescue StandardError
        0
    end

    # CPU tics used by a process
    def self.proc_jiffies(pid)
        stat = File.read("/proc/#{pid}/stat")

        j = 0

        data = stat.lines.first.split(' ')

        [13, 14, 15, 16].each {|col| j += data[col].to_i }

        j
    rescue StandardError
        0
    end

end

#-------------------------------------------------------------------------------
#  This class represents a Firecracker domain, information includes:
#    @vm[:name]
#    @vm[:id] from one-<id>
#    @vm[:uuid] (deployment id)
#    @vm[:fc_state] Firecracker state
#    @vm[:state] OpenNebula state
#    @vm[:netrx]
#    @vm[:nettx]
#    @vm[:diskrdbytes]
#    @vm[:diskwrbytes]
#    @vm[:diskrdiops]
#    @vm[:diskwriops]
#
#  This class uses the KVM and ProcessList interface
#-------------------------------------------------------------------------------
class Domain

    attr_reader :vm, :name

    def initialize(name)
        @name = name
        @vm   = {}
    end

    # Gets the information of the domain, fills the @vm hash using ProcessList
    # and virsh dominfo
    def info
        # Flush the microVM metrics
        hash = Firecracker.retrieve_info(@name)

        return -1 if hash.nil?

        @vm[:name] = @name
        @vm[:uuid] = hash['id']

        m = @vm[:name].match(/^one-(\d*)$/)

        if m
            @vm[:id] = m[1]
        else
            @vm[:id] = -1
        end

        @vm[:fc_state] = hash['state']

        state = STATE_MAP[hash['state']] || 'UNKNOWN'

        @vm[:state] = state

        io_stats
    end

    # Get domain attribute by name.
    def [](name)
        @vm[name]
    end

    def []=(name, value)
        @vm[name] = value
    end

    # Merge hash value into the domain attributes
    def merge!(map)
        @vm.merge!(map)
    end

    #  Builds an OpenNebula Template with the monitoring keys. E.g.
    #    CPU=125.2
    #    MEMORY=1024
    #    NETTX=224324
    #    NETRX=213132
    #    ...
    #
    #  Keys are defined in MONITOR_KEYS constant
    #
    #  @return [String] OpenNebula template encoded in base64
    def to_monitor
        mon_s = ''

        MONITOR_KEYS.each do |k|
            next unless @vm[k.to_sym]

            mon_s << "#{k.upcase}=\"#{@vm[k.to_sym]}\"\n"
        end

        Base64.strict_encode64(mon_s)
    end

    private

    # --------------------------------------------------------------------------
    # Firecracker states for the guest are
    #  * 'Uninitialized'
    #  * 'Starting'
    #  * 'Running'
    # https://github.com/firecracker-microvm/firecracker/blob/8d369e5db565441987d607f3ff24dc15fa2c8d7a/src/api_server/swagger/firecracker.yaml#L471
    # --------------------------------------------------------------------------
    STATE_MAP = {
        'Uninitialized' => 'FAILURE',
        'Starting'      => 'RUNNING',
        'Running'       => 'RUNNING'
    }

    MONITOR_KEYS = %w[cpu memory netrx nettx diskrdbytes diskwrbytes diskrdiops
                      diskwriops]

    # Get the I/O stats of the domain as provided by Libvirt command domstats
    # The metrics are aggregated for all DIKS and NIC
    def io_stats
        @vm[:netrx] = 0
        @vm[:nettx] = 0
        @vm[:diskrdbytes] = 0
        @vm[:diskwrbytes] = 0
        @vm[:diskrdiops]  = 0
        @vm[:diskwriops]  = 0

        return if @vm[:state] != 'RUNNING'

        vm_metrics = Firecracker.metrics(@name)

        return if vm_metrics.nil? || vm_metrics.keys.empty?

        @vm[:netrx] += vm_metrics['net']['rx_bytes_count']
        @vm[:nettx] += vm_metrics['net']['tx_bytes_count']
        @vm[:diskrdbytes] += vm_metrics['block']['read_bytes']
        @vm[:diskwrbytes] += vm_metrics['block']['write_bytes']
        @vm[:diskrdiops] += vm_metrics['block']['read_count']
        @vm[:diskwriops] += vm_metrics['block']['write_count']
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
        domains = FirecrackerDomains.new

        domains.info
        domains.to_monitor
    end

    def self.state_info(host, host_id)
        domains = FirecrackerDomains.new

        domains.state_info
    end

    ############################################################################
    # This is the implementation class for the module logic
    ############################################################################
    class FirecrackerDomains

        include Firecracker
        include ProcessList

        def initialize
            @vms = {}
        end

        # Get the list of VMs (known to OpenNebula) and their monitor info
        # including process usage
        #
        #   @return [Hash] with KVM Domain classes indexed by their uuid
        def info
            info_each(true) do |name|
                vm = Domain.new name

                next if vm.info == -1

                vm
            end
        end

        # Get the list of VMs and their info
        # not including process usage.
        #
        #   @return [Hash] with KVM Domain classes indexed by their uuid
        def state_info
            info_each(false) do |name|
                vm = Domain.new name

                next if vm.info == -1

                vm
            end
        end

        # Return a message string with VM monitor information
        def to_monitor
            mon_s = ''

            @vms.each do |_uuid, vm|
                mon_s << "VM = [ ID=\"#{vm[:id]}\", UUID=\"#{vm[:uuid]}\","
                mon_s << " MONITOR=\"#{vm.to_monitor}\"]\n"
            end

            mon_s
        end

        private

        # Generic build method for the info list. It filters and builds the
        # domain list based on the given block
        #   @param[Boolean] do_process, to get process information
        def info_each(do_process)
            return unless block_given?

            vm_ps = ProcessList.process_list if do_process

            names = ProcessList.retrieve_names

            return @vms if names.empty?

            names.each do |name|
                vm = yield(name)

                @vms[vm[:uuid]] = vm if vm
            end

            return @vms unless do_process

            vm_ps.each do |uuid, ps|
                next unless @vms[uuid]

                @vms[uuid].merge!(ps)
            end

            @vms
        end

    end

end
