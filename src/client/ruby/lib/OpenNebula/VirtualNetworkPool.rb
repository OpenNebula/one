require 'OpenNebula/Pool'

module OpenNebula
    class VirtualNetworkPool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################
        
        VN_POOL_METHODS = {
            :info => "vnpool.info"
        }

        #######################################################################
        # Class constructor & Pool Methods
        #######################################################################
        
        # +client+ a Client object that represents a XML-RPC connection
        # +user_id+ is to refer to a Pool with VirtualNetworks from that user
        def initialize(client, user_id=0)
            super('VNET_POOL','VNET',client)

            @user_id  = user_id
        end

        # Default Factory Method for the Pools
        def factory(element_xml)
            OpenNebula::VirtualNetwork.new(element_xml,@client)
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Network Object
        #######################################################################

        def info()
            super(VN_POOL_METHODS[:info],@user_id)
        end
    end
end
