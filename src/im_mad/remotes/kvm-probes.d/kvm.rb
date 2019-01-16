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

def print_info(name, value)
    value = "0" if value.nil? or value.to_s.strip.empty?
    puts "#{name}=#{value}"
end

######
#  First, get all the posible info out of virsh
#  TODO : use virsh freecell when available
######

ENV['LANG'] = 'C'
ENV['LC_ALL'] = 'C'

nodeinfo_text = `virsh -c qemu:///system nodeinfo`
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
#  CPU
######
vmstat = `vmstat 1 2`
$free_cpu = $total_cpu * ((vmstat.split("\n").to_a.last.split)[14].to_i)/100
$used_cpu = $total_cpu - $free_cpu

######
#  MEMORY
######
memory = `cat /proc/meminfo`
meminfo = Hash.new()
memory.each_line do |line|
  key, value = line.split(':')
  meminfo[key] = /\d+/.match(value)[0].to_i
end

$total_memory = meminfo['MemTotal']

$used_memory = meminfo['MemTotal'] - meminfo['MemFree'] - meminfo['Buffers'] - meminfo['Cached']
$free_memory = $total_memory - $used_memory

######
#  INTERFACE
######

NETINTERFACE = [
  'eth[0-9]+',
  'ib[0-9]+',

  # --- BIOS derived names:
  'em[0-9]+(_[0-9]+)?',
  'p[0-9]+p[0-9]+(_[0-9]+)?',

  # --- Systemd naming - type of names for en*:
  # o<index>[n<phys_port_name>|d<dev_port>] — on-board device index number
  # s<slot>[f<function>][n<phys_port_name>|d<dev_port>] — hotplug slot index number
  # x<MAC> — MAC address
  # [P<domain>]p<bus>s<slot>[f<function>][n<phys_port_name>|d<dev_port>] — PCI geographical location
  # a<vendor><model>i<instance> — Platform bus ACPI instance id
  'eno[0-9]+(n[0-9a-zA-Z]+|d[0-9]+)?',
  'ens[0-9]+(f[0-9]+)?(n[0-9a-zA-Z]+|d[0-9]+)?',
  'enx[0-9a-fA-F]{12}',
  'en(P[0-9]+)?p[0-9]+s[0-9]+(f[0-9]+)?(n[0-9a-zA-Z]+|d[0-9]+)?',
  'ena[0-9a-zA-Z]+i[0-9]+',
].join('|')

net_text=`cat /proc/net/dev`
exit(-1) if $?.exitstatus != 0

$netrx = 0
$nettx = 0

net_text.split(/\n/).each{|line|
    if line.match("^ *(#{NETINTERFACE}):")
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
