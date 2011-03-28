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

require 'OpenNebula'

include OpenNebula

class VirtualMachineOCCI < VirtualMachine
    OCCI_VM = %q{
        <COMPUTE href="<%= base_url %>/compute/<%= self.id.to_s  %>">
            <ID><%= self.id.to_s%></ID>
            <CPU><%= self['TEMPLATE/CPU'] %></CPU>
            <MEMORY><%= self['TEMPLATE/MEMORY'] %></MEMORY>
            <NAME><%= self.name%></NAME>
            <% if self['TEMPLATE/INSTANCE_TYPE'] %>
            <INSTANCE_TYPE><%= self['TEMPLATE/INSTANCE_TYPE'] %></INSTANCE_TYPE>
            <% end %>
            <STATE><%= self.state_str %></STATE>
            <% self.each('TEMPLATE/DISK') do |disk| %>
            <DISK id="<%= disk['DISK_ID']%>">
                <% if disk['SAVE_AS'] %>
                <SAVE_AS href="<%= base_url %>/storage/<%= disk['SAVE_AS'] %>"/>
                <% end %>
                <STORAGE href="<%= base_url %>/storage/<%= disk['IMAGE_ID'] %>" name="<%= disk['IMAGE'] %>"/>
                <TYPE><%= disk['TYPE'] %></TYPE>
                <TARGET><%= disk['TARGET'] %></TARGET>
            </DISK>
            <% end %>
            <% self.each('TEMPLATE/NIC') do |nic| %>
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
            <% if self['TEMPLATE/CONTEXT'] %>
            <CONTEXT>
            <% self.each('TEMPLATE/CONTEXT/*') do |cont| %>
                <% if cont.text %>
                <<%= cont.name %>><%= cont.text %></<%= cont.name %>>
                <% end %>
            <% end %>
            </CONTEXT>
            <% end %>
        </COMPUTE>
    }
    
    # Class constructor
    def initialize(xml, client, xml_info=nil, types=nil, base=nil)
        super(xml, client)
        @vm_info  = nil
        @template = nil
        @common_template = base + '/common.erb' if base
        
        if xml_info != nil
            xmldoc   = XMLElement.build_xml(xml_info, 'COMPUTE')
            @vm_info = XMLElement.new(xmldoc) if xmldoc != nil
        end
        
        if @vm_info != nil
            itype = @vm_info['INSTANCE_TYPE']
            
            if itype != nil and types[itype] != nil
                @template = base + "/#{types[itype]['TEMPLATE']}"
            end
        end
        
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
        if @vm_info == nil
            error_msg = "Missing COMPUTE section in the XML body"
            return OpenNebula::Error.new(error_msg), 400
        end
        
        if @template == nil
            return OpenNebula::Error.new("Bad instance type"), 500
        end
        
        begin
            template = ERB.new(File.read(@common_template)).result(binding)
            template << ERB.new(File.read(@template)).result(binding)
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end
        
        return template
    end
    
    # Creates the VMI representation of a Virtual Machine
    def to_occi(base_url)
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




