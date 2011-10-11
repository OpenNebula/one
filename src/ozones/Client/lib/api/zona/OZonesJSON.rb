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

    class JSONElement
        def initialize(json_hash=nil)
            @json_hash=json_hash
        end

        def initialize_json(json_str, root_element)
            rc = JSONElement.build_json(json_str,root_element)
            @json_hash = rc

            if OZonesClient.is_error?(rc) || (rc.size == 0)
                @json_hash=nil
            end
        end

        def self.build_json(json_str, root_element)
            begin
                parser = JSON.parser.new(json_str, {:symbolize_names => false})
                hash = parser.parse
                hash[root_element]
            rescue => e
                OZonesClient::Error.new(e.message)
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
