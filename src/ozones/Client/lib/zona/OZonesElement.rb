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

    # Standard abstraction of an OZones element. To be inherited.
    class OZonesElement < JSONElement

        protected

        # Initializes an OZones Element instance. Tries to set @pe_id and @name
        # @param [Hash] hash element description
        # @param [Zona::Client] client OZones client
        # @return [String] Element's name or nil
        def initialize(hash, client)
            @client = client
            @json_hash = hash

            @pe_id = self[:ID] ? self[:ID].to_i : nil
            @name = self[:NAME] ? self[:NAME] : nil
        end

        # Retrieves details about an object and fills in
        # the information hash
        # @param [String] kind element kind: zone, vdc...
        # @param [String] root_element root element of the JSON object description
        # @return [Zona::Error] nil or Error
        def info(kind, root_element)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.get_resource(kind,@pe_id)
            if !Zona.is_error?(rc)
                initialize_json(rc.body,root_element)

                rc = nil

                @pe_id = self[:ID] ? self[:ID].to_i : nil
                @name = self[:NAME] ? self[:NAME] : nil

            end
            rc
        end

        # Allocates a new element from a hash description
        # @param [String] kind element kind: zone, vdc...
        # @param [Hash] tmpl_hash element template hash
        # @return [Zona::Error] nil or Error
        def allocate_hash(kind, tmpl_hash)
            allocate(kind, tmpl_hash.to_json)
        end

        # Allocates a new element from a JSON description
        # @param [String] kind element kind: zone, vdc...
        # @param [String] tmpl_json element JSON template
        # @return [Zona::Error] nil or Error
        def allocate(kind, tmpl_json)
            rc = @client.post_resource(kind, tmpl_json)

            if !Zona.is_error?(rc)
                initialize_json(rc.body,kind.upcase)
                @pe_id = self[:ID].to_i
                rc = nil
            end
            rc
        end

        # Deletes current element
        # @param [String] kind element kind: zone, vdc...
        # @return [Zona::Error] nil or Error
        def delete(kind)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.delete_resource(kind,@pe_id)
            return rc if Zona.is_error?(rc)
            nil
        end

        public

        attr_reader :pe_id, :name

        # Creates a new element with the custom ID
        # @param [#to_i] id element ID
        # @param [Zona::Client] client OZones Client for this element
        # @return [OZonesElement] A new element object
        def self.new_with_id(id, client=nil)
            self.new(self.build_json(id.to_i),client)
        end

    end
end
