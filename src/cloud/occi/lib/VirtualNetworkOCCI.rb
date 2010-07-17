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

class VirtualNetworkOCCI < VirtualNetwork
    OCCI_NETWORK = %q{
        <NETWORK href="<%= base_url %>/network/<%= self.id.to_s  %>">
            <ID><%= self.id.to_s %></ID>
            <NAME><%= self.name %></NAME>
            <ADDRESS><%= self['TEMPLATE/NETWORK_ADDRESS'] %></ADDRESS>
            <% if self['TEMPLATE/NETWORK_SIZE'] %>
            <SIZE><%= self['TEMPLATE/NETWORK_SIZE'] %></SIZE>
            <% end %>
        </NETWORK>
    }

    ONE_NETWORK = %q{
        NAME            = <%= @vnet_info.elements['NAME'].text %>
        TYPE            = RANGED
        BRIDGE          = <%= @vnet_info.elements['BRIDGE'].text %>
        NETWORK_ADDRESS = <%= @vnet_info.elements['ADDRESS'].text %>
        NETWORK_SIZE    = <%= @vnet_info.elements['SIZE'].text %>
    }.gsub(/^        /, '')

    # Class constructor
    def initialize(xml, client, xml_info=nil, bridge=nil)
        super(xml, client)

        if xml_info != nil and bridge != nil
            @vnet_info = REXML::Document.new(xml_info).root

            bridge_element = REXML::Element.new("BRIDGE")
            bridge_element.add_text(bridge)

            @vnet_info.add(bridge_element)
        else
            @vnet_info = nil
        end
    end

    # Creates the OCCI representation of a Virtual Network
    def to_occi(base_url)
        begin
            occi = ERB.new(OCCI_NETWORK)
            occi_text = occi.result(binding)
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end

        return occi_text.gsub(/\n\s*/,'')
    end

    def to_one_template()
        if @vnet_info.name != 'NETWORK'
            error_msg = "Missing NETWORK section in the XML body"
            error = OpenNebula::Error.new(error_msg)
            return error
        end

        one = ERB.new(ONE_NETWORK)
        return one.result(binding)
    end
end
