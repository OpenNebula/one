# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'opennebula'

include OpenNebula

class UserOCCI < User
    FORCE_USAGE = true

    OCCI_USER = %q{
        <USER href="<%= base_url %>/user/<%= self.id.to_s  %>">
            <ID><%= self.id.to_s %></ID>
            <NAME><%= self.name %></NAME>
            <GROUP><%= self['GNAME'] %></GROUP>
            <%= self.element_xml('DATASTORE_QUOTA') %>
            <%= self.element_xml('NETWORK_QUOTA') %>
            <%= self.element_xml('VM_QUOTA') %>
            <%= self.element_xml('IMAGE_QUOTA') %>
        </USER>
    }

    # Class constructor
    def initialize(xml, client)
        super(xml, client)
    end

    # Creates the OCCI representation of a User
    def to_occi(base_url, verbose=false)
        occi = ERB.new(OCCI_USER)
        return occi.result(binding).gsub(/\n\s*/,'')
    end
end
