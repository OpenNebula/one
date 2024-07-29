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

# Module to decorate ServiceTemplate class with additional helpers not directly
# exposed through the OpenNebula XMLRPC API. The extensions include
#   - mp_import helper that imports a template into a marketplace
#
# rubocop:disable Style/ClassAndModuleChildren
module OpenNebula::ServiceTemplateExt

    def self.extend_object(obj)
        if !obj.is_a?(OpenNebula::ServiceTemplate)
            raise StandardError, "Cannot extended #{obj.class} " \
                                 'with MarketPlaceAppExt'
        end

        class << obj

            ####################################################################
            # Public extended interface
            ####################################################################
            # Imports service template into marketplace
            #
            # @param templates [Hash]    Service roles templates information
            # @param market_id [Integer] Marketplace ID to import app
            # @param name      [String]  Service Template App name
            def mp_import(templates, market_id, name)
                template = ''
                name   ||= "#{@body['name']}-#{SecureRandom.hex[0..9]}"

                template = <<-EOT
                NAME      = "#{name}"
                ORIGIN_ID = "-1"
                TYPE      = "SERVICE_TEMPLATE"
                APPTEMPLATE64 = "#{Base64.strict_encode64(@body.to_json)}"
                EOT

                # Add VM template name into roles information
                @body['roles'].each do |role|
                    # Find role template into templates to get the name to use
                    t = templates.find do |_, v|
                        v[:template]['ID'].to_i == role['vm_template']
                    end

                    next if t.nil? || t[1].nil? || t[1][:name].nil?

                    app_name = t[1][:name]

                    template << <<-EOT
                    ROLE = [ NAME="#{role['name']}", APP="#{app_name}"]
                    EOT

                    role.delete('vm_template')
                end

                xml = MarketPlaceApp.build_xml
                app = MarketPlaceApp.new(xml, @client)
                rc  = app.allocate(template, market_id)

                if OpenNebula.is_error?(rc)
                    [-1, rc]
                else
                    [0, app.id]
                end
            end

        end
    end

end
# rubocop:enable Style/ClassAndModuleChildren
