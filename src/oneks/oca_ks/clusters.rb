# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

module OneKS

    # Clusters Module
    module Clusters

        # GET /clusters/families
        # Retrieve a list of all existing cluster families and their flavours
        # @return [Array<Hash>] Families list
        def list_cluster_families(opts = {})
            get('/clusters/families', opts)
        end

        # GET /clusters/families/:family
        # Retrieve a specific cluster family and its flavours by name
        # @param family [String] Cluster family name
        # @return [Hash] Family details
        def get_cluster_family(family, opts = {})
            get("/clusters/families/#{family}", opts)
        end

        # GET /clusters/families/:family/inputs
        # Retrieve inputs for a specific flavour of the family, including its default values
        # @param family [String] Cluster family name
        # @param flavour [String] Cluster flavour name
        def get_cluster_inputs(family, flavour, opts = {})
            get("/clusters/families/#{family}/#{flavour}/inputs", opts)
        end

        # GET /clusters
        # Retrieve a list of all existing clusters
        # @param opts [Hash] Optional parameters
        # @return [Array<Hash>] Clusters list
        def list_clusters(opts = {})
            get('/clusters', opts)
        end

        # GET /clusters/:id
        # Retrieve a specific cluster by ID
        # @param id [String] Cluster ID
        # @return [Hash] Cluster details
        def get_cluster(id, opts = {})
            get("/clusters/#{id}", opts)
        end

        # GET /clusters/deployment/check
        # Retrieve readiness check service status
        # @return [Hash] Readiness check status
        def check_cluster_deployment_status
            get('/clusters/deployment/check')
        end

        # POST /clusters/deployment/check
        # Runs a streaming readiness check for a deployment placement
        # @param deployment [Hash] Cluster and network deployment placement
        # @yieldparam event [String] SSE event name
        # @yieldparam data [Hash] SSE event payload
        # @return [Boolean] true when the stream ends cleanly
        def check_cluster_deployment(body, &block)
            post_stream('/clusters/deployment/check', body, &block)
        end

        # POST /clusters/deployment/validate
        # Validate deployment placement
        # @param body [Hash] Deployment validation body
        # @return [Hash] Validation result
        def validate_cluster_deployment(body)
            post('/clusters/deployment/validate', body)
        end

        # POST /clusters
        # Create a new cluster
        # @param template [Hash] Cluster template, including deployment placement
        # @return [Hash] Cluster created
        def create_cluster(template)
            post('/clusters', template)
        end

        # PATCH /clusters/:id
        # Update a cluster (partial update)
        # @param id [String] Cluster ID
        # @param patch_data [Hash] Patch data (e.g., 'name', 'description', etc)
        # @return [Hash] Updated cluster
        def update_cluster(id, patch_data)
            patch("/clusters/#{id}", patch_data)
        end

        # POST /clusters/:id/chmod
        # Change the permissions of a cluster and its associated group documents
        # @param id [String] Cluster ID
        # @param octet [String] New octal permissions (e.g., '640')
        # @return [Integer] Operation result/status
        def chmod_cluster(id, octet)
            post("/clusters/#{id}/chmod", { :octet => octet })
        end

        # POST /clusters/:id/chown
        # Change the owner and optionally the group of a cluster and its groups
        # @param id [String] Cluster ID
        # @param owner [Integer] New owner ID
        # @param group [Integer, nil] New group ID (optional)
        # @return [Integer] Operation result/status
        def chown_cluster(id, owner, group = nil)
            post("/clusters/#{id}/chown", { :owner_id => owner, :group_id => group })
        end

        # POST /clusters/:id/chgrp
        # Change the group of a cluster and its associated group documents
        # @param id [String] Cluster ID
        # @param group [Integer] New group ID
        # @return [Integer] Operation result/status
        def chgrp_cluster(id, group)
            post("/clusters/#{id}/chgrp", { :group_id => group })
        end

        # POST /clusters/:id/upgrade
        # Initiates an upgrade of a Kubernetes cluster
        # @param id [String] Cluster ID
        # @param k8s_version [String] K8sversion to upgrade
        # @return [Hash] Cluster created
        def upgrade_cluster(id, k8s_version)
            post("/clusters/#{id}/upgrade", { :kubernetes_version => k8s_version })
        end

        # POST /clusters/:id/recover
        # Tries to recover a cluster in a warning or failure state
        # @param id [String] Cluster ID
        # @return [Integer] Recover result/status
        def recover_cluster(id)
            post("/clusters/#{id}/recover")
        end

        # DELETE /clusters/:id
        # Delete a specific cluster
        # @param id [String] Cluster ID
        # @return [Integer] Deletion result/status
        def delete_cluster(id, opts = {})
            delete("/clusters/#{id}", opts)
        end

        # GET /clusters/:id/kubeconfig
        # Retrieve the kubeconfig of a specific workload cluster
        # @param id [String] Cluster ID
        # @return [String] Kubeconfig YAML
        def get_cluster_kubeconfig(id, opts = {})
            get("/clusters/#{id}/kubeconfig", opts)
        end

        # GET /clusters/:id/logs
        # Retrieve a snapshot of cluster logs or follow them continuously.
        #
        # @param id [String] Cluster ID
        # @param all [Boolean] Return the full log history or start follow from byte 0
        # @param opts [Hash] Additional options, including :follow
        # @return [Hash, nil] Log snapshot response, or nil while following
        def get_cluster_logs(id, all = false, opts = {})
            params = opts.reject {|key, _| [:follow, :all].include?(key) }
            params[:all] = true if all

            if opts[:follow]
                follow_logs("/clusters/#{id}/logs", params)
            else
                get("/clusters/#{id}/logs", params)
            end
        end

    end

end
