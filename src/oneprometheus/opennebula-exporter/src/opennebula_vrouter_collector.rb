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

require 'opennebula'
require 'time'

# Exports BGP session and FRR apply status from Virtual Router VMs.
class OpenNebulaVRouterCollector

    ROUTER_LABELS = [:vrouter_id, :vrouter_name, :vm_id, :vm_name].freeze
    PEER_LABELS = (ROUTER_LABELS + [:peer]).freeze

    def initialize(registry, client, namespace)
        @client = client
        @bgp_established = registry.gauge(
            :"#{namespace}_vrouter_bgp_peer_established",
            :docstring => 'Whether the BGP session with this peer is established',
            :labels => PEER_LABELS
        )
        @prefixes_received = registry.gauge(
            :"#{namespace}_vrouter_bgp_rcv",
            :docstring => 'BGP_STATE rcv value reported for this peer',
            :labels => PEER_LABELS
        )
        @prefixes_sent = registry.gauge(
            :"#{namespace}_vrouter_bgp_snt",
            :docstring => 'BGP_STATE snt value reported for this peer',
            :labels => PEER_LABELS
        )
        @frr_applied = registry.gauge(
            :"#{namespace}_vrouter_frr_applied",
            :docstring => 'Whether FRR_APPLY reports a successful apply',
            :labels => ROUTER_LABELS
        )
        @frr_apply_timestamp = registry.gauge(
            :"#{namespace}_vrouter_frr_apply_timestamp_seconds",
            :docstring => 'Unix timestamp of the successful FRR apply reported in FRR_APPLY',
            :labels => ROUTER_LABELS
        )
    end

    def collect
        pool = OpenNebula::VirtualRouterPool.new(@client)
        result = pool.info_all

        if OpenNebula.is_error?(result)
            warn("[OpenNebulaVRouterCollector] pool.info_all failed: #{result.message}")
            return
        end

        pool.each do |router|
            (router.retrieve_elements('VMS/ID') || []).each do |vm_id|
                collect_vm(router, vm_id)
            end
        end
    rescue StandardError => e
        warn("[OpenNebulaVRouterCollector] #{e.class}: #{e.message}")
    end

    private

    def collect_vm(router, vm_id)
        vm = OpenNebula::VirtualMachine.new(
            OpenNebula::VirtualMachine.build_xml(vm_id.to_i), @client
        )
        result = vm.info
        if OpenNebula.is_error?(result)
            warn("[OpenNebulaVRouterCollector] VM #{vm_id} info failed: #{result.message}")
            return
        end

        labels = {
            :vrouter_id => router['ID'],
            :vrouter_name => router['NAME'],
            :vm_id => vm_id.to_s,
            :vm_name => vm['NAME']
        }
        collect_bgp(vm['USER_TEMPLATE/BGP_STATE'] || vm['TEMPLATE/BGP_STATE'], labels)
        collect_frr(vm['USER_TEMPLATE/FRR_APPLY'] || vm['TEMPLATE/FRR_APPLY'], labels)
    rescue StandardError => e
        warn("[OpenNebulaVRouterCollector] VM #{vm_id}: #{e.class}: #{e.message}")
    end

    def collect_bgp(value, labels)
        value.to_s.split(';').each do |entry|
            peer, details = entry.strip.split(/:\s+/, 2)
            next if peer.to_s.empty? || details.to_s.empty?

            peer_labels = labels.merge(:peer => peer)
            state = details.split.first
            established = state.casecmp('Established').zero?
            @bgp_established.set(established ? 1 : 0, :labels => peer_labels)

            received = details[/\brcv\s+(\d+)\b/, 1]
            sent = details[/\bsnt\s+(\d+)\b/, 1]
            @prefixes_received.set(received.to_i, :labels => peer_labels) if received
            @prefixes_sent.set(sent.to_i, :labels => peer_labels) if sent
        end
    end

    def collect_frr(value, labels)
        status, timestamp = value.to_s.split
        return unless status

        applied = status.casecmp('applied').zero?
        @frr_applied.set(applied ? 1 : 0, :labels => labels)
        return unless applied && timestamp

        @frr_apply_timestamp.set(Time.iso8601(timestamp).to_i, :labels => labels)
    rescue ArgumentError => e
        warn("[OpenNebulaVRouterCollector] Invalid FRR_APPLY timestamp: #{e.message}")
    end

end
