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

    # Schema for snapshots reported by the Kubernetes cluster monitor
    class ObservationsSchema < Dry::Validation::Contract

        ITEM_SCHEMA = Dry::Schema.Params do
            required(:resource).filled(:string)
            required(:namespace).filled(:string)
            required(:name).filled(:string)
            required(:path).filled(:string)
            required(:value).value { str? | int? | float? | bool? | nil? }
            required(:createdAt).filled(:integer, :gteq? => 0)
        end

        params do
            required(:observations).array(ITEM_SCHEMA)
        end

    end

    # Schema for pod snapshots reported by the Kubernetes cluster monitor
    class PodsSchema < Dry::Validation::Contract

        ID_PATTERN = /\A\d+\z/

        POD_SCHEMA = Dry::Schema.JSON do
            required(:pod).filled(:string)
            required(:namespace).filled(:string)
            required(:state).filled(:string)
            required(:reason).maybe(:string)
        end

        params do
            required(:pods).hash
        end

        rule(:pods) do
            value.each do |group_id, vms|
                unless ID_PATTERN.match?(group_id.to_s)
                    key.failure("Invalid NodeGroup ID #{group_id.inspect}")
                    next
                end

                unless vms.is_a?(Hash)
                    key.failure("NodeGroup #{group_id} pods must be grouped by VM ID")
                    next
                end

                vms.each do |vm_id, pods|
                    unless ID_PATTERN.match?(vm_id.to_s)
                        key.failure("Invalid VM ID #{vm_id.inspect} in NodeGroup #{group_id}")
                        next
                    end

                    unless pods.is_a?(Array)
                        key.failure(
                            "Pods for VM #{vm_id} in NodeGroup #{group_id} must be an array"
                        )
                        next
                    end

                    pods.each_with_index do |pod, index|
                        validation = POD_SCHEMA.call(pod)
                        next if validation.success?

                        key.failure(
                            "Invalid pod #{index} for VM #{vm_id} in NodeGroup " \
                            "#{group_id}: #{validation.errors.to_h}"
                        )
                    end
                end
            end
        end

    end

    # Kubernetes group document schema
    class K8sGroupSchema < ODS::Schema

        include ODS::UserInputsRules

        params do
            required(:name).filled(:string)
            required(:uuid).filled(:string)
            optional(:description).filled(:string)
            required(:cluster_id).filled(:integer)
            required(:family).filled(:string)
            required(:flavour).filled(:string)
            required(:type).filled(:string)
            required(:state).filled(:string, :included_in? => K8sGroup.states.map(&:to_s))
            required(:vms).array(:hash) do
                required(:id).filled(:integer, :gteq? => 0)
                required(:ready).filled(:bool)
                required(:pods).array(PodsSchema::POD_SCHEMA)
            end
            required(:dependencies).array(:hash)
            required(:user_inputs).array(:hash)
            required(:user_inputs_values).hash
            required(:registration_time).filled(:integer)
        end

        rule(:name, :uuid) do
            next if ODS::RequestHelper.rfc1123_name?(value)

            key.failure(ODS::RequestHelper::RFC1123_ERROR)
        end

    end

    # Declarative chart definition loaded from the filesystem catalogue
    class ChartSchema < Dry::Validation::Contract

        KUBERNETES_MANIFEST_SCHEMA = Dry::Schema.JSON do
            required(:apiVersion).filled(:string)
            required(:kind).filled(:string)
            required(:metadata).hash do
                required(:name).filled(:string)
                optional(:namespace).filled(:string)
            end
        end

        WAIT_SCHEMA = KUBERNETES_MANIFEST_SCHEMA & Dry::Schema.JSON do
            optional(:condition).filled(:string)
            required(:timeout).filled(:string)
        end

        PATCH_SCHEMA = KUBERNETES_MANIFEST_SCHEMA & Dry::Schema.JSON do
            optional(:type).filled(
                :string, :included_in? => ['json', 'merge', 'strategic']
            )
            required(:content).value { hash? | array? | str? }
        end

        DELETE_SCHEMA = KUBERNETES_MANIFEST_SCHEMA & Dry::Schema.JSON do
            optional(:ignoreNotFound).filled(:bool)
            optional(:wait).filled(:bool)
            optional(:timeout).filled(:string)
        end

        INSTALL_STEP_SCHEMA = Dry::Schema.JSON do
            required(:name).filled(:string)
            optional(:retain).filled(:bool)
            optional(:apply).hash(KUBERNETES_MANIFEST_SCHEMA)
            optional(:wait).hash(WAIT_SCHEMA)
            optional(:patch).hash(PATCH_SCHEMA)
            optional(:delete).hash(DELETE_SCHEMA)
            optional(:shell).filled(:string)
        end

        json do
            required(:id).filled(:string)
            optional(:repo).filled(:string)
            required(:chart).filled(:string)
            required(:version).filled(:string)
            required(:metadata).hash do
                required(:name).filled(:string)
            end
            optional(:authSecret).filled(:string)
            optional(:userInputs).array(:hash)
            optional(:deploymentConstraints).array(
                :string,
                :included_in? => Applications::Validations::DEPLOYMENT_CONSTRAINTS.keys
            )
            optional(:defaultValuesContent).value(:string)
            optional(:dependencies).array(:hash) do
                required(:chartId).filled(:string)
            end
            optional(:preInstall).array(INSTALL_STEP_SCHEMA)
            optional(:postInstall).array(INSTALL_STEP_SCHEMA)
            optional(:preUninstall).array(INSTALL_STEP_SCHEMA)
            optional(:installDefaults).hash do
                required(:releaseName).filled(:string)
                required(:targetNamespace).filled(:string)
                required(:createNamespace).filled(:bool)
            end
        end

        rule(:installDefaults => :releaseName) do
            next unless key?
            next if ODS::RequestHelper.rfc1123_name?(value)

            key.failure(ODS::RequestHelper::RFC1123_ERROR)
        end

        rule(:installDefaults => :targetNamespace) do
            next unless key?
            next if ODS::RequestHelper.rfc1123_name?(value)

            key.failure(ODS::RequestHelper::RFC1123_ERROR)
        end

    end

    # Chart input values validated with the common ODS user input rules
    class ChartUserInputsSchema < ODS::Schema

        params do
            required(:user_inputs).array(:hash)
            required(:user_inputs_values).hash
        end

        include ODS::UserInputsRules

    end

    # Runtime application entry persisted in a Kubernetes cluster document
    class ClusterApplicationSchema < Dry::Validation::Contract

        json do
            required(:id).filled(:string)
            required(:release_name).filled(:string)
            optional(:target_namespace).filled(:string)
            required(:state).filled(
                :string, :included_in? => ['installing', 'ready', 'deleting', 'error']
            )
            optional(:parent).filled(:string)
            optional(:resource_version).maybe(:integer, :gteq? => 0)
            optional(:error_msg).filled(:string)
        end

    end

    # Kubernetes cluster document schema
    class ClusterSchema < ODS::Schema

        params do
            required(:name).filled(:string)
            optional(:description).filled(:string)
            required(:state).filled(:string, :included_in? => Cluster.states.map(&:to_s))
            required(:kubernetes_version).filled(:string)
            optional(:target_kubernetes_version).maybe(:string)
            required(:deployment).hash(ClusterDeployment::SCHEMA)
            required(:control_plane).value(:hash)
            required(:node_groups).value(:array)
            optional(:features).hash do
                optional(:monitor).filled(:bool)
            end
            optional(:monitor_key).maybe(:string)
            optional(:applications).array(ClusterApplicationSchema.schema)
            required(:observations).array(ObservationsSchema::ITEM_SCHEMA)
            required(:registration_time).filled(:integer)
        end

        rule(:name) do
            next if ODS::RequestHelper.rfc1123_name?(value)

            key.failure(ODS::RequestHelper::RFC1123_ERROR)
        end

    end

end
