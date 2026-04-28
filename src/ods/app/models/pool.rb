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

        # OpenNebula Document Server Pool
        class Pool < OpenNebula::DocumentPoolJSON

            DOCUMENT_CLASS = OpenNebula::DocumentJSON
            DOCUMENT_TYPES = {}

            # rubocop:disable Style/ClassVars
            @@mutex      ||= Mutex.new
            @@mutex_hash ||= {}
            # rubocop:enable Style/ClassVars

            # Class constructor
            #
            # @param [OpenNebula::Client] client the xml-rpc client
            # @param [OpenNebula::CloudAuth, nil] cloud_auth optional cloud authentication
            #   object used to generate alternative clients
            # @param [Integer] user_id the filter flag, see
            #   http://docs.opennebula.io/stable/integration/system_interfaces/api.html
            #
            # @return [Pool] the new object
            def initialize(client: nil, auth: nil, user_id: OpenNebula::Pool::INFO_ALL)
                raise ArgumentError, 'Provide either client or auth' if client.nil? && auth.nil?
                raise ArgumentError, 'Provide either client or auth, not both' if client && auth

                @cloud_auth = auth
                @client     = client || auth.client

                super(@client, user_id)
            end

            # Overrides the factory method from DocumentPool to generate
            # custom DOCUMENT_CLASS objects
            def factory(element_xml)
                self.class::DOCUMENT_CLASS.new_from_xml(@client, element_xml)
            end

            def list
                map(&:name)
            end

            def ids
                map(&:id)
            end

            def exists?(id)
                ids.include?(id)
            end

            # Retrieves a DOCUMENT_CLASS element from OpenNebula, locking the resource
            # during the block execution.
            #
            # @param [Integer] resource_id Numerical ID of the resource to retrieve
            # @param [String, nil] user_name If provided, perform the request on behalf
            #   of this user instead of the default client user
            # @yieldparam [OpenNebula::DocumentJSON] resource The retrieved resource
            #
            # @return [OpenNebula::DocumentJSON, OpenNebula::Error] The resource in case
            #   of success, or an error otherwise
            def get(resource_id, user_name = nil, &block)
                resource_id = resource_id.to_i if resource_id
                aux_client  = impersonate(user_name)

                resource = self.class::DOCUMENT_CLASS.new_from_id(aux_client, resource_id)
                return resource if OpenNebula.is_error?(resource)

                # Support dynamic child classes
                klass_type = resource.respond_to?(:type) ? resource.type : nil

                if klass_type && self.class.const_defined?(:DOCUMENT_TYPES)
                    klass = self.class::DOCUMENT_TYPES[klass_type.to_sym] ||
                            self.class::DOCUMENT_TYPES[klass_type.to_s]

                    if klass && !resource.is_a?(klass)
                        resource = klass.new_from_id(aux_client, resource_id)
                        return resource if OpenNebula.is_error?(resource)
                    end
                end

                obj_mutex = nil
                entry     = nil

                @@mutex.synchronize do
                    entry = @@mutex_hash[resource_id]

                    if entry.nil?
                        entry = [Mutex.new, 0]
                        @@mutex_hash[resource_id] = entry
                    end

                    obj_mutex = entry[0]
                    entry[1]  = entry[1] + 1

                    if @@mutex_hash.size > 10000
                        @@mutex_hash.delete_if {|_id, entry_loop| entry_loop[1] == 0 }
                    end
                end

                rc = obj_mutex.synchronize do
                    rc = resource.info
                    next rc if OpenNebula.is_error?(rc)

                    if block
                        next OpenNebula::Error.new(
                            "Invalid block arity #{block.arity} (expected 1)",
                            OpenNebula::Error::EACTION
                        ) unless block.arity == 1

                        rc = block.call(resource)
                        next rc if OpenNebula.is_error?(rc)
                    end

                    next resource
                end

                return rc if OpenNebula.is_error?(rc)

                rc
            rescue StandardError => e
                return OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            ensure
                @@mutex.synchronize do
                    entry[1] = entry[1] - 1 if entry
                end
            end

            # WARNING!!!
            # No validation is performed for user_name. The caller must ensure the
            # requested identity was already authenticated/authorized.
            def impersonate(user_name)
                raise ArgumentError, 'Cloud auth is required to impersonate users' \
                if @cloud_auth.nil?

                @cloud_auth.client(user_name)
            end

            class << self

                # Safely reads a resource from the pool
                #
                # @param client [OpenNebula::Client] XML-RPC client
                # @param resource_id [Integer, String] ID of the resource
                # @return [OpenNebula::DocumentJSON, OpenNebula::Error] the resource or an error
                def read(client, resource_id)
                    pool = new(client)

                    pool.get(resource_id) do |resource|
                        resource
                    end
                end

            end

        end

    end

end
