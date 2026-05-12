# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

module OpenNebula

    module DocumentServer

        # Defines methods to manage resources in OpenNebula using the OCA API
        module OneHelper

            # Defines methods to manage VM Templates in OpenNebula.
            module Template

                def self.create(client, content)
                    content = Hash.to_raw(content)
                    return content if OpenNebula.is_error?(content)

                    return OpenNebula::Error.new(
                        'Template content cannot be empty', OpenNebula::Error::EACTION
                    ) if content.to_s.empty?

                    template = OpenNebula::Template.new(OpenNebula::Template.build_xml, client)

                    rc = template.allocate(content)
                    return rc if OpenNebula.is_error?(rc)

                    rc = template.info
                    return rc if OpenNebula.is_error?(rc)

                    template
                end

                def self.exists?(client, name)
                    template = find(client, name)
                    return template if OpenNebula.is_error?(template)

                    !template.nil?
                end

                def self.name(client, template_id)
                    return OpenNebula::Error.new(
                        'Template ID cannot be nil', OpenNebula::Error::EACTION
                    ) if template_id.nil?

                    template = OpenNebula::Template.new_with_id(template_id, client)

                    rc = template.info
                    return rc if OpenNebula.is_error?(rc)

                    name = template.name
                    return OpenNebula::Error.new(
                        "Cannot retrieve name for VM Template '#{template_id}'",
                        OpenNebula::Error::EACTION
                    ) if name.nil? || name.to_s.empty?

                    name
                end

                def self.find(client, name)
                    template_pool = OpenNebula::TemplatePool.new(client, -1)

                    tc = template_pool.info
                    return tc if OpenNebula.is_error?(tc)

                    template = template_pool.find {|t| t.name == name }
                    return if template.nil?

                    rc = template.info
                    return rc if OpenNebula.is_error?(rc)

                    template
                end

                def self.find_by_attr(client, attr, value)
                    template_pool = OpenNebula::TemplatePool.new(client, -1)

                    tc = template_pool.info
                    return tc if OpenNebula.is_error?(tc)

                    template = template_pool.find do |tpl|
                        tpl["TEMPLATE/#{attr}"].to_s == value.to_s
                    end
                    return if template.nil?

                    rc = template.info
                    return rc if OpenNebula.is_error?(rc)

                    template
                end

                def self.update(client, template_id, content, append: false)
                    return OpenNebula::Error.new(
                        'Template ID cannot be nil', OpenNebula::Error::EACTION
                    ) if template_id.nil?

                    content = Hash.to_raw(content)
                    return content if OpenNebula.is_error?(content)

                    return OpenNebula::Error.new(
                        'Template content cannot be empty', OpenNebula::Error::EACTION
                    ) if content.to_s.empty?

                    template = OpenNebula::Template.new_with_id(template_id, client)

                    rc = template.update(content, append)
                    return rc if OpenNebula.is_error?(rc)

                    rc = template.info
                    return rc if OpenNebula.is_error?(rc)

                    template
                end

                def self.delete(client, template_id, recursive: false)
                    return OpenNebula::Error.new(
                        'Template ID cannot be nil', OpenNebula::Error::EACTION
                    ) if template_id.nil?

                    template = OpenNebula::Template.new_with_id(template_id, client)

                    rc = template.delete(recursive)
                    return rc if OpenNebula.is_error?(rc)

                    true
                end

                def self.delete_by_name(client, name, recursive: false)
                    template = find(client, name)
                    return template if OpenNebula.is_error?(template)
                    return if template.nil?

                    delete(client, template.id, :recursive => recursive)
                end

            end

        end

    end

end
