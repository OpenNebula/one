#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

require_relative 'process_list'
require_relative 'domain'

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
            client = FirecrackerClient.new(uuid)

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

        return if metrics_f.nil?

        metrics_f.tr!("\u0000", '')

        JSON.parse(metrics_f)
    end

    def self.machine_config(uuid)
        begin
            client = FirecrackerClient.new(uuid)

            response = client.get('machine-config')
        rescue StandardError, FirecrackerError
            return {}
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
            client = FirecrackerClient.new(uuid)

            response = client.get('')
        rescue StandardError, FirecrackerError
            return {}
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
#  Extends ProcessList module defined at process_list.rb
#-------------------------------------------------------------------------------
module ProcessList

    #  Number of seconds to average process usage
    AVERAGE_SECS = 1

    # Regex used to retrieve microVMs process info
    PS_REGEX = /firecracker.+(one-\d+)/

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

end

#-------------------------------------------------------------------------------
#  This class represents a Firecracker domain, information includes:
#    @vm[:name]
#    @vm[:id] from one-<id>
#    @vm[:uuid] (deployment id)
#    @vm[:deploy_id] (deployment id)
#    @vm[:fc_state] Firecracker state
#    @vm[:state] OpenNebula state
#    @vm[:netrx]
#    @vm[:nettx]
#    @vm[:diskrdbytes]
#    @vm[:diskwrbytes]
#    @vm[:diskrdiops]
#    @vm[:diskwriops]
#
#  This class uses the Firecracker and ProcessList interface
#-------------------------------------------------------------------------------
class Domain < BaseDomain

    # Gets the information of the domain, fills the @vm hash using ProcessList
    # and ps command
    def info
        # Flush the microVM metrics
        hash = Firecracker.retrieve_info(@name)

        return -1 if hash.nil?

        @vm[:name] = @name
        @vm[:uuid] = hash['id']

        @vm[:deploy_id] = hash['id']

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

    def self.state_info(_host, _host_id)
        domains = FirecrackerDomains.new

        domains.state_info
    end

    ############################################################################
    # This is the implementation class for the module logic
    ############################################################################
    class FirecrackerDomains < BaseDomains

        include Firecracker
        include ProcessList

    end

end
