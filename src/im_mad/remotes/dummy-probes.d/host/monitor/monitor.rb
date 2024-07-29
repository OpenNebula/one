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
def unindent(s)
    m = s.match(/^(\s*)/)
    spaces = m[1].size
    s.gsub!(/^ {#{spaces}}/, '')
end

def topology(nodes, pages, mem)
    st = ''

    nodes.times do |i|
        pages.each do |p|
            st << "HUGEPAGE = [ SIZE = \"#{p}\", FREE = \"1024\", "\
                " NODE_ID = \"#{i}\"]\n"
        end

        memn = mem.to_i/nodes

        st << "MEMORY_NODE = [ NODE_ID = \"#{i}\", FREE = \"#{rand(memn)}\","\
            " USED = \"#{rand(memn)}\"]\n"
    end

    st
end

def system(cpu, mem)
    used_memory = rand(mem)
    used_cpu    = rand(cpu)

    unindent(<<-EOS)
        USEDMEMORY=#{used_memory}
        FREEMEMORY=#{16777216-used_memory}
        USEDCPU=#{used_cpu}
        FREECPU=#{800-used_cpu}
        NETTX=1241307203246698
        NETRX=50104108822222
    EOS
end

result = ''

result << topology(2, [2048, 1048576], 16777216)
result << system(800, 16777216)

puts result
