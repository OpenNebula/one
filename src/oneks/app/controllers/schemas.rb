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

    # Chart catalogue and Cluster application controllers
    module ApplicationController

        # Schema for installing one catalogue chart.
        class InstallApplicationSchema < Dry::Validation::Contract

            params do
                required(:application_id).filled(:string)
                optional(:release_name).filled(:string)
                optional(:target_namespace).filled(:string)
                optional(:create_namespace).filled(:bool)
                optional(:user_input_values).hash
            end

            rule(:release_name) do
                next unless key?
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

            rule(:target_namespace) do
                next unless key?
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

        end

        # Query parameters accepted by the public Application catalogue.
        class ApplicationListParamsSchema < Dry::Validation::Contract

            config.validate_keys = true

            params do
                optional(:all).filled(:bool)
                optional(:cluster_id).filled(:integer)
            end

        end

        # Query and path parameters accepted by one Application definition.
        class ApplicationParamsSchema < Dry::Validation::Contract

            config.validate_keys = true

            params do
                required(:application_id).filled(:string)
                optional(:cluster_id).filled(:integer)
            end

        end

        # Query and path parameters for installed Application collections.
        class ClusterApplicationsParamsSchema < Dry::Validation::Contract

            config.validate_keys = true

            params do
                required(:id).filled(:integer)
                optional(:all).filled(:bool)
            end

        end

    end

    # Kubernetes family catalogue controllers
    module FamilyController

        # Query and path parameters for family input definitions.
        class InputsParamsSchema < Dry::Validation::Contract

            config.validate_keys = true

            params do
                required(:family).filled(:string)
                required(:flavour).filled(:string)
                optional(:exclude_defaults).filled(:bool)
            end

        end

    end

    # Kubernetes cluster controller
    module ClusterController

        # Query and path parameters for a Cluster representation.
        class ShowParamsSchema < Dry::Validation::Contract

            config.validate_keys = true

            params do
                required(:id).filled(:integer)
                optional(:expand).filled(:bool)
                optional(:include_sensitive).filled(:bool)
            end

        end

        # Query and path parameters for Cluster deletion.
        class DeleteParamsSchema < Dry::Validation::Contract

            config.validate_keys = true

            params do
                required(:id).filled(:integer)
                optional(:force).filled(:bool)
            end

        end

        # Query and path parameters for Cluster logs.
        class LogsParamsSchema < Dry::Validation::Contract

            config.validate_keys = true

            params do
                required(:id).filled(:integer)
                optional(:page).filled(:integer, :gteq? => 1)
                optional(:per_page).filled(:integer, :gteq? => 1)
                optional(:all).filled(:bool)
            end

        end

        # Schema for Cluster POST requests
        class PostClusterSchema < Dry::Validation::Contract

            params do
                required(:name).filled(:string)
                optional(:description).filled(:string)
                required(:kubernetes_version).filled(:string)
                required(:deployment).hash(ClusterDeployment::SCHEMA)

                required(:spec).hash do
                    optional(:name).filled(:string)
                    optional(:description).filled(:string)
                    optional(:family).filled(:string)
                    required(:flavour).filled(:string)
                    optional(:user_inputs_values).hash
                end
            end

            rule(:name) do
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

            rule(:spec => :name) do
                next unless key?
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

        end

        # Schema for Cluster deployment validation/check requests
        class DeploymentSchema < Dry::Validation::Contract

            params(ClusterDeployment::SCHEMA)

        end

        # Schema for Cluster PATCH requests
        class PatchClusterSchema < Dry::Validation::Contract

            params do
                optional(:name).filled(:string)
                optional(:description).filled(:string)
            end

            rule(:name) do
                next unless key?
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

        end

        # Schema for Cluster upgrade requests
        class UpgradeClusterSchema < Dry::Validation::Contract

            params do
                required(:kubernetes_version).filled(:string)
            end

        end

        # Schema for explicit lifecycle recovery decisions.
        class RecoverClusterSchema < Dry::Validation::Contract

            config.validate_keys = true

            params do
                optional(:action).filled(
                    :string,
                    :included_in? => ['retry', 'success', 'failure', 'delete-db']
                )
            end

        end

    end

    # Kubernetes NodeGroup controller
    module NodeGroupController

        # Schema for NodeGroup POST requests
        class GroupPostSchema < Dry::Validation::Contract

            params do
                required(:name).filled(:string)
                optional(:family).filled(:string)
                required(:flavour).filled(:string)
                optional(:description).filled(:string)
                optional(:user_inputs_values).hash
            end

            rule(:name) do
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

        end

        # Schema for NodeGroup PATCH requests
        class PatchGroupSchema < Dry::Validation::Contract

            params do
                optional(:name).filled(:string)
                optional(:description).filled(:string)
            end

            rule(:name) do
                next unless key?
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

        end

        # Schema for NodeGroup scale requests
        class ScaleGroupSchema < Dry::Validation::Contract

            params do
                required(:target).filled(:integer, :gteq? => 0)
            end

        end

        # Schema for explicit NodeGroup lifecycle recovery decisions.
        class RecoverGroupSchema < Dry::Validation::Contract

            config.validate_keys = true

            params do
                optional(:action).filled(
                    :string,
                    :included_in? => ['retry', 'success', 'failure']
                )
            end

        end

    end

    # Schema for lifecycle event callbacks received through the API.
    class ApiEventSchema < Dry::Validation::Contract

        params do
            required(:event).filled(:string)
            optional(:payload).hash
        end

    end

    # Schema for encrypted lifecycle event callbacks sent by the cluster monitor.
    class EncryptedApiEventSchema < Dry::Validation::Contract

        params do
            required(:payload).filled(:string)
        end

    end

end
