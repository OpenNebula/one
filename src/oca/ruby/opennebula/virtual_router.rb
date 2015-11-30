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
    class VirtualRouter < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        VIRTUAL_ROUTER_METHODS = {
            :allocate    => "vrouter.allocate",
            :info        => "vrouter.info",
            :update      => "vrouter.update",
            :delete      => "vrouter.delete",
            :chown       => "vrouter.chown",
            :chmod       => "vrouter.chmod",
# TODO: remove or implement
#            :clone       => "vrouter.clone",
            :rename      => "vrouter.rename"
        }

        # Creates a VirtualRouter description with just its identifier
        # this method should be used to create plain VirtualRouter objects.
        # +id+ the id of the user
        #
        # Example:
        #   vrouter = VirtualRouter.new(VirtualRouter.build_xml(3),rpc_client)
        #
        def VirtualRouter.build_xml(pe_id=nil)
            if pe_id
                obj_xml = "<VROUTER><ID>#{pe_id}</ID></VROUTER>"
            else
                obj_xml = "<VROUTER></VROUTER>"
            end

            XMLElement.build_xml(obj_xml,'VROUTER')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the VirtualRouter Object
        #######################################################################

        # Retrieves the information of the given Virtual Router
        def info()
            super(VIRTUAL_ROUTER_METHODS[:info], 'VROUTER')
        end

        alias_method :info!, :info

        # Allocates a new VirtualRouter in OpenNebula
        #
        # @param description [String] The contents of the VirtualRouter.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description)
            super(VIRTUAL_ROUTER_METHODS[:allocate], description)
        end

        # Deletes the VirtualRouter
        def delete()
            super(VIRTUAL_ROUTER_METHODS[:delete])
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
            super(VIRTUAL_ROUTER_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Changes the owner/group
        # @param uid [Integer] the new owner id. Set to -1 to leave the current one
        # @param gid [Integer] the new group id. Set to -1 to leave the current one
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(uid, gid)
            super(VIRTUAL_ROUTER_METHODS[:chown], uid, gid)
        end

        # Changes the VirtualRouter permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(VIRTUAL_ROUTER_METHODS[:chmod], octet)
        end

        # Changes the VirtualRouter permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(VIRTUAL_ROUTER_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end
=begin
        # Clones this VirtualRouter into a new one
        #
        # @param [String] name for the new VirtualRouter.
        #
        # @return [Integer, OpenNebula::Error] The new VirtualRouter ID in case
        #   of success, Error otherwise
        def clone(name)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VIRTUAL_ROUTER_METHODS[:clone], @pe_id, name)

            return rc
        end
=end
        # Renames this VirtualRouter
        #
        # @param name [String] New name for the VirtualRouter.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(VIRTUAL_ROUTER_METHODS[:rename], @pe_id, name)
        end

        #######################################################################
        # Helpers to get VirtualRouter information
        #######################################################################

        # Returns the group identifier
        # @return [Integer] the element's group ID
        def gid
            self['GID'].to_i
        end

        def owner_id
            self['UID'].to_i
        end
    end
end
