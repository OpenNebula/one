# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
            :rename      => "template.rename"
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
            super(xml,client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the Template Object
        #######################################################################

        # Retrieves the information of the given Template.
        def info()
            super(TEMPLATE_METHODS[:info], 'VMTEMPLATE')
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
        def delete()
            super(TEMPLATE_METHODS[:delete])
        end

        # Creates a VM instance from a Template
        #
        # @param name [String] Name for the VM instance. If it is an empty
        #   string OpenNebula will set a default name
        # @param hold [true,false] false to create the VM in pending state,
        #   true to create it on hold
        # @param template [String] User provided Template to merge with the
        #   one being instantiated
        #
        # @return [Integer, OpenNebula::Error] The new VM id, Error
        #   otherwise
        def instantiate(name="", hold=false, template="")
            return Error.new('ID not defined') if !@pe_id

            name ||= ""
            hold = false if hold.nil?
            template ||= ""

            rc = @client.call(
                TEMPLATE_METHODS[:instantiate], @pe_id, name, hold, template)

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
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(TEMPLATE_METHODS[:chmod], octet)
        end

        # Changes the Template permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(TEMPLATE_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        # Clones this Template into a new one
        #
        # @param [String] name for the new Template.
        #
        # @return [Integer, OpenNebula::Error] The new Template ID in case
        #   of success, Error otherwise
        def clone(name)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(TEMPLATE_METHODS[:clone], @pe_id, name)

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
