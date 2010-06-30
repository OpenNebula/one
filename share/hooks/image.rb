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
require 'client_utilities'
require 'pp'

if !(vm_id=ARGV[0])
    exit -1
end

vm=OpenNebula::VirtualMachine.new_with_id(vm_id, get_one_client)
vm.info
template=vm.to_hash
template=template['VM']['TEMPLATE']
disks=[template['DISK']].flatten if template['DISK']
disks.each_with_index do |disk,i|
    source_path=VMDIR+"/#{vm_id}/disk.#{i}"
    if disk["NAME"]# and File.exists?(source_path)        
        if nil#disk["SAVE_AS"] 
            # Perform the allocate if all goes well
            image=OpenNebula::Image.new(
                OpenNebula::Image.build_xml, get_one_client)
            begin
                template="NAME=#{disk['SAVE_AS']}\n"
                template+="TYPE=#{disk['TYPE'].upcase}\n" if DISK["TYPE"]
                result=image.allocate(template)
            rescue
                result=OpenNebula::Error.new("Error in template")
            end

            # Get the allocated image 
            image=OpenNebula::Image.new_with_id(image.id, get_one_client)
            image.info
            template=image.to_hash
            template=template['IMAGE']['TEMPLATE']

            if !is_successful?(result) 
                exit -1
            end
        elsif disk["OVERWRITE"]
            # Get the allocated image 
            image=OpenNebula::Image.new_with_id(disk['IID'], get_one_client)
            image.info
            image.disable                                        
        end
        # Perform the copy to the image repo if needed
        if File.copy(source_path, image['SOURCE'])
            result=image.enable
        else
            result=OpenNebula::Error.new(
                 "Cannot copy image, please update before enabling it.")
        end
    end
end