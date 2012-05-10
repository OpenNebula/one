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

require 'OpenNebula'

include OpenNebula

class VirtualMachineOCCI < VirtualMachine
    OCCI_VM = %q{
        <COMPUTE href="<%= base_url %>/compute/<%= self.id.to_s  %>">
            <ID><%= self.id.to_s%></ID>
            <USER href="<%= base_url %>/user/<%= self['UID'] %>" name="<%= self['UNAME'] %>"/>
            <GROUP><%= self['GNAME'] %></GROUP>
            <CPU><%= self['TEMPLATE/CPU'] %></CPU>
            <MEMORY><%= self['TEMPLATE/MEMORY'] %></MEMORY>
            <NAME><%= self.name%></NAME>
            <% if self['TEMPLATE/INSTANCE_TYPE'] %>
            <INSTANCE_TYPE href="<%= base_url %>/instance_type/<%= self['TEMPLATE/INSTANCE_TYPE'] %>"><%= self['TEMPLATE/INSTANCE_TYPE'] %></INSTANCE_TYPE>
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
            <% if self.has_elements?('TEMPLATE/CONTEXT') %>
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

    OCCI_ACTION = {
        "STOPPED"   => { :from => ["ACTIVE"], :action => :stop},
        "SUSPENDED" => { :from => ["ACTIVE"], :action => :suspend},
        "RESUME"    => { :from => ["STOPPED", "SUSPENDED"], :action => :resume},
        "CANCEL"    => { :from => ["ACTIVE"], :action => :cancel},
        "REBOOT"    => { :from => ["ACTIVE"], :action => :reboot},
        "RESET"     => { :from => ["ACTIVE"], :action => :reset},
        "SHUTDOWN"  => { :from => ["ACTIVE"], :action => :shutdown},
        "DONE"      => { :from => VM_STATE,   :action => :finalize}
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
            if href = @vm_info.attr('INSTANCE_TYPE','href')
                @itype = href.split('/').last
            else
                @itype = @vm_info['INSTANCE_TYPE']
            end

            if @itype != nil and types[@itype.to_sym] != nil
                @template = base + "/#{types[@itype.to_sym][:template]}"
            end
        end

    end

    def to_one_template()
        if @vm_info == nil
            error_msg = "Missing COMPUTE section in the XML body"
            return OpenNebula::Error.new(error_msg)
        end

        if @template == nil
            return OpenNebula::Error.new("Bad instance type")
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
    def to_occi(base_url, verbose=false)
        begin
            occi_vm = ERB.new(OCCI_VM)
            occi_vm_text = occi_vm.result(binding)
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end

        return occi_vm_text.gsub(/\n\s*/,'')
    end

    # Update de resource from an XML representation of the COMPUTE
    # @param [String] xml_compute XML representation of the COMPUTE
    # @return [[nil, OpenNebula::Error], HTTP_CODE] If there is no error
    #   the first component is nil.
    def update_from_xml(xml_compute)
        xmldoc  = XMLElement.build_xml(xml_compute, 'COMPUTE')
        vm_info = XMLElement.new(xmldoc) if xmldoc != nil

        action = nil
        args   = []

        # Check if a state change is required
        occi_state = vm_info['STATE']

        if occi_state
            # If a state is provided
            occi_state.upcase!
            if OCCI_ACTION.keys.include?(occi_state)
                # If the requested state is one the OCCI action states
                shash = OCCI_ACTION[occi_state]
                if shash[:from].include?(state_str)
                    # Action to be performed
                    action = shash[:action]
                elsif occi_state != state_str
                    # If the requested state is different from the resource
                    # state but it does not belong to the "from" state array
                    error_msg = "The state of the resource cannot be changed" \
                        " from #{state_str} to #{occi_state}."
                    error = OpenNebula::Error.new(error_msg)
                    return error, 403
                end
            elsif !VM_STATE.include?(occi_state)
                # The requested state is not one of the OCCI action states nor
                # a resource state
                error_msg = "Invalid state: \"#{occi_state}\""
                error = OpenNebula::Error.new(error_msg)
                return error, 400
            end
        end

        # Check if a disk image save as is required
        image_name = nil
        vm_info.each('DISK/SAVE_AS') { |save_as|
            image_name = save_as.attr('.', 'name')
            if image_name
                if action
                    # Return erro if an action has been defined before
                    if action == :save_as
                        error_msg = "Only one disk can be saved per request"
                    else
                        error_msg = "Changig the state of the resource and" \
                            " saving a disk is not allowed in the same request"
                    end
                    error = OpenNebula::Error.new(error_msg)
                    return error, 403
                else
                    # if no action is defined yet and a save_as is requested
                    action  = :save_as
                    disk_id = save_as.attr('..', 'id')

                    # Params for the save_as action:
                    # save_as(disk_id, image_name)
                    args << disk_id.to_i
                    args << image_name
                end
            end
        }

        # Perform the requested action
        if action
            rc = self.send(action, *args)
            if OpenNebula.is_error?(rc)
                return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
            else
                return nil, 202
            end
        else
            # There is no change requested
            return nil, 200
        end
    end
end




