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

#
# Module for monitoring host NUMA information
#
module NUMA

    def self.node_to_template(node, nid)
        node_s = ''

        node.each do |k, v|
            case k
            when 'hugepages'
                v.each do |h|
                    node_s << "HUGEPAGE = [ NODE_ID = \"#{nid}\","
                    node_s << " SIZE = \"#{h['size']}\","
                    node_s << " FREE = \"#{h['free']}\" ]\n"
                end
            when 'memory'
                node_s << "MEMORY_NODE = [ NODE_ID = \"#{nid}\","
                node_s << " FREE = \"#{v['free']}\","
                node_s << " USED = \"#{v['used']}\" ]\n"
            end
        end

        node_s
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

    NUMA.memory(nodes, node_id)
end

nodes_s = ''

nodes.each {|i, v| nodes_s << NUMA.node_to_template(v, i) }

puts nodes_s
