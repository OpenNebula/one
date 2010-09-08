#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

def print_info(name, value)
    value = "0" if value.nil? or value.to_s.empty?
    puts "#{name}=#{value}"
end

######
#  First, get all the posible info out of virsh 
#  TODO : use virsh freecell when available
######

nodeinfo_text = `virsh -c qemu:///system nodeinfo`
exit(-1) if $?!=0

nodeinfo_text.split(/\n/).each{|line|
    if     line.match('^CPU\(s\)') 
        $total_cpu   = line.split(":")[1].strip.to_i * 100
    elsif  line.match('^CPU frequency')
        $cpu_speed   = line.split(":")[1].strip.split(" ")[0]
    elsif  line.match('^Memory size')
        $total_memory = line.split(":")[1].strip.split(" ")[0]
    end
}

######
#   for everything else, top & proc
#####

NETINTERFACE = "eth1"

top_text=`top -bin2`
exit(-1) if $?!=0

top_text.gsub!(/^top.*^top.*?$/m, "") # Strip first top output

top_text.split(/\n/).each{|line|
    if line.match('^Mem')  
        line[4..-1].split(",").each{|elemento|
            temp = elemento.strip.split("k ")
            if temp[1] == "used"
                $used_memory = temp[0]
            end
        }
    
    elsif line.match('^Cpu')
        line[7..-1].split(",").each{|elemento|
            temp = elemento.strip.split("%")
            if temp[1]=="id"
	        idle = temp[0] 
 	        $free_cpu = idle.to_f * $total_cpu.to_f / 100 
 	        $used_cpu = $total_cpu.to_f - $free_cpu                 
                break
            end

        }
    end
}

$free_memory=`free -k|grep "buffers\/cache"|awk '{print $4}'`
    
net_text=`cat /proc/net/dev`
exit(-1) if $?!=0

net_text.split(/\n/).each{|line|
    if line.match("^ *#{NETINTERFACE}")
        arr   = line.split(":")[1].split(" ")
        $netrx = arr[0]
        $nettx = arr[8]
        break
    end
}

print_info("HYPERVISOR","kvm")

print_info("TOTALCPU",$total_cpu)
print_info("CPUSPEED",$cpu_speed)

print_info("TOTALMEMORY",$total_memory)
print_info("USEDMEMORY",$used_memory)
print_info("FREEMEMORY",$free_memory)

print_info("FREECPU",$free_cpu)
print_info("USEDCPU",$used_cpu)

print_info("NETRX",$netrx)
print_info("NETTX",$nettx)

