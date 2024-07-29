# !/usr/bin/env ruby

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

#-------------------------------------------------------------------------------
# This probe uses the sysfs interface to get information about the NUMA topology
# of the host. References:
#   - https://www.kernel.org/doc/Documentation/ABI/stable/sysfs-devices-node
#   - https://www.kernel.org/doc/Documentation/cputopology.txt
#
#-------------------------------------------------------------------------------
module NUMA

    NODE_PATH = '/sys/bus/node/devices/'

    # Print node information in OpenNebula Template format. Example:
    #
    # HUGEPAGE = [NODE_ID = "0", SIZE = "1048576", PAGES = "0", FREE = "0"]
    # HUGEPAGE = [NODE_ID = "0", SIZE = "2048", PAGES = "0", FREE = "0"]
    # CORE = [ NODE_ID = "0", ID = "0", CPUS = "0,2"]
    # CORE = [ NODE_ID = "0", ID = "1", CPUS = "1,3"]
    #
    # Corresponding Hash is:
    # {"hugepages"=>
    #  [{"size"=>"2048", "free"=>"0", "nr"=>"0", "surplus"=>"0"},
    #   {"size"=>"1048576", "free"=>"0", "nr"=>"0", "surplus"=>"0"}],
    # "cores"=>
    #  [{"id"=>"3", "cpus"=>["3", "7"]},
    #   {"id"=>"1", "cpus"=>["1", "5"]},
    #   {"id"=>"2", "cpus"=>["2", "6"]},
    #   {"id"=>"0", "cpus"=>["0", "4"]}],
    # "memory"=>
    #  {"total"=>"7992880", "free"=>"2041004", "used"=>"5951876",
    #   "distance"=>"0"}}
    def self.node_to_template(_node, _nid)
        # Implementation varies on probe
        nil
    end

    # --------------------------------------------------------------------------
    # hugepages information
    # --------------------------------------------------------------------------
    # This function parses the HUGE_PAGES information for the node
    # @param [Hash] nodes the attributes of the NUMA nodes
    # @param [String] node name of the node
    # @param [String] node_id of the node
    #
    def self.huge_pages(nodes, node_id)
        nodes[node_id]['hugepages'] = []

        hp_path = "#{NODE_PATH}/node#{node_id}/hugepages"

        return unless Dir.exist?(hp_path)

        Dir.foreach(hp_path) do |hp|
            /hugepages-(?<hp_size>\d+)kB/ =~ hp
            next unless hp_size

            hpsz_path = "#{hp_path}/#{hp}"

            hp_info = { 'size' => hp_size }

            begin
                ['free', 'nr', 'surplus'].each do |var|
                    var_path = "#{hpsz_path}/#{var}_hugepages"
                    hp_info[var] = File.read(var_path).chomp
                end
            rescue StandardError
                next
            end

            nodes[node_id]['hugepages'] << hp_info
        end
    end

    # --------------------------------------------------------------------------
    # Memory
    # --------------------------------------------------------------------------
    # This function parses the CPU topology information for the node
    # @param [Hash] nodes the attributes of the NUMA nodes
    # @param [String] node name of the node
    # @param [String] node_id of the node
    #
    def self.memory(nodes, node_id)
        meminfo_path = "#{NODE_PATH}/node#{node_id}/meminfo"

        return unless File.exist?(meminfo_path)

        bind = binding

        mem_vars = ['MemTotal', 'MemFree', 'MemUsed']

        # rubocop:disable Style/DocumentDynamicEvalDefinition
        mem_vars.each {|var| bind.eval("#{var.downcase.to_sym} = 0") }

        File.readlines(meminfo_path).each do |line|
            mem_vars.each do |metric|
                md = /Node #{node_id} #{metric}:\s+(?<value>\d+) k/.match(line)

                bind.eval("#{metric.downcase.to_sym} = #{md[:value]}") if md
                break if md
            end
        end
        # rubocop:enable Style/DocumentDynamicEvalDefinition

        nodes[node_id]['memory'] = {
            'total' => bind.eval(:memtotal.to_s),
            'free'  => bind.eval(:memfree.to_s),
            'used'  => bind.eval(:memused.to_s)
        }

        # Node distance to priotitize memory allocation
        distance_path = "#{NODE_PATH}/node#{node_id}/distance"

        return unless File.exist?(distance_path)

        distance   = File.read(distance_path)
        distance_a = distance.split(' ')

        distance_h = {}
        distance_a.each_with_index {|d, i| distance_h[d.to_i] = i }

        distance_h = Hash[distance_h.sort]

        closer = ''
        distance_h.each {|_, v| closer << v.to_s << ' ' }

        nodes[node_id]['memory']['distance'] = closer.chop
    end

end
