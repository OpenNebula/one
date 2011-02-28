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
require 'fileutils'

module OpenNebula
    class Image < PoolElement
        # ---------------------------------------------------------------------
        # Constants and Class Methods
        # ---------------------------------------------------------------------
        IMAGE_METHODS = {
            :info        => "image.info",
            :allocate    => "image.allocate",
            :update      => "image.update",
            :rmattr      => "image.rmattr",
            :enable      => "image.enable",
            :publish     => "image.publish",
            :persistent  => "image.persistent",
            :delete      => "image.delete"
        }

        IMAGE_STATES=%w{INIT READY USED DISABLED}

        SHORT_IMAGE_STATES={
            "INIT"      => "init",
            "READY"     => "rdy",
            "USED"      => "used",
            "DISABLED"  => "disa"
        }

        IMAGE_TYPES=%w{OS CDROM DATABLOCK}

        SHORT_IMAGE_TYPES={
            "OS"         => "OS",
            "CDROM"      => "CD",
            "DATABLOCK"  => "DB"
        }

        # Creates an Image description with just its identifier
        # this method should be used to create plain Image objects.
        # +id+ the id of the image
        #
        # Example:
        #   image = Image.new(Image.build_xml(3),rpc_client)
        #
        def Image.build_xml(pe_id=nil)
            if pe_id
                image_xml = "<IMAGE><ID>#{pe_id}</ID></IMAGE>"
            else
                image_xml = "<IMAGE></IMAGE>"
            end

            XMLElement.build_xml(image_xml,'IMAGE')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the Image Object
        #######################################################################

        # Retrieves the information of the given Image.
        def info()
            super(IMAGE_METHODS[:info], 'IMAGE')
        end

        # Allocates a new Image in OpenNebula
        #
        # +description+ A string containing the template of the Image.
        def allocate(description)
            super(IMAGE_METHODS[:allocate],description)
        end

        # Modifies an image attribute
        #
        # +name+ Name of the attribute to be changed
        #
        # +value+ New value for the attribute
        def update(name, value)
            super(IMAGE_METHODS[:update], name, value)
        end

        # Deletes an Image attribute
        #
        # +name+ Name of the attribute to be deleted
        def remove_attr(name)
            do_rm_attr(name)
        end

        # Enables an Image
        def enable
            set_enabled(true)
        end

        # Disables an Image
        def disable
            set_enabled(false)
        end

        # Publishes the Image, to be used by other users
        def publish
            set_publish(true)
        end

        # Unplubishes the Image
        def unpublish
            set_publish(false)
        end
        
        # Makes the Image persistent
        def persistent
            set_persistent(true)
        end

        # Makes the Image non persistent
        def nonpersistent
            set_persistent(false)
        end

        # Deletes the Image
        def delete()
            super(IMAGE_METHODS[:delete])
        end
    

        #######################################################################
        # Helpers to get Image information
        #######################################################################

        # Returns the state of the Image (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the Image (string value)
        def state_str
            IMAGE_STATES[state]
        end

        # Returns the state of the Image (string value)
        def short_state_str
            SHORT_IMAGE_STATES[state_str]
        end

        # Returns the type of the Image (numeric value)
        def type
            self['TYPE'].to_i
        end

        # Returns the type of the Image (string value)
        def type_str
            IMAGE_TYPES[type]
        end

        # Returns the state of the Image (string value)
        def short_type_str
            SHORT_IMAGE_TYPES[type_str]
        end

    private

        def set_enabled(enabled)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:enable], @pe_id, enabled)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        def set_publish(published)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:publish], @pe_id, published)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end
        
        def set_persistent(persistence)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:persistent], @pe_id, persistence)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        def do_rm_attr(name)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:rmattr], @pe_id, name)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

    end
end
