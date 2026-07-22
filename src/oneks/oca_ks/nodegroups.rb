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

    # NodeGroups Module
    module NodeGroups

        # GET /nodegroups/families
        # Retrieve all available nodegroup families and their flavours
        #
        # @return [Array<Hash>] Families list
        def list_nodegroup_families(opts = {})
            get('/nodegroups/families', opts)
        end

        # GET /nodegroups/families/:family
        # Retrieve a specific nodegroup family by name
        #
        # @param family [String] Nodegroup family name
        # @return [Hash] Family details
        def get_nodegroup_family(family, opts = {})
            get("/nodegroups/families/#{family}", opts)
        end

        # GET /nodegroups/families/:family/:flavour/inputs
        # Retrieve inputs for a specific flavour of the family, including its default values
        #
        # @param family [String] Nodegroup family name
        # @param flavour [String] Nodegroup flavour name
        # @param opts [Hash] Optional parameters (e.g., :exclude_defaults)
        # @return [Hash] Flavour inputs
        def get_nodegroup_inputs(family, flavour, opts = {})
            get("/nodegroups/families/#{family}/#{flavour}/inputs", opts)
        end

        # GET /clusters/:id/nodegroups
        # Retrieve all nodegroups in a cluster
        #
        # @param id [String] Cluster ID
        # @return [Array<Hash>] Nodegroups list
        def list_cluster_nodegroups(id, opts = {})
            get("/clusters/#{id}/nodegroups", opts)
        end

        # GET /clusters/:id/nodegroups/:nodegroup_id
        # Retrieve a specific nodegroup in a cluster
        #
        # @param id [String] Cluster ID
        # @param nodegroup_id [String] NodeGroup ID
        # @return [Hash] NodeGroup details
        def get_cluster_nodegroup(id, nodegroup_id, opts = {})
            get("/clusters/#{id}/nodegroups/#{nodegroup_id}", opts)
        end

        # POST /clusters/:id/nodegroups
        # Add a new nodegroup to a cluster
        #
        # @param id [String] Cluster ID
        # @param template [Hash] NodeGroup template
        # @return [Hash] Created NodeGroup / operation result
        def create_cluster_nodegroup(id, template)
            post("/clusters/#{id}/nodegroups", template)
        end

        # PATCH /clusters/:id/nodegroups/:nodegroup_id
        # Update a specific nodegroup in a cluster
        #
        # @param id [String] Cluster ID
        # @param nodegroup_id [String] NodeGroup ID
        # @param patch_data [Hash] Patch data
        # @return [Hash] Updated nodegroup / operation result
        def update_cluster_nodegroup(id, nodegroup_id, patch_data)
            patch("/clusters/#{id}/nodegroups/#{nodegroup_id}", patch_data)
        end

        # DELETE /clusters/:id/nodegroups/:nodegroup_id
        # Delete a specific nodegroup from a cluster
        #
        # @param id [String] Cluster ID
        # @param nodegroup_id [String] NodeGroup ID
        # @return [Integer] Deletion result/status
        def delete_cluster_nodegroup(id, nodegroup_id)
            delete("/clusters/#{id}/nodegroups/#{nodegroup_id}")
        end

        # POST /clusters/:id/nodegroups/:nodegroup_id/recover
        # Tries to recover a specific nodegroup in a cluster
        #
        # @param id [String] Cluster ID
        # @param nodegroup_id [String] NodeGroup ID
        # @return [Hash] Recovery operation result
        def recover_cluster_nodegroup(id, nodegroup_id)
            post("/clusters/#{id}/nodegroups/#{nodegroup_id}/recover")
        end

        # POST /clusters/:id/nodegroups/:nodegroup_id/scale
        # Scale a specific nodegroup in a cluster
        #
        # @param id [String] Cluster ID
        # @param nodegroup_id [String] NodeGroup ID
        # @param payload [Hash] Body with :count (Integer)
        # @return [Hash] Scale operation result
        def scale_cluster_nodegroup(id, nodegroup_id, payload)
            post("/clusters/#{id}/nodegroups/#{nodegroup_id}/scale", payload)
        end

        # GET /groups
        # Retrieve a list of all existing groups
        #
        # @param opts [Hash] Optional parameters
        # @return [Array<Hash>] Groups list
        def list_groups(opts = {})
            get('/groups', opts)
        end

        # GET /groups/:id
        # Retrieve a specific group
        #
        # @param id [String] Group ID
        # @param opts [Hash] Optional parameters
        # @return [Hash] Group details
        def get_group(id, opts = {})
            get("/groups/#{id}", opts)
        end

    end

end
