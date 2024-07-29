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

    # Image
    class Image < VirtualSyncResource

        # Class constructor
        #
        # @param p_template [Hash] Resource information in hash form
        def initialize(p_template = nil)
            super

            @pool = OpenNebula::ImagePool.new(@client)
            @type = 'image'
        end

        # Creates a new object in OpenNebula
        #
        # @return [Integer] Resource ID
        def create
            meta = @p_template['meta']

            wait, timeout = OneProvision::ObjectOptions.get_wait(meta)
            info          = { 'wait'         => wait,
                              'wait_timeout' => timeout }

            check_wait(wait)

            add_provision_info(@p_template, info)

            # create ONE object
            new_object

            rc = @one.allocate(format_template(@p_template),
                               Integer(@p_template['ds_id']))
            Utils.exception(rc)
            rc = @one.info
            Utils.exception(rc)

            OneProvisionLogger.debug(
                "#{@type} created with ID: #{@one.id}"
            )

            return Integer(@one.id) unless wait

            ready?
        end

        # Info an specific object
        #
        # @param id [String] Object ID
        def info(id)
            @one = OpenNebula::Image.new_with_id(id, @client)
            @one.info
        end

        # Wait until the image is ready, retry if fail
        #
        # @return [Integer] Resource ID
        def ready?
            OneProvisionLogger.debug(
                "Waiting #{@type} #{@one.id} to be READY"
            )

            Driver.retry_loop 'Fail to create image' do
                @one.wait_state('READY',
                                (@p_template && @p_template['timeout']) || 60)

                # check state after existing wait loop
                @one.info

                case @one.state_str
                when 'ERROR'
                    # if error, delete the image and try to create it again
                    raise OneProvisionLoopException
                else
                    # if everything is ready, return the ID
                    Integer(@one.id)
                end
            end
        end

        private

        # Create new object
        def new_object
            @one = OpenNebula::Image.new(OpenNebula::Image.build_xml, @client)
        end

    end

end
