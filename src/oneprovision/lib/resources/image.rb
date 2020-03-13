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

require 'resources/resource'

module OneProvision

    # Image
    class Image < Resource

        # Class constructor
        def initialize
            super

            @pool = OpenNebula::ImagePool.new(@client)
        end

        # Creates a new IMAGE in OpenNebula
        #
        # @param template     [String] Image template
        # @param provision_id [String] Provision ID
        # @param mode         [String] Sync or async mode
        #
        # @return [Integer] Resource ID
        def create(template, provision_id, mode)
            info = { 'provision_id' => provision_id,
                     'mode'         => mode }

            add_provision_info(template, info)

            # create ONE object
            new_object

            rc = @one.allocate(Utils.template_like_str(template),
                               template['ds_id'])
            Utils.exception(rc)
            rc = @one.info
            Utils.exception(rc)

            return @one.id.to_i if mode == 'async' || mode.nil?

            wait_state('READY', template['timeout'])

            @one.id.to_i
        end

        # Delete image
        def delete
            @one.info

            mode = @one['TEMPLATE/PROVISION/MODE']

            super

            return true if mode == 'async' || mode.nil?

            t_start   = Time.now
            timeout ||= DEFAULT_TIMEOUT

            while Time.now - t_start < timeout
                rc = @one.info

                break true if OpenNebula.is_error?(rc)

                sleep 1
            end
        end

        # Info an specific object
        #
        # @param id [String] Object ID
        def info(id)
            @one = OpenNebula::Image.new_with_id(id, @client)
            @one.info
        end

        private

        # Create new object
        def new_object
            @one = OpenNebula::Image.new(OpenNebula::Image.build_xml, @client)
        end

    end

end
