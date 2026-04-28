#!/usr/bin/env ruby

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

module OpenNebula

    module DocumentServer

        # Client Helpers to be extended in ODS clients
        module ClientHelpers

            # Description of the name to ID method
            def name_to_id_desc(poolname)
                "OpenNebula #{poolname} id"
            end

            # Convert a name to an ID based on the provided pool
            def name_to_id(name:, pool:)
                return [0, name.to_i] if name.match?(/^\d+$/)

                pool_name = pool.to_s
                objects   = fetch_pool_objects(pool_name)
                result    = resolve_object_id_by_name(objects, name, pool_name)

                return result if result.is_a?(Array)

                [0, result]
            end

            def list_to_id_desc(poolname)
                "Comma-separated list of OpenNebula #{poolname} ids"
            end

            def list_to_id(names, poolname)
                pool_name = poolname.to_s
                objects   = fetch_pool_objects(pool_name)
                return objects if objects.is_a?(Array) && objects.first == -1

                result = names.split(',').collect do |name|
                    if name.match?(/^\d+$/)
                        name.to_i
                    else
                        resolved = resolve_object_id_by_name(objects, name, pool_name)
                        return resolved if resolved.is_a?(Array)

                        resolved
                    end
                end

                [0, result]
            end

            private

            def fetch_pool_objects(pool_name)
                pool_key  = pool_name.downcase.to_sym
                pool_path = self::POOLS[pool_key]

                raise ArgumentError, "Unknown pool name: #{pool_name}" unless pool_path

                response = new.send(:get, pool_path)

                return [-1, "OpenNebula #{pool_name} name not found, use the ID instead"] \
                    if CloudClient.is_error?(response)

                case response
                when Array
                    response
                when Hash
                    docs = response.dig('DOCUMENT_POOL', 'DOCUMENT') ||
                            response.dig(:DOCUMENT_POOL, :DOCUMENT)

                    docs.is_a?(Array) ? docs : Array(docs).compact
                else
                    []
                end
            end

            def resolve_object_id_by_name(objects, name, pool_name)
                return [-1, "#{pool_name} named #{name} not found."] if objects.empty?

                matches = objects.select do |object|
                    object['NAME'] == name || object[:NAME] == name
                end

                return [-1, "#{pool_name} named #{name} not found."] if matches.empty?
                return [-1, "There are multiple #{pool_name}s with name #{name}."] \
                    if matches.length > 1

                matches.first['ID'] || matches.first[:ID]
            end

        end

    end

end
