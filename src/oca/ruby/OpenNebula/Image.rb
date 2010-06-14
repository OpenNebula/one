require 'OpenNebula/Pool'

module OpenNebula
    class Image < PoolElement
        # ---------------------------------------------------------------------
        # Constants and Class Methods
        # ---------------------------------------------------------------------
        IMAGE_METHODS = {
            :info     => "image.info",
            :allocate => "image.allocate",
            :update   => "image.update",
            :delete   => "image.delete"
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
            IMAGE
                image_xml = "<IMAGE></IMAGE>"
            end

            XMLUtilsElement.initialize_xml(image_xml, 'IMAGE')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the Image Object
        #######################################################################
        
        def info()
            super(IMAGE_METHODS[:info], 'IMAGE')
        end

        def allocate(description)
            super(IMAGE_METHODS[:allocate],description)
        end
        
        def update(name, value)
            super(IMAGE_METHODS[:update], name, value)
        end

        def delete()
            super(IMAGE_METHODS[:delete])
        end
    end
end
