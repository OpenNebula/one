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

    # Providers Module
    module Providers

        # List all existing cloud providers.
        #
        # @return [Array<Hash>] List of configured providers with their metadata.
        def list_providers(opts = {})
            get('/providers', opts)
        end

        # Retrieve a specific provider by its ID.
        #
        # @param id [Int] The provider's unique identifier.
        # @return [Hash] Provider configuration and status.
        def get_provider(id, opts = {})
            get("/providers/#{id}", opts)
        end

        # Retrieve the location path of a provider.
        #
        # @param id [Int] The provider's unique identifier.
        # @return [String] The location path of the provider.
        def get_provider_location(id)
            get("/providers/#{id}/path")
        end

        # Creates a new provider using a base driver definition
        #
        # @param driver_name [String] The driver name
        # @param octet [String] Values to merge to the provider (connection_values, name, etc)
        # @return [Hash] Provider object created
        def create_provider(driver_name, values)
            body = {
                :driver => driver_name
            }.merge(values)

            post('/providers', body)
        end

        # Change the permissions of a provider.
        #
        # @param id [Int] The provider's ID.
        # @param octet [String] The new permissions in octal format (e.g., '755').
        # @return [Hash] Provider metadata after permission change.
        def chmod_provider(id, octet)
            body = { :octet => octet }
            post("/providers/#{id}/chmod", body)
        end

        # Change the owner and/or group of a provider.
        #
        # @param id [Int] The provider's ID.
        # @param owner [String] The new owner's ID.
        # @param group [String] The new group's ID (optional).
        # @return [Hash] Provider metadata after ownership change.
        def chown_provider(id, owner, group = nil)
            body = { :owner_id => owner, :group_id => group }
            post("/providers/#{id}/chown", body)
        end

        # Change the group of a provider.
        #
        # @param id [Int] The provider's ID.
        # @param group [String] The new group's ID.
        # @return [Hash] Provider metadata after group change.
        def chgrp_provider(id, group)
            body = { :group_id => group }
            post("/providers/#{id}/chgrp", body)
        end

        # Update an existing provider with partial data.
        #
        # @param id [Int] The provider's ID.
        # @param patch_data [Hash] Fields to update (e.g., new credentials).
        # @return [Hash] Updated provider metadata.
        def update_provider(id, patch_data)
            patch("/providers/#{id}", patch_data)
        end

        # Delete a provider by its ID.
        #
        # @param id [Int] The provider's ID.
        # @return [Hash] Result of the delete operation.
        def delete_provider(id)
            delete("/providers/#{id}")
        end

    end

end
