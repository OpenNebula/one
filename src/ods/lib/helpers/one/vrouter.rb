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

            # Defines methods to manage Virtual Routers in OpenNebula
            module VRouter

                # Creates a virtual router from a template.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param template [Hash] Virtual-router template.
                # @return [OpenNebula::VirtualRouter, OpenNebula::Error]
                def self.create(client, template)
                    template = Hash.to_raw(template)
                    return template if OpenNebula.is_error?(template)

                    return OpenNebula::Error.new(
                        'VRouter template cannot be empty', OpenNebula::Error::EACTION
                    ) if template.to_s.empty?

                    vr = OpenNebula::VirtualRouter.new(OpenNebula::VirtualRouter.build_xml, client)

                    rc = vr.allocate(template)
                    return rc if OpenNebula.is_error?(rc)

                    rc = vr.info
                    return rc if OpenNebula.is_error?(rc)

                    vr
                end

                # Checks whether a virtual router with a name exists.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Router name.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists?(client, name)
                    vrouter = find(client, name)
                    return vrouter if OpenNebula.is_error?(vrouter)

                    !vrouter.nil?
                end

                # Retrieves a virtual router with its current information.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vrouter_id [Integer] Router ID.
                # @return [OpenNebula::VirtualRouter, OpenNebula::Error] router or an API error.
                def self.get(client, vrouter_id)
                    return OpenNebula::Error.new(
                        'VRouter ID cannot be nil', OpenNebula::Error::EACTION
                    ) if vrouter_id.nil?

                    vrouter = OpenNebula::VirtualRouter.new_with_id(vrouter_id, client)

                    rc = vrouter.info
                    return rc if OpenNebula.is_error?(rc)

                    vrouter
                end

                # Returns a virtual router body using symbolized keys.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vrouter_id [Integer] Router ID.
                # @param downcase [Boolean] Whether to downcase keys.
                # @return [Hash, OpenNebula::Error] router body or an API error.
                def self.body(client, vrouter_id, downcase: true)
                    vrouter = get(client, vrouter_id)
                    return vrouter if OpenNebula.is_error?(vrouter)

                    body = vrouter.to_hash['VROUTER']

                    return OpenNebula::Error.new(
                        "Cannot retrieve VRouter body for resource '#{vrouter_id}'",
                        OpenNebula::Error::EACTION
                    ) unless body

                    body.deep_symbolize_keys(:downcase => downcase)
                end

                # Returns a virtual router name.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vrouter_id [Integer] Router ID.
                # @return [String, OpenNebula::Error] router name or an API error.
                def self.name(client, vrouter_id)
                    vrouter = get(client, vrouter_id)
                    return vrouter if OpenNebula.is_error?(vrouter)

                    name = vrouter.name
                    return OpenNebula::Error.new(
                        "Cannot retrieve name for VRouter '#{vrouter_id}'",
                        OpenNebula::Error::EACTION
                    ) if name.nil? || name.to_s.empty?

                    name
                end

                # Finds a virtual router by name.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Router name.
                # @return [OpenNebula::VirtualRouter, nil, OpenNebula::Error]
                def self.find(client, name)
                    vrouter_pool = OpenNebula::VirtualRouterPool.new(client, -1)

                    rc = vrouter_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    vrouter = vrouter_pool.find {|vr| vr.name == name }
                    return if vrouter.nil?

                    rc = vrouter.info
                    return rc if OpenNebula.is_error?(rc)

                    vrouter
                end

                # Deletes a virtual router.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vrouter_id [Integer] Router ID.
                # @return [true, OpenNebula::Error] success or an API error.
                def self.delete(client, vrouter_id)
                    return OpenNebula::Error.new(
                        'VRouter ID cannot be nil', OpenNebula::Error::EACTION
                    ) if vrouter_id.nil?

                    vr = OpenNebula::VirtualRouter.new_with_id(vrouter_id, client)
                    rc = vr.delete
                    return rc if OpenNebula.is_error?(rc)

                    true
                end

                # Returns the public endpoint configured on a virtual router.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vrouter_id [Integer] Router ID.
                # @return [String, OpenNebula::Error] endpoint address or an API error.
                def self.public_endpoint(client, vrouter_id)
                    vrouter = get(client, vrouter_id)
                    return vrouter if OpenNebula.is_error?(vrouter)

                    endpoint = vrouter.to_hash.dig('VROUTER', 'TEMPLATE', 'NIC', 0, 'VROUTER_IP')

                    return OpenNebula::Error.new(
                        "Endpoint not found in VRouter '#{vrouter_id}'",
                        OpenNebula::Error::EACTION
                    ) if endpoint.nil? || endpoint.to_s.empty?

                    endpoint
                end

            end

        end

    end

end
