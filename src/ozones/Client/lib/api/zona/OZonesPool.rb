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

    class OZonesPool < JSONPool

        protected

        def initialize(pool,element,client)
            super(nil)

            @client = client
            @pool_name = pool.upcase
            @element_name = element.upcase
        end

        def factory(element_json)
            OZonesPoolElement.new(element_json, @client)
        end

        def info(kind)
            rc = @client.get_pool(kind)

            if !Zona.is_error?(rc)
                initialize_json(rc.body,@pool_name)
                rc=nil
            end

            rc
        end

        public

        def each(&block)
            each_element(block) if @json_hash
        end

    end

end
