require 'OpenNebula/Pool'

module OpenNebula
    class ImagePool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################
        
        IMAGE_POOL_METHODS = {
            :info => "imagepool.info"
        }

        #######################################################################
        # Class constructor & Pool Methods
        #######################################################################
        
        # +client+ a Client object that represents a XML-RPC connection
        # +user_id+ is to refer to a Pool with Images from that user
        def initialize(client, user_id=0)
            super('IMAGE_POOL','IMAGE',client)

            @user_id  = user_id
        end

        # Default Factory Method for the Pools
        def factory(element_xml)
            OpenNebula::Image.new(element_xml,@client)
        end

        #######################################################################
        # XML-RPC Methods for the Image Object
        #######################################################################

        def info()
            super(IMAGE_POOL_METHODS[:info],@user_id)
        end
    end
end
