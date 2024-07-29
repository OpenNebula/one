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
    class SecurityGroup < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################


        SECGROUP_METHODS = {
            :allocate    => "secgroup.allocate",
            :info        => "secgroup.info",
            :update      => "secgroup.update",
            :delete      => "secgroup.delete",
            :chown       => "secgroup.chown",
            :chmod       => "secgroup.chmod",
            :clone       => "secgroup.clone",
            :rename      => "secgroup.rename",
            :commit      => "secgroup.commit"
        }

        # Creates a SecurityGroup description with just its identifier
        # this method should be used to create plain SecurityGroup objects.
        # @param pe_id [Integer] the id of the object
        def SecurityGroup.build_xml(pe_id=nil)
            if pe_id
                obj_xml = "<SECURITY_GROUP><ID>#{pe_id}</ID></SECURITY_GROUP>"
            else
                obj_xml = "<SECURITY_GROUP></SECURITY_GROUP>"
            end

            XMLElement.build_xml(obj_xml,'SECURITY_GROUP')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the SecurityGroup Object
        #######################################################################

        # Retrieves the information of the given SecurityGroup.
        def info()
            super(SECGROUP_METHODS[:info], 'SECURITY_GROUP')
        end

        alias_method :info!, :info

        # Allocates a new SecurityGroup in OpenNebula
        #
        # @param description [String] The contents of the SecurityGroup.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description)
            super(SECGROUP_METHODS[:allocate], description)
        end

        # Deletes the SecurityGroup
        def delete()
            super(SECGROUP_METHODS[:delete])
        end

        # Replaces the securitygroup contents
        #
        # @param new_securitygroup [String] New securitygroup contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole securitygroup
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_securitygroup, append=false)
            super(SECGROUP_METHODS[:update], new_securitygroup, append ? 1 : 0)
        end

        # Changes the owner/group
        #
        # @param uid [Integer] the new owner id. Set to -1 to leave the current one
        # @param gid [Integer] the new group id. Set to -1 to leave the current one
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(uid, gid)
            super(SECGROUP_METHODS[:chown], uid, gid)
        end

        # Changes the SecurityGroup permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(SECGROUP_METHODS[:chmod], octet)
        end

        # Changes the SecurityGroup permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(SECGROUP_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        # Clones this SecurityGroup into a new one
        #
        # @param [String] name for the new SecurityGroup.
        #
        # @return [Integer, OpenNebula::Error] The new SecurityGroup ID in case
        #   of success, Error otherwise
        def clone(name)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(SECGROUP_METHODS[:clone], @pe_id, name)

            return rc
        end

        # Renames this SecurityGroup
        #
        # @param name [String] New name for the SecurityGroup.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(SECGROUP_METHODS[:rename], @pe_id, name)
        end

        # Commit SG changes to associated VMs
        #
        # @param recover [Bool] If true will only operate on outdated and error
        # VMs. This is intended for retrying updates of VMs or reinitialize the
        # updating process if oned stopped or fail.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def commit(recover)
            return call(SECGROUP_METHODS[:commit], @pe_id, recover)
        end

        #######################################################################
        # Helpers to get SecurityGroup information
        #######################################################################

        # Returns three arrays with the numeric vm ids for vms updated,
        # outdated (include updating) and error
        def vm_ids
            updated = Array.new

            self.each("UPDATED_VMS/ID") do |id|
                updated << id.text.to_i
            end

            outdated = Array.new

            self.each("OUTDATED_VMS/ID") do |id|
                outdated << id.text.to_i
            end

            self.each("UPDATING_VMS/ID") do |id|
                outdated << id.text.to_i
            end

            error = Array.new

            self.each("ERROR_VMS/ID") do |id|
                error << id.text.to_i
            end

            return [updated, outdated, error]
        end

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
        end

        def owner_id
            self['UID'].to_i
        end
    end
end
