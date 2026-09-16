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

                RESOURCE_TYPE = 'image'
                WAIT_DELETE   = true

                # Creates an image in a datastore.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param template [Hash] Image template.
                # @param datastore_id [Integer] Destination datastore ID.
                # @param no_check_capacity [Boolean] Whether to bypass capacity checks.
                # @return [OpenNebula::Image, OpenNebula::Error] created image or an API error.
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

                # Returns an image body using symbolized keys.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param image_id [Integer] Image ID.
                # @param downcase [Boolean] Whether to downcase keys.
                # @return [Hash, OpenNebula::Error] image body or an API error.
                def self.body(client, image_id, downcase: true)
                    image = get(client, image_id)
                    return image if OpenNebula.is_error?(image)

                    body = image.to_hash['IMAGE']

                    return OpenNebula::Error.new(
                        "Cannot retrieve Image body for resource '#{image_id}'",
                        OpenNebula::Error::EACTION
                    ) unless body

                    body.deep_symbolize_keys(:downcase => downcase)
                end

                # Checks whether an image with a name exists.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Image name.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists?(client, name)
                    image = find(client, name)
                    return image if OpenNebula.is_error?(image)

                    !image.nil?
                end

                # Checks whether an image ID exists in the pool.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param image_id [Integer] Image ID.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists_id?(client, image_id)
                    image_pool = OpenNebula::ImagePool.new(client, -1)

                    rc = image_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    image_pool.any? {|image| image.id.to_i == image_id.to_i }
                end

                # Retrieves an image with its current information.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param image_id [Integer] Image ID.
                # @return [OpenNebula::Image, OpenNebula::Error] image or an API error.
                def self.get(client, image_id)
                    return OpenNebula::Error.new(
                        'Image ID cannot be nil', OpenNebula::Error::EACTION
                    ) if image_id.nil?

                    image = OpenNebula::Image.new_with_id(image_id, client)

                    rc = image.info
                    return rc if OpenNebula.is_error?(rc)

                    image
                end

                # Returns an image name.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param image_id [Integer] Image ID.
                # @return [String, OpenNebula::Error] image name or an API error.
                def self.name(client, image_id)
                    image = get(client, image_id)
                    return image if OpenNebula.is_error?(image)

                    name = image.name
                    return OpenNebula::Error.new(
                        "Cannot retrieve name for Image '#{image_id}'",
                        OpenNebula::Error::EACTION
                    ) if name.to_s.empty?

                    name
                end

                # Finds an image by name and optional datastore ID.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] Image name.
                # @param ds_id [Integer, nil] Datastore filter.
                # @return [OpenNebula::Image, nil, OpenNebula::Error] image, none, or an API error.
                def self.find(client, name, ds_id: nil)
                    image_pool = OpenNebula::ImagePool.new(client, -1)

                    rc = image_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    image = image_pool.find do |i|
                        i.name == name && (ds_id.nil? || i['DATASTORE_ID'].to_s == ds_id.to_s)
                    end
                    return if image.nil?

                    rc = image.info
                    return rc if OpenNebula.is_error?(rc)

                    image
                end

                # Finds an image by a template attribute and optional datastore ID.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param attr [String] Template attribute path.
                # @param value [Object] Expected attribute value.
                # @param ds_id [Integer, nil] Datastore filter.
                # @return [OpenNebula::Image, nil, OpenNebula::Error] image, none, or an API error.
                def self.find_by_attr(client, attr, value, ds_id: nil)
                    image_pool = OpenNebula::ImagePool.new(client, -1)

                    rc = image_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    image = image_pool.find do |i|
                        i["TEMPLATE/#{attr}"].to_s == value.to_s &&
                            (ds_id.nil? || i['DATASTORE_ID'].to_s == ds_id.to_s)
                    end
                    return if image.nil?

                    rc = image.info
                    return rc if OpenNebula.is_error?(rc)

                    image
                end

                # Finds the first image imported from a Marketplace appliance UUID.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param appliance_uuid [String] Marketplace appliance UUID.
                # @param ds_id [Integer] Datastore ID.
                # @return [OpenNebula::Image, nil, OpenNebula::Error] image, none, or an API error.
                def self.find_by_marketplace_uuid(client, appliance_uuid, ds_id)
                    return OpenNebula::Error.new(
                        'Marketplace appliance UUID cannot be empty',
                        OpenNebula::Error::EACTION
                    ) if appliance_uuid.to_s.empty?

                    return OpenNebula::Error.new(
                        'Datastore ID cannot be nil',
                        OpenNebula::Error::EACTION
                    ) if ds_id.nil?

                    image_pool = OpenNebula::ImagePool.new(client, -1)

                    rc = image_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    images = []
                    image_pool.sort_by {|image| image.id.to_i }.each do |image|
                        next unless image['DATASTORE_ID'].to_s == ds_id.to_s

                        rc = image.info
                        return rc if OpenNebula.is_error?(rc)

                        path = image['PATH'].to_s
                        images << image if path.include?("/appliance/#{appliance_uuid}/")
                    end

                    return if images.empty?

                    if images.size > 1
                        Log.warn(
                            'ONE',
                            'Multiple appliance images found for appliance UUID ' \
                            "#{appliance_uuid} in datastore #{ds_id}. " \
                            "Using image #{images.first.id}."
                        )
                    end

                    images.first
                end

                # Updates or appends template content to an image.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param image_id [Integer] Image ID.
                # @param content [Hash] Template data.
                # @param append [Boolean] Whether to append the data.
                # @return [OpenNebula::Image, OpenNebula::Error] updated image or an API error.
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

                # Deletes an image, optionally forcing and waiting for its removal.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param image_id [Integer] Image ID.
                # @param force [Boolean] Whether to force deletion.
                # @param wait [Boolean] Whether to wait for deletion.
                # @return [true, OpenNebula::Error] success or an API error.
                def self.delete(client, image_id, force: false, wait: false)
                    return OpenNebula::Error.new(
                        'Image ID cannot be nil', OpenNebula::Error::EACTION
                    ) if image_id.nil?

                    image = if wait
                                get(client, image_id)
                            else
                                OpenNebula::Image.new_with_id(image_id, client)
                            end
                    return image if OpenNebula.is_error?(image)

                    rc = image.delete(force)
                    return rc if OpenNebula.is_error?(rc)
                    return true unless wait

                    Resource.wait_until_deleted(image)
                end

            end

        end

    end

end
