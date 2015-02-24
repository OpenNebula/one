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

require "pp"

XENTOP_PATH="/usr/sbin/xentop"

dir=File.basename(Dir.pwd)
if dir.match(/^xen4/)
    XM_PATH="/usr/sbin/xl"
else
    XM_PATH="/usr/sbin/xm"
end

def print_info(name, value)
    value = "0" if value.nil? or value.to_s.strip.empty?
    puts "#{name}=#{value}"
end

xentop_text=`sudo #{XENTOP_PATH} -bi2`
exit(-1) if $?.exitstatus != 0

xm_text=`sudo #{XM_PATH} info`
exit(-1) if $?.exitstatus != 0

#xentop_text.gsub!(/^xentop.*^xentop.*?$/m, "") # Strip first top output
xentop_text.gsub!("no limit", "no_limit")

lines=xentop_text.split("\n")

block_size=lines.length/2
valid_lines=lines.last(block_size)
first_domain = 4
valid_lines.each_with_index{ |l,i|
    if l.match 'NAME  STATE'
        first_domain=i+1
        break
    end
}

domain_info_line=xentop_text[0]
memory_info_line=xentop_text[1]
domains_info=valid_lines[first_domain..-1]


# Getting information from xm info

memory_info=Hash.new
cpu_info=Hash.new

free_memory=nil
max_free_memory=nil

xm_text.each_line {|line|
    columns=line.split(":").collect {|c| c.strip }

    case columns[0]
    when 'total_memory'
        memory_info[:total]=columns[1].to_i*1024
    when 'max_free_memory'
        max_free_memory=columns[1].to_i*1024
    when 'free_memory'
        free_memory=columns[1].to_i*1024
    when 'nr_cpus'
        cpu_info[:total]=columns[1].to_f*100
    when 'cpu_mhz'
        cpu_info[:speed]=columns[1]
    end
}

if max_free_memory
    memory_info[:free]=max_free_memory
else
    memory_info[:free]=free_memory
end

memory_info[:used]=memory_info[:total]-memory_info[:free]

# DOMAINS LINES

vm_info=Hash.new
vm_info[:cpu]=0.0
vm_info[:nettx]=0
vm_info[:netrx]=0

domains_info.each {|line|
    l=line.strip.split
    vm_info[:cpu]+=l[3].to_f
    vm_info[:nettx]+=l[10].to_i
    vm_info[:netrx]+=l[11].to_i
}


# WRITE INFO

print_info("HYPERVISOR","xen")
print_info("TOTALCPU",cpu_info[:total].round.to_s)
print_info("CPUSPEED",cpu_info[:speed])
print_info("TOTALMEMORY",memory_info[:total].to_s)
print_info("FREEMEMORY",memory_info[:free].to_s)
print_info("USEDMEMORY",memory_info[:used].to_s)
print_info("USEDCPU",vm_info[:cpu].round.to_s)
print_info("FREECPU",(cpu_info[:total]-vm_info[:cpu]).round.to_s)
print_info("NETTX",vm_info[:nettx].to_s)
print_info("NETRX",vm_info[:netrx].to_s)
