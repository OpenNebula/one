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

require 'resources/virtual/virtual_sync_resource'

module OneProvision

    # Marketplaceapp
    class MarketPlaceApp < VirtualSyncResource

        # Class constructor
        def initialize
            super

            @type = 'marketplaceapp'
        end

        # Creates a new object in OpenNebula
        #
        # @param template     [String] Object template
        # @param provision_id [String] Provision ID
        #
        # @return [Integer] Resource ID
        def create(template, provision_id)
            mode    = template['mode'].downcase if template['mode']
            timeout = template['timeout']

            uid   = template['uid']
            gid   = template['gid']
            octet = template['octet']

            OneProvisionLogger.debug(
                "Exporting marketplace app #{template['appid']}"
            )

            app = OpenNebula::MarketPlaceApp.new(
                OpenNebula::MarketPlaceApp.build_xml(template['appid']),
                @client
            )

            # export the APP from marktplace
            rc = app.info
            Utils.exception(rc)
            rc = app.export(
                :dsid => template['dsid'],
                :name => template['name'],
                :vmtemplate_name => template['vmname']
            )
            Utils.exception(rc)

            # get new IDs
            image_id    = rc[:image].first
            template_id = rc[:vmtemplate].first

            OneProvisionLogger.debug(
                "Image created with ID: #{image_id}"
            )

            OneProvisionLogger.debug(
                "Template created with ID: #{template_id}"
            )
            # get new created template and update it with provision ID
            template = Template.new

            template.info(template_id)
            template.one.update("PROVISION=[PROVISION_ID=#{provision_id}]",
                                true)

            # get new created image and update it with provision ID
            image = Image.new

            image.info(image_id)
            image.one.update(
                "PROVISION=[MODE=#{mode},PROVISION_ID=#{provision_id}]",
                true
            )

            # Change permissions and ownership
            image.chown(uid, gid)
            template.chown(uid, gid)
            image.chmod(octet)
            template.chmod(octet)

            return [image_id, template_id] if mode == 'async' || mode.nil?

            image.wait_state('READY', timeout)

            [image_id, template_id]
        end

        ########################################################################
        # EMPTY METHODS
        ########################################################################

        def delete; end

        def chown(user, group) end

        def chmod(octet) end

    end

end
