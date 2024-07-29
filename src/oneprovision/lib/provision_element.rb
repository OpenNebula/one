# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula/document_json'

# OneProvision module
module OneProvision

    # Provision element
    class ProvisionElement < OpenNebula::DocumentJSON

        TEMPLATE_TAG = 'PROVISION_BODY'

        # Body tag
        attr_reader :tag

        # Body
        attr_reader :body, :plain

        # Class constructor
        def initialize(xml, client)
            super

            @tag = TEMPLATE_TAG
        end

        # Allocate provision element
        #
        # @param template_json [Hash]   Template information
        # @param name          [String] Provision element name
        def allocate(template, name, plain)
            plain = plain.to_json if plain
            text  = build_template_xml(template, name, plain)

            allocate_xml(text)
        end

        # Replaces the template contents
        #
        # @param template_json [String]  New template contents
        # @param plain         [Boolean] Update plain information
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(template_json = nil, plain = false)
            if template_json
                if plain
                    @plain        = JSON.parse(template_json)
                    template_json = @body
                else
                    template_json = JSON.parse(template_json)

                    if template_json.keys.sort != @body.keys.sort
                        return OpenNebula::Error.new('Keys can not be changed')
                    end

                    self.class::IMMUTABLE_ATTRS.each do |attr|
                        next if template_json[attr] == @body[attr]

                        return OpenNebula::Error.new(
                            "`#{attr}` can not be changed"
                        )
                    end
                end

                super(template_json.to_json)
            else
                super
            end
        end

    end

end
