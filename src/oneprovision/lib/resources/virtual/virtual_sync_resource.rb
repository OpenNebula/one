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

    # Represents the virtual resource with async/sync waits
    class VirtualSyncResource < Resource

        # Default timeout to wait until object is ready in sync mode
        DEFAULT_TIMEOUT = 60

        # Creates a new object in OpenNebula
        #
        # @param template     [Hash]   Object attributes
        # @param provision_id [String] Provision ID
        #
        # @return [Integer] Resource ID
        def create(template, provision_id)
            mode = template['mode'].downcase.to_sym if template['mode']
            info = { 'provision_id' => provision_id,
                     'mode'         => mode }

            add_provision_info(template, info)

            # create ONE object
            new_object

            rc = @one.allocate(format_template(template), template['ds_id'])
            Utils.exception(rc)
            rc = @one.info
            Utils.exception(rc)

            OneProvisionLogger.debug(
                "#{@type} created with ID: #{@one.id}"
            )

            @one.id.to_i
        end

        # Delete object
        def delete
            @one.info

            mode = @one['TEMPLATE/PROVISION/MODE']

            super

            return true if mode == 'async' || mode.nil?

            t_start   = Time.now
            timeout ||= DEFAULT_TIMEOUT

            OneProvisionLogger.debug(
                "Waiting #{@type} #{@one.id} to be deleted"
            )

            while Time.now - t_start < timeout
                rc = @one.info

                break true if OpenNebula.is_error?(rc)

                sleep 1
            end
        end

        protected

        # Wait until object reaches state
        #
        # @param state   [String]  State to wait
        # @param timeout [Integer] Timeout to wait
        def wait_state(state, timeout)
            t_start   = Time.now
            timeout ||= DEFAULT_TIMEOUT

            OneProvisionLogger.debug(
                "Waiting #{@type} #{@one.id} to be #{state}"
            )

            while Time.now - t_start < timeout
                @one.info

                break if @one.state_str == state

                sleep 1
            end
        end

    end

end
