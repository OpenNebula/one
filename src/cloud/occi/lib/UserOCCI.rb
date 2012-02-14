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

require 'quota'

class UserOCCI < User
    FORCE_USAGE = true

    OCCI_USER = %q{
        <USER href="<%= base_url %>/user/<%= self.id.to_s  %>">
            <ID><%= self.id.to_s %></ID>
            <NAME><%= self.name %></NAME>
            <GROUP><%= self['GNAME'] %></GROUP>
            <QUOTA>
            <% user_quota.each { |key,value|
                key_s = key.to_s.upcase
                value_i = value.to_i %>
                <<%= key_s %>><%= value_i %></<%= key_s %>>
            <% } %>
            </QUOTA>
            <USAGE>
            <% user_usage.each { |key,value|
                key_s = key.to_s.upcase
                value_i = value.to_i %>
                <<%= key_s %>><%= value_i %></<%= key_s %>>
            <% } %>
            </USAGE>
        </USER>
    }

    # Class constructor
    def initialize(xml, client)
        super(xml, client)
    end

    # Creates the OCCI representation of a User
    def to_occi(base_url, verbose=false)
        quota = Quota.new
        user_usage = quota.get_usage(self.id, nil, FORCE_USAGE)
        user_usage.delete(:uid)

        user_quota = quota.get_quota(self.id)
        user_quota.delete(:uid)

        occi = ERB.new(OCCI_USER)
        return occi.result(binding).gsub(/\n\s*/,'')
    end
end
