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

            # Defines methods to manage OpenNebula Clusters.
            module Cluster

                RESOURCE_TYPE = 'cluster'
                WAIT_DELETE   = false
                POOL_CLASS    = OpenNebula::ClusterPool

                # Creates a cluster and optionally appends template attributes.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Cluster name.
                # @param template [Hash] Initial template attributes.
                # @param extra_template [Hash] Additional template attributes.
                # @return [OpenNebula::Cluster, OpenNebula::Error] created cluster or an API error.
                def self.create(client, name:, template: {}, extra_template: {}, **_options)
                    return OpenNebula::Error.new(
                        'Cluster name cannot be empty', OpenNebula::Error::EACTION
                    ) if name.to_s.empty?

                    cluster = OpenNebula::Cluster.new(OpenNebula::Cluster.build_xml, client)
                    rc      = cluster.allocate(name)
                    return rc if OpenNebula.is_error?(rc)

                    content = (template || {}).merge(extra_template || {})

                    unless content.empty?
                        content = Hash.to_raw(content)
                        return content if OpenNebula.is_error?(content)

                        rc = cluster.update(content, true)
                        return rc if OpenNebula.is_error?(rc)
                    end

                    rc = cluster.info
                    return rc if OpenNebula.is_error?(rc)

                    cluster
                end

                # Retrieves a cluster with its current information.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param cluster_id [Integer] Cluster ID.
                # @return [OpenNebula::Cluster, OpenNebula::Error] cluster or an API error.
                def self.get(client, cluster_id)
                    return OpenNebula::Error.new(
                        'Cluster ID cannot be nil', OpenNebula::Error::EACTION
                    ) if cluster_id.nil?

                    cluster = OpenNebula::Cluster.new_with_id(cluster_id, client)

                    rc = cluster.info
                    return rc if OpenNebula.is_error?(rc)

                    cluster
                end

                # Returns a cluster body using symbolized keys.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param cluster_id [Integer] Cluster ID.
                # @param downcase [Boolean] Whether to downcase keys.
                # @return [Hash, OpenNebula::Error] cluster body or an API error.
                def self.body(client, cluster_id, downcase: true)
                    cluster = get(client, cluster_id)
                    return cluster if OpenNebula.is_error?(cluster)

                    body = cluster.to_hash['CLUSTER']

                    return OpenNebula::Error.new(
                        "Cannot retrieve OpenNebula cluster body for resource '#{cluster_id}'",
                        OpenNebula::Error::EACTION
                    ) unless body

                    body.deep_symbolize_keys(:downcase => downcase)
                end

                # Checks whether a cluster with a name exists.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Cluster name.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists?(client, name)
                    cluster = find(client, name)
                    return cluster if OpenNebula.is_error?(cluster)

                    !cluster.nil?
                end

                # Checks whether a cluster ID exists in the pool.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param cluster_id [Integer] Cluster ID.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists_id?(client, cluster_id)
                    cluster_pool = OpenNebula::ClusterPool.new(client)

                    rc = cluster_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    cluster_pool.any? {|cluster| cluster.id.to_i == cluster_id.to_i }
                end

                # Finds a cluster by name.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Cluster name.
                # @return [OpenNebula::Cluster, nil, OpenNebula::Error]
                def self.find(client, name)
                    cluster_pool = OpenNebula::ClusterPool.new(client)

                    rc = cluster_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    cluster = cluster_pool.find {|item| item.name == name }
                    return if cluster.nil?

                    rc = cluster.info
                    return rc if OpenNebula.is_error?(rc)

                    cluster
                end

                # Deletes a cluster, optionally waiting for its removal.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param cluster_id [Integer] Cluster ID.
                # @param wait [Boolean] Whether to wait for deletion.
                # @return [true, OpenNebula::Error] success or an API error.
                def self.delete(client, cluster_id, wait: false)
                    cluster = get(client, cluster_id)
                    return cluster if OpenNebula.is_error?(cluster)

                    rc = cluster.delete
                    return rc if OpenNebula.is_error?(rc)
                    return true unless wait

                    Resource.wait_until_deleted(cluster)
                end

                # Lists the resources associated with a cluster, grouped by type.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param cluster_id [Integer] Cluster ID.
                # @return [Hash, OpenNebula::Error] non-empty resource IDs by type or an API error.
                def self.associated_objects(client, cluster_id)
                    cluster = get(client, cluster_id)
                    return cluster if OpenNebula.is_error?(cluster)

                    body = cluster.to_hash['CLUSTER'] || {}

                    {
                        'host'      => Array(body.dig('HOSTS', 'ID')),
                        'datastore' => Array(body.dig('DATASTORES', 'ID')),
                        'network'   => Array(body.dig('VNETS', 'ID'))
                    }.reject {|_, ids| ids.empty? }
                end

            end

        end

    end

end
