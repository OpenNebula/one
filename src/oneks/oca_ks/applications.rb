# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
#--------------------------------------------------------------------------- #

module OneKS

    # Application catalogue and Cluster application lifecycle client calls.
    module Applications

        # Returns public Application definitions, optionally including components.
        # @param opts [Hash] Query options; all includes components and cluster_id
        #   evaluates installability for one Cluster
        # @return [Array<Hash>] Application catalogue entries
        def list_applications(opts = {})
            get('/applications', opts)
        end

        # Returns one complete Application definition by catalogue ID.
        # @param application_id [String] Catalogue identifier
        # @param opts [Hash] Query options; cluster_id evaluates installability
        # @return [Hash] Complete public Application definition
        def get_application(application_id, opts = {})
            get("/applications/#{application_id}", opts)
        end

        # Returns the runtime applications stored for a cluster.
        # @param cluster_id [Integer, String] Cluster identifier
        # @param opts [Hash] Query options; all includes dependency entries
        def get_cluster_applications(cluster_id, opts = {})
            get("/clusters/#{cluster_id}/applications", opts)
        end

        # Returns one installed Application with chart metadata when available.
        def get_cluster_application(cluster_id, release_name)
            get("/clusters/#{cluster_id}/applications/#{release_name}")
        end

        def install_application(cluster_id, attributes)
            post("/clusters/#{cluster_id}/applications", attributes)
        end

        def delete_application(cluster_id, release_name)
            delete("/clusters/#{cluster_id}/applications/#{release_name}")
        end

    end

end
