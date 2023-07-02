# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

    # Class Logical Switch
    class LogicalPort < NSXComponent

        # ATTRIBUTES

        def self.new_child(nsx_client, id = nil)
            case nsx_client.nsx_type.upcase
            when NSXConstants::NSXT
                NSXTLogicalPort.new(nsx_client, id)
            when NSXConstants::NSXV
                NSXVLogicalPort.new(nsx_client, id)
            else
                error_msg = "Unknown NSX type: #{type}"
                error = NSXError::UnknownObject.new(error_msg)
                raise error
            end
        end

        # Check if logical port exists
        def lp?; end

        # Get logical port id
        def lp_id; end

        # Get logical port display name
        def lp_name; end

        # Get resource type
        def lp_type; end

    end

end
