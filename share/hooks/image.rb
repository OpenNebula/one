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

if !(vm_id=ARGV[0])
    exit -1
end


client = Client.new()

vm = VirtualMachine.new(
                VirtualMachine.build_xml(vm_id),
                client)
vm.info

vm.each('TEMPLATE/DISK') do |disk| 
    disk_id     = disk["DISK_ID"]
    source_path = VMDIR+"/#{vm_id}/disk.#{disk_id}"
    
    image_id = nil
    if disk["SAVE_AS"] 
        image_id = disk["SAVE_AS"]
    end
    
    if image_id and source_path
        image=Image.new(
                Image.build_xml(image_id),
                client)
                
        result = image.info
        exit -1 if OpenNebula.is_error?(result)

        # Disable the Image for a safe overwriting
        # image.disable
    
        # Save the image file
        result = image.move(source_path, image['SOURCE']) 
        
        exit -1 if OpenNebula.is_error?(result)
    
        # image.enable
    end
end
