# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'quota'
require 'base64'

class SimplePermissions
    
    def initialize(database, client, conf={})
        @quota=Quota.new(database, client, conf[:quota] || {})
        @quota_enabled=conf[:quota][:enabled]
    end
    
    # Returns message if result is false, true otherwise
    def auth_message(result, message)
        result ? true : message
    end
    
    # Extracts cpu and memory resources from the VM template sent in
    # authorization message
    def get_vm_usage(data)
        vm_xml=Base64::decode64(data)
        vm=OpenNebula::VirtualMachine.new(
            OpenNebula::XMLElement.build_xml(vm_xml, 'TEMPLATE'),
            OpenNebula::Client.new)
        
        # Should set more sensible defaults or get driver configuration
        cpu=vm['CPU']
        cpu||=1.0
        cpu=cpu.to_f
        
        memory=vm['MEMORY']
        memory||=64
        memory=memory.to_f
        
        VmUsage.new(cpu, memory)
    end

    # Checks if the quota is enabled, and if it is not exceeded
    def check_quota_enabled(uid, object, id, auth_result)
        if @quota_enabled and object=='VM' and auth_result
            STDERR.puts 'quota enabled'
            @quota.update(uid.to_i)
            if !@quota.check(uid.to_i, get_vm_usage(id))
                auth_result="Quota exceeded"
            end
        end

        return auth_result
    end

    # Method called by authorization driver
    def auth(uid, tokens)
        result=true
        
        tokens.each do |token|
            object, id, action, owner, pub=token.split(':')
            result=auth_object(uid.to_s, object, id, action, owner, pub)
            break result if result!=true
        end
        
        result
    end
    
    # Authorizes each of the tokens. All parameters are strings. Pub
    # means public when "1" and private when "0"
    def auth_object(uid, object, id, action, owner, pub)
        return true if uid=='0'
        
        auth_result=false
        
        case action
        when 'CREATE'
            auth_result=true if %w{VM NET IMAGE TEMPLATE}.include? object
            auth_result = check_quota_enabled(uid, object, id, auth_result)

        when 'INSTANTIATE'
            auth_result = true if %w{VM}.include? object
            auth_result = check_quota_enabled(uid, object, id, auth_result)

        when 'DELETE'
            auth_result = (owner == uid)
            
        when 'USE'
            if %w{VM NET IMAGE TEMPLATE}.include? object
                auth_result = ((owner == uid) | (pub=='1'))
            elsif object == 'HOST'
                auth_result=true
            end
            
        when 'MANAGE'
            auth_result = (owner == uid)
            
        when 'INFO'
        end
        
        return auth_result
    end
end
