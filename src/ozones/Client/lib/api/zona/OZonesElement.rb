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

    class OZonesElement < JSONElement

        protected

        def initialize(hash, client)
            @client = client
            @json_hash = hash

            @pe_id = self["id"] ? self["id"].to_i : nil
            @name = self["name"] ? self["name"] : nil
        end

        def info(kind, root_element)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.get_resource(kind,@pe_id)
            if !Zona.is_error?(rc)
                initialize_json(rc.body,root_element)

                rc = nil

                @pe_id = self["id"] ? self["id"].to_i : nil
                @name = self["name"] ? self["name"] : nil

            end
            rc
        end

        def allocate_hash(kind, tmpl_hash)
            allocate(kind, tmpl_hash.to_json)
        end

        def allocate(kind, tmpl_json)
            rc = @client.post_resource(kind, tmpl_json)

            if !Zona.is_error?(rc)
                initialize_json(rc.body,kind.upcase)
                @pe_id = self["id"].to_i
                rc = nil
            end
            rc
        end

        def delete(kind)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.delete_resource(kind,@pe_id)
            return rc if Zona.is_error?(rc)
            nil
        end

        public

        attr_reader :pe_id, :name

        def self.new_with_id(id, client=nil)
            self.new(self.build_json(id),client)
        end

    end
end
