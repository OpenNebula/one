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

require 'opennebula/lockable_ext'
require 'opennebula/pool_element'

module OpenNebula
    class VirtualRouter < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        VIRTUAL_ROUTER_METHODS = {
            :allocate    => "vrouter.allocate",
            :instantiate => "vrouter.instantiate",
            :info        => "vrouter.info",
            :update      => "vrouter.update",
            :delete      => "vrouter.delete",
            :chown       => "vrouter.chown",
            :chmod       => "vrouter.chmod",
            :rename      => "vrouter.rename",
            :attachnic   => "vrouter.attachnic",
            :detachnic   => "vrouter.detachnic",
            :lock        => "vrouter.lock",
            :unlock      => "vrouter.unlock"
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
            LockableExt.make_lockable(self, VIRTUAL_ROUTER_METHODS)

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

        # Creates VM instances from a VM Template. New VMs will be associated
        # to this Virtual Router, and its Virtual Networks
        #
        # @para n_vms [Integer] Number of VMs to instantiate
        # @para template_id [Integer] VM Template id to instantiate
        # @param name [String] Name for the VM instances. If it is an empty
        #   string OpenNebula will set a default name. Wildcard %i can be used.
        # @param hold [true,false] false to create the VM in pending state,
        #   true to create it on hold
        # @param template [String] User provided Template to merge with the
        #   one being instantiated
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def instantiate(n_vms, template_id, name="", hold=false, template="")
            return call(VIRTUAL_ROUTER_METHODS[:instantiate], @pe_id,
                        n_vms.to_i, template_id.to_i, name, hold, template)
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

        # Renames this VirtualRouter
        #
        # @param name [String] New name for the VirtualRouter.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(VIRTUAL_ROUTER_METHODS[:rename], @pe_id, name)
        end

        # Attaches a NIC to this VirtualRouter, and each one of its VMs
        #
        # @param nic_template [String] Template containing a NIC element
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def nic_attach(nic_template)
            return call(VIRTUAL_ROUTER_METHODS[:attachnic], @pe_id, nic_template)
        end

        # Detaches a NIC from this VirtualRouter, and each one of its VMs
        #
        # @param nic_id [Integer] Id of the NIC to be detached
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def nic_detach(nic_id)
            return call(VIRTUAL_ROUTER_METHODS[:detachnic], @pe_id, nic_id)
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

        # Returns an array with the numeric VM ids
        def vm_ids
            array = Array.new

            self.each("VMS/ID") do |id|
                array << id.text.to_i
            end

            return array
        end
    end
end
