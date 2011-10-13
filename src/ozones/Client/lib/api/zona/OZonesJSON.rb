# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

    class OZonesJSON

        def self.build_json(json_str, root_element)
            begin
                parser = JSON.parser.new(json_str, {:symbolize_names => false})
                hash = parser.parse

                if hash.has_key?(root_element)
                    return hash[root_element]
                end

                Error.new("Error parsing JSON:\ root element not present")

            rescue => e
                Error.new(e.message)
            end
        end

        # Alias for compatibility
        def self.parse_json(json_str, root_element)
            OZonesJSON.build_json(json_str, root_element)
        end


        def self.to_json(hash_to_convert)
            begin
                JSON.pretty_generate(hash_to_convert)
            rescue Exception => e
                Error.new(e.message)
            end
        end

    end

    class JSONElement
        def initialize(json_hash=nil)
            @json_hash=json_hash
        end

        def initialize_json(json_str, root_element)
            rc = OZonesJSON.build_json(json_str,root_element)
            @json_hash = rc

            if Zona.is_error?(rc) || (rc.size == 0)
                @json_hash=nil
            end
        end
        def [](key)
            @json_hash[key]
        end


    end

    class JSONPool < JSONElement
        def initialize(json_hash=nil)
            super(json_hash)
        end

        def each_element(block)
            @json_hash[@element_name].each do |elem|
                block.call self.factory(elem)
            end
        end
    end

end
