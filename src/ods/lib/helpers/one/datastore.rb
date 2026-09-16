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

            # Defines methods to manage OpenNebula Datastores
            module Datastore

                RESOURCE_TYPE = 'datastore'
                WAIT_DELETE   = true
                POOL_CLASS    = OpenNebula::DatastorePool

                # Creates a datastore and assigns it to an optional cluster.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Datastore name.
                # @param template [Hash] Initial template attributes.
                # @param cluster_id [Integer, nil] Cluster ID.
                # @param extra_template [Hash] Additional template attributes.
                # @return [OpenNebula::Datastore, OpenNebula::Error]
                def self.create(client, name:, template: {}, cluster_id: nil, extra_template: {})
                    content = (template || {}).merge(extra_template || {}).merge(:name => name)
                    content = Hash.to_raw(content)
                    return content if OpenNebula.is_error?(content)

                    return OpenNebula::Error.new(
                        'Datastore template cannot be empty',
                        OpenNebula::Error::EACTION
                    ) if content.to_s.empty?

                    datastore = OpenNebula::Datastore.new(
                        OpenNebula::Datastore.build_xml, client
                    )

                    rc = datastore.allocate(content, cluster_id)
                    return rc if OpenNebula.is_error?(rc)

                    rc = datastore.info
                    return rc if OpenNebula.is_error?(rc)

                    datastore
                end

                # Retrieves a datastore with its current information.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param datastore_id [Integer] Datastore ID.
                # @return [OpenNebula::Datastore, OpenNebula::Error] datastore or an API error.
                def self.get(client, datastore_id)
                    return OpenNebula::Error.new(
                        'Datastore ID cannot be nil', OpenNebula::Error::EACTION
                    ) if datastore_id.nil?

                    datastore = OpenNebula::Datastore.new_with_id(datastore_id, client)

                    rc = datastore.info
                    return rc if OpenNebula.is_error?(rc)

                    datastore
                end

                # Returns a datastore body using symbolized keys.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param datastore_id [Integer] Datastore ID.
                # @param downcase [Boolean] Whether to downcase keys.
                # @return [Hash, OpenNebula::Error] datastore body or an API error.
                def self.body(client, datastore_id, downcase: true)
                    datastore = get(client, datastore_id)
                    return datastore if OpenNebula.is_error?(datastore)

                    body = datastore.to_hash['DATASTORE']

                    return OpenNebula::Error.new(
                        "Cannot retrieve Datastore body for resource '#{datastore_id}'",
                        OpenNebula::Error::EACTION
                    ) unless body

                    body.deep_symbolize_keys(:downcase => downcase)
                end

                # Checks whether a datastore with a name exists.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Datastore name.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists?(client, name)
                    datastore = find(client, name)
                    return datastore if OpenNebula.is_error?(datastore)

                    !datastore.nil?
                end

                # Checks whether a datastore ID exists in the pool.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param datastore_id [Integer] Datastore ID.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists_id?(client, datastore_id)
                    datastore_pool = OpenNebula::DatastorePool.new(client)

                    rc = datastore_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    datastore_pool.any? do |datastore|
                        datastore.id.to_i == datastore_id.to_i
                    end
                end

                # Finds a datastore by name.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Datastore name.
                # @return [OpenNebula::Datastore, nil, OpenNebula::Error]
                def self.find(client, name)
                    datastore_pool = OpenNebula::DatastorePool.new(client)

                    rc = datastore_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    datastore = datastore_pool.find {|item| item.name == name }
                    return if datastore.nil?

                    rc = datastore.info
                    return rc if OpenNebula.is_error?(rc)

                    datastore
                end

                # Deletes a datastore, optionally waiting for its removal.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param datastore_id [Integer] Datastore ID.
                # @param wait [Boolean] Whether to wait for deletion.
                # @return [true, OpenNebula::Error] success or an API error.
                def self.delete(client, datastore_id, wait: false)
                    datastore = get(client, datastore_id)
                    return datastore if OpenNebula.is_error?(datastore)

                    rc = datastore.delete
                    return rc if OpenNebula.is_error?(rc)
                    return true unless wait

                    Resource.wait_until_deleted(datastore)
                end

                # Lists images associated with a datastore.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param datastore_id [Integer] Datastore ID.
                # @return [Array<Integer>, OpenNebula::Error] image IDs or an API error.
                def self.associated_objects(client, datastore_id)
                    datastore = get(client, datastore_id)
                    return datastore if OpenNebula.is_error?(datastore)

                    Array(datastore.to_hash.dig('DATASTORE', 'IMAGES', 'ID'))
                end

                # Checks whether a datastore is an IMAGE datastore.
                # @param datastore [OpenNebula::Datastore] datastore to inspect.
                # @return [Boolean] whether the datastore stores images.
                def self.image?(datastore)
                    type = OpenNebula::Datastore::DATASTORE_TYPES[datastore['TYPE'].to_i]
                    type == 'IMAGE'
                end

                # Resolves an image datastore from an explicit ID or cluster membership.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param cluster [OpenNebula::Cluster] Cluster to inspect.
                # @param datastore_id [Integer, nil] Preferred datastore ID.
                # @return [OpenNebula::Datastore, OpenNebula::Error]
                def self.resolve_image_ds(client, cluster, datastore_id = nil)
                    if datastore_id
                        datastore = get(client, datastore_id)
                        return datastore if OpenNebula.is_error?(datastore)
                        return datastore if image?(datastore)

                        return OpenNebula::Error.new(
                            "Datastore #{datastore_id} (#{datastore.name}) is not " \
                            'an IMAGE datastore',
                            OpenNebula::Error::EACTION
                        )
                    end

                    cluster.datastore_ids.each do |ds_id|
                        datastore = get(client, ds_id)
                        return datastore if OpenNebula.is_error?(datastore)
                        return datastore if image?(datastore)
                    end

                    OpenNebula::Error.new(
                        "OpenNebula cluster #{cluster.id} (#{cluster.name}) has no " \
                        'image datastores',
                        OpenNebula::Error::EACTION
                    )
                end

            end

        end

    end

end
