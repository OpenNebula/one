#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2010-2013, C12G Labs S.L                                           #
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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
   BIN_LOCATION = "/usr/bin" 
   LIB_LOCATION = "/usr/lib/one"
   ETC_LOCATION = "/etc/one/" 
   VAR_LOCATION = "/var/lib/one"
   RUBY_LIB_LOCATION = "/usr/lib/one/ruby"  
else
   LIB_LOCATION = ONE_LOCATION + "/lib"
   BIN_LOCATION = ONE_LOCATION + "/bin" 
   ETC_LOCATION = ONE_LOCATION  + "/etc/"
   VAR_LOCATION = ONE_LOCATION + "/var/"
   RUBY_LIB_LOCATION = ONE_LOCATION+"/lib/ruby" 
end

$: << RUBY_LIB_LOCATION

CONF_FILE   = ETC_LOCATION + "/vmwarerc"

ENV['LANG'] = 'C'

require "scripts_common"
require 'yaml'
require "CommandManager"
require 'opennebula'
include OpenNebula

begin
    client = Client.new()
rescue Exception => e
    puts "Error: #{e}"
    exit(-1)
end

# ######################################################################## #
#                          DRIVER HELPER FUNCTIONS                         #
# ######################################################################## #

#Generates an ESX command using ttyexpect
def esx_cmd(command)
    cmd = "#{BIN_LOCATION}/tty_expect -u #{@user} -p #{@pass} #{command}"
end

#Performs a action usgin libvirt
def do_action(cmd)
    rc = LocalCommand.run(esx_cmd(cmd))

    if rc.code == 0
        return [true, rc.stdout]
    else
        err = "Error executing: #{cmd} err: #{rc.stderr} out: #{rc.stdout}"
        OpenNebula.log_error(err)
        return [false, rc.code]
    end
end

@result_str = ""

def add_info(name, value)
    value = "0" if value.nil? or value.to_s.empty?
    @result_str << "#{name}=#{value}\n"
end

def print_info
    puts @result_str
end

def get_vm_names
    rc, data = do_action("virsh -c #{@uri} --readonly list")
    return [] if !rc

    data.gsub!(/^.*----$/m, '')

    data.strip! if data


    lines=data.split(/\n/)

    lines.map do |line|
        line.split(/\s+/).delete_if {|d| d.empty? }[1]
    end.compact
end

def get_vm_info(host, vm)
    `../../vmm/vmware/poll #{vm} #{host}`.strip
end

def get_all_vm_info(host, vms)
    puts "VM_POLL=YES"
    vms.each do |vm|
        info=get_vm_info(host, vm)

        number = -1
        if (vm =~ /^one-\d*$/)
            number = vm.split('-').last
        end

        puts "VM=["
        puts "  ID=#{number},"
        puts "  DEPLOY_ID=#{vm},"
        puts "  POLL=\"#{info}\" ]"
    end
end

# ######################################################################## #
#                          Main Procedure                                  #
# ######################################################################## #

host       = ARGV[2]

if !host
    exit -1
end

conf  = YAML::load(File.read(CONF_FILE))

@uri  = conf[:libvirt_uri].gsub!('@HOST@', host)

@user = conf[:username]
if conf[:password] and !conf[:password].empty?
   @pass=conf[:password]
else
   @pass="\"\""
end

# Poll the VMware hypervisor

rc, data = do_action("virsh -c #{@uri} --readonly nodeinfo")

if rc == false
    exit data
end

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

# Scheduler will take hypervisor memory usage into account
free_memory = ($total_memory.to_i - used_memory)
# assume all the host's CPU is devoted to running Virtual Machines
free_cpu    = ($total_cpu.to_f    - used_cpu)

add_info("HYPERVISOR","vmware")
add_info("TOTALCPU",$total_cpu)
add_info("FREECPU",free_cpu.to_i)
add_info("CPUSPEED",$cpu_speed)
add_info("TOTALMEMORY",$total_memory)
add_info("FREEMEMORY",free_memory.to_i)

print_info

get_all_vm_info(host, get_vm_names)
