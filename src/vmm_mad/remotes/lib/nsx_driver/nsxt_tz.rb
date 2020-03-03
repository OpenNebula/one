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
    class NSXTtz < TransportZone

        # ATTRIBUTES
        attr_reader :tz_id

        # CONSTRUCTOR
        def initialize(nsx_client)
            super(nsx_client)
            # Construct base URLs
            @url_tzs_nsxt = NSXConstants::NSXT_TZS
        end

        # METHODS
        def tzs
            @nsx_client.get(@url_tzs_nsxt)
        end

    end

end
