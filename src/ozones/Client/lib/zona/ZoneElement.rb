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

    # This class describes a single OZones Zone element. It can be used to
    # allocate, delete and retrieve full information for a Zone.
    class Zone < OZonesElement

        # String describing the kind of this resource
        ZONE_KIND = "zone"

        # Builds minimal JSON description for a Zone
        # @param [#to_i] pe_id zone's ID
        # @return [Hash,Zona::Error] Hash description of the object, or Error
        def self.build_json(pe_id=nil)
            if pe_id
                json = "{\"ZONE\":{\"ID\":#{pe_id}}}"
            else
                json = '{"ZONE":{}}'
            end
            OZonesJSON.build_json(json,:ZONE)
        end

        # Initializes a Zone object instance
        # @param [Hash] hash zone description
        # @param [Zona::Client] client OZones Client
        # @return [String] Element's name or nil
        def initialize(hash, client)
            super(hash, client)
        end

        # Retrieves details about this object and fills in
        # the information hash
        # @return [Zona::Error] nil or Error
        def info
            super(ZONE_KIND,:ZONE)
        end

        # Allocates a new element from a hash description
        # @param [Hash] template element description
        # @return [Zona::Error] nil or Error
        def allocate_hash(template)
            super(ZONE_KIND,template)
        end

        # Allocates a new element from a JSON description
        # @param [String] template element description
        # @return [Zona::Error] nil or Error
        def allocate(template)
            super(ZONE_KIND,template)
        end

        # Deletes current element
        # @return [Zona::Error] nil or Error
        def delete
            super(ZONE_KIND)
        end
    end
end
