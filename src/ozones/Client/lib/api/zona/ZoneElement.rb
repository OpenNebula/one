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

module Zona

    class Zone < OZonesElement

        ZONE_KIND = "zone"

        def self.build_json(pe_id=nil)
            if pe_id
                json = "{\"ZONE\":{\"id\":#{pe_id}}}"
            else
                json = '{"ZONE":{}}'
            end
            OZonesJSON.build_json(json,"ZONE")
        end

        def initialize(hash, client)
            super(hash, client)
        end

        def info
            super(ZONE_KIND,"ZONE")
        end

        def allocate_hash(template)
            super(ZONE_KIND,template)
        end

        def allocate(template)
            super(ZONE_KIND,template)
        end

        def delete
            super(ZONE_KIND)
        end
    end
end
