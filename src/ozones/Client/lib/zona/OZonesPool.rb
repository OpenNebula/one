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

    # Standard pool abstraction. To be inherited.
    class OZonesPool < JSONPool

        protected

        # Initializes a Pool instance
        # @param [#to_sym] pool pool name tag
        # @param [#to_sym] pool pool elements name tag
        # @param [Zona::Client] client OZones Client
        def initialize(pool,element,client)
            super(nil)

            @client = client
            @pool_name = pool.to_sym
            @element_name = element.to_sym
        end

        # Produces a new Pool element with the provided description
        # @param [String] element_json JSON string of the element
        # @return [String] Element's name or nil
        def factory(element_json)
            OZonesElement.new(element_json, @client)
        end

        # Retrieves the Pool information
        # @param [String] kind pool kind: vdc, zone...
        # @return [Zona:Error] nil or Error
        def info(kind)
            rc = @client.get_pool(kind)

            if !Zona.is_error?(rc)
                initialize_json(rc.body,@pool_name)
                rc=nil
            end

            rc
        end

        public

        # Allows iteration on pools elements
        # @param [Block] block a block to call for each iteration
        def each(&block)
            each_element(block) if @json_hash
        end

    end

end
