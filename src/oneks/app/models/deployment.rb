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

    # Validates OneKS deployment placement before provisioning resources
    class ClusterDeployment

        SCHEMA = Dry::Schema.Params do
            required(:cluster).hash do
                required(:id).filled(:integer)
            end

            required(:networks).hash do
                required(:public).hash do
                    required(:id).filled(:integer)
                end

                required(:private).hash do
                    required(:id).filled(:integer)
                end
            end

            optional(:datastores).hash do
                optional(:image).hash do
                    required(:id).filled(:integer)
                end
            end
        end

        class << self

            # Validates that the deployment placement can be used before any
            # OneKS resource is created.
            # @param client [OpenNebula::Client] OpenNebula client
            # @param deployment [Hash] Deployment placement section
            # @param family [Hash, nil] Control plane family definition
            # @return [true, OpenNebula::Error] true if the deployment is valid
            def validate(client, deployment, family = nil)
                return OpenNebula::Error.new(
                    'Missing deployment section', ODS::ResponseHelper::VALIDATION_EC
                ) unless deployment

                cluster_id = deployment.dig(:cluster, :id)
                cluster    = OneHelper::Cluster.get(client, cluster_id)

                return OpenNebula::Error.new(
                    "OpenNebula cluster #{cluster_id} does not exist: #{cluster.message}",
                    ODS::ResponseHelper::VALIDATION_EC
                ) if OpenNebula.is_error?(cluster)

                rc = validate_networks(client, cluster, deployment[:networks])
                return rc if OpenNebula.is_error?(rc)

                rc = validate_datastores(client, cluster, deployment[:datastores])
                return rc if OpenNebula.is_error?(rc)

                rc = validate_appliances(client, cluster, deployment, family)
                return rc if OpenNebula.is_error?(rc)

                true
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error validating deployment placement: #{e.message}",
                    ODS::ResponseHelper::VALIDATION_EC
                )
            end

            # Resolves the appliance VM template for the deployment image datastore
            # @param client [OpenNebula::Client] OpenNebula client
            # @param deployment [Hash] Deployment placement section
            # @param appliance_id [String] Marketplace appliance import ID
            # @return [OpenNebula::Template, OpenNebula::Error] appliance template
            def appliance_template(client, deployment, appliance_id)
                cluster_id = deployment.dig(:cluster, :id)
                cluster    = OneHelper::Cluster.get(client, cluster_id)
                return cluster if OpenNebula.is_error?(cluster)

                datastore = OneHelper::Datastore.resolve_image_ds(
                    client, cluster, deployment.dig(:datastores, :image, :id)
                )
                return OpenNebula::Error.new(
                    datastore.message, ODS::ResponseHelper::VALIDATION_EC
                ) if OpenNebula.is_error?(datastore)

                OneHelper::Template.find_by_marketplace_uuid(
                    client, appliance_id, datastore.id
                )
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error resolving deployment appliance template: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Extracts marketplace appliance definitions from all dependencies
            # in the selected family
            def appliances_for(family)
                dependencies = family.is_a?(Hash) ? family[:dependencies] : []

                Array(dependencies).filter_map do |dep|
                    opts = dep[:opts] || {}
                    next if opts[:appliance_id].nil? || opts[:appliance_id].to_s.strip.empty?

                    klass = K8sDependency.object_class(dep[:type])
                    name  = opts[:appliance_name]

                    # If no name is provided, use the default
                    # value from the dependency class
                    if name.nil? || name.to_s.strip.empty?
                        name =
                            if klass && klass.const_defined?(:APPLIANCE_NAME)
                                klass.const_get(:APPLIANCE_NAME)
                            else
                                dep[:type].to_s
                            end
                    end

                    {
                        :type => dep[:type],
                        :id   => opts[:appliance_id],
                        :name => name
                    }
                end
            end

            private

            # Checks that each deployment network exists and belongs to the
            # selected OpenNebula cluster, when one is provided.
            def validate_networks(client, cluster, networks)
                return OpenNebula::Error.new(
                    'Missing deployment networks section', ODS::ResponseHelper::VALIDATION_EC
                ) if networks.nil? || networks.empty?

                networks.each do |role, net|
                    net_id  = net[:id]
                    network = OneHelper::VirtualNetwork.get(client, net_id)

                    return OpenNebula::Error.new(
                        "Deployment #{role} network #{net_id} does not exist: " \
                        "#{network.message}",
                        ODS::ResponseHelper::VALIDATION_EC
                    ) if OpenNebula.is_error?(network)

                    next if cluster.contains_vnet?(net_id)

                    return OpenNebula::Error.new(
                        "Deployment #{role} network #{net_id} (#{network.name}) is not " \
                        "available in OpenNebula cluster #{cluster.id} (#{cluster.name})",
                        ODS::ResponseHelper::VALIDATION_EC
                    )
                end

                true
            end

            # Checks that each deployment datastore exists and belongs to the
            # selected OpenNebula cluster
            def validate_datastores(client, cluster, datastores)
                return true if datastores.nil? || datastores.empty?

                datastores.each do |role, ds|
                    ds_id     = ds[:id]
                    datastore = OneHelper::Datastore.get(client, ds_id)
                    return OpenNebula::Error.new(
                        "Deployment #{role} datastore #{ds_id} does not exist: " \
                        "#{datastore.message}",
                        ODS::ResponseHelper::VALIDATION_EC
                    ) if OpenNebula.is_error?(datastore)

                    next if cluster.contains_datastore?(ds_id)

                    return OpenNebula::Error.new(
                        "Deployment #{role} datastore #{ds_id} " \
                        "(#{datastore.name}) is not available in OpenNebula " \
                        "cluster #{cluster.id} (#{cluster.name})",
                        ODS::ResponseHelper::VALIDATION_EC
                    )
                end

                true
            end

            # Checks that every family appliance has a valid image and VM Template
            # in the deployment image datastore.
            def validate_appliances(client, cluster, deployment, family)
                family ||= ControlPlane.family_by_name(K8sGroup::DEFAULT_FAMILY)

                return OpenNebula::Error.new(
                    "Control plane family #{K8sGroup::DEFAULT_FAMILY} not found",
                    ODS::ResponseHelper::VALIDATION_EC
                ) if family.nil?

                datastore = OneHelper::Datastore.resolve_image_ds(
                    client, cluster, deployment.dig(:datastores, :image, :id)
                )
                return datastore if OpenNebula.is_error?(datastore)

                appliances = appliances_for(family)
                return true if appliances.empty?

                appliances.each do |appliance|
                    template = OneHelper::Template.find_by_marketplace_uuid(
                        client, appliance[:id], datastore.id
                    )

                    return template if OpenNebula.is_error?(template)
                    next if template

                    return OpenNebula::Error.new(
                        "Deployment appliance #{appliance[:name]} (#{appliance[:id]}) " \
                        "is not available in image datastore #{datastore.id} " \
                        "(#{datastore.name}). Please import the OneKS appliance from the " \
                        'OpenNebula Public Marketplace into an image datastore available in the ' \
                        'target OpenNebula cluster',
                        ODS::ResponseHelper::VALIDATION_EC
                    )
                end

                true
            end

        end

    end

end
