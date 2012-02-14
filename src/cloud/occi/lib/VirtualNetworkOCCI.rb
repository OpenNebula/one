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
require 'ipaddr'

include OpenNebula

class VirtualNetworkOCCI < VirtualNetwork
    OCCI_NETWORK = %q{
        <NETWORK href="<%= base_url %>/network/<%= self.id.to_s  %>">
            <ID><%= self.id.to_s %></ID>
            <NAME><%= self.name %></NAME>
            <USER href="<%= base_url %>/user/<%= self['UID'] %>" name="<%= self['UNAME'] %>"/>
            <GROUP><%= self['GNAME'] %></GROUP>
            <% if self['TEMPLATE/DESCRIPTION'] != nil %>
            <DESCRIPTION><%= self['TEMPLATE/DESCRIPTION'] %></DESCRIPTION>
            <% end %>
            <% if network_address != nil %>
            <ADDRESS><%= network_address %></ADDRESS>
            <% end %>
            <% if network_size != nil %>
            <SIZE><%= network_size %></SIZE>
            <% end %>
            <USED_LEASES><%= self['TOTAL_LEASES'] %></USED_LEASES>
            <PUBLIC><%= self.public? ? "YES" : "NO" %></PUBLIC>
        </NETWORK>
    }

    # Class constructor
    #
    def initialize(xml, client, xml_info=nil, base=nil)
        super(xml, client)
        @vnet_info = nil
        @common_template = base + '/network.erb' if base

        if xml_info != nil
            xmldoc     = XMLElement.build_xml(xml_info, 'NETWORK')
            @vnet_info = XMLElement.new(xmldoc) if xmldoc != nil
        end
    end

    # Creates the OCCI representation of a Virtual Network
    def to_occi(base_url, verbose=false)
        network_address = nil
        network_size    = nil

        if self['RANGE/IP_START']
            network_address = self['RANGE/IP_START']

            ip_start = IPAddr.new(network_address, Socket::AF_INET)
            ip_end = IPAddr.new(self['RANGE/IP_END'], Socket::AF_INET)

            network_size = ip_end.to_i - ip_start.to_i
        end

        if self['PERMISSIONS/GROUP_U'] == "1" || self['PERMISSIONS/OTHER_U'] == "1"
            pub = "YES"
        else
            pub = "NO"
        end

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
        if @vnet_info == nil
            error_msg = "Missing NETWORK section in the XML body"
            return OpenNebula::Error.new(error_msg), 400
        end

        begin
            template = ERB.new(File.read(@common_template)).result(binding)
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end

        return template
    end
end
