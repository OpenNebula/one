#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
    value = "0" if value.nil? or value.to_s.strip.empty?
    puts "#{name}=#{value}"
end

######
#  First, get all the posible info out of virsh
#  TODO : use virsh freecell when available
######

nodeinfo_text = `LANG=C virsh -c qemu:///system nodeinfo`
exit(-1) if $?.exitstatus != 0

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

NETINTERFACE = "eth|bond|em|enp2|p[0-9]+p[0-9]+"

stat = `cat /proc/stat`

stat.each_line do |line|
  if /\Acpu (.*)\Z/.match(line)
    stat_cpu = Regexp.last_match[1].to_s.split
    stat_total_cpu = stat_cpu.inject(0) {|s,sum| sum.to_i+s.to_i}.to_i
    $free_cpu = $total_cpu * stat_cpu[3].to_f / stat_total_cpu
    $used_cpu = $total_cpu - $free_cpu
  end
end

memory = `cat /proc/meminfo`
meminfo = Hash.new()
memory.each_line do |line|
  key, value = line.split(':')
  meminfo[key] = /\d+/.match(value)[0].to_i
end

$total_memory = meminfo['MemTotal']

$used_memory = meminfo['MemTotal'] - meminfo['MemFree'] - meminfo['Buffers'] - meminfo['Cached']
$free_memory = $total_memory - $used_memory

net_text=`cat /proc/net/dev`
exit(-1) if $?.exitstatus != 0

$netrx = 0
$nettx = 0

net_text.split(/\n/).each{|line|
    if line.match("^ *#{NETINTERFACE}")
        arr   = line.split(":")[1].split(" ")
        $netrx += arr[0].to_i
        $nettx += arr[8].to_i
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
