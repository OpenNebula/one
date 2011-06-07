# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'OpenNebula/Pool'

module OpenNebula
    class Template < PoolElement
        # ---------------------------------------------------------------------
        # Constants and Class Methods
        # ---------------------------------------------------------------------
        TEMPLATE_METHODS = {
            :allocate    => "template.allocate",
            :instantiate => "template.instantiate",
            :info        => "template.info",
            :update      => "template.update",
            :publish     => "template.publish",
            :delete      => "template.delete",
            :chown       => "template.chown"
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

        # ---------------------------------------------------------------------
        # Class constructor
        # ---------------------------------------------------------------------
        def initialize(xml, client)
            super(xml,client)

            @client = client
        end

        # ---------------------------------------------------------------------
        # XML-RPC Methods for the Template Object
        # ---------------------------------------------------------------------
        
        # Retrieves the information of the given Template.
        def info()
            super(TEMPLATE_METHODS[:info], 'VMTEMPLATE')
        end

        # Allocates a new Template in OpenNebula
        #
        # +templatename+ A string containing the name of the Template.
        def allocate(templatename)
            super(TEMPLATE_METHODS[:allocate], templatename)
        end

        # Deletes the Template
        def delete()
            super(TEMPLATE_METHODS[:delete])
        end

        # Creates a VM instance from a Template
        #
        # +name+ A string containing the name of the VM instance.
        # [return] The new VM Instance ID, or an Error object
        def instantiate(name="")
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(TEMPLATE_METHODS[:instantiate], @pe_id, name)

            return rc
        end

        # Replaces the template contents
        #
        # +new_template+ New template contents
        def update(new_template)
            return Error.new('ID not defined') if !@pe_id

            super(TEMPLATE_METHODS[:update], new_template)
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

        # ---------------------------------------------------------------------
        # Helpers to get Template information
        # ---------------------------------------------------------------------

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
        end

        def owner_id
            self['UID'].to_i
        end

    private

        def set_publish(published)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(TEMPLATE_METHODS[:publish], @pe_id, published)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end
    end
end
