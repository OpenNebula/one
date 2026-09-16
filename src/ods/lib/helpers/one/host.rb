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

            # Defines methods to manage OpenNebula Hosts
            module Host

                RESOURCE_TYPE = 'host'
                WAIT_DELETE   = true
                POOL_CLASS    = OpenNebula::HostPool

                # Creates a host and optionally appends template attributes.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Host name.
                # @param template [Hash] Initial template attributes.
                # @param cluster_id [Integer, nil] Cluster ID.
                # @param extra_template [Hash] Additional template attributes.
                # @return [OpenNebula::Host, OpenNebula::Error] created host or an API error.
                def self.create(client, name:, template: {}, cluster_id: nil, extra_template: {})
                    return OpenNebula::Error.new(
                        'Host name cannot be empty', OpenNebula::Error::EACTION
                    ) if name.to_s.empty?

                    template = (template || {}).clone
                    im_mad   = template.delete(:im_mad)  || template.delete('IM_MAD')  || 'kvm'
                    vmm_mad  = template.delete(:vmm_mad) || template.delete('VMM_MAD') || 'kvm'

                    host = OpenNebula::Host.new(OpenNebula::Host.build_xml, client)
                    rc   = host.allocate(name, im_mad, vmm_mad, cluster_id)
                    return rc if OpenNebula.is_error?(rc)

                    content = template.merge(extra_template || {})

                    unless content.empty?
                        content = Hash.to_raw(content)
                        return content if OpenNebula.is_error?(content)

                        rc = host.update(content, true)
                        return rc if OpenNebula.is_error?(rc)
                    end

                    rc = host.info
                    return rc if OpenNebula.is_error?(rc)

                    host
                end

                # Returns a host body using symbolized keys.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param host_id [Integer] Host ID.
                # @param downcase [Boolean] Whether to downcase keys.
                # @return [Hash, OpenNebula::Error] host body or an API error.
                def self.body(client, host_id, downcase: true)
                    host = get(client, host_id)
                    return host if OpenNebula.is_error?(host)

                    body = host.to_hash['HOST']

                    return OpenNebula::Error.new(
                        "Cannot retrieve Host body for resource '#{host_id}'",
                        OpenNebula::Error::EACTION
                    ) unless body

                    body.deep_symbolize_keys(:downcase => downcase)
                end

                # Checks whether a host with a name exists.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Host name.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists?(client, name)
                    host = find(client, name)
                    return host if OpenNebula.is_error?(host)

                    !host.nil?
                end

                # Checks whether a host ID exists in the pool.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param host_id [Integer] Host ID.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists_id?(client, host_id)
                    host_pool = OpenNebula::HostPool.new(client)

                    rc = host_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    host_pool.any? {|host| host.id.to_i == host_id.to_i }
                end

                # Retrieves a host with its current information.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param host_id [Integer] Host ID.
                # @return [OpenNebula::Host, OpenNebula::Error] host or an API error.
                def self.get(client, host_id)
                    return OpenNebula::Error.new(
                        'Host ID cannot be nil', OpenNebula::Error::EACTION
                    ) if host_id.nil?

                    host = OpenNebula::Host.new_with_id(host_id, client)

                    rc = host.info
                    return rc if OpenNebula.is_error?(rc)

                    host
                end

                # Finds a host by name.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Host name.
                # @return [OpenNebula::Host, nil, OpenNebula::Error] host, none, or an API error.
                def self.find(client, name)
                    host_pool = OpenNebula::HostPool.new(client)

                    rc = host_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    host = host_pool.find {|item| item.name == name }
                    return if host.nil?

                    rc = host.info
                    return rc if OpenNebula.is_error?(rc)

                    host
                end

                # Deletes a host, optionally waiting for its removal.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param host_id [Integer] Host ID.
                # @param wait [Boolean] Whether to wait for deletion.
                # @return [true, OpenNebula::Error] success or an API error.
                def self.delete(client, host_id, wait: false)
                    host = get(client, host_id)
                    return host if OpenNebula.is_error?(host)

                    rc = host.delete
                    return rc if OpenNebula.is_error?(rc)
                    return true unless wait

                    Resource.wait_until_deleted(host)
                end

                # Forces a host monitoring update.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param host_id [Integer] Host ID.
                # @return [true, OpenNebula::Error] success or an API error.
                def self.force_update(client, host_id)
                    host = OpenNebula::Host.new_with_id(host_id, client)
                    rc   = host.forceupdate

                    return rc if OpenNebula.is_error?(rc)

                    true
                end

                # Disables a host.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param host_id [Integer] Host ID.
                # @return [true, OpenNebula::Error] success or an API error.
                def self.disable(client, host_id)
                    host = OpenNebula::Host.new_with_id(host_id, client)
                    rc   = host.disable

                    return rc if OpenNebula.is_error?(rc)

                    true
                end

                # Lists VMs associated with a host.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param host_id [Integer] Host ID.
                # @return [Array<Integer>, OpenNebula::Error] VM IDs or an API error.
                def self.associated_objects(client, host_id)
                    host = get(client, host_id)
                    return host if OpenNebula.is_error?(host)

                    Array(host.to_hash.dig('HOST', 'VMS', 'ID'))
                end

            end

        end

    end

end
