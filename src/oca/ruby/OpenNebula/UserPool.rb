require 'OpenNebula/Pool'

module OpenNebula
    class UserPool < Pool
        # ---------------------------------------------------------------------
        # Constants and Class attribute accessors
        # ---------------------------------------------------------------------

        USER_POOL_METHODS = {
            :info => "userpool.info"
        }

        # ---------------------------------------------------------------------
        # Class constructor & Pool Methods
        # ---------------------------------------------------------------------
        
        # +client+ a Client object that represents a XML-RPC connection
        def initialize(client)
            super('USER_POOL','USER',client)
        end

        # Factory method to create User objects
        def factory(element_xml)
            OpenNebula::User.new(element_xml,@client)
        end

        # ---------------------------------------------------------------------
        # XML-RPC Methods for the User Object
        # ---------------------------------------------------------------------

        def info()
            super(USER_POOL_METHODS[:info])
        end
    end
end
