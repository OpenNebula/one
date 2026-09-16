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

            # Resolves and waits for generic OpenNebula resources
            module Resource

                # Resolves the helper module for an OpenNebula resource type.
                # @param resource_type [String, Symbol] resource type.
                # @return [Module, OpenNebula::Error] matching helper or an unsupported-type error.
                def self.resolve(resource_type)
                    helper = OneHelper.constants(false).filter_map do |constant_name|
                        constant = OneHelper.const_get(constant_name)
                        next unless constant.is_a?(Module)
                        next unless constant.const_defined?(:RESOURCE_TYPE, false)

                        constant if constant.const_get(:RESOURCE_TYPE) == resource_type.to_s
                    end.first

                    return helper unless helper.nil?

                    OpenNebula::Error.new(
                        "Unsupported OpenNebula resource type '#{resource_type}'",
                        OpenNebula::Error::EACTION
                    )
                end

                # Finds all objects of a resource type whose body attributes
                # match the expected values
                #
                # @param client [OpenNebula::Client] OpenNebula client
                # @param resource_type [String, Symbol] type resolved by OneHelper
                # @param attributes [Hash<String, Object>] body paths and expected values
                # @return [Array<OpenNebula::PoolElement>, OpenNebula::Error]
                def self.find_all_by_attributes(client, resource_type, attributes)
                    return OpenNebula::Error.new(
                        'Search attributes cannot be empty',
                        OpenNebula::Error::EACTION
                    ) if attributes.nil? || attributes.empty?

                    helper = resolve(resource_type)
                    return helper if OpenNebula.is_error?(helper)

                    unless helper.const_defined?(:POOL_CLASS, false)
                        return OpenNebula::Error.new(
                            "OpenNebula resource type '#{resource_type}' does not support " \
                            'pool attribute searches',
                            OpenNebula::Error::EACTION
                        )
                    end

                    pool_class = helper.const_get(:POOL_CLASS, false)
                    pool_args  =
                        if helper.const_defined?(:POOL_ARGS, false)
                            helper.const_get(:POOL_ARGS, false)
                        else
                            []
                        end
                    pool = pool_class.new(client, *pool_args)

                    rc = pool.info
                    return rc if OpenNebula.is_error?(rc)

                    objects = pool.select do |object|
                        attributes.all? do |path, expected|
                            object[path.to_s].to_s == expected.to_s
                        end
                    end

                    objects.each do |object|
                        rc = object.info
                        return rc if OpenNebula.is_error?(rc)
                    end

                    objects
                rescue StandardError => e
                    OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
                end

                # Appends generic template content to an OpenNebula object and
                # refreshes its body
                #
                # @param object [OpenNebula::PoolElement] object to update
                # @param content [Hash] template content
                # @return [OpenNebula::PoolElement, OpenNebula::Error]
                def self.update_template(object, content)
                    template = Hash.to_raw(content)
                    return template if OpenNebula.is_error?(template)

                    return OpenNebula::Error.new(
                        'Template content cannot be empty',
                        OpenNebula::Error::EACTION
                    ) if template.to_s.empty?

                    rc = object.update(template, true)
                    return rc if OpenNebula.is_error?(rc)

                    rc = object.info
                    return rc if OpenNebula.is_error?(rc)

                    object
                rescue StandardError => e
                    OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
                end

                # Waits until an OpenNebula object reaches a state.
                # @param object [OpenNebula::PoolElement] Object to refresh.
                # @param timeout [Integer] Maximum seconds to wait.
                # @param interval [Integer] Seconds between refreshes.
                # @param state [Integer] Target OpenNebula state.
                # @return [OpenNebula::PoolElement, OpenNebula::Error]
                def self.wait_until_ready(object, timeout: 60, interval: 2, state: 1)
                    Timeout.timeout(timeout) do
                        loop do
                            sleep interval

                            rc = object.info
                            return rc if OpenNebula.is_error?(rc)
                            return object if object.state == state
                        end
                    end
                rescue Timeout::Error
                    OpenNebula::Error.new(
                        "OpenNebula object ID=#{object.id} did not become ready " \
                        "within #{timeout} seconds",
                        OpenNebula::Error::EACTION
                    )
                end

                # Waits until an object disappears or reaches a terminal state.
                # @param object [OpenNebula::PoolElement] Object to refresh.
                # @param timeout [Integer] Maximum seconds to wait.
                # @param interval [Integer] Seconds between refreshes.
                # @param state [Integer, nil] Optional terminal state.
                # @return [true, OpenNebula::Error] deletion result or an API/timeout error.
                def self.wait_until_deleted(object, timeout: 60, interval: 2, state: nil)
                    Timeout.timeout(timeout) do
                        loop do
                            sleep interval

                            rc = object.info
                            return true if OpenNebula.is_error?(rc)
                            return true if !state.nil? && object.state == state
                        end
                    end
                rescue Timeout::Error
                    OpenNebula::Error.new(
                        "Could not delete OpenNebula object ID=#{object.id} " \
                        "within #{timeout} seconds",
                        OpenNebula::Error::EACTION
                    )
                end

            end

        end

    end

end
