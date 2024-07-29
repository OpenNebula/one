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
    class VMGroup < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################
        VMGROUP_METHODS = {
            :allocate    => "vmgroup.allocate",
            :info        => "vmgroup.info",
            :update      => "vmgroup.update",
            :delete      => "vmgroup.delete",
            :chown       => "vmgroup.chown",
            :chmod       => "vmgroup.chmod",
            :rename      => "vmgroup.rename",
            :lock        => "vmgroup.lock",
            :unlock      => "vmgroup.unlock",
            :roleadd     => "vmgroup.roleadd",
            :roledelete  => "vmgroup.roledelete",
            :roleupdate  => "vmgroup.roleupdate"
        }

        # Creates a VMGroup description with just its identifier
        # this method should be used to create plain VMGroup objects.
        # @param pe_id [Integer] the id of the object
        def VMGroup.build_xml(pe_id=nil)
            if pe_id
                obj_xml = "<VM_GROUP><ID>#{pe_id}</ID></VM_GROUP>"
            else
                obj_xml = "<VM_GROUP></VM_GROUP>"
            end

            XMLElement.build_xml(obj_xml,'VM_GROUP')
        end

        # Class constructor
        def initialize(xml, client)
            LockableExt.make_lockable(self, VMGROUP_METHODS)

            super(xml,client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the VMGroup Object
        #######################################################################

        # Retrieves the information of the VMGroup.
        def info()
            super(VMGROUP_METHODS[:info], 'VM_GROUP')
        end

        alias_method :info!, :info

        # Allocates a new VMGroup in OpenNebula
        #
        # @param description [String] The contents of the VMGroup.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description)
            super(VMGROUP_METHODS[:allocate], description)
        end

        # Deletes the SecurityGroup
        def delete()
            super(VMGROUP_METHODS[:delete])
        end

        # Replaces the vm group contents
        #
        # @param new_vmgroup [String] New vmgroup contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole securitygroup
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_vmgroup, append=false)
            super(VMGROUP_METHODS[:update], new_vmgroup, append ? 1 : 0)
        end

        # Changes the owner/group
        #
        # @param uid [Integer] the new owner id. Set to -1 to leave the current one
        # @param gid [Integer] the new group id. Set to -1 to leave the current one
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(uid, gid)
            super(VMGROUP_METHODS[:chown], uid, gid)
        end

        # Changes the SecurityGroup permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(VMGROUP_METHODS[:chmod], octet)
        end

        # Changes the SecurityGroup permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(VMGROUP_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        # Renames this VMGroup
        #
        # @param name [String] New name for the VMGroup.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(VMGROUP_METHODS[:rename], @pe_id, name)
        end

        # Add role to VM Group
        #
        # @param template [String] String template for the new role
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def role_add(template)
            return call(VMGROUP_METHODS[:roleadd], @pe_id, template)
        end

        # Delete role from VM Group
        #
        # @param roleid [Integer] ID of the role to remove
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def role_delete(roleid)
            return call(VMGROUP_METHODS[:roledelete], @pe_id, roleid)
        end

        # Update VM Group role
        #
        # @param roleid [Integer] ID of the role to remove
        # @param template [String] String template with updated values
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def role_update(roleid, template)
            return call(VMGROUP_METHODS[:roleupdate], @pe_id, roleid, template)
        end

        #######################################################################
        # Helpers to get VMGroup information
        #######################################################################

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
        end

        def owner_id
            self['UID'].to_i
        end

        # [return] _Array_ with the name of roles
        def role_names
            self.retrieve_elements('ROLES/ROLE/NAME')
        end
    end
end
