#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2010-2011, C12G Labs S.L                                           #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

ONE_LOCATION=ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
   ETC_LOCATION      = "/etc/one"  if !defined?(ETC_LOCATION)
   RUBY_LIB_LOCATION = "/usr/lib/one/ruby"  if !defined?(RUBY_LIB_LOCATION)
else
   ETC_LOCATION      = ONE_LOCATION+"/etc"  if !defined?(ETC_LOCATION)
   RUBY_LIB_LOCATION = ONE_LOCATION+"/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
end

$: << RUBY_LIB_LOCATION

require 'OpenNebula'
include OpenNebula
require 'vmwarelib'

begin
    client = Client.new()
rescue Exception => e
    puts "Error: #{e}"
    exit(-1)
end

def add_info(name, value)
    value = "0" if value.nil? or value.to_s.empty?
    result_str << "#{name}=#{value} "
end

def print_info
    puts result_str
end

result_str = ""

host       = ARGV[2]

if !@host
    exit -1
end

vmware_drv = VMWareDriver.new(host)

data = vmware_drv.poll_hypervisor

data.split(/\n/).each{|line|
    if line.match('^CPU\(s\)')
        $total_cpu   = line.split(":")[1].strip.to_i * 100
    elsif line.match('^CPU frequency')
        $cpu_speed   = line.split(":")[1].strip.split(" ")[0]
    elsif line.match('^Memory size')
        $total_memory = line.split(":")[1].strip.split(" ")[0]
    end
}

# Loop through all vms
used_memory = 0
used_cpu    = 0

vms = VirtualMachinePool.new(client)

rc = vms.info
if OpenNebula.is_error?(rc)
    warn "Couldn't reach OpenNebula, aborting."
    exit -1
end

vm_ids_array = vms.retrieve_elements("/VM_POOL/VM[STATE=3 or STATE=5]/HISTORY_RECORDS/HISTORY[HOSTNAME=\"#{@host}\"]/../ID")

if vm_ids_array
    vm_ids_array.each do |vm_id|
        vm=OpenNebula::VirtualMachine.new_with_id(vm_id, client)
        rc = vm.info
        
        if OpenNebula.is_error?(rc)
            warn "Couldn't reach OpenNebula, aborting."
            exit -1
        end

        used_memory = used_memory + (vm['TEMPLATE/MEMORY'].to_i * 1024)
        used_cpu    = used_cpu    + (vm['TEMPLATE/CPU'].to_f * 100)
    end
end

# 80% of the total free calculated memory to take hypervisor into account
free_memory = ($total_memory.to_i - used_memory) * 0.8
# assume all the host's CPU is devoted to running Virtual Machines
free_cpu    = ($total_cpu.to_f    - used_cpu)

add_info("HYPERVISOR","vmware")
add_info("TOTALCPU",$total_cpu)
add_info("FREECPU",free_cpu.to_i)
add_info("CPUSPEED",$cpu_speed)
add_info("TOTALMEMORY",$total_memory)
add_info("FREEMEMORY",free_memory.to_i)

print_info
