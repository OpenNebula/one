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
require 'rexml/document'

# OpenNebula Address Range collector.
#
# Metrics exposed:
# - opennebula_vnet_free_lease_ratio{vnet_id="...",vnet_name="...",ar_id="..."} 0.00-1.00
class OpenNebulaARCollector

    LABELS = [:vnet_id, :vnet_name, :ar_id].freeze

    METRIC_NAME = 'vnet_free_lease_ratio'

    def initialize(registry, client, namespace)
        @client = client

        @metric = registry.gauge(
            "#{namespace}_#{METRIC_NAME}".to_sym,
            :docstring => 'Fraction of free leases in each VNet Address Range',
            :labels => LABELS
        )
    end

    def collect
        pool = fetch_vnet_pool
        return if pool.nil?

        pool.each do |vnet|
            process_vnet(vnet)
        rescue StandardError => e
            warn("[OpenNebulaARCollector] VNet error: #{e.class}: #{e.message}")
        end
    rescue StandardError => e
        warn("[OpenNebulaARCollector] #{e.class}: #{e.message}")
        nil
    end

    private

    def fetch_vnet_pool
        pool = OpenNebula::VirtualNetworkPool.new(@client)
        rc = pool.info_all

        if OpenNebula.is_error?(rc)
            warn("[OpenNebulaARCollector] pool.info_all failed: #{rc.message}")
            return
        end

        pool
    end

    def process_vnet(vnet)
        doc = REXML::Document.new(vnet.to_xml)

        vnet_id   = text(doc, 'VNET/ID')
        vnet_name = text(doc, 'VNET/NAME')

        doc.elements.each('VNET/AR_POOL/AR') do |ar_el|
            process_ar(ar_el, vnet_id, vnet_name)
        end
    end

    def process_ar(ar_el, vnet_id, vnet_name)
        size = ar_size(ar_el)
        return if size <= 0

        free_ratio = compute_ratio(size, used_leases(ar_el))

        @metric.set(
            free_ratio,
            :labels => metric_labels(vnet_id, vnet_name, ar_el)
        )
    end

    def ar_size(ar_el)
        ar_el.elements['SIZE']&.text.to_i
    end

    def metric_labels(vnet_id, vnet_name, ar_el)
        {
            :vnet_id => vnet_id.to_s,
          :vnet_name => vnet_name.to_s,
          :ar_id => ar_el.elements['AR_ID']&.text.to_s
        }
    end

    def compute_ratio(size, used)
        ratio = (size - used).to_f / size

        ratio = 0.0 if ratio < 0.0
        ratio = 1.0 if ratio > 1.0

        ratio.round(2)
    end

    def text(doc, xpath)
        el = doc.elements[xpath]
        el ? el.text.to_s : ''
    end

    # Prefer AR/USED_LEASES if present.
    # Fallback to AR/ALLOCATED parsing (pairs: INDEX ENCODED_VMID).
    def used_leases(ar_el)
        used_el = ar_el.elements['USED_LEASES']
        return used_el.text.to_i if used_el && !used_el.text.to_s.empty?

        allocated = ar_el.elements['ALLOCATED']&.text.to_s
        tokens = allocated.split
        tokens.size / 2
    end

end
