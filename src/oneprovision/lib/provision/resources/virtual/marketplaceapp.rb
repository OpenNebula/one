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

require 'provision/resources/virtual/virtual_sync_resource'

module OneProvision

    # Marketplaceapp
    class MarketPlaceApp < VirtualSyncResource

        # Class constructor
        #
        # @param p_template [Hash] Resource information in hash form
        def initialize(p_template)
            super

            @type = 'marketplaceapp'
        end

        # Creates a new object in OpenNebula
        #
        # @return [Integer] Resource ID
        def create
            meta = @p_template['meta']

            app_id = @p_template['appid'] || name_to_id(@p_template['appname'])
            wait, timeout = OneProvision::ObjectOptions.get_wait(meta)

            check_wait(wait)

            OneProvisionLogger.debug(
                "Exporting marketplace app #{app_id}"
            )

            app = OpenNebula::MarketPlaceApp.new(
                OpenNebula::MarketPlaceApp.build_xml(app_id),
                @client
            )

            # export the APP from marktplace
            rc = app.info

            Utils.exception(rc)

            app.extend(MarketPlaceAppExt)

            url_args = "tag=#{@p_template['tag']}" if @p_template['tag']
            rc       = app.info

            Utils.exception(rc)

            rc = app.export(
                :dsid => Integer(@p_template['dsid']),
                :name => @p_template['name'],
                :vmtemplate_name => @p_template['vmname'],
                :url_args => url_args
            )

            Utils.exception(rc[:image].first) if rc[:image]
            Utils.exception(rc[:vmtemplate].first) if rc[:vmtemplate]

            # get new IDs
            image_id    = rc[:image].first
            template_id = rc[:vmtemplate].first
            p_id        = @p_template['provision']['id']
            ret         = {}

            # get new created image and update it with provision ID
            if image_id
                OneProvisionLogger.debug(
                    "Image created with ID: #{image_id}"
                )

                @image = Image.new

                @image.info(image_id)
                @image.update_provision_info({ 'wait'         => wait,
                                            'wait_timeout' => timeout,
                                            'id'           => p_id })

                @image.template_chown(@p_template)
                @image.template_chmod(@p_template)

                ret[:image] = { 'id'   => image_id,
                                'name' => @image.one['NAME'] }
            end

            # get new created template and update it with provision ID
            if template_id
                OneProvisionLogger.debug(
                    "Template created with ID: #{template_id}"
                )

                @template = Template.new

                @template.info(template_id)
                @template.update_provision_info({ 'id' => p_id })
                @template.template_chown(@p_template)
                @template.template_chmod(@p_template)

                ret[:template] = { 'id'   => template_id,
                                   'name' => @template.one['NAME'] }
            end

            return ret unless wait

            @image.ready?

            ret
        end

        ########################################################################
        # EMPTY METHODS
        ########################################################################

        def delete; end

        def template_chown(template) end

        def template_chmod(template) end

        private

        # Get app ID from app name
        #
        # @param name [String] App name
        #
        # @return [Integer] App ID
        def name_to_id(name)
            pool = OpenNebula::MarketPlaceAppPool.new(@client)

            rc = pool.info_all
            Utils.exception(rc)

            app = pool.find {|v| v.name == name }

            return app.id unless app.nil?

            raise OneProvisionLoopException, "App #{name} not found"
        end

    end

end
