# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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


module Zona

    require 'json'

    # Several class methods regarding the handling of JSON descriptions
    # for the OZones utilities.
    class OZonesJSON

        # Build an element description hash.
        # @param [String] json_str JSON description of the element
        # @param [#to_sym] root_element root element of the JSON object
        # @return [Hash,Zona::Error] The parsed JSON hash, or Error
        def self.build_json(json_str, root_element)
            begin
                parser = JSON.parser.new(json_str, {:symbolize_names => true})
                hash = parser.parse

                root_sym = root_element.to_sym

                if hash.has_key?(root_sym)
                    return hash[root_sym]
                end

                Error.new("Error parsing JSON:\ root element not present")

            rescue => e
                Error.new(e.message)
            end
        end

        # @see build_json
        def self.parse_json(json_str, root_element)
            OZonesJSON.build_json(json_str, root_element)
        end

        # Generates a pretty JSON string from a hash
        # @param [Hash] hash_to_convert a hash to be converted
        # @return [String, Zona::Error] JSON string or Error if conversion fails
        def self.to_json(hash_to_convert)
            begin
                JSON.pretty_generate(hash_to_convert)
            rescue Exception => e
                Error.new(e.message)
            end
        end

    end

    # This class represents an element described by a JSON string
    # In practice, this is represented by a hash,
    # result of parsing the JSON string.
    class JSONElement

        # Initializes an instance
        # @param [Hash] json_hash a hash with the object description
        def initialize(json_hash=nil)
            @json_hash=json_hash
        end

        # Initializes an instance with a JSON description
        # @param [String] json_str JSON description
        # @param [#to_sym] root_element root element in the element description
        def initialize_json(json_str, root_element)
            rc = OZonesJSON.build_json(json_str,root_element)
            @json_hash = rc

            if Zona.is_error?(rc) || (rc.size == 0)
                @json_hash=nil
            end
        end

        # Accesses the value of a JSON element key
        # @param [#to_sym] key
        # @return [String] Value
        def [](key)
            @json_hash[key.to_sym]
        end


    end

    # This class represents a collection of JSON Elements and it is itself one
    class JSONPool < JSONElement

        # Initializes an instance
        # @param [Hash] json_hash a hash with the object description
        def initialize(json_hash=nil)
            super(json_hash)
        end

        # Allows to iterate through the elements of a JSONPool
        # @param [Block] block a block to be called in each iteration
        def each_element(block)
            @json_hash[@element_name].each do |elem|
                block.call self.factory(elem)
            end
        end
    end

end
