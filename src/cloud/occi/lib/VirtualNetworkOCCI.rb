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
        <NETWORK>
            <ID><%= self.id.to_s %></ID>
            <NAME><%= self.name %></NAME>
            <ADDRESS><%= template['NETWORK_ADDRESS'] %></ADDRESS>
            <% if template['NETWORK_SIZE'] %>
            <SIZE><%= template['NETWORK_SIZE'] %></SIZE>
            <% end %>
        </NETWORK>
    }

    ONE_NETWORK = %q{
        NAME            = <%= vnet_info['NAME'] %>
        TYPE            = RANGED
        BRIDGE          = <%= vnet_info['BRIDGE'] %>
        NETWORK_ADDRESS = <%= vnet_info['ADDRESS'] %>
        NETWORK_SIZE    = <%= vnet_info['SIZE'] %>
    }.gsub(/^        /, '')

    # Class constructor
    def initialize(vnet_info, xml, client)
        super(xml, client)

        @vnet_info = vnet_info
    end
    
    # Creates the OCCI representation of a Virtual Network
    def to_occi()        
        vn_hash = self.to_hash
        return vn_hash, 500 if OpenNebula.is_error?(vn_hash)
        
        template = vn_hash['VNET']['TEMPLATE']

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
        if @vnet_info['NETWORK']
            vnet_info = @vnet_info['NETWORK']
        else            
            error_msg = "Missing STORAGE section in the XML body"
            error = OpenNebula::Error.new(error_msg)
            return error
        end
            
        one = ERB.new(ONE_NETWORK)
        return one.result(binding)
    end
end
