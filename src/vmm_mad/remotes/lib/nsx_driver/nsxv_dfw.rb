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
    class NSXVdfw < NSXDriver::DistributedFirewall

        # ATTRIBUTES
        attr_reader :one_section_id

        # CONSTRUCTOR
        # Creates OpenNebula section if not exists
        def initialize(nsx_client)
            super(nsx_client)
            # Construct base URLs
            @base_url = NSXDriver::NSXConstants::NSXV_DFW_BASE
            @url_sections = @base_url + \
                            NSXDriver::NSXConstants::NSXV_DFW_SECTIONS
            @one_section_id = init_section
        end

        # Sections
        # Get all sections
        # Creates OpenNebula section if not exists and returns
        # its section_id. Returns its section_id if OpenNebula
        # section already exists
        def init_section
            one_section = section_by_name(
                NSXDriver::NSXConstants::ONE_SECTION_NAME
            )
            one_section ||= create_section(
                NSXDriver::NSXConstants::ONE_SECTION_NAME
            )
            return one_section.xpath('@id').text if one_section
        end

        # Get all sections
        # Params:
        # - None
        # Return:
        # - nil | [Nokogiri::XML::NodeSet] sections
        def sections
            result = @nsx_client.get(@base_url)
            return unless result

            result.xpath(NSXDriver::NSXConstants::NSXV_DFW_SECTION_XPATH)
        end

        # Get section by id
        # Params:
        # - section_id: [String] ID of the section or @one_section_id
        # Return:
        # - nil | [Nokogiri::XML::NodeSet] section
        def section_by_id(section_id = @one_section_id)
            url = @url_sections + '/' + section_id
            result = @nsx_client.get(url)
            return unless result

            result.xpath(NSXDriver::NSXConstants::NSXV_DFW_SECTION_XPATH)
        end

        # Get section etag needed to manage FW rules
        # Params:
        # - section_id: [String] ID of the section or @one_section_id
        # Return:
        # - nil | etag [String] ID of the etag header
        def section_etag(section_id = @one_section_id)
            url = @url_sections + '/' + section_id
            response = @nsx_client.get_full_response(url)
            return unless response

            etag = response['etag']
            return etag.delete('\"') if etag
        end

        # Get section by name
        # Params:
        # - section_name: [String] Name of the section
        # Return:
        # - nil | [Nokogiri::XML::NodeSet] section
        def section_by_name(section_name)
            url = @url_sections + '?name=' + section_name
            result = @nsx_client.get(url)
            return unless result

            result.xpath(NSXDriver::NSXConstants::NSXV_DFW_SECTION_XPATH)
        end

        # Create new section
        # Params:
        # - section_name [String] Name of the section
        # Return:
        # - [Nokogiri::XML::NodeSet]
        def create_section(section_name)
            section_spec =
                "<section name=\"#{section_name}\"\
                stateless=\"false\" tcpStrict=\"true\" useSid=\"false\">\
                </section>"
            begin
                section = @nsx_client.post(@url_sections, section_spec)
            rescue StandardError => e
                raise NSXDriver::DFWError::CreateError, \
                      "Error creating section in NSX: #{e.message}"
            end

            unless section
                raise NSXDriver::DFWError::CreateError, \
                      'Error creating section in NSX: Unknown error'
            end

            section_id = section.xpath('//section/@id').text
            result = section_by_id(section_id)
            raise 'Section was not created in DFW' unless result

            result
        end

        # Delete section
        # Params:
        # - section_id: [String] ID of the section or @one_section_id
        def delete_section(section_id = @one_section_id)
            url = @url_sections + '/' + section_id
            @nsx_client.delete(url)
        end

        # Rules
        # Get all rules
        # Params:
        # - section_id: [String] ID of the section or @one_section_id
        # Return:
        # - [Nokogiri::XML::NodeSet]
        def rules(section_id = @one_section_id)
            url = @url_sections + '/' + section_id
            result = @nsx_client.get(url)
            return result.xpath(RULE_XPATH) if result
        end

        # Get rule by id
        def rules_by_id(rule_id, section_id = @one_section_id)
            url = @url_sections + '/' + section_id + '/rules/' + rule_id
            result = @nsx_client.get(url)
            return unless result

            result.xpath(NSXDriver::NSXConstants::NSXV_DFW_RULE_XPATH)
        end

        # Get rule by name
        def rules_by_name(rule_name, section_id = @one_section_id)
            result = []
            return result unless section_id

            all_rules = rules(section_id)
            return result unless all_rules

            all_rules.each do |rule|
                result << rule if rule.xpath("//rule/name=\"#{rule_name}\"")
            end
            result
        end

        # Get rule by regex
        # Return an array with rules
        # def rules_by_regex(rule_name, section_id = @one_section_id)
        #     result = []
        #     return result unless section_id

        #     all_rules = rules(section_id)
        #     return result unless all_rules

        #     all_rules.each do |rule|
        # CHANGE THIS: result << rule if rule.xpath("//rule/name=\"#{rule_name}\"")
        #     end
        #     result
        # end

        # Create new rule
        def create_rule(rule_spec, section_id = @one_section_id)
            # etag is needed to add a new header If-Match
            etag = section_etag(section_id)
            raise "Cannot get etag from section: #{section_id}" unless etag

            header['If-Match'] = etag
            url = @url_sections + '/' + section_id + '/rules'
            result = @nsx_client.post(url, rule_spec)
            raise 'Error creating DFW rule' unless result
        end

        # Update rule
        def update_rule(rule_id, rule_spec, section_id = @one_section_id)
            url = @url_sections + '/' + section_id + '/rules/' + rule_id
            rule = rules_by_id(rule_id)
            raise "Rule id #{rule_id} not found" unless rule

            # etag is needed to add a new header If-Match
            etag = section_etag(section_id)
            raise "Cannot get etag from section: #{section_id}" unless etag

            header['If-Match'] = etag
            result = @nsx_client.put(url, rule_spec)
            raise 'Error creating DFW rule' unless result
        end

        # Delete rule
        def delete_rule(rule_id, section_id = @one_section_id)
            url = @url_sections + '/' + section_id + '/rules/' + rule_id
            # etag is needed to add a new header If-Match
            etag = section_etag(section_id)
            raise "Cannot get etag from section: #{section_id}" unless etag

            header['If-Match'] = etag
            result = @nsx_client.delete(url)
            raise 'Invalid http code deleting rule in DFW' unless result

            result = rules_by_id(rule_id)
            raise 'Error deleting rule in DFW' if result
        end

    end

end
