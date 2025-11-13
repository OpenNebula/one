# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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
            get('/provisions', opts)
        end

        # Retrieve a specific provision by ID.
        #
        # @param id [String] Provision ID.
        # @return [Hash] Details of the provision.
        def get_provision(id)
            get("/provisions/#{id}")
        end

        # Retrieve the unmanaged version of a provision.
        #
        # @param id [String] Provision ID.
        # @return [Hash] Unmanaged data of the provision.
        def get_unmanaged_provision(id)
            get("/provisions/#{id}/unmanged")
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

        # Deprovision (tear down) a specific provision.
        #
        # @param id [String] Provision ID.
        # @param force [Boolean] Whether to force the deprovisioning.
        # @return [Integer] Deprovisioning result/status.
        def undeploy_provision(id, force = false)
            post("/provisions/#{id}/undeploy", { :force => force })
        end

        # Retry a failed provision.
        #
        # @param id [String] Provision ID.
        # @param force [Boolean] Force retry even if not recommended.
        # @param opts [Hash] Optional parameters (e.g., changed inputs).
        # @return [Integer] Retry operation result.
        def retry_provision(id, force = false, **opts)
            post("/provisions/#{id}/retry", { :force => force }.merge(opts))
        end

        # Scale an existing provision.
        #
        # @param id [String] Provision ID.
        # @param direction [String] 'up' or 'down'.
        # @param nodes [Array<String>] List of node names or IDs to scale.
        # @param opts [Hash] Additional options like force.
        # @return [Integer] Scaling operation result.
        def scale_provision(id, direction, nodes, **opts)
            body = {
                :direction => direction,
                :nodes     => nodes
            }.merge(opts)
            post("/provisions/#{id}/scale", body)
        end

        # Add an amount of public IPs to the provision.
        #
        # @param id [String] Provision ID.
        # @param amount [Integer] Number of IPs to add (default = 1)
        # @return [Integer] Operation result.
        def add_ip_provision(id, amount = 1)
            body = { :amount => amount }
            post("/provisions/#{id}/add-ip", body)
        end

        # Remove a public IPs from the provision by AR ID.
        #
        # @param id [String] Provision ID.
        # @param amount [Integer] Address Range ID to remove
        # @return [Integer] Operation result.
        def remove_ip_provision(id, ar_id)
            body = { :ar_id => ar_id }
            post("/provisions/#{id}/remove-ip", body)
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
            body = { :owner_id => owner, :group_id => group }
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
            patch("/provisions/#{id}", patch_data)
        end

        # Delete a provision.
        #
        # @param id [String] Provision ID.
        # @param force [Boolean] Whether to force deletion.
        # @return [Integer] Deletion result/status.
        def delete_provision(id, force = false)
            delete("/provisions/#{id}", { :force => force })
        end

        # Get logs for a specific provision.
        #
        # @param id [String] Provision ID.
        # @return [Array<Hash>] List of log entries for the provision.
        def get_provision_logs(id, all = false, opts = {})
            body = { :all => all }.merge(opts)
            follow_logs("/provisions/#{id}/logs/poll", body)
        end

    end

end
