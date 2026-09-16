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

module OneForm

    # Provisions Module
    module Provisions

        # List all provisions.
        #
        # @param opts [Hash] Optional parameters for filtering or pagination.
        # @return [Array<Hash>] List of provision instances with their metadata.
        def list_provisions(opts = {})
            get('/provisions', query_params(opts))
        end

        # Retrieve a specific provision by ID.
        #
        # @param id [String] Provision ID.
        # @return [Hash] Details of the provision.
        def get_provision(id, opts = {})
            get("/provisions/#{id}", query_params(opts))
        end

        # Retrieve the input definitions of a provision.
        #
        # @param id [String] Provision ID.
        # @return [Array<Hash>] Provision input definitions.
        def get_provision_inputs(id)
            get("/provisions/#{id}/inputs")
        end

        # Retrieve the Terraform state of a provision.
        #
        # @param id [String] Provision ID.
        # @param decode [Boolean] Whether to decode the stored state.
        # @return [Hash, String] Stored Terraform state.
        def get_provision_tfstate(id, decode = false)
            get("/provisions/#{id}/tfstate", query_params(:decode => decode))
        end

        # Retrieve the active lifecycle job of a provision.
        #
        # @param id [String] Provision ID.
        # @return [Array<Hash>] Active job information.
        def get_provision_jobs(id)
            get("/provisions/#{id}/jobs")
        end

        # Cancel the active lifecycle job of a provision.
        #
        # @param id [String] Provision ID.
        # @return [Hash] Cancellation request status.
        def cancel_provision(id)
            post("/provisions/#{id}/cancel")
        end

        # Retrieve the OpenNebula hosts owned by a provision.
        #
        # @param id [String] Provision ID.
        # @return [Array<Hash>] OpenNebula host objects.
        def get_provision_hosts(id)
            get("/provisions/#{id}/hosts")
        end

        # Retrieve the OpenNebula networks owned by a provision.
        #
        # @param id [String] Provision ID.
        # @return [Array<Hash>] OpenNebula network objects.
        def get_provision_networks(id)
            get("/provisions/#{id}/networks")
        end

        # Retrieve the OpenNebula datastores owned by a provision.
        #
        # @param id [String] Provision ID.
        # @return [Array<Hash>] OpenNebula datastore objects.
        def get_provision_datastores(id)
            get("/provisions/#{id}/datastores")
        end

        # Retrieve the OpenNebula cluster owned by a provision.
        #
        # @param id [String] Provision ID.
        # @return [Hash, nil] OpenNebula cluster object.
        def get_provision_cluster(id)
            get("/provisions/#{id}/cluster")
        end

        # Retrieve the unmanaged version of a provision.
        #
        # @param id [String] Provision ID.
        # @return [Hash] Unmanaged data of the provision.
        def get_unmanaged_provision(id)
            get("/provisions/#{id}/unmanaged")
        end

        # Creates a new provision using a base driver definition
        #
        # @param driver_name [String] The driver name
        # @param octet [String] Values to merge to the provision (user_inputs_values, name, etc)
        # @return [Hash] Provision object created
        def create_provision(driver_name, deployment_type, provider_id, values)
            body = {
                :driver => driver_name,
                :deployment_type => deployment_type,
                :provider_id => provider_id
            }.merge(values)

            post('/provisions', body)
        end

        # Recover a failed provision.
        #
        # @param id [String] Provision ID.
        # @param force [Boolean] Force recovery when protections would reject it.
        # @return [Hash] Recovery acceptance response.
        def recover_provision(id, force = false)
            post_with_params("/provisions/#{id}/recover", :force => force)
        end

        # Add cloud or on-premises hosts to a provision.
        #
        # @param id [String] Provision ID.
        # @param amount [Integer, nil] Number of cloud hosts to add.
        # @param hosts [Array<String>, nil] On-premises host addresses to add.
        # @return [Hash] Host creation acceptance response.
        def add_provision_hosts(id, amount: nil, hosts: nil)
            body = { :amount => amount, :hosts => hosts }.compact
            post("/provisions/#{id}/hosts", body)
        end

        # Delete hosts from a provision.
        #
        # @param id [String] Provision ID.
        # @param host_ids [Array<Integer>] OpenNebula host IDs.
        # @return [Hash] Host deletion acceptance response.
        def delete_provision_hosts(id, host_ids)
            delete("/provisions/#{id}/hosts", :ids => host_ids.join(','))
        end

        # Add an amount of public IPs to the provision.
        #
        # @param id [String] Provision ID.
        # @param amount [Integer] Number of IPs to add (default = 1)
        # @return [Integer] Operation result.
        def add_ip_provision(id, amount = 1)
            body = { :amount => amount }
            post("/provisions/#{id}/public-network/ips", body)
        end

        # Remove a public IPs from the provision by AR ID.
        #
        # @param id [String] Provision ID.
        # @param ar_id [Integer] Address Range ID to remove
        # @return [Integer] Operation result.
        def remove_ip_provision(id, ar_id)
            delete("/provisions/#{id}/public-network/ips/#{ar_id}")
        end

        # Change the permissions of a provision.
        #
        # @param id [Int] The provision's ID.
        # @param octet [String] The new permissions in octal format (e.g., '755').
        # @return [Hash] Provision metadata after permission change.
        def chmod_provision(id, octet)
            body = { :octet => octet }
            post("/provisions/#{id}/chmod", body)
        end

        # Change the owner and/or group of a provision.
        #
        # @param id [Int] The provision's ID.
        # @param owner [String] The new owner's ID.
        # @param group [String] The new group's ID (optional).
        # @return [Hash] Provision metadata after ownership change.
        def chown_provision(id, owner, group = nil)
            body = { :owner_id => owner, :group_id => group }.compact
            post("/provisions/#{id}/chown", body)
        end

        # Change the group of a provision.
        #
        # @param id [Int] The provision's ID.
        # @param group [String] The new group's ID.
        # @return [Hash] Provision metadata after group change.
        def chgrp_provision(id, group)
            body = { :group_id => group }
            post("/provisions/#{id}/chgrp", body)
        end

        # Update a provision with patch data.
        #
        # @param id [String] Provision ID.
        # @param patch_data [Hash] Partial update fields.
        # @return [Hash] Updated provision data.
        def update_provision(id, patch_data)
            allowed = [:name, :description]
            body    = patch_data.select {|key, _| allowed.include?(key.to_sym) }

            patch("/provisions/#{id}", body)
        end

        # Delete a provision.
        #
        # @param id [String] Provision ID.
        # @param force [Boolean] Whether to force deletion.
        # @param from_db [Boolean] Whether to delete only the provision document.
        # @return [Integer] Deletion result/status.
        def delete_provision(id, force = false, from_db = false)
            delete(
                "/provisions/#{id}",
                query_params(:force => force, :from_db => from_db)
            )
        end

        # Retrieve a snapshot of provision logs or follow them continuously.
        #
        # @param id [String] Provision ID
        # @param all [Boolean] Return the full log history or start follow from byte 0
        # @param opts [Hash] Additional options, including :follow
        # @return [Hash, nil] Log snapshot response, or nil while following
        def get_provision_logs(id, all = false, opts = {})
            params = opts.reject {|key, _| [:follow, :all].include?(key) }
            params[:all] = true if all

            if opts[:follow]
                follow_logs("/provisions/#{id}/logs", params)
            else
                get("/provisions/#{id}/logs", params)
            end
        end

    end

end
