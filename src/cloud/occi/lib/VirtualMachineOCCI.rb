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

include OpenNebula

class VirtualMachineOCCI < VirtualMachine
    OCCI_VM = %q{
        <COMPUTE>
            <ID><%= self.id.to_s%></ID>
            <NAME><%= self.name%></NAME>
            <% if template['INSTANCE_TYPE'] %> 
            <INSTANCE_TYPE><%= template['INSTANCE_TYPE'] %></INSTANCE_TYPE>
            <% end %>
            <STATE><%= self.state_str %></STATE>
            <% if template['DISK'] %>
                <% template['DISK'].each do |disk| %> 
            <DISK>
                <STORAGE href="<%= base_url %>/storage/<%= disk['IMAGE_ID'] %>" name="<%= disk['IMAGE'] %>"/>
                <TYPE><%= disk['TYPE'] %></TYPE>
                <TARGET><%= disk['TARGET'] %></TARGET>
                <% if disk['CLONE']=='NO' %>
                <OVERWRITE/>
                <% end %>
                <% if disk['SAVE_AS'] %>
                <SAVE_AS><%= disk['SAVE_AS'] %></SAVE_AS>
                <% end %>
            </DISK>
                <% end %>
            <% end %>
            <% if template['NIC'] %>
                <% template['NIC'].each do |nic| %> 
            <NIC>
                <NETWORK href="<%= base_url %>/network/<%= nic['NETWORK_ID'] %>" name="<%= nic['NETWORK'] %>"/>
                <% if nic['IP'] %>
                <IP><%= nic['IP'] %></IP>
                <% end %>
                <% if nic['MAC'] %>
                <MAC><%= nic['MAC'] %></MAC>
                <% end %>
            </NIC>
                <% end %>
            <% end %>
        </COMPUTE>     
    }
    
    # Class constructor
    def initialize(vm_info, xml, client)
        super(xml, client)

        @vm_info = vm_info
    end
    
    def mk_action(action_str)
        case action_str.downcase
            when "stopped" 
                rc = self.stop
            when "suspended"
                rc = self.suspend
            when "resume"
                rc = self.resume
            when "cancel"
                rc = self.cancel
            when "shutdown"
                rc = self.shutdown
            when "done"  
                rc = self.finalize  
            else 
                error_msg = "Invalid state"
                error = OpenNebula::Error.new(error_msg)
                return error
        end
        
        return rc
    end
    
    def to_one_template()
        if @vm_info['COMPUTE']
            vm_info = @vm_info['COMPUTE']
            vm_info['DISK'] = [vm_info['DISK']].flatten if vm_info['DISK']
            vm_info['NIC'] = [vm_info['NIC']].flatten if vm_info['NIC']
        else
            error_msg = "Missing COMPUTE section in the XML body"
            error = OpenNebula::Error.new(error_msg)
            return error, 400
        end        
        
        begin
            template = ERB.new(File.read(@vm_info['TEMPLATE_PATH']))
            template_text = template.result(binding) 
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end    

        return template_text 
    end
    
    # Creates the VMI representation of a Virtual Machine
    def to_occi(base_url)
        vm_hash = self.to_hash
        return vm_hash, 500 if OpenNebula.is_error?(vm_hash)
        
        template = vm_hash['VM']['TEMPLATE']
        template['DISK']=[template['DISK']].flatten if template['DISK']
        template['NIC']=[template['NIC']].flatten if template['NIC']

        begin
            occi_vm = ERB.new(OCCI_VM)
            occi_vm_text = occi_vm.result(binding) 
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end    

        return occi_vm_text.gsub(/\n\s*/,'')
    end
end




