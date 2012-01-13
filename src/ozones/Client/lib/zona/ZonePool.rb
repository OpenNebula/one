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

    # This class represents a set of Zones. It allows to list the defined
    # Zones and iterate on them.
    class ZonePool < OZonesPool

        # String describing the kind of this resource
        ZONE_POOL_KIND = "zone"

        # Initializes a Zone Pool instance
        # @param [Zona::Client] client OZones Client
        def initialize(client)
            super(:ZONE_POOL, :ZONE, client)
        end

        # Produces a new Zone element with the provided description
        # @param [String] element_json JSON string of the element
        # @return [String] Element's name or nil
        def factory(element_json)
            Zone.new(element_json,@client)
        end

        # Retrieves the information for this pool
        # @return [Zona:Error] nil or Error
        def info
            super(ZONE_POOL_KIND)
        end
    end
end
