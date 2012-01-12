#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

####################################################
# Script to implement host failure tolerance
#   It can be set to
#           -r resubmit VMs running in the host
#           -d delete VMs running in the host
####################################################

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    VMDIR="/var/lib/one"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    VMDIR=ONE_LOCATION+"/var"
end

$: << RUBY_LIB_LOCATION

require 'OpenNebula'
include OpenNebula

if !(host_id=ARGV[0])
    exit -1
end

if !(mode=ARGV[1]) # By default, resubmit VMs
    mode = "-r"
end

if !(force=ARGV[2]) # By default, don't resubmit/finalize suspended VMs
    force = "n"
end

begin
    client = Client.new()
rescue Exception => e
    puts "Error: #{e}"
    exit -1
end

# Retrieve hostname
host  =  OpenNebula::Host.new_with_id(host_id, client)
exit -1 if OpenNebula.is_error?(host)
host.info
host_name = host.name

# Loop through all vms
vms = VirtualMachinePool.new(client)
exit -1 if OpenNebula.is_error?(vms)

vms.info_all

state = "STATE=3"
state += " or STATE=5" if force == "y"

vm_ids_array = vms.retrieve_elements("/VM_POOL/VM[#{state}]/HISTORY_RECORDS/HISTORY[HOSTNAME=\"#{host_name}\" and last()]/../../ID")

if vm_ids_array
    vm_ids_array.each do |vm_id|
        vm=OpenNebula::VirtualMachine.new_with_id(vm_id, client)
        vm.info

        if mode == "-r"
            vm.resubmit
        elsif mode == "-d"
            vm.finalize
        end
    end
end

