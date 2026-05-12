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

            # Defines methods to manage Images in OpenNebula
            module Image

                def self.create(client, template, datastore_id, no_check_capacity: false)
                    template = Hash.to_raw(template)
                    return template if OpenNebula.is_error?(template)

                    return OpenNebula::Error.new(
                        'Image template cannot be empty', OpenNebula::Error::EACTION
                    ) if template.to_s.empty?

                    return OpenNebula::Error.new(
                        'Datastore ID cannot be nil', OpenNebula::Error::EACTION
                    ) if datastore_id.nil?

                    image = OpenNebula::Image.new(OpenNebula::Image.build_xml, client)

                    rc = image.allocate(template, datastore_id, no_check_capacity)
                    return rc if OpenNebula.is_error?(rc)

                    rc = image.info
                    return rc if OpenNebula.is_error?(rc)

                    image
                end

                def self.exists?(client, name)
                    image = find(client, name)
                    return image if OpenNebula.is_error?(image)

                    !image.nil?
                end

                def self.name(client, image_id)
                    return OpenNebula::Error.new(
                        'Image ID cannot be nil', OpenNebula::Error::EACTION
                    ) if image_id.nil?

                    image = OpenNebula::Image.new_with_id(image_id, client)

                    rc = image.info
                    return rc if OpenNebula.is_error?(rc)

                    name = image.name
                    return OpenNebula::Error.new(
                        "Cannot retrieve name for Image '#{image_id}'",
                        OpenNebula::Error::EACTION
                    ) if name.to_s.empty?

                    name
                end

                def self.find(client, name)
                    image_pool = OpenNebula::ImagePool.new(client, -1)

                    rc = image_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    image = image_pool.find {|i| i.name == name }
                    return if image.nil?

                    rc = image.info
                    return rc if OpenNebula.is_error?(rc)

                    image
                end

                def self.update(client, image_id, content, append: false)
                    return OpenNebula::Error.new(
                        'Image ID cannot be nil', OpenNebula::Error::EACTION
                    ) if image_id.nil?

                    content = Hash.to_raw(content)
                    return content if OpenNebula.is_error?(content)

                    return OpenNebula::Error.new(
                        'Image content cannot be empty', OpenNebula::Error::EACTION
                    ) if content.to_s.empty?

                    image = OpenNebula::Image.new_with_id(image_id, client)

                    rc = image.update(content, append)
                    return rc if OpenNebula.is_error?(rc)

                    rc = image.info
                    return rc if OpenNebula.is_error?(rc)

                    image
                end

                def self.delete(client, image_id, force: false)
                    return OpenNebula::Error.new(
                        'Image ID cannot be nil', OpenNebula::Error::EACTION
                    ) if image_id.nil?

                    image = OpenNebula::Image.new_with_id(image_id, client)

                    rc = image.delete(force)
                    return rc if OpenNebula.is_error?(rc)

                    true
                end

            end

        end

    end

end
