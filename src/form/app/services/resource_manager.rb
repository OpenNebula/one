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

    # Manages the OpenNebula resources owned by a Provision
    class ResourceManager

        COMP = 'ONE'

        RESOURCE_MODELS = {
            :cluster    => Provision::Cluster,
            :hosts      => Provision::Host,
            :networks   => Provision::Network,
            :datastores => Provision::Datastore
        }

        CREATE_ORDER = [:cluster, :datastores, :networks, :hosts]
        DELETE_ORDER = CREATE_ORDER.reverse

        REMOVABLE_TYPES = [:hosts, :networks, :datastores]

        attr_reader :body

        # Builds the embedded resource collections from the provision body
        # @param provision [Provision] Provision owning the resources
        def initialize(provision)
            body = provision.body[:one_objects]
            raise ArgumentError, 'Resource body must be a hash' unless body.is_a?(Hash)

            @provision = provision
            @body      = body

            load_resources
        end

        # ------------------------------------------------------
        # Collections
        # ------------------------------------------------------

        # Returns the embedded cluster resource
        def cluster
            @body[:cluster]
        end

        # Returns the embedded host resources
        def hosts
            @body[:hosts]
        end

        # Returns the embedded network resources
        def networks
            @body[:networks]
        end

        # Returns the embedded datastore resources
        def datastores
            @body[:datastores]
        end

        # ------------------------------------------------------
        # Lifecycle
        # ------------------------------------------------------

        # Creates and reconciles all resources in dependency order
        def create
            Log.info(COMP, 'Creating OpenNebula objects', @provision.id)

            provider = Provider.new_from_id(@provision.client, @provision.provider_id)
            return provider if OpenNebula.is_error?(provider)

            CREATE_ORDER.each do |resource_type|
                collection = Array(@body[resource_type])

                collection.each do |resource|
                    unless resource.uuid
                        resource.uuid = SecureRandom.uuid
                        persist!
                    end

                    create_resource(resource, provider, :known_resources => collection)
                    persist!
                end
            end

            if elastic_network
                rc = allocate_public_ips
                raise rc.message if OpenNebula.is_error?(rc)
            end

            Log.info(
                COMP,
                'OpenNebula objects created and registered successfully',
                @provision.id
            )
        rescue StandardError => e
            operation_error(:creating, e)
        end

        # Deletes all or selected resources in reverse dependency order
        # @param requested [Hash] Resource types and OpenNebula IDs to delete
        def delete(requested = {})
            context = requested.empty? ? 'all provision objects' : requested.keys.join(', ')
            Log.info(COMP, "Deleting OpenNebula #{context}", @provision.id)

            DELETE_ORDER.each do |resource_type|
                collection = Array(@body[resource_type])
                next if collection.empty?
                next unless requested.empty? || requested.key?(resource_type)

                selected_resources(collection, requested[resource_type]).each do |resource|
                    delete_resource(resource)
                    persist!
                end
            end

            Log.info(COMP, "OpenNebula #{context} deleted", @provision.id)

            nil
        rescue StandardError => e
            operation_error(:deleting, e)
        end

        # ------------------------------------------------------
        # Hosts
        # ------------------------------------------------------

        # Activates every allocated host in the provision
        def activate_hosts
            Array(hosts).each do |host|
                next unless host.id

                Log.info(COMP, "Activating host #{host.id}...", @provision.id)
                host.activate!(@provision.client)
            end

            nil
        rescue StandardError => e
            Log.error(COMP, "Error activating hosts: #{e.message}", @provision.id)

            OpenNebula::Error.new(
                "Error activating hosts: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Registers a host reported by Terraform in the provision
        # @param id [Integer, nil] OpenNebula host ID
        # @param uuid [String] Terraform resource UUID
        # @param address [String] Host address exposed by Terraform
        def register_host(id:, uuid:, address:)
            return if hosts.any? {|host| host.uuid.to_s == uuid.to_s }

            template = Marshal.load(
                Marshal.dump(@body.dig(:shared, :hosts, :template))
            )

            @provision.register_event(
                :tf_resource_created,
                :description => "#{address} provisioned"
            )

            hosts << Provision::Host.json_create(
                {
                    :id       => id.nil? ? nil : id.to_i,
                    :uuid     => uuid,
                    :name     => address,
                    :template => template
                }
            )
        end

        # Unregisters a host missing from the latest Terraform outputs
        # @param uuid [String] Terraform resource UUID
        def unregister_host(uuid)
            host = hosts.find {|current| current.uuid.to_s == uuid.to_s }
            return unless host

            hosts.delete(host)

            @provision.register_event(
                :tf_resource_deleted,
                :description => "#{host.name} deprovisioned"
            )

            if @provision.values.onprem?
                @provision.values.remove_onprem_host(host.name)
            else
                @provision.values.hosts = [
                    @provision.values.hosts - 1,
                    0
                ].max
            end
        end

        # ------------------------------------------------------
        # Networks
        # ------------------------------------------------------

        # Returns the provision elastic network and rejects ambiguous definitions
        def elastic_network
            elastic_networks = Array(networks).select(&:elastic?)

            raise 'Multiple virtual networks with vn_mad = elastic found' \
                if elastic_networks.size > 1

            elastic_networks.first
        end

        # Allocates missing public IP ranges up to the requested amount
        def allocate_public_ips
            network = elastic_network
            raise 'Elastic network not found' unless network

            target = @provision.values.public_ips
            return if target <= 0

            provider = Provider.new_from_id(
                @provision.client,
                @provision.provider_id
            )
            return provider if OpenNebula.is_error?(provider)

            address_ranges = network.address_ranges(@provision.client)
            return address_ranges if OpenNebula.is_error?(address_ranges)

            count = target - address_ranges.size
            return if count <= 0

            count.times do
                ar_data = {
                    :ipam_mad     => provider.driver,
                    :provision_id => @provision.id,
                    :size         => 1
                }

                Log.info(
                    COMP,
                    "Adding an AR to network #{network.id} " \
                    "using #{ar_data[:ipam_mad]} drivers",
                    @provision.id
                )

                rc = network.add_ar(@provision.client, ar_data)
                return rc if OpenNebula.is_error?(rc)
            end

            nil
        end

        # Deletes a public IP address range from the elastic network
        # @param ar_id [Integer, String] OpenNebula address range ID
        def delete_public_ip(ar_id)
            network = elastic_network
            raise 'Elastic network not found' unless network

            Log.info(
                COMP,
                "Removing AR #{ar_id} from network #{network.id}",
                @provision.id
            )

            network.remove_ar(@provision.client, ar_id)
        end

        # ------------------------------------------------------
        # External resources
        # ------------------------------------------------------

        # Returns unmanaged objects grouped by resource type and ID
        # @param requested [Hash] Resource types and IDs selected for inspection
        def unmanaged(requested = {})
            REMOVABLE_TYPES.each_with_object({}) do |resource_type, result|
                collection = public_send(resource_type)

                unless requested.empty?
                    next unless requested.key?(resource_type)

                    collection = collection.select do |resource|
                        requested[resource_type]&.include?(resource.id)
                    end
                end

                collection.each do |resource|
                    next unless resource.id
                    next if resource.associated_types.empty?

                    associated = associated_objects(resource)
                    next if associated.empty?

                    result[resource_type] ||= {}
                    result[resource_type][resource.id] =
                        resource.associated_types.to_h do |associated_type|
                            [associated_type, associated]
                        end
                end
            end
        rescue StandardError => e
            Log.error(COMP, "Error checking unmanaged resources: #{e.message}", @provision.id)

            OpenNebula::Error.new(
                "Error checking unmanaged resources: #{e.message}",
                OpenNebula::Error::EINTERNAL
            )
        end

        private

        # ------------------------------------------------------
        # Internal operations
        # ------------------------------------------------------

        # Replaces serialized resource hashes with their domain models
        def load_resources
            RESOURCE_MODELS.each do |key, klass|
                resources = @body[key]
                next if resources.nil?

                @body[key] =
                    if resources.is_a?(Array)
                        resources.map {|resource| klass.json_create(resource) }
                    else
                        klass.json_create(resources)
                    end
            end
        end

        # Creates or reconciles one embedded resource
        # @param resource [Provision::Resource] Resource to create
        # @param provider [Provider] Provider owning the resource
        # @param known_resources [Array<Provision::Resource>] Sibling resources
        def create_resource(resource, provider, known_resources:)
            # Normalize resource data before it is sent to OpenNebula
            resource.pre_create!

            helper = ODS::OneHelper::Resource.resolve(resource.type)
            raise helper.message if OpenNebula.is_error?(helper)

            one_object = nil

            # Prefer the persisted ID when resuming an interrupted operation
            if resource.id
                one_object = helper.get(@provision.client, resource.id)

                if OpenNebula.is_error?(one_object)
                    raise one_object.message \
                        unless one_object.errno == OpenNebula::Error::ENO_EXISTS

                    # Reconcile by ownership tags when the persisted object disappeared
                    resource.id = nil
                else
                    # Validate ownership before adopting the persisted object
                    validate_object!(one_object, resource)

                    resource.name = one_object.name
                    return one_object
                end
            end

            # Find an existing object with the OneForm identity to avoid duplicates
            one_object = find_by_identity(resource, known_resources)

            if one_object
                # Validate ownership tags before accepting the existing object
                validate_object!(one_object, resource)
                resource.name = one_object.name

                Log.info(
                    COMP,
                    "#{resource.type.capitalize} #{resource.name} " \
                    "(ID=#{one_object.id}) added",
                    @provision.id
                )
            else
                # No matching object exists, so create it with a resolved name and tags
                resolve_object_name!(resource)
                one_object = create_object(helper, resource, provider)
                validate_object!(one_object, resource)

                Log.info(
                    COMP,
                    "#{resource.type.capitalize} #{resource.name} " \
                    "(ID=#{one_object.id}) created",
                    @provision.id
                )

                event_desc = "#{resource.type.capitalize} #{one_object.id} created"
                @provision.register_event(
                    :one_object_created,
                    :description => event_desc
                )
            end

            # Persist the real ID so subsequent steps can resume reconciliation
            resource.id = one_object.id.to_i

            one_object
        end

        # Deletes one embedded resource and its associated objects
        # @param resource [Provision::Resource] Resource to delete
        def delete_resource(resource)
            # Resources without a persisted ID were never registered in OpenNebula
            return if resource.id.nil?

            # Resolve the helper that knows how to remove this resource type
            helper = ODS::OneHelper::Resource.resolve(resource.type)
            raise helper.message if OpenNebula.is_error?(helper)

            one_object = helper.get(@provision.client, resource.id)

            if OpenNebula.is_error?(one_object)
                raise one_object.message \
                    unless one_object.errno == OpenNebula::Error::ENO_EXISTS

                # The object referenced by the persisted ID is already gone
                resource.id = nil
                return
            end

            # Check ownership and refresh mutable data before removing the object
            validate_object!(one_object, resource)

            resource.id   = one_object.id.to_i
            resource.name = one_object.name
            resource.pre_delete!(@provision.client)

            # Remove dependent objects before deleting their parent resource
            delete_associated(helper, resource)
            delete_object(resource.type, resource.id)

            Log.info(
                COMP,
                "#{resource.type.capitalize} #{resource.name} (ID=#{resource.id}) deleted",
                @provision.id
            )

            event_desc = "#{resource.type.capitalize} #{resource.id} deleted"
            @provision.register_event(
                :one_object_deleted,
                :description => event_desc
            )

            # Clear the embedded ID once the OpenNebula object no longer exists
            resource.id = nil
        end

        # Returns selected resources or the complete collection
        # @param collection [Array<Provision::Resource>] Available resources
        # @param ids [Array<Integer>, nil] Selected OpenNebula IDs
        def selected_resources(collection, ids)
            return collection if ids.nil?

            collection.select {|resource| ids.include?(resource.id) }
        end

        # Persists changes made through the resource manager
        def persist!
            rc = @provision.update
            raise rc.message if OpenNebula.is_error?(rc)
        end

        # Builds an operation error and attempts to persist partial progress
        # @param action [Symbol] Operation being performed
        # @param error [StandardError] Original operation error
        def operation_error(action, error)
            Log.error(
                COMP,
                "Error #{action} OpenNebula objects: #{error.message} - " \
                "#{error.backtrace}",
                @provision.id
            )

            persist_rc  = @provision.update
            persist_msg =
                if OpenNebula.is_error?(persist_rc)
                    "; error persisting partial progress: #{persist_rc.message}"
                else
                    ''
                end

            OpenNebula::Error.new(
                "Error #{action} OpenNebula objects for provision " \
                "#{@provision.id}: #{error.message}#{persist_msg}",
                OpenNebula::Error::EACTION
            )
        end

        # Creates an OpenNebula object and assigns its OneForm ownership tags
        # @param helper [ODS::OneHelper::Resource] Helper for the resource type
        # @param resource [Provision::Resource] Embedded resource to create
        # @param provider [Provider] Provider owning the resource
        def create_object(helper, resource, provider)
            custom_tags = @provision.values.tags
            custom_tags = {} unless custom_tags.is_a?(Hash)

            oneform_tags = custom_tags.merge(
                :provision_id => @provision.id,
                :provider_id  => provider.id,
                :driver       => provider.driver,
                :uuid         => resource.uuid
            ).compact

            one_object = helper.create(
                @provision.client,
                :name           => resource.name,
                :template       => resource.template,
                :cluster_id     => cluster&.id,
                :extra_template => { :oneform => oneform_tags }
            )
            raise one_object.message if OpenNebula.is_error?(one_object)

            one_object
        end

        # Deletes an OpenNebula object by its resource type and ID
        # @param object_type [Symbol] OpenNebula resource type
        # @param object_id [Integer] OpenNebula object ID
        def delete_object(object_type, object_id)
            helper = ODS::OneHelper::Resource.resolve(object_type)
            raise helper.message if OpenNebula.is_error?(helper)

            wait   = helper.const_get(:WAIT_DELETE)

            result = helper.delete(
                @provision.client,
                object_id,
                :wait => wait
            )
            if OpenNebula.is_error?(result)
                return true if result.errno == OpenNebula::Error::ENO_EXISTS

                raise result.message
            end

            result
        end

        # Builds the OneForm ownership identity expected for a resource
        # @param resource [Provision::Resource] Embedded resource to identify
        def object_identity(resource)
            raise "Missing OneForm UUID for #{resource.type} resource" if resource.uuid.nil?

            {
                :provision_id => @provision.id,
                :provider_id  => @provision.provider_id,
                :uuid         => resource.uuid
            }
        end

        # Finds the OpenNebula object matching a resource ownership identity
        # @param resource [Provision::Resource] Embedded resource to find
        # @param known_resources [Array<Provision::Resource>] Sibling resources
        def find_by_identity(resource, known_resources)
            identity   = object_identity(resource)
            uuid       = identity.delete(:uuid)
            attributes = identity.to_h do |key, value|
                ["TEMPLATE/ONEFORM/#{key.to_s.upcase}", value]
            end

            candidates = ODS::OneHelper::Resource.find_all_by_attributes(
                @provision.client,
                resource.type,
                attributes
            )
            raise candidates.message if OpenNebula.is_error?(candidates)

            known_ids = known_resources.filter_map do |candidate|
                next if candidate.equal?(resource) || candidate.id.nil?

                candidate.id.to_i
            end

            matches = candidates.select do |candidate|
                candidate['TEMPLATE/ONEFORM/UUID'].to_s == uuid.to_s
            end

            raise(
                "Multiple #{resource.type} objects match OneForm UUID " \
                "#{uuid}: #{matches.map(&:id).join(', ')}"
            ) if matches.size > 1

            unless matches.empty?
                raise(
                    "#{resource.type.capitalize} (ID=#{matches.first.id}) is already " \
                    'assigned to another provision object'
                ) if known_ids.include?(matches.first.id.to_i)

                return matches.first
            end

            nil
        end

        # Returns the objects associated with an allocated resource
        # @param resource [Provision::Resource] Parent resource
        def associated_objects(resource)
            helper = ODS::OneHelper::Resource.resolve(resource.type)
            raise helper.message if OpenNebula.is_error?(helper)

            objects = helper.associated_objects(@provision.client, resource.id)
            raise objects.message if OpenNebula.is_error?(objects)

            objects
        end

        # Deletes objects associated with an allocated resource
        # @param helper [ODS::OneHelper::Resource] Helper for the resource type
        # @param resource [Provision::Resource] Resource owning the associated objects
        def delete_associated(helper, resource)
            return if resource.associated_types.empty?

            associated = helper.associated_objects(@provision.client, resource.id)
            raise associated.message if OpenNebula.is_error?(associated)

            return if associated.empty?

            if associated.is_a?(Hash)
                raise "The object #{resource.name} has unknown associated " \
                      "objects: #{associated}"
            end

            child_type = resource.associated_types.first
            child_label = child_type == :vm ? 'VMs' : "#{child_type}s"

            Log.warn(
                COMP,
                "Deleting #{child_label} associated with #{resource.type} " \
                "#{resource.name}: #{associated.one? ? 'ID' : 'IDs'} " \
                "#{associated.join(', ')}",
                @provision.id
            )

            associated.each do |object_id|
                delete_object(child_type, object_id)

                event_desc = "#{child_type.to_s.capitalize} #{object_id} deleted"
                @provision.register_event(
                    :one_object_deleted,
                    :description => event_desc
                )
            end
        end

        # Completes a resource name with the provision suffix when required
        # @param resource [Provision::Resource] Resource whose name is resolved
        def resolve_object_name!(resource)
            resource.name ||= @provision.name
            return unless resource.suffix?

            suffix = "(provision_#{@provision.id})"
            return if resource.name.end_with?(suffix)

            resource.name = "#{resource.name} #{suffix}"
        end

        # Validates that an OpenNebula object belongs to its provision resource
        # @param one_object [OpenNebula::PoolElement] OpenNebula object to validate
        # @param resource [Provision::Resource] Expected embedded resource
        def validate_object!(one_object, resource)
            expected_identity = {
                :provision_id => @provision.id,
                :provider_id  => @provision.provider_id
            }

            object_uuid = one_object['TEMPLATE/ONEFORM/UUID']
            expected_identity[:uuid] = resource.uuid unless object_uuid.to_s.empty?

            expected_identity.each do |key, expected|
                actual = one_object["TEMPLATE/ONEFORM/#{key.to_s.upcase}"]
                next if actual.to_s == expected.to_s

                raise(
                    "OpenNebula object #{resource.name} (ID=#{one_object.id}) " \
                    "does not belong to provision #{@provision.id}: " \
                    "ONEFORM/#{key.to_s.upcase}=#{actual.inspect}, " \
                    "expected #{expected.inspect}"
                )
            end

            cluster_id = cluster&.id
            return if cluster_id.nil?

            body = one_object.to_hash.values.first || {}

            cluster_ids = Array(body['CLUSTER_ID']) + Array(body.dig('CLUSTERS', 'ID'))
            cluster_ids = cluster_ids.compact.map(&:to_i)
            return if cluster_ids.empty? || cluster_ids.include?(cluster_id.to_i)

            raise(
                "OpenNebula object #{resource.name} (ID=#{one_object.id}) " \
                "does not belong to cluster ID=#{cluster_id}"
            )
        end

    end

end
