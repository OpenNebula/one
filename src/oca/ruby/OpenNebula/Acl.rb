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

require 'OpenNebula/Pool'

module OpenNebula
    class Acl < XMLElement

        #######################################################################
        # Constants and Class Methods
        #######################################################################
        ACL_METHODS = {
            :info       => "acl.info",
            :addrule    => "acl.addrule",
            :delrule    => "acl.delrule"
        }

        #######################################################################
        # Class constructor
        #######################################################################
        def initialize(client)
            @client = client
        end

        #######################################################################
        # XML-RPC Methods
        #######################################################################

        # Retrieves the ACL rule set
        def info()
            rc = @client.call( ACL_METHODS[:info] )

            if !OpenNebula.is_error?(rc)
                initialize_xml(rc, 'ACL')
                rc = nil
            end

            return rc
        end

        # Adds a new ACL rule.
        #
        # +user+ A hex number, e.g. 0x100000001
        # +resource+ A hex number, e.g. 0x2100000001
        # +rights+ A hex number, e.g. 0x10
        def addrule(user, resource, rights)
            rc = @client.call( ACL_METHODS[:addrule], user, resource, rights )

            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Deletes an existing ACL rule.
        #
        # +user+ A hex number, e.g. 0x100000001
        # +resource+ A hex number, e.g. 0x2100000001
        # +rights+ A hex number, e.g. 0x10
        def delrule(user, resource, rights)
            rc = @client.call( ACL_METHODS[:delrule], user, resource, rights )

            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        #######################################################################
        # Helpers
        #######################################################################

    private

    end
end
