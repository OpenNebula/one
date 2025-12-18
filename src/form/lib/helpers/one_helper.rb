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

    # Defines methods to create resources in OpenNebula using the OCA API
    # All methods included in this module that are meant to be used
    # by the create_resources method should have the following signature:
    #
    # Allocate methods: allocate_<resource_type>
    #
    # @param client [OpenNebula::Client]  OpenNebula client
    # @param template [Hash]              Hash with the template to create the resource
    # @param cluster_id [Integer]         ID of the cluster where the resource will be created
    # @param extra_template [Hash]        (Opt) Extra template to be added to the resource
    # @return [Integer]                   ID of the created resource
    #
    # ----------------------------------------------------------------
    #
    # Delete methods: delete_<resource_type>
    #
    # @param client [OpenNebula::Client]  OpenNebula client
    # @param resource_id [Integer]        ID of the resource to be deleted
    #
    # ----------------------------------------------------------------
    #
    # ID methods: <resource_type>_id
    #
    # @param client [OpenNebula::Client]  OpenNebula client
    # @param resource_name [String]       Name of the resource to get the ID
    # @return [Integer]                   ID of the resource
    #
    # ----------------------------------------------------------------
    #
    # ID exists methods: <resource_type>_id_exists?
    #
    # @param client [OpenNebula::Client]  OpenNebula client
    # @param resource_id [Integer]        ID of the resource to check if exists
    # @return [Boolean]                   True if the resource exists, False otherwise
    #
    # ----------------------------------------------------------------
    #
    # Name exists methods: <resource_type>_name_exists?
    #
    # @param client [OpenNebula::Client]  OpenNebula client
    # @param resource_name [String]       Name of the resource to check if exists
    # @return [Boolean]                   True if the resource exists, False otherwise
    #
    # ----------------------------------------------------------------
    #
    # Associated objects methods: <resource_type>_associated_objects
    #
    # @param client [OpenNebula::Client]  OpenNebula client
    # @param resource_id [Integer]        ID of the resource to get the associated objects
    # @return [Array]                     Array with the IDs of the associated objects
    #
    module OneHelper

        # ----------------------------------------------------------------
        # Cluster
        # ----------------------------------------------------------------

        def allocate_cluster(client, resource, _, extra_template = {})
            cluster = OpenNebula::Cluster.new(OpenNebula::Cluster.build_xml, client)

            name = resource['name']
            rc   = cluster.allocate(name)
            raise rc.message if OpenNebula.is_error?(rc)

            if extra_template
                cluster.update(Hash.to_raw(extra_template), true)
                raise rc.message if OpenNebula.is_error?(rc)
            end

            cluster.id
        end

        def delete_cluster(client, cluster_id)
            cluster = OpenNebula::Cluster.new_with_id(cluster_id, client)
            rc = cluster.delete

            raise rc.message if OpenNebula.is_error?(rc)
        end

        def cluster_id(client, cluster_name)
            cpool = OpenNebula::ClusterPool.new(client)
            rc    = cpool.info

            raise rc.message if OpenNebula.is_error?(rc)

            cluster = cpool.find {|c| c.name == cluster_name }
            cluster.id
        end

        def cluster_id_exists?(client, cluster_id)
            cpool = OpenNebula::ClusterPool.new(client)
            rc    = cpool.info

            raise rc.message if OpenNebula.is_error?(rc)

            cpool.map(&:id).include?(cluster_id)
        end

        def cluster_name_exists?(client, cluster_name)
            cpool = OpenNebula::ClusterPool.new(client)
            rc    = cpool.info

            raise rc.message if OpenNebula.is_error?(rc)

            cpool.map(&:name).include?(cluster_name)
        end

        def cluster_associated_objects(client, cluster_id)
            cluster = OpenNebula::Cluster.new_with_id(cluster_id, client)
            rc      = cluster.info

            raise rc.message if OpenNebula.is_error?(rc)

            hosts = cluster.to_hash.dig('CLUSTER', 'HOSTS', 'ID') || []
            datastores = cluster.to_hash.dig('CLUSTER', 'DATASTORES', 'ID') || []
            networks = cluster.to_hash.dig('CLUSTER', 'VNETS', 'ID') || []

            {
                'host' => hosts,
                'datastore' => datastores,
                'network' => networks
            }.compact.reject {|_, value| value.empty? }
        end

        # ----------------------------------------------------------------
        # Hosts
        # ----------------------------------------------------------------

        def allocate_host(client, resource, cluster_id, extra_template = {})
            host = OpenNebula::Host.new(OpenNebula::Host.build_xml, client)

            hostname = resource['name']
            template = resource['template'] || {}
            im_mad   = template['im_mad'] || 'kvm'
            vmm_mad  = template['vmm_mad'] || 'kvm'

            rc = host.allocate(hostname, im_mad, vmm_mad, cluster_id)
            raise rc.message if OpenNebula.is_error?(rc)

            if extra_template
                host.update(Hash.to_raw(extra_template), true)
                raise rc.message if OpenNebula.is_error?(rc)
            end

            host.id
        end

        def delete_host(client, host_id)
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.delete

            raise rc.message if OpenNebula.is_error?(rc)

            wait_until_deleted(host)
        end

        def host_id(client, host_name)
            hpool = OpenNebula::HostPool.new(client)
            rc    = hpool.info

            raise rc.message if OpenNebula.is_error?(rc)

            host = hpool.find {|h| h.name == host_name }
            host.id
        end

        def host_id_exists?(client, host_id)
            hpool = OpenNebula::HostPool.new(client)
            rc    = hpool.info

            raise rc.message if OpenNebula.is_error?(rc)

            hpool.map(&:id).include?(host_id)
        end

        def host_name_exists?(client, host_name)
            hpool = OpenNebula::HostPool.new(client)
            rc    = hpool.info

            raise rc.message if OpenNebula.is_error?(rc)

            hpool.map(&:name).include?(host_name)
        end

        def host_forceupdate(client, host_id)
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.forceupdate

            raise rc.message if OpenNebula.is_error?(rc)
        end

        def host_enable(client, host_id)
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.enable

            raise rc.message if OpenNebula.is_error?(rc)
        end

        def host_disable(client, host_id)
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.disable

            raise rc.message if OpenNebula.is_error?(rc)
        end

        def host_associated_objects(client, host_id)
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc   = host.info

            raise rc.message if OpenNebula.is_error?(rc)

            Array(host.to_hash.dig('HOST', 'VMS', 'ID')) || []
        end

        # ----------------------------------------------------------------
        # Datastores
        # ----------------------------------------------------------------

        def allocate_datastore(client, resource, cluster_id, extra_template = {})
            ds_name          = resource['name']
            template         = resource['template'].clone || {}
            template['name'] = ds_name

            template.merge!(extra_template) if extra_template

            ds = OpenNebula::Datastore.new(OpenNebula::Datastore.build_xml, client)
            rc = ds.allocate(Hash.to_raw(template), cluster_id)

            raise rc.message if OpenNebula.is_error?(rc)

            ds.id
        end

        def delete_datastore(client, datastore_id)
            ds = OpenNebula::Datastore.new_with_id(datastore_id, client)
            rc = ds.delete

            raise rc.message if OpenNebula.is_error?(rc)

            wait_until_deleted(ds)
        end

        def datastore_id(client, datastore_name)
            dspool = OpenNebula::DatastorePool.new(client)
            rc     = dspool.info

            raise rc.message if OpenNebula.is_error?(rc)

            datastore = dspool.find {|ds| ds.name == datastore_name }
            datastore.id
        end

        def datastore_id_exists?(client, datastore_id)
            dspool = OpenNebula::DatastorePool.new(client)
            rc     = dspool.info

            raise rc.message if OpenNebula.is_error?(rc)

            dspool.map(&:id).include?(datastore_id)
        end

        def datastore_name_exists?(client, datastore_name)
            dspool = OpenNebula::DatastorePool.new(client)
            rc     = dspool.info

            raise rc.message if OpenNebula.is_error?(rc)

            dspool.map(&:name).include?(datastore_name)
        end

        def datastore_associated_objects(client, datastore_id)
            ds = OpenNebula::Datastore.new_with_id(datastore_id, client)
            rc = ds.info

            raise rc.message if OpenNebula.is_error?(rc)

            Array(ds.to_hash.dig('DATASTORE', 'IMAGES', 'ID')) || []
        end

        # ----------------------------------------------------------------
        # Virtual Networks
        # ----------------------------------------------------------------

        def network_info(client, network_id)
            vn = OpenNebula::VirtualNetwork.new_with_id(network_id, client)
            rc = vn.info

            raise rc.message if OpenNebula.is_error?(rc)

            vn.to_hash['VNET']
        end

        def network_add_ar(client, network_id, ar)
            vn = OpenNebula::VirtualNetwork.new_with_id(network_id, client)
            rc = vn.info
            raise rc.message if OpenNebula.is_error?(rc)

            wait_until_ready(vn)

            ar_data     = vn.to_hash.dig('VNET', 'AR_POOL', 'AR') || []
            ar_data     = [ar_data] if ar_data.is_a?(Hash)
            initial_ids = ar_data.map {|a| a['AR_ID'] }

            rc = vn.add_ar(Hash.to_raw(ar))
            raise rc.message if OpenNebula.is_error?(rc)

            wait_until_ar_added(vn, initial_ids)
        end

        def network_rm_ar(client, network_id, ar_id)
            vnet = OpenNebula::VirtualNetwork.new_with_id(network_id, client)
            rc   = vnet.rm_ar(ar_id.to_i)

            raise rc.message if OpenNebula.is_error?(rc)
        end

        def allocate_network(client, resource, cluster_id, extra_template = {})
            vn_name          = resource['name']
            template         = resource['template'].clone || {}
            template['name'] = vn_name

            # Remove ARs with size == 0
            template['ar'].reject! {|ar| ar['size'].to_i == 0 } if template['ar'].is_a?(Array)
            template.merge!(extra_template) if extra_template

            vn = OpenNebula::VirtualNetwork.new(OpenNebula::VirtualNetwork.build_xml, client)
            rc = vn.allocate(Hash.to_raw(template), cluster_id)

            raise rc.message if OpenNebula.is_error?(rc)

            vn.id
        end

        def delete_network(client, network_id)
            vn = OpenNebula::VirtualNetwork.new_with_id(network_id, client)
            rc = vn.delete

            raise rc.message if OpenNebula.is_error?(rc)

            wait_until_deleted(vn)
        end

        def network_id(client, network_name)
            vnpool = OpenNebula::VirtualNetworkPool.new(client)
            rc     = vnpool.info

            raise rc.message if OpenNebula.is_error?(rc)

            network = vnpool.find {|vn| vn.name == network_name }
            network.id
        end

        def network_id_exists?(client, network_id)
            vnpool = OpenNebula::VirtualNetworkPool.new(client)
            rc     = vnpool.info

            raise rc.message if OpenNebula.is_error?(rc)

            vnpool.map(&:id).include?(network_id)
        end

        def network_name_exists?(client, network_name)
            vnpool = OpenNebula::VirtualNetworkPool.new(client)
            rc     = vnpool.info

            raise rc.message if OpenNebula.is_error?(rc)

            vnpool.map(&:name).include?(network_name)
        end

        def network_associated_objects(client, network_id)
            vn = OpenNebula::VirtualNetwork.new_with_id(network_id, client)
            rc = vn.info

            raise rc.message if OpenNebula.is_error?(rc)

            vn_body = vn.to_hash['VNET']

            # Return an empty array if no leases are used
            return [] if vn_body['USED_LEASES'].to_i.zero?

            ars = vn_body.dig('AR_POOL', 'AR')

            return [] if ars.nil?

            associated_vms = []

            # Get the VM IDs associated with each AR
            ars.map do |ar|
                leases = ar['LEASES']['LEASE'] || []
                vm_ids = leases.map {|lease| lease['VM'] }.uniq

                associated_vms.concat(vm_ids)
            end

            associated_vms
        end

        # ----------------------------------------------------------------
        # Images
        # ----------------------------------------------------------------

        def delete_image(client, image_id)
            image = OpenNebula::Image.new_with_id(image_id, client)
            rc = image.delete

            raise rc.message if OpenNebula.is_error?(rc)

            wait_until_deleted(image)
        end
        # ----------------------------------------------------------------
        # Virtual Machines
        # ----------------------------------------------------------------

        def delete_vm(client, vm_id)
            vm = OpenNebula::VirtualMachine.new_with_id(vm_id, client)
            rc = vm.delete

            raise rc.message if OpenNebula.is_error?(rc)

            wait_until_deleted(vm)
        end

        # ----------------------------------------------------------------
        # Utils
        # ----------------------------------------------------------------

        # Wait until OpenNebula object is ready or timeout
        def wait_until_ready(object, timeout = 60, interval = 2, ready_state = 1)
            Timeout.timeout(timeout) do
                loop do
                    sleep interval

                    rc = object.info
                    # 1 = READY by default for networks, datastores uses 0
                    break if OpenNebula.is_error?(rc) || object.state == ready_state
                end
            end
        rescue Timeout::Error
            raise "Timeout: Could not delete OpeNebula object ID=#{object.id} " \
                  "within #{timeout} seconds"
        end

        # Wait until OpenNebula object is deleted or timeout
        def wait_until_deleted(object, timeout = 60, interval = 2)
            Timeout.timeout(timeout) do
                loop do
                    sleep interval

                    rc = object.info
                    # 6 = DONE state for VMs, rest of resources return rc error
                    break if OpenNebula.is_error?(rc) || object.state == 6
                end
            end
        rescue Timeout::Error
            raise "Timeout: Could not delete OpeNebula object ID=#{object.id} " \
                  "within #{timeout} seconds"
        end

        # To avoid race conditions, we need to wait until provider give us the IP
        def wait_until_ar_added(vnet, initial_ids, timeout = 60, interval = 2)
            Timeout.timeout(timeout) do
                loop do
                    sleep interval

                    rc = vnet.info
                    raise rc.message if OpenNebula.is_error?(rc)

                    current_ars = vnet.to_hash.dig('VNET', 'AR_POOL', 'AR') || []
                    current_ars = [current_ars] if current_ars.is_a?(Hash)
                    current_ids = current_ars.map {|ar| ar['AR_ID'] }

                    new_ids = current_ids - initial_ids

                    break unless new_ids.empty?
                end
            end
        rescue Timeout::Error
            raise "Timeout: New ARs were not added to network ID=#{vnet.id} " \
                  "within #{timeout} seconds"
        end

        def create_resources(provision, resource_type, resources, form_tags, suffix)
            return if resources.nil? || resources.empty?

            client = provision.client
            log    = provision.logger

            resources.each do |resource|
                resource['name'] = provision.name if resource['name'].nil?

                # Generate the resource name with the suffix if needed
                unless resource['name'].end_with?(suffix) || resource_type == 'host'
                    resource['name'] = "#{resource['name']} #{suffix}"
                end

                # Deep clone the tags to avoid modifying the original hash
                tags = JSON.parse(form_tags.to_json)

                tags['oneform'] = {} unless tags['oneform'].is_a?(Hash)
                tags['oneform']['resource_id'] = resource['resource_id'] if resource['resource_id']

                # Provision do not have any information about the resource
                if resource['id'].nil?
                    # Check if the resource already exists in OpenNebula
                    # If exists we use the existing ID, otherwise we create it
                    if send("#{resource_type}_name_exists?", client, resource['name'])
                        resource_id = send(
                            "#{resource_type}_id", client, resource['name']
                        )

                        log.info(
                            "#{resource_type.capitalize} '#{resource['name']}' " \
                            "added from ID '#{resource_id}'"
                        )
                    else
                        resource_id = send(
                            "allocate_#{resource_type}",
                            client,
                            resource,
                            provision.cluster['id'],
                            tags
                        )

                        log.info(
                            "#{resource_type.capitalize} '#{resource['name']}' " \
                            "created with ID '#{resource_id}'"
                        )

                        provision.register_action(
                            Provision::ACTIONS[:one_object_created],
                            "#{resource_type.capitalize} #{resource_id} created"
                        )
                    end
                else
                    # Provision has information about the resource
                    # Check if the resource really exists in OpenNebula
                    resource_id_exists = send(
                        "#{resource_type}_id_exists?",
                        client,
                        resource['id']
                    )

                    next if resource_id_exists

                    # If the ID stored doesn't exist, we try to use
                    # the name to get the ID, if not we recreate the resource
                    resource_name_exists = send(
                        "#{resource_type}_name_exists?",
                        client,
                        resource['name']
                    )

                    if resource_name_exists
                        resource_id = send(
                            "#{resource_type}_id",
                            client,
                            resource['name']
                        )

                        log.info(
                            "#{resource_type.capitalize} '#{resource['name']}' " \
                            "added from ID '#{resource_id}'"
                        )
                    else
                        resource_id = send(
                            "allocate_#{resource_type}",
                            client,
                            resource,
                            provision.cluster['id'],
                            tags
                        )

                        log.info(
                            "#{resource_type.capitalize} '#{resource['name']}' " \
                            "created with ID '#{resource_id}'"
                        )

                        provision.register_action(
                            Provision::ACTIONS[:one_object_created],
                            "#{resource_type.capitalize} #{resource_id} created"
                        )
                    end
                end

                resource['id'] = resource_id
            end
        rescue StandardError => e
            log.error("Error creating resources: #{e.message}")
            provision.update
            raise e
        end

        def delete_resources(provision, resource_type, associated_types, resources)
            return if resources.nil? || resources.empty?

            client = provision.client
            log    = provision.logger

            resources.each do |resource|
                next unless resource['id']

                # Check if the resource has associated objects
                associated_objects = send(
                    "#{resource_type}_associated_objects",
                    client,
                    resource['id']
                )

                unless associated_objects.empty?
                    # This method does not support deleting recursive associated objects
                    # therefore, clusters should return and empty hash if they have
                    # been cleaned correctly
                    raise "The resource '#{resource['name']}' has unknown associated "  \
                        "objects: #{associated_objects}" \
                        if associated_objects.is_a?(Hash) && !associated_objects.empty?

                    log.warn(
                        "Deleting associated objects to #{resource_type.capitalize} " \
                        "'#{resource['name']}' with ID '#{resource['id']}': " \
                        "#{associated_objects.join(', ')}"
                    )

                    associated_objects.each do |id|
                        # TODO: support more than one associated type during deletion
                        send("delete_#{associated_types.first}", client, id)

                        provision.register_action(
                            Provision::ACTIONS[:one_object_deleted],
                            "#{associated_types.first.capitalize} #{id} deleted"
                        )
                    end
                end

                send(
                    "delete_#{resource_type}",
                    client,
                    resource['id']
                )

                log.info(
                    "#{resource_type.capitalize} '#{resource['name']}' " \
                    "with ID '#{resource['id']}' deleted"
                )

                provision.register_action(
                    Provision::ACTIONS[:one_object_deleted],
                    "#{resource_type.capitalize} #{resource['id']} deleted"
                )

                resource['id'] = nil
            end
        rescue StandardError => e
            log.error("Error deleting resources: #{e.message}")
            provision.update
            raise e
        end

    end

end

# Extension of Hash class to add to_raw method
class Hash

    class << self

        # Converts a hash to a raw String in the form KEY = VAL
        #
        # @param template [String]          Hash content
        #
        # @return [Hash, OpenNebula::Error] String representation in the form KEY = VALUE of
        #                                   the hash, or an OpenNebula Error if the conversion fails
        def to_raw(content_hash)
            return '' if content_hash.nil? || content_hash.empty?

            content = ''
            content_hash.each do |key, value|
                case value
                when Hash
                    sub_content = to_raw(value)

                    content      += "#{key} = [\n"
                    content_lines = sub_content.split("\n")

                    content_lines.each_with_index do |line, index|
                        content += line.to_s
                        content += ",\n" unless index == content_lines.size - 1
                    end

                    content += "\n]\n"
                when Array
                    value.each do |element|
                        content += to_raw({ key.to_s => element })
                    end
                else
                    content += "#{key} = \"#{value}\"\n"
                end
            end
            content
        rescue StandardError => e
            return OpenNebula::Error.new("Error wrapping the hash: #{e.message}")
        end

    end

end
