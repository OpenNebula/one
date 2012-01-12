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


module Zona

    # This class represents a set of VDCs. It allows to list the defined
    # VDCs and iterate on them.
    class VDCPool < OZonesPool

        # String describing the kind of this resource
        VDC_POOL_KIND="vdc"

        # Initializes a VDC Pool instance
        # @param [Zona::Client] client OZones Client
        def initialize(client)
            super(:VDC_POOL, :VDC, client)
        end

        # Produces a new VDC element with the provided description
        # @param [String] element_json JSON string of the element
        # @return [String] Element's name or nil
        def factory(element_json)
            VDC.new(element_json,@client)
        end

        # Retrieves the information for this pool
        # @return [Zona:Error] nil or Error
        def info
            super(VDC_POOL_KIND)
        end
    end
end
