require 'OpenNebula/Pool'

module OpenNebula
    class VirtualMachinePool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################

        VM_POOL_METHODS = {
            :info => "vmpool.info"
        }

        #######################################################################
        # Class constructor & Pool Methods
        #######################################################################
        
        # +client+ a Client object that represents a XML-RPC connection
        # +user_id+ is to refer to a Pool with VirtualNetworks from that user
        def initialize(client, user_id=0)
            super('VM_POOL','VM',client)

            @user_id  = user_id
        end

        # Default Factory Method for the Pools
        def factory(element_xml)
            OpenNebula::VirtualMachine.new(element_xml,@client)
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Network Object
        #######################################################################

        def info()
            super(VM_POOL_METHODS[:info],@user_id)
        end
    end
end
