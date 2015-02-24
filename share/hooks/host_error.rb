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

##############################################################################
# Script to implement host failure tolerance
#   It can be set to
#           -m migrate VMs to another host. Only for images in shared storage
#           -r recreate VMs running in the host. State will be lost.
#           -d delete VMs running in the host
#   Additional flags
#           -f force resubmission of suspended VMs
#           -p <n> avoid resubmission if host comes
#                  back after n monitoring cycles
##############################################################################

##############################################################################
# WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
#
# This script needs to fence the error host to prevent split brain VMs. You
# may use any fence mechanism and invoke it around L105, using host_name
#
# WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
#############################################################################

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    VMDIR="/var/lib/one"
    CONFIG_FILE="/var/lib/one/config"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    VMDIR=ONE_LOCATION+"/var"
    CONFIG_FILE=ONE_LOCATION+"/var/config"
end

$: << RUBY_LIB_LOCATION

require 'opennebula'
include OpenNebula

require 'getoptlong'

if !(host_id=ARGV[0])
    exit -1
end

mode   = "-r" # By default, recreate VMs
force  = "n"  # By default, don't recreate/delete suspended VMs
repeat = nil  # By default, don't wait for monitorization cycles"

opts = GetoptLong.new(
            ['--migrate',  '-m',GetoptLong::NO_ARGUMENT],
            ['--delete',   '-d',GetoptLong::NO_ARGUMENT],
            ['--recreate', '-r',GetoptLong::NO_ARGUMENT],
            ['--force',    '-f',GetoptLong::NO_ARGUMENT],
            ['--pause',    '-p',GetoptLong::REQUIRED_ARGUMENT]
        )

begin
    opts.each do |opt, arg|
        case opt
            when '--migrate'
                mode="-m"
            when '--delete'
                mode="-d"
            when '--recreate'
                mode="-r"
            when '--force'
                force  = "y"
            when '--pause'
                repeat = arg.to_i
        end
    end
rescue Exception => e
    exit(-1)
end

begin
    client = Client.new()
rescue Exception => e
    puts "Error: #{e}"
    exit -1
end

# Retrieve hostname
host  =  OpenNebula::Host.new_with_id(host_id, client)
rc = host.info
exit -1 if OpenNebula.is_error?(rc)
host_name = host.name

if repeat
    # Retrieve host monitor interval
    monitor_interval = nil
    File.readlines(CONFIG_FILE).each{|line|
         monitor_interval = line.split("=").last.to_i if /MONITORING_INTERVAL/=~line
    }
    # Sleep through the desired number of monitor interval
    sleep (repeat * monitor_interval)

    # If the host came back, exit! avoid duplicated VMs
    exit 0 if host.state != 3
end

# Loop through all vms
vms = VirtualMachinePool.new(client)
rc = vms.info_all
exit -1 if OpenNebula.is_error?(rc)


state = "STATE=3"
state += " or STATE=5" if force == "y"

vm_ids_array = vms.retrieve_elements("/VM_POOL/VM[#{state}]/HISTORY_RECORDS/HISTORY[HOSTNAME=\"#{host_name}\" and last()]/../../ID")

if vm_ids_array
    vm_ids_array.each do |vm_id|
        vm=OpenNebula::VirtualMachine.new_with_id(vm_id, client)
        vm.info

        if mode == "-r"
            vm.delete(true)
        elsif mode == "-d"
            vm.delete
        elsif mode == "-m"
            vm.resched
        end
    end
end

