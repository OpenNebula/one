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
            optional(:cluster).hash do
                optional(:id).filled(:integer)
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
                cluster    = OneHelper::Cluster.get(client, cluster_id) unless cluster_id.nil?

                return OpenNebula::Error.new(
                    "OpenNebula cluster #{cluster_id} does not exist: #{cluster.message}",
                    ODS::ResponseHelper::VALIDATION_EC
                ) if OpenNebula.is_error?(cluster)

                rc = validate_networks(client, cluster, deployment[:networks])
                return rc if OpenNebula.is_error?(rc)

                rc = validate_datastores(client, cluster, deployment[:datastores])
                return rc if OpenNebula.is_error?(rc)

                rc = validate_appliances(client, deployment, family)
                return rc if OpenNebula.is_error?(rc)

                true
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error validating deployment placement: #{e.message}",
                    ODS::ResponseHelper::VALIDATION_EC
                )
            end

            # Resolves the appliance in an image datastore compatible with the selected
            # networks, explicit datastore and optional OpenNebula cluster.
            # @param client [OpenNebula::Client] OpenNebula client
            # @param deployment [Hash] Deployment placement section
            # @param appliance_id [String] OneKS appliance ID
            # @return [Hash, OpenNebula::Error] appliance image and template
            def appliance(client, deployment, appliance_id)
                cluster_id = deployment.dig(:cluster, :id)
                cluster    = OneHelper::Cluster.get(client, cluster_id) unless cluster_id.nil?
                return cluster if OpenNebula.is_error?(cluster)

                datastore_ids = appliance_datastores(client, deployment, cluster)
                return datastore_ids if OpenNebula.is_error?(datastore_ids)

                OneHelper::Template.find_by_appliance_id(
                    client, appliance_id, datastore_ids
                )
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error resolving appliance: #{e.message}",
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

            # Reads membership from accessible resources, without requiring Cluster USE
            def appliance_datastores(client, deployment, cluster)
                networks = deployment[:networks]
                return OpenNebula::Error.new(
                    'Missing deployment networks section', ODS::ResponseHelper::VALIDATION_EC
                ) if networks.nil? || networks.empty?

                cluster_ids = [cluster.id.to_s] if cluster

                networks.each_value do |net|
                    network = OneHelper::VirtualNetwork.get(client, net[:id])
                    return network if OpenNebula.is_error?(network)

                    ids = Array(network.retrieve_elements('CLUSTERS/ID'))
                    cluster_ids = cluster_ids.nil? ? ids : cluster_ids & ids
                end

                return OpenNebula::Error.new(
                    'Selected networks and OpenNebula cluster have no common placement',
                    ODS::ResponseHelper::VALIDATION_EC
                ) if cluster_ids.empty?

                image_ds = deployment.dig(:datastores, :image, :id)

                if image_ds
                    selected = OneHelper::Datastore.get(client, image_ds)
                    return selected if OpenNebula.is_error?(selected)

                    datastores = [selected]
                else
                    datastores = OpenNebula::DatastorePool.new(client)
                    rc = datastores.info
                    return rc if OpenNebula.is_error?(rc)
                end

                ids = datastores.filter_map do |datastore|
                    next unless OneHelper::Datastore.image?(datastore)
                    next if (cluster_ids & Array(datastore.retrieve_elements('CLUSTERS/ID'))).empty?

                    datastore.id
                end

                return ids unless ids.empty?

                OpenNebula::Error.new(
                    'No accessible image datastore is compatible with the selected networks ' \
                    'and deployment placement', ODS::ResponseHelper::VALIDATION_EC
                )
            end

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

                    next if cluster.nil? || cluster.contains_vnet?(net_id)

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

                    next if cluster.nil? || cluster.contains_datastore?(ds_id)

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
            # in a datastore available to the target OpenNebula cluster
            def validate_appliances(client, deployment, family)
                family ||= ControlPlane.family_by_name(K8sGroup::DEFAULT_FAMILY)

                return OpenNebula::Error.new(
                    "Control plane family #{K8sGroup::DEFAULT_FAMILY} not found",
                    ODS::ResponseHelper::VALIDATION_EC
                ) if family.nil?

                appliances = appliances_for(family)
                return true if appliances.empty?

                appliances.each do |appliance|
                    template = self.appliance(client, deployment, appliance[:id])

                    return template if OpenNebula.is_error?(template)
                    next if template

                    return OpenNebula::Error.new(
                        "Appliance #{appliance[:name]} (#{appliance[:id]}) " \
                        'is not available in any image datastore accessible ' \
                        'with the selected configuration',
                        ODS::ResponseHelper::VALIDATION_EC
                    )
                end

                true
            end

        end

    end

end
