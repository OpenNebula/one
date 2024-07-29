#!/usr/bin/env ruby

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

require_relative '../../../lib/numa_common'

# This module extracts NUMA information from a host
module NUMA

    def self.node_to_template(node, nid)
        node_s = ''

        node.each do |k, v|
            case k
            when 'hugepages'
                v.each do |h|
                    node_s << "HUGEPAGE = [ NODE_ID = \"#{nid}\","
                    node_s << " SIZE = \"#{h['size']}\","
                    node_s << " PAGES = \"#{h['nr']}\" ]\n"
                end
            when 'cores'
                v.each do |c|
                    node_s << "CORE = [ NODE_ID = \"#{nid}\","
                    node_s << " ID = \"#{c['id']}\","
                    node_s << " CPUS = \"#{c['cpus'].join(',')}\" ]\n"
                end
            when 'memory'
                node_s << "MEMORY_NODE = [ NODE_ID = \"#{nid}\","
                node_s << " TOTAL = \"#{v['total']}\","
                node_s << " DISTANCE = \"#{v['distance']}\" ]\n"
            end
        end

        node_s
    end

    # --------------------------------------------------------------------------
    # CPU topology
    # --------------------------------------------------------------------------
    # This function parses the CPU topology information for the node
    # @param [Hash] nodes the attributes of the NUMA nodes
    # @param [String] node name of the node
    # @param [String] node_id of the node
    #
    def self.cpu_topology(nodes, node_id)
        nodes[node_id]['cores'] = []
        cpu_visited = []

        cpu_path = "#{NODE_PATH}/node#{node_id}/"

        return unless Dir.exist?(cpu_path)

        Dir.foreach(cpu_path) do |cp|
            /cpu(?<cpu_id>\d+)/ =~ cp
            next unless cpu_id
            next if cpu_visited.include? cpu_id

            begin
                core_path = "#{cpu_path}/#{cp}/topology"

                siblings = File.read("#{core_path}/thread_siblings_list").chomp
                siblings = siblings.split(',')

                cpu_visited.concat(siblings)

                core_id = File.read("#{core_path}/core_id").chomp

                nodes[node_id]['cores'] << { 'id' => core_id,
                                             'cpus' => siblings }
            rescue StandardError
                next
            end
        end
    end

end

# ------------------------------------------------------------------------------
# Get information for each NUMA node.
# ------------------------------------------------------------------------------
nodes = {}

Dir.foreach(NUMA::NODE_PATH) do |node|
    /node(?<node_id>\d+)/ =~ node
    next unless node_id

    nodes[node_id] = {}

    NUMA.huge_pages(nodes, node_id)

    NUMA.cpu_topology(nodes, node_id)

    NUMA.memory(nodes, node_id)
end

nodes_s = ''

nodes.each {|i, v| nodes_s << NUMA.node_to_template(v, i) }

puts nodes_s
