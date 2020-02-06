# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
module NSXDriver

    # Class NSXTLogicalPort
    class NSXTLogicalPort < NSXDriver::LogicalPort

        # ATTRIBUTES

        # CONSTRUCTOR

        def initialize(nsx_client)
            super(nsx_client)
        end

        def self.new_from_id(nsx_client, lpid)
            @nsx_client = nsx_client
            @lp_id = lpid
            @url_lp = NSXDriver::NSXConstants::NSXT_LP_BASE + @lp_id
            if lp?
                @lp_name = lp_name
                @lp_type = lp_type
            else
                error_msg = "Logical port with id: #{@lp_id} not found"
                error = NSXDriver::NSXError::ObjectNotFound
                        .new(error_msg)
                raise error
            end
        end

        # Check if logical port exists
        def lp?
            @nsx_client.get(@url_lp) ? true : false
        end

        # Get logical port id
        def lp_id
            @nsx_client.get(@url_lp)['id']
        end

        # Get logical port display name
        def lp_name
            @nsx_client.get(@url_lp)['display_name']
        end

        # Get resource type
        def lp_type
            @nsx_client.get(@url_lp)['resource_type']
        end

    end

end