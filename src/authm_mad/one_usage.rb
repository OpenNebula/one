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

require 'OpenNebula'

# This class holds usage information for a virtual machine or
# total usage for a user. Variables inside are cpu and memory
# consumption
class VmUsage
    attr_accessor :cpu, :memory
    def initialize(cpu, memory)
        @cpu=cpu
        @memory=memory
    end
end

# This class retrieves and caches vms and its consuption grouped
# by users. 'update_user' method should be called to fill data for
# a user before any calculation is made
class OneUsage
    # 'client' is an OpenNebula::Client object used to connect
    # to OpenNebula daemon. Ideally it should connect as user 0
    def initialize(client)
        @client=client
        @users=Hash.new
    end
    
    # Gets information about VMs defined for a user. It caches new
    # VMs and takes out from the cache deleted VMs
    def update_user(user)
        @users[user]=Hash.new if !@users[user]
        
        vmpool=OpenNebula::VirtualMachinePool.new(@client, user)
        vmpool.info
        
        one_ids=vmpool.map {|vm| vm.id }
        vms=@users[user]
        user_ids=vms.keys
        
        deleted_vms=user_ids-one_ids
        added_vms=one_ids-user_ids
        
        deleted_vms.each {|vmid| vms.delete(vmid) }
        
        added_vms.each do |vmid|
            vm=OpenNebula::VirtualMachine.new(
                OpenNebula::VirtualMachine.build_xml(vmid), @client)
            vm.info
            
            usage=VmUsage.new(vm['TEMPLATE/CPU'].to_f,
                vm['TEMPLATE/MEMORY'].to_i)
            vms[vmid.to_i]=usage
        end
        
        STDERR.puts Time.now.to_i
    end
    
    # Returns the cache of defined VMs for a user. It is a hash with
    # VM id as key and VmUsage as value
    def vms(user)
        vms=@users[user]
        @users[user]=vms=Hash.new if !vms
        vms
    end
    
    # Returns total consumption by a user into a VmUsage object
    def total(user)
        usage=VmUsage.new(0.0, 0)
        
        @users[user].each do |id, vm|
            usage.cpu+=vm.cpu
            usage.memory+=vm.memory
        end if @users[user]
        
        usage
    end
end
