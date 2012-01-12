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


require 'OpenNebula/Pool'

module OpenNebula
    class AclPool < Pool

        #######################################################################
        # Constants and Class Methods
        #######################################################################


        ACL_POOL_METHODS = {
            :info       => "acl.info",
            :addrule    => "acl.addrule",
            :delrule    => "acl.delrule"
        }

        # Class constructor
        def initialize(client)
            super('ACL_POOL','ACL',client)
        end

        def factory(element_xml)
            OpenNebula::Acl.new(element_xml, @client)
        end

        #######################################################################
        # XML-RPC Methods
        #######################################################################

        # Retrieves the ACL Pool
        def info()
        # Retrieves all the Acls in the pool.
            super(ACL_POOL_METHODS[:info])
        end
    end
end
