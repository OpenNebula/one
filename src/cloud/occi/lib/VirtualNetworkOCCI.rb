# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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
require 'erb'

include OpenNebula

class VirtualNetworkOCCI < VirtualNetwork
    OCCI_NETWORK = %q{
        <NETWORK>
            <ID><%= vn_hash['VNET']['ID'].strip %></ID>
            <NAME><%= vn_hash['VNET']['NAME'].strip %></NAME>
            <ADDRESS><%= vn_hash['VNET']['TEMPLATE']['NETWORK_ADDRESS'].strip %></ADDRESS>
            <SIZE><%= vn_hash['VNET']['TEMPLATE']['NETWORK_SIZE'].strip %></SIZE>
        </NETWORK>
    }.gsub(/^        /, '')

    ONE_NETWORK = %q{
        NAME            = <%= network_hash['NAME'] %>
        TYPE            = RANGED
        BRIDGE          = <%= bridge %>
        NETWORK_ADDRESS = <%= network_hash['ADDRESS'] %>
        NETWORK_SIZE    = <%= network_hash['SIZE'] %>
    }.gsub(/^        /, '')

    # Creates the OCCI representation of a Virtual Network
    def to_occi()
        vn_hash = to_hash

        occi = ERB.new(OCCI_NETWORK)
        return occi.result(binding)
    end
    
    def to_one_template(network_hash, bridge)
         one = ERB.new(ONE_NETWORK)
         return one.result(binding)
    end
end
