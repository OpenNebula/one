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

    # Class Transport Zone
    class TransportZone < NSXComponent

        # ATTRIBUTES
        attr_reader :tz_id

        # CONSTRUCTOR
        def initialize(nsx_client)
            super(nsx_client)
        end

        def self.new_child(nsx_client)
            case nsx_client.nsx_type.upcase
            when NSXConstants::NSXT
                NSXTtz.new(nsx_client)
            when NSXConstants::NSXV
                NSXVtz.new(nsx_client)
            else
                error_msg = "Unknown object type: #{nsx_client.nsx_type}"
                error = NSXError::UnknownObject.new(error_msg)
                raise error
            end
        end

        # METHODS
        # Return the transport zones list
        def tzs; end

    end

end
