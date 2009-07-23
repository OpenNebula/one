require 'OpenNebula/Pool'

module OpenNebula
    class VirtualNetwork < PoolElement
        # ---------------------------------------------------------------------
        # Constants and Class Methods
        # ---------------------------------------------------------------------
        VN_METHODS = {
            :info     => "vn.info",
            :allocate => "vn.allocate",
            :delete   => "vn.delete"
        }

        # Creates a VirtualNetwork description with just its identifier
        # this method should be used to create plain VirtualNetwork objects.
        # +id+ the id of the network
        #
        # Example:
        #   vnet = VirtualNetwork.new(VirtualNetwork.build_xml(3),rpc_client)
        #
        def VirtualNetwork.build_xml(pe_id=nil)
            if pe_id
                vn_xml = "<VNET><ID>#{pe_id}</ID></VNET>"
            else
                vn_xml = "<VNET></VNET>"
            end

            XMLUtilsElement.initialize_xml(vn_xml, 'VNET')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Network Object
        #######################################################################
        
        def info()
            super(VN_METHODS[:info], 'VNET')
        end

        def allocate(description)
            super(VN_METHODS[:allocate],description)
        end

        def delete()
            super(VN_METHODS[:delete])
        end
    end
end
