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

            # Defines methods to manage Marketplace Apps in OpenNebula
            module Marketplace

                IMPORT_TAG = 'MARKETPLACE_IMPORT_ID'

                def self.import(client, name, app_id, datastore_id)
                    return OpenNebula::Error.new(
                        'Marketplace appliance ID cannot be empty',
                        OpenNebula::Error::EACTION
                    ) if app_id.to_s.empty?

                    return OpenNebula::Error.new(
                        'Datastore ID cannot be nil', OpenNebula::Error::EACTION
                    ) if datastore_id.nil?

                    app = find(client, app_id)
                    return app if OpenNebula.is_error?(app)

                    return OpenNebula::Error.new(
                        "Marketplace appliance '#{app_id}' not found",
                        OpenNebula::Error::EACTION
                    ) if app.nil?

                    app.extend(OpenNebula::MarketPlaceAppExt)
                    rc = app.export({ :name => name, :dsid => datastore_id })
                    return rc if OpenNebula.is_error?(rc)

                    # Check first if any error is returned by the OCA export method
                    image_ids   = Array(rc[:image])
                    image_error = image_ids.find {|image_id| OpenNebula.is_error?(image_id) }
                    return image_error if image_error

                    tmplt_ids   = Array(rc[:vmtemplate])
                    tmplt_error = tmplt_ids.find {|tmplt_id| OpenNebula.is_error?(tmplt_id) }
                    return tmplt_error if tmplt_error

                    # Add ID reference to the app in each created image and template
                    app_tag = { IMPORT_TAG => app['TEMPLATE/IMPORT_ID'] }

                    image_ids.each do |image_id|
                        rc = Image.update(client, image_id, app_tag, :append => true)
                        return rc if OpenNebula.is_error?(rc)
                    end

                    tmplt_ids.each do |template_id|
                        rc = Template.update(client, template_id, app_tag, :append => true)
                        return rc if OpenNebula.is_error?(rc)
                    end

                    app
                end

                def self.exists?(client, app_id)
                    app = find(client, app_id)
                    return app if OpenNebula.is_error?(app)

                    !app.nil?
                end

                def self.name(client, app_id)
                    return OpenNebula::Error.new(
                        'Marketplace appliance ID cannot be nil',
                        OpenNebula::Error::EACTION
                    ) if app_id.nil?

                    app = find(client, app_id)
                    return app if OpenNebula.is_error?(app)

                    return OpenNebula::Error.new(
                        "Marketplace appliance '#{app_id}' not found",
                        OpenNebula::Error::EACTION
                    ) if app.nil?

                    name = app.name
                    return OpenNebula::Error.new(
                        "Cannot retrieve name for Marketplace appliance '#{app_id}'",
                        OpenNebula::Error::EACTION
                    ) if name.nil? || name.to_s.empty?

                    name
                end

                def self.find(client, app_id)
                    marketplace_app_pool = OpenNebula::MarketPlaceAppPool.new(client, -1)

                    rc = marketplace_app_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    app = marketplace_app_pool.find do |market_app|
                        market_app['TEMPLATE/IMPORT_ID'] == app_id
                    end

                    return if app.nil?

                    rc = app.info
                    return rc if OpenNebula.is_error?(rc)

                    app
                end

                def self.delete(client, app_id)
                    return OpenNebula::Error.new(
                        'Marketplace appliance ID cannot be nil',
                        OpenNebula::Error::EACTION
                    ) if app_id.nil?

                    app = find(client, app_id)
                    return app if OpenNebula.is_error?(app)

                    return OpenNebula::Error.new(
                        "Marketplace appliance '#{app_id}' not found",
                        OpenNebula::Error::EACTION
                    ) if app.nil?

                    rc = app.delete
                    return rc if OpenNebula.is_error?(rc)

                    true
                end

            end

        end

    end

end
