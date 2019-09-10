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
        attr_reader :one_section_id
        HEADER_JSON = { :'Content-Type' => 'application/json' }
        SECTIONS = '/sections'

        # CONSTRUCTOR

        def initialize(nsx_client)
            super(nsx_client)
            # Construct base URLs
            @base_url = "#{@nsx_client.nsxmgr}/api/v1/firewall"
            @url_sections = @base_url + SECTIONS
            @one_section_id = init_section
        end

        # Sections
        # Creates OpenNebula section if not exists and returns
        # its section_id. Returns its section_id if OpenNebula
        # section already exists
        def init_section
            one_section = section_by_name(@one_section_name)
            one_section ||= create_section(@one_section_name)
            @one_section_id = one_section['id']
        end

        # Get all sections
        def sections
            sections = @nsx_client.get_json(@url_sections)
            sections['results']
        end

        # Get section by id
        # Params:
        # - section_id: specified section_id or @one_section_id
        # Return:
        #
        def section_by_id(section_id = @one_section_id)
            url = @url_sections + '/' + section_id
            @nsx_client.get_json(url)
        end

        # Get section by name
        # Params:
        # - section_name: Name of the section
        # Return
        # - nil | section
        def section_by_name(section_name)
            result = nil
            all_sections = sections
            return result unless all_sections

            all_sections.each do |section|
                result = section if section['display_name'] == section_name
            end
            result
        end

        # Create new section and return the section
        def create_section(section_name)
            section_spec = %(
              {
                  "display_name": "#{section_name}",
                  "section_type": "LAYER3",
                  "stateful": true
              }
            )
            section_id = @nsx_client.post_json(@url_sections, section_spec)
            result = section_by_id(section_id)
            raise 'Error creating section in DFW' unless result

            result
        end

        # Delete section
        def delete_section(section_id = @one_section_id)
            url = @url_sections + '/' + section_id
            @nsx_client.delete(url, HEADER_JSON)
        end

        # Rules
        # Get all rules of a Section, OpenNebula section if it's not defined
        def rules(section_id = @one_section_id)
            url = @url_sections + '/' + section_id + '/rules'
            @nsx_client.get_json(url)
        end

        # Get rule by id
        def rules_by_id(rule_id)
            url = @base_url + '/rules/' + rule_id
            @nsx_client.get_json(url)
        end

        # Get rule by name
        def rules_by_name(rule_name, section_id = @one_section_id)
            result = nil
            return result unless section_id

            all_rules = rules(section_id)
            return result unless all_rules

            all_rules['results'].each do |rule|
                result = rule if rule['display_name'] == rule_name
            end
            result
        end

        # Create new rule
        def create_rule(rule_spec, section_id = @one_section_id)
            # Get revision from section
            revision_id = section_by_id(section_id)['_revision']
            rule_spec['_revision'] = revision_id
            rule_spec = rule_spec.to_json
            url = @url_sections + '/' + section_id + '/rules'
            result = @nsx_client.post_json(url, rule_spec)
            raise 'Error creating DFW rule' unless result
        end

        # Update rule
        def update_rule(rule_id, rule_spec, section_id = @one_section_id)
            url = @url_sections + '/' + section_id + '/rules/' + rule_id
            rule = rules_by_id(rule_id)
            raise "Rule id #{rule_id} not found" unless rule

            rule_spec['_revision'] = rule['_revision']
            rule_spec = rule_spec.to_json
            result = @nsx_client.put_json(url, rule_spec)
            raise 'Error updating DFW rule' unless result
        end

        # Delete rule
        def delete_rule(rule_id, section_id = @one_section_id)
            url = @url_sections + '/' + section_id + '/rules/' + rule_id
            # Delete receive a 200 OK also if the rule doesn't exist
            @nsx_client.delete(url, HEADER_JSON)
            result = rules_by_id(rule_id)
            raise 'Error deleting section in DFW' if result
        end

    end

end
