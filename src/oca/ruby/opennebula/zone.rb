# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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


require 'opennebula/pool_element'

module OpenNebula
    class Zone < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        ZONE_METHODS = {
            :info           => "zone.info",
            :allocate       => "zone.allocate",
            :update         => "zone.update",
            :rename         => "zone.rename",
            :delete         => "zone.delete"
        }

        # Creates a Zone description with just its identifier
        # this method should be used to create plain Zone objects.
        # @param id [Integer] the id of the Zone
        #
        # Example:
        #   zone = Zone.new(Zone.build_xml(3),rpc_client)
        #
        def Zone.build_xml(pe_id=nil)
            if pe_id
                zone_xml = "<ZONE><ID>#{pe_id}</ID></ZONE>"
            else
                zone_xml = "<ZONE></ZONE>"
            end

            XMLElement.build_xml(zone_xml,'ZONE')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the Zone Object
        #######################################################################

        # Retrieves the information of the given Zone.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info()
            super(ZONE_METHODS[:info], 'ZONE')
        end

        alias_method :info!, :info

        # Allocates a new Zone in OpenNebula
        #
        # @param description [String] The template of the Zone.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description)
            super(ZONE_METHODS[:allocate], description)
        end

        # Replaces the template contents
        #
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template=nil, append=false)
            super(ZONE_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Deletes the Zone
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete()
            super(ZONE_METHODS[:delete])
        end

        # Renames this Zone
        #
        # @param name [String] New name for the Zone.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(ZONE_METHODS[:rename], @pe_id, name)
        end
    end
end
