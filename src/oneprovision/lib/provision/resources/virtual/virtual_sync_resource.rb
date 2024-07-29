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

require 'provision/resources/resource'

module OneProvision

    # Represents the virtual resource with async/sync waits
    class VirtualSyncResource < Resource

        # Default timeout to wait until object is ready in wait mode
        DEFAULT_TIMEOUT = 60

        # Supported wait modes
        SUPPORTED_MODES = ['true', 'false']

        # Delete object
        def delete(_ = nil, _ = nil, _ = nil)
            @one.info

            id      = @one['ID']
            wait    = @one['TEMPLATE/PROVISION/WAIT']
            timeout = @one['TEMPLATE/PROVISION/WAIT_TIMEOUT'].to_f

            super

            return true unless wait == 'true'

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

            # Check if the object was really deleted
            rc = @one.info

            return if OpenNebula.is_error?(rc)

            raise OneProvisionLoopException, "Fail to delete #{@type} #{id}"
        end

        protected

        # Check wait mode
        #
        # @param wait [Boolean] Wait mode
        #
        # Raises exception in case of mode not supported
        def check_wait(wait)
            return if SUPPORTED_MODES.include?(wait.to_s) || wait.nil?

            raise OneProvisionLoopException, "Wait mode #{wait} not supported"
        end

    end

end
