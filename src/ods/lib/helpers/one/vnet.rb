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

module OpenNebula

    module DocumentServer

        # Defines methods to manage resources in OpenNebula using the OCA API
        module OneHelper

            # Defines methods to manage Virtual Networks in OpenNebula
            module VirtualNetwork

                NONE_CLUSTER_ID = OpenNebula::ClusterPool::NONE_CLUSTER_ID
                RESOURCE_TYPE   = 'network'
                WAIT_DELETE     = true
                POOL_CLASS      = OpenNebula::VirtualNetworkPool
                POOL_ARGS       = [-1]

                # Creates a virtual network from content or named options.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param content [Hash, nil] Network template.
                # @param options [Hash] Name, templates, and cluster ID.
                # @return [OpenNebula::VirtualNetwork, OpenNebula::Error]
                def self.create(client, content = nil, **options)
                    cluster_id = options.fetch(:cluster_id, NONE_CLUSTER_ID)

                    if content.nil?
                        name           = options[:name]
                        template       = options.fetch(:template, {})
                        extra_template = options.fetch(:extra_template, {})
                        content = Marshal.load(Marshal.dump(template || {}))
                        content = content.merge(extra_template || {}).merge(:name => name)
                    end

                    template = Hash.to_raw(content)
                    return template if OpenNebula.is_error?(template)

                    return OpenNebula::Error.new(
                        'Network template cannot be empty', OpenNebula::Error::EACTION
                    ) if template.to_s.empty?

                    vnet = OpenNebula::VirtualNetwork.new(
                        OpenNebula::VirtualNetwork.build_xml, client
                    )

                    rc = vnet.allocate(template, cluster_id)
                    return rc if OpenNebula.is_error?(rc)

                    rc = vnet.info
                    return rc if OpenNebula.is_error?(rc)

                    vnet
                end

                # Returns a virtual network body using symbolized keys.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param network_id [Integer] Network ID.
                # @param downcase [Boolean] Whether to downcase keys.
                # @return [Hash, OpenNebula::Error] network body or an API error.
                def self.body(client, network_id, downcase: true)
                    vnet = get(client, network_id)
                    return vnet if OpenNebula.is_error?(vnet)

                    body = vnet.to_hash['VNET']

                    return OpenNebula::Error.new(
                        "Cannot retrieve VNet body for resource '#{network_id}'",
                        OpenNebula::Error::EACTION
                    ) unless body

                    body.deep_symbolize_keys(:downcase => downcase)
                end

                # Checks whether a virtual network with a name exists.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Network name.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists?(client, name)
                    vnet = find(client, name)
                    return vnet if OpenNebula.is_error?(vnet)

                    !vnet.nil?
                end

                # Checks whether a virtual network ID exists in the pool.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param network_id [Integer] Network ID.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists_id?(client, network_id)
                    vnet_pool = OpenNebula::VirtualNetworkPool.new(client)

                    rc = vnet_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    vnet_pool.any? {|vnet| vnet.id.to_i == network_id.to_i }
                end

                # Retrieves a virtual network with its current information.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param network_id [Integer] Network ID.
                # @return [OpenNebula::VirtualNetwork, OpenNebula::Error] network or an API error.
                def self.get(client, network_id)
                    return OpenNebula::Error.new(
                        'Network ID cannot be nil', OpenNebula::Error::EACTION
                    ) if network_id.nil?

                    vnet = OpenNebula::VirtualNetwork.new_with_id(network_id, client)

                    rc = vnet.info
                    return rc if OpenNebula.is_error?(rc)

                    vnet
                end

                # Returns a virtual network name.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param network_id [Integer] Network ID.
                # @return [String, OpenNebula::Error] network name or an API error.
                def self.name(client, network_id)
                    vn = get(client, network_id)
                    return vn if OpenNebula.is_error?(vn)

                    name = vn.to_hash.dig('VNET', 'NAME')
                    return OpenNebula::Error.new(
                        "Cannot retrieve name for VNet '#{network_id}'",
                        OpenNebula::Error::EACTION
                    ) if name.nil? || name.to_s.empty?

                    name
                end

                # Finds a virtual network by name.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Network name.
                # @return [OpenNebula::VirtualNetwork, nil, OpenNebula::Error]
                def self.find(client, name)
                    vnet_pool = OpenNebula::VirtualNetworkPool.new(client, -1)

                    rc = vnet_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    vnet = vnet_pool.find {|vn| vn.name == name }
                    return if vnet.nil?

                    rc = vnet.info
                    return rc if OpenNebula.is_error?(rc)

                    vnet
                end

                # Deletes a virtual network, optionally waiting for its removal.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param network_id [Integer] Network ID.
                # @param wait [Boolean] Whether to wait for deletion.
                # @return [true, OpenNebula::Error] success or an API error.
                def self.delete(client, network_id, wait: false)
                    return OpenNebula::Error.new(
                        'Network ID cannot be nil', OpenNebula::Error::EACTION
                    ) if network_id.nil?

                    vnet = if wait
                               get(client, network_id)
                           else
                               OpenNebula::VirtualNetwork.new_with_id(network_id, client)
                           end
                    return vnet if OpenNebula.is_error?(vnet)

                    rc = vnet.delete
                    return rc if OpenNebula.is_error?(rc)
                    return true unless wait

                    Resource.wait_until_deleted(vnet)
                end

                # Adds an address range to a ready virtual network.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param network_id [Integer] Network ID.
                # @param address_range [Hash] Address-range template.
                # @param wait [Boolean] Whether to wait for creation.
                # @return [Integer, true, OpenNebula::Error] new AR ID, success, or an API error.
                def self.add_ar(client, network_id, address_range, wait: true)
                    vnet = get(client, network_id)
                    return vnet if OpenNebula.is_error?(vnet)

                    rc = Resource.wait_until_ready(vnet)
                    return rc if OpenNebula.is_error?(rc)

                    initial_ids = address_range_ids(vnet)
                    content     = Hash.to_raw(address_range)
                    return content if OpenNebula.is_error?(content)

                    rc = vnet.add_ar(content)
                    return rc if OpenNebula.is_error?(rc)
                    return true unless wait

                    wait_until_ar_added(vnet, initial_ids)
                end

                # Removes an address range from a virtual network.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param network_id [Integer] Network ID.
                # @param address_range_id [Integer] Address-range ID.
                # @return [true, OpenNebula::Error] success or an API error.
                def self.remove_ar(client, network_id, address_range_id)
                    return OpenNebula::Error.new(
                        'Network ID cannot be nil', OpenNebula::Error::EACTION
                    ) if network_id.nil?

                    vnet = OpenNebula::VirtualNetwork.new_with_id(network_id, client)
                    rc   = vnet.rm_ar(address_range_id.to_i)
                    return rc if OpenNebula.is_error?(rc)

                    true
                end

                # Lists VMs currently using leases from a virtual network.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param network_id [Integer] Network ID.
                # @return [Array<Integer>, OpenNebula::Error] VM IDs or an API error.
                def self.associated_objects(client, network_id)
                    network = body(client, network_id, :downcase => false)
                    return network if OpenNebula.is_error?(network)
                    return [] if network[:USED_LEASES].to_i.zero?

                    address_ranges = network.dig(:AR_POOL, :AR)
                    return [] if address_ranges.nil?

                    collection(address_ranges).flat_map do |address_range|
                        leases = address_range.dig(:LEASES, :LEASE)
                        collection(leases).map {|lease| lease[:VM] }
                    end.compact.uniq
                end

                def self.address_range_ids(vnet)
                    address_ranges = vnet.to_hash.dig('VNET', 'AR_POOL', 'AR')
                    collection(address_ranges).map {|address_range| address_range['AR_ID'] }
                end

                def self.collection(value)
                    return [] if value.nil?

                    value.is_a?(Array) ? value : [value]
                end

                def self.wait_until_ar_added(vnet, initial_ids, timeout: 60, interval: 2)
                    Timeout.timeout(timeout) do
                        loop do
                            sleep interval

                            rc = vnet.info
                            return rc if OpenNebula.is_error?(rc)

                            new_ids = address_range_ids(vnet) - initial_ids
                            return new_ids.first unless new_ids.empty?
                        end
                    end
                rescue Timeout::Error
                    OpenNebula::Error.new(
                        "New ARs were not added to network ID=#{vnet.id} " \
                        "within #{timeout} seconds",
                        OpenNebula::Error::EACTION
                    )
                end

                private_class_method :address_range_ids, :collection, :wait_until_ar_added

            end

        end

    end

end
