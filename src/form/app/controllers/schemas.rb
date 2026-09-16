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

    # Providers controller
    module ProviderController

        # Schema for provider POST requests
        class PostProviderSchema < Dry::Validation::Contract

            params do
                required(:driver).filled(:string)
                optional(:connection_values).hash
                optional(:name).filled(:string)
                optional(:description).filled(:string)
            end

        end

        # Schema for provider PATCH requests
        class PatchProviderSchema < Dry::Validation::Contract

            params do
                optional(:name).filled(:string)
                optional(:description).maybe(:string)
                optional(:connection).hash
            end

            rule(:name, :description, :connection) do
                base.failure('at least one provider attribute must be provided') \
                    if values.empty?
            end

        end

    end

    # Provisions controller
    module ProvisionController

        # Schema for provision PATCH requests
        class PatchProvisionSchema < Dry::Validation::Contract

            config.validate_keys = true

            params do
                optional(:name).filled(:string)
                optional(:description).maybe(:string)
            end

            rule(:name, :description) do
                base.failure('at least one provision attribute must be provided') \
                    if values.empty?
            end

        end

        # Schema for provision POST requests
        class PostProvisionSchema < Dry::Validation::Contract

            params do
                required(:driver).filled(:string)
                required(:deployment_type).filled(:string)
                required(:provider_id).filled(:integer)
                required(:user_inputs_values).hash
                optional(:name).filled(:string)
                optional(:description).filled(:string)
            end

        end

        # Schema for adding hosts to a provision
        class PostHostsSchema < Dry::Validation::Contract

            params do
                optional(:amount).filled(:integer)
                optional(:hosts).array(:string)
            end

            rule(:amount, :hosts) do
                amount = values[:amount]
                hosts  = values[:hosts]

                if amount.nil? && hosts.nil?
                    base.failure('either amount or hosts must be provided')
                elsif amount && hosts
                    base.failure('amount and hosts cannot be provided together')
                elsif amount && amount <= 0
                    key(:amount).failure('must be greater than zero')
                elsif hosts&.empty?
                    key(:hosts).failure('must not be empty')
                elsif hosts&.any? {|host| host.is_a?(String) && host.empty? }
                    key(:hosts).failure('must contain only non-empty addresses')
                end
            end

        end

        # Schema for deleting provision hosts
        class DeleteHostSchema < Dry::Validation::Contract

            params do
                required(:ids).filled(:string)
            end

            rule(:ids) do
                next unless value

                host_ids = value.split(',', -1)

                if host_ids.any?(&:empty?)
                    key.failure('must be a comma-separated list of host IDs')
                elsif host_ids.any? {|host_id| !host_id.match?(/\A\d+\z/) }
                    key.failure('must contain only values greater than or equal to zero')
                elsif host_ids.uniq.size != host_ids.size
                    key.failure('must not contain duplicates')
                end
            end

        end

        # Schema for adding public IPs to a provision
        class PostPublicIpsSchema < Dry::Validation::Contract

            params do
                optional(:amount).filled(:integer)
            end

            rule(:amount) do
                key.failure('must be greater than zero') if value && value <= 0
            end

        end

        # Schema for deleting a public IP address range
        class DeletePublicIpSchema < Dry::Validation::Contract

            params do
                required(:ar_id).filled(:integer)
            end

            rule(:ar_id) do
                key.failure('must be greater than or equal to zero') \
                    if value && value.negative?
            end

        end

    end

end
