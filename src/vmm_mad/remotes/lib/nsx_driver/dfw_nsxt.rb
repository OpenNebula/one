# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
module NSXDriver

    # Class Logical Switch
    class DfwNsxt < NSXDriver::DistributedFirewall

        # ATTRIBUTES
        attr_reader :dfw_id
        HEADER_JSON = { :'Content-Type' => 'application/json' }
        SECTIONS = '/sections'

        # CONSTRUCTOR

        def initialize(nsx_client)
            super(nsx_client)
            # Construct base URLs
            @base_url = "#{@nsx_client.nsxmgr}/api/v1/firewall"
            @url_sections = @base_url_nsxt + SECTIONS
        end

        # Sections
        # Get all sections
        def sections
            @nsx_client.get_json(@url_sections)
        end

        # Get section by id
        def section_by_id(section_id)
            url = @url_sections + '/' + section_id
            @nsx_client.get_json(url)
        end

        # Get section by name
        def section_by_name(section_name)
            all_sections = sections
            all_sections[:results].each do |section|
                section if section[:display_name] == section_name
            end
        end

        # Create new section
        def create_section(section_name)
            section_spec = %(
              {
                  "display_name": "#{section_name}",
                  "section_type": "LAYER3",
                  "stateful": false
              }
            )
            @nsx_client.post_json(@url_sections, section_spec)
        end

        # Delete section
        def delete_section(section_id)
            url = @url_sections + '/' + section_id
            @nsx_client.delete(url, HEADER_JSON)
        end

    end

end
