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

    # Image
    class Image < VirtualSyncResource

        # Class constructor
        def initialize
            super

            @pool = OpenNebula::ImagePool.new(@client)
            @type = 'image'
        end

        # Creates a new object in OpenNebula
        #
        # @param template     [Hash]   Object attributes
        # @param provision_id [String] Provision ID
        #
        # @return [Integer] Resource ID
        def create(template, provision_id)
            meta = template['meta']

            wait, timeout = OneProvision::ObjectOptions.get_wait(meta)
            info          = { 'provision_id' => provision_id,
                              'wait'         => wait,
                              'wait_timeout' => timeout }

            check_wait(wait)

            add_provision_info(template, info)

            # create ONE object
            new_object

            rc = @one.allocate(format_template(template),
                               template['ds_id'].to_i)
            Utils.exception(rc)
            rc = @one.info
            Utils.exception(rc)

            OneProvisionLogger.debug(
                "#{@type} created with ID: #{@one.id}"
            )

            return @one.id.to_i unless wait

            ready?(template, provision_id)
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

        # Wait until the image is ready, retry if fail
        #
        # @param template     [Hash]   Object attributes
        # @param provision_id [String] Provision ID
        #
        # @return [Integer] Resource ID
        def ready?(template, provision_id)
            Driver.retry_loop 'Fail to create image' do
                wait_state('READY', template['timeout'])

                # check state after existing wait loop
                @one.info

                case @one.state_str
                when 'LOCKED'
                    # if locked, keep waiting
                    ready?(template, provision_id)
                when 'ERROR'
                    # if error, delete the image and try to create it again
                    raise OneProvisionLoopException
                else
                    # if everything is ready, return the ID
                    @one.id.to_i
                end
            end
        end

    end

end
