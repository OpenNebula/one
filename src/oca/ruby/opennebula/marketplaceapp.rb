# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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
    class MarketPlaceApp < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        MARKETPLACEAPP_METHODS = {
            :info       => "marketapp.info",
            :allocate   => "marketapp.allocate",
            :delete     => "marketapp.delete",
            :update     => "marketapp.update",
            :chown      => "marketapp.chown",
            :chmod      => "marketapp.chmod",
            :rename     => "marketapp.rename"
        }

        MARKETPLACEAPP_STATES=%w{INIT READY LOCKED ERROR}

        SHORT_MARKETPLACEAPP_STATES={
            "INIT"      => "init",
            "READY"     => "rdy",
            "LOCKED"    => "lock",
            "ERROR"     => "err",
        }

        # Creates a MarketPlace description with just its identifier
        # this method should be used to create plain MarketPlace objects.
        # +id+ the id of the user
        #
        # Example:
        #  app = MarketPlaceApp.new(MarketPlace.build_xml(3),rpc_client)
        #
        def MarketPlaceApp.build_xml(pe_id=nil)
            if pe_id
                app_xml = "<MARKETPLACEAPP><ID>#{pe_id}</ID></MARKETPLACEAPP>"
            else
                app_xml = "<MARKETPLACEAPP></MARKETPLACEAPP>"
            end

            XMLElement.build_xml(app_xml,'MARKETPLACEAPP')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml, client)
        end

        #######################################################################
        # XML-RPC Methods for the MarketPlace Object
        #######################################################################

        # Retrieves the information of the given marketplace app
        def info()
            super(MARKETPLACEAPP_METHODS[:info], 'MARKETPLACEAPP')
        end

        alias_method :info!, :info

        # Allocates a new MarketPlace in OpenNebula
        #
        # @param description [String] The template of the marketplace app
        # @param mp_id [Integer] The id of the marketplace to create the app
        #
        # @return [Integer, OpenNebula::Error] the new ID in case of
        #   success, error otherwise
        def allocate(description, mp_id)
            super(MARKETPLACEAPP_METHODS[:allocate], description, mp_id)
        end

        # Deletes the marketplace app
        def delete()
            super(MARKETPLACEAPP_METHODS[:delete])
        end

        # Replaces the template contents
        #
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template, append=false)
            super(MARKETPLACEAPP_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Changes the owner/group
        #
        # @param uid [Integer] the new owner id. Set to -1 to leave the current one
        # @param gid [Integer] the new group id. Set to -1 to leave the current one
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(uid, gid)
            super(MARKETPLACEAPP_METHODS[:chown], uid, gid)
        end

        # Changes the marketplace app permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(MARKETPLACEAPP_METHODS[:chmod], octet)
        end

        # Changes the marketplace app permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(MARKETPLACEAPP_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        # Renames this marketplace app
        #
        # @param name [String] New name for the marketplace app
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(MARKETPLACEAPP_METHODS[:rename], @pe_id, name)
        end

        # ---------------------------------------------------------------------
        # Helpers to get information
        # ---------------------------------------------------------------------

        # Returns the state of the marketplace app (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the marketplace app (string value)
        def state_str
            MARKETPLACEAPP_STATES[state]
        end

        # Returns the state of the marketplace app (string value)
        def short_state_str
            SHORT_MARKETPLACEAPP_STATES[state_str]
        end
    end
end
