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

module OneKS

    # OneKS specific extensions for shared OpenNebula helpers
    module OneHelperExtensions

        APPLIANCE_ID_ATTR = 'ONEKS_APPLIANCE_ID'

        # OneKS appliance image discovery
        module Image

            # Finds appliance images in any of the provided datastores.
            # Marketplace imports identified by their path take precedence
            # over manually imported images marked with ONEKS_APPLIANCE_ID.
            def find_all_by_appliance_id(client, appliance_id, datastore_ids)
                return OpenNebula::Error.new(
                    'OneKS appliance ID cannot be empty', OpenNebula::Error::EACTION
                ) if appliance_id.to_s.empty?

                datastore_ids = Array(datastore_ids).map(&:to_s)

                return OpenNebula::Error.new(
                    'Datastore IDs cannot be empty', OpenNebula::Error::EACTION
                ) if datastore_ids.empty?

                image_pool = OpenNebula::ImagePool.new(
                    client, OpenNebula::Pool::INFO_ALL
                )

                rc = image_pool.info
                return rc if OpenNebula.is_error?(rc)

                images = image_pool.sort_by {|image| image.id.to_i }.filter_map do |image|
                    # Skip if the datastore is not inclided in the target cluster datastores
                    next unless datastore_ids.include?(image['DATASTORE_ID'].to_s)

                    rc = image.info
                    return rc if OpenNebula.is_error?(rc)

                    image
                end

                marketplace_matches = images.select do |image|
                    image['PATH'].to_s.include?("/appliance/#{appliance_id}/")
                end

                manual_matches = images.select do |image|
                    image["TEMPLATE/#{APPLIANCE_ID_ATTR}"].to_s == appliance_id.to_s
                end

                (marketplace_matches + manual_matches).uniq(&:id)
            end

        end

        # OneKS appliance VM Template discovery
        module Template

            # Finds the VM Template using the image for a Marketplace or
            # manually imported OneKS appliance.
            def find_by_appliance_id(client, appliance_id, datastore_ids)
                images = ::OneHelper::Image.find_all_by_appliance_id(
                    client, appliance_id, datastore_ids
                )
                return images if OpenNebula.is_error?(images)

                return OpenNebula::Error.new(
                    "Cannot find OneKS appliance image #{appliance_id} in datastores " \
                    "#{Array(datastore_ids).join(', ')}",
                    OpenNebula::Error::EACTION
                ) if images.empty?

                images.each do |image|
                    template = find_by_image(client, image.id)
                    return template if OpenNebula.is_error?(template)
                    next unless template

                    if images.size > 1
                        Log.warn(
                            'ONE',
                            'Multiple appliance images found for appliance ID ' \
                            "#{appliance_id} in datastores " \
                            "#{Array(datastore_ids).join(', ')}. Using image " \
                            "#{image.id} with template #{template.id}."
                        )
                    end

                    return template
                end

                OpenNebula::Error.new(
                    "Cannot find OneKS appliance VM Template #{appliance_id} " \
                    "using images #{images.map(&:id).join(', ')}",
                    OpenNebula::Error::EACTION
                )
            end

        end

    end

end
