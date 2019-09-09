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
    class DfwNsxv < NSXDriver::DistributedFirewall

        # ATTRIBUTES
        attr_reader :one_section_id
        HEADER_XML = { :'Content-Type' => 'application/xml' }
        SECTIONS = '/layer3sections'
        SECTION_XPATH = '//section'
        RULE_XPATH = '//rule'

        # CONSTRUCTOR

        def initialize(nsx_client)
            super(nsx_client)
            # Construct base URLs
            @base_url = @nsx_client.nsxmgr
            @base_url << '/api/4.0/firewall/globalroot-0/config'
            @url_sections = @base_url + SECTIONS
            @one_section_id = init_section
        end

        # Sections
        # Get all sections
        # Creates OpenNebula section if not exists and returns
        # its section_id. Returns its section_id if OpenNebula
        # section already exists
        def init_section
            one_section = section_by_name(@one_section_name)
            one_section ||= create_section(@one_section_name)
            one_section[:id]
        end

        def sections
            @nsx_client.get_xml(@base_url).xpath(SECTION_XPATH)
        end

        # Get section by id
        def section_by_id(section_id = @one_section_id)
            url = @url_sections + '/' + section_id
            @nsx_client.get_xml(url).xpath(SECTION_XPATH)
        end

        # Get section by name
        def section_by_name(section_name)
            url = @url_sections + '?name=' + section_name
            @nsx_client.get_xml(url).xpath(SECTION_XPATH)
        end

        # Create new section
        def create_section(section_name)
            section_spec =
                "<section name=\"#{section_name}\"\
                stateless=\"false\" tcpStrict=\"true\" useSid=\"false\">\
                </section>"
            @nsx_client.post_xml(@url_sections, section_spec)
        end

        # Delete section
        def delete_section(section_id = @one_section_id)
            url = @url_sections + '/' + section_id
            @nsx_client.delete(url, HEADER_XML)
        end

        # Rules
        # Get all rules
        def rules(section_id = @one_section_id)
            url = @url_sections + '/' + section_id
            @nsx_client.get_xml(url).xpath(RULE_XPATH)
        end

        # Get rule by id
        def rules_by_id(rule_id, section_id = @one_section_id); end

        # Get rule by name
        def rules_by_name; end

        # Create new rule
        def create_rule; end

        # Update rule
        def update_rule; end

        # Delete rule
        def delete_rule; end

    end

end
