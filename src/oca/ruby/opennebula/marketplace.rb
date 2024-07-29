# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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
    class MarketPlace < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        MARKETPLACE_METHODS = {
            :info       => "market.info",
            :allocate   => "market.allocate",
            :delete     => "market.delete",
            :update     => "market.update",
            :chown      => "market.chown",
            :chmod      => "market.chmod",
            :rename     => "market.rename",
            :enable     => "market.enable"
        }

        MARKETPLACE_STATES=%w{ENABLED DISABLED}

        SHORT_MARKETPLACE_STATES={
            "ENABLED"              => "on",
            "DISABLED"             => "off"
        }

        # Creates a MarketPlace description with just its identifier
        # this method should be used to create plain MarketPlace objects.
        # +id+ the id of the user
        #
        # Example:
        #   marketplace = MarketPlace.new(MarketPlace.build_xml(3),rpc_client)
        #
        def MarketPlace.build_xml(pe_id=nil)
            if pe_id
                marketplace_xml = "<MARKETPLACE><ID>#{pe_id}</ID></MARKETPLACE>"
            else
                marketplace_xml = "<MARKETPLACE></MARKETPLACE>"
            end

            XMLElement.build_xml(marketplace_xml,'MARKETPLACE')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the MarketPlace Object
        #######################################################################

        # Retrieves the information of the given marketplace.
        def info()
            super(MARKETPLACE_METHODS[:info], 'MARKETPLACE')
        end

        alias_method :info!, :info

        # Allocates a new marketplace in OpenNebula
        #
        # @param description [String] The template of the marketplace.
        #
        # @return [Integer, OpenNebula::Error] the new ID in case of
        #   success, error otherwise
        def allocate(description)
            super(MARKETPLACE_METHODS[:allocate], description)
        end

        # Deletes the marketplace
        def delete()
            super(MARKETPLACE_METHODS[:delete])
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
            super(MARKETPLACE_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Changes the owner/group
        #
        # @param uid [Integer] the new owner id. Set to -1 to leave the current one
        # @param gid [Integer] the new group id. Set to -1 to leave the current one
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(uid, gid)
            super(MARKETPLACE_METHODS[:chown], uid, gid)
        end

        # Changes the marketplace permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(MARKETPLACE_METHODS[:chmod], octet)
        end

        # Changes the marketplace permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(MARKETPLACE_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        # Renames this marketplace
        #
        # @param name [String] New name for the marketplace
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            call(MARKETPLACE_METHODS[:rename], @pe_id, name)
        end

        # Enables this marketplace
        def enable
            call(MARKETPLACE_METHODS[:enable], @pe_id, true)
        end

        # Enables this marketplace
        def disable
            call(MARKETPLACE_METHODS[:enable], @pe_id, false)
        end

        # ---------------------------------------------------------------------
        # Helpers to get information
        # ---------------------------------------------------------------------

        # Returns the state of the Zone (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the Zone (string value)
        def state_str
            MARKETPLACE_STATES[state]
        end

        # Returns whether or not the marketplace app with id 'id' is part of
        # this marketplace
        def contains(id)
            #This doesn't work in ruby 1.8.5
            #return self["MARKETPLACE/MARKETPLACEAPPS/ID[.=#{uid}]"] != nil

            id_array = retrieve_elements('MARKETPLACEAPPS/ID')
            return id_array != nil && id_array.include?(uid.to_s)
        end

        # Returns an array with the numeric image ids
        def marketapp_ids
            array = Array.new

            self.each("MARKETPLACEAPPS/ID") do |id|
                array << id.text.to_i
            end

            return array
        end
    end
end
