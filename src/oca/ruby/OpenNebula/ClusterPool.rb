require 'OpenNebula/Pool'

module OpenNebula
    class ClusterPool < Pool
        # ---------------------------------------------------------------------
        # Constants and Class attribute accessors
        # ---------------------------------------------------------------------

        CLUSTER_POOL_METHODS = {
            :info => "clusterpool.info"
        }

        # ---------------------------------------------------------------------
        # Class constructor & Pool Methods
        # ---------------------------------------------------------------------
        
        # +client+ a Client object that represents a XML-RPC connection
        def initialize(client)
            super('CLUSTER_POOL','CLUSTER',client)
        end

        # Factory method to create User objects
        def factory(element_xml)
            OpenNebula::Cluster.new(element_xml,@client)
        end

        # ---------------------------------------------------------------------
        # XML-RPC Methods for the User Object
        # ---------------------------------------------------------------------
        
        # Retrieves all the Clusters in the pool.
        def info()
            super(CLUSTER_POOL_METHODS[:info])
        end
    end
end