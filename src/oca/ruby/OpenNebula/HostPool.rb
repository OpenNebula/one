require 'OpenNebula/Pool'

module OpenNebula
    class HostPool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################

        HOST_POOL_METHODS = {
            :info => "hostpool.info"
        }

        #######################################################################
        # Class constructor & Pool Methods
        #######################################################################
        
        # +client+ a Client object that represents a XML-RPC connection
        def initialize(client)
            super('HOST_POOL','HOST',client)
        end

        # Factory Method for the Host Pool
        def factory(element_xml)
            OpenNebula::Host.new(element_xml,@client)
        end

        #######################################################################
        # XML-RPC Methods for the Host Pool 
        #######################################################################

        # Retrieves all the Hosts in the pool.
        def info()
            super(HOST_POOL_METHODS[:info])
        end
    end
end
