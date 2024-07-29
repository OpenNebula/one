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
    class Template < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        TEMPLATE_METHODS = {
            :allocate    => "template.allocate",
            :instantiate => "template.instantiate",
            :info        => "template.info",
            :update      => "template.update",
            :delete      => "template.delete",
            :chown       => "template.chown",
            :chmod       => "template.chmod",
            :clone       => "template.clone",
            :rename      => "template.rename",
            :lock        => "template.lock",
            :unlock      => "template.unlock"
        }

        # Creates a Template description with just its identifier
        # this method should be used to create plain Template objects.
        # +id+ the id of the user
        #
        # Example:
        #   template = Template.new(Template.build_xml(3),rpc_client)
        #
        def Template.build_xml(pe_id=nil)
            if pe_id
                obj_xml = "<VMTEMPLATE><ID>#{pe_id}</ID></VMTEMPLATE>"
            else
                obj_xml = "<VMTEMPLATE></VMTEMPLATE>"
            end

            XMLElement.build_xml(obj_xml,'VMTEMPLATE')
        end

        # Class constructor
        def initialize(xml, client)
            LockableExt.make_lockable(self, TEMPLATE_METHODS)

            super(xml,client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the Template Object
        #######################################################################

        # Retrieves the information of the given Template.
        # @param extended [true,false] optional flag to process the template and
        # include extended information, such as the SIZE for each DISK
        def info(extended=false, decrypt=false)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(TEMPLATE_METHODS[:info], @pe_id, extended, decrypt)

            if !OpenNebula.is_error?(rc)
                initialize_xml(rc, 'VMTEMPLATE')
                rc   = nil

                @pe_id = self['ID'].to_i if self['ID']
                @name  = self['NAME'] if self['NAME']
            end

            return rc
        end

        alias_method :info!, :info

        # Allocates a new Template in OpenNebula
        #
        # @param description [String] The contents of the Template.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description)
            super(TEMPLATE_METHODS[:allocate], description)
        end

        # Deletes the Template
        #
        # @param recursive [true,false] optional, deletes the template plus
        # any image defined in DISK.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete(recursive=false)
            return call(TEMPLATE_METHODS[:delete], @pe_id, recursive)
        end

        # Creates a VM instance from a Template
        #
        # @param name [String] Name for the VM instance. If it is an empty
        #   string OpenNebula will set a default name
        # @param hold [true,false] false to create the VM in pending state,
        #   true to create it on hold
        # @param template [String] User provided Template to merge with the
        #   one being instantiated
        # @param persistent [true,false] true to create a private persistent
        #   copy of the template plus any image defined in DISK, and instantiate
        #   that copy
        #
        # @return [Integer, OpenNebula::Error] The new VM id, Error
        #   otherwise
        def instantiate(name="", hold=false, template="", persistent=false)
            return Error.new('ID not defined') if !@pe_id

            name ||= ""
            hold = false if hold.nil?
            template ||= ""
            persistent = false if persistent.nil?

            rc = @client.call(TEMPLATE_METHODS[:instantiate], @pe_id,
                name, hold, template, persistent)

            return rc
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
            super(TEMPLATE_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Publishes the Template, to be used by other users
        def publish
            set_publish(true)
        end

        # Unplubishes the Image
        def unpublish
            set_publish(false)
        end

        # Changes the owner/group
        # uid:: _Integer_ the new owner id. Set to -1 to leave the current one
        # gid:: _Integer_ the new group id. Set to -1 to leave the current one
        # [return] nil in case of success or an Error object
        def chown(uid, gid)
            super(TEMPLATE_METHODS[:chown], uid, gid)
        end

        # Changes the Template permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @param recursive [true,false] optional, chmods the template plus
        # any image defined in DISK.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet, recursive=false)
            owner_u = octet[0..0].to_i & 4 != 0 ? 1 : 0
            owner_m = octet[0..0].to_i & 2 != 0 ? 1 : 0
            owner_a = octet[0..0].to_i & 1 != 0 ? 1 : 0
            group_u = octet[1..1].to_i & 4 != 0 ? 1 : 0
            group_m = octet[1..1].to_i & 2 != 0 ? 1 : 0
            group_a = octet[1..1].to_i & 1 != 0 ? 1 : 0
            other_u = octet[2..2].to_i & 4 != 0 ? 1 : 0
            other_m = octet[2..2].to_i & 2 != 0 ? 1 : 0
            other_a = octet[2..2].to_i & 1 != 0 ? 1 : 0

            chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a, recursive)
        end

        # Changes the Template permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @param recursive [true,false] optional, chmods the template plus
        # any image defined in DISK.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a, recursive=false)
            return call(TEMPLATE_METHODS[:chmod], @pe_id, owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a, recursive)
        end

        # Clones this Template into a new one
        #
        # @param [String] name for the new Template.
        # @param recursive [true,false] optional, clones the template plus
        # any image defined in DISK. The new IMAGE_ID is set into each DISK.
        #
        # @return [Integer, OpenNebula::Error] The new Template ID in case
        #   of success, Error otherwise
        def clone(name, recursive=false)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(TEMPLATE_METHODS[:clone], @pe_id, name, recursive)

            return rc
        end

        # Renames this Template
        #
        # @param name [String] New name for the Template.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(TEMPLATE_METHODS[:rename], @pe_id, name)
        end

        #######################################################################
        # Helpers to get Template information
        #######################################################################

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
        end

        def owner_id
            self['UID'].to_i
        end

        def public?
            if self['PERMISSIONS/GROUP_U'] == "1" || self['PERMISSIONS/OTHER_U'] == "1"
                true
            else
                false
            end
        end

    private

        def set_publish(published)
            group_u = published ? 1 : 0

            chmod(-1, -1, -1, group_u, -1, -1, -1, -1, -1)
        end
    end
end
