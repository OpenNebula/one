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

module OneForm

    # Apps Module
    module Drivers

        # Return a list of all drivers registered on the system
        #
        # @param opts [Hash] Optional parameters for filtering drivers
        # @return [Array[Hash]] List of drivers installed on the system
        def list_drivers(opts = {})
            get('/drivers', query_params(opts))
        end

        # Get information about a specific driver
        #
        # @param name [String] Name of the driver
        # @return [Hash] Information about the specified driver
        def get_driver(name)
            get("/drivers/#{name}")
        end

        # Get the input definitions for a driver deployment
        #
        # @param name [String] Name of the driver
        # @param deployment [String] Deployment inventory name
        # @return [Array<Hash>] Driver and deployment input definitions
        def get_driver_inputs(name, deployment)
            get("/drivers/#{name}/#{deployment}/inputs")
        end

        # Synchronize the list of drivers installed on the system
        #
        # @return [Integer] Result code of the operation
        def sync_drivers
            post('/drivers/sync')
        end

        # Enable a specific driver
        #
        # @param name [String] Name of the driver to enable
        # @return [Integer] Result code of the operation
        def enable_driver(name)
            post("/drivers/#{name}/enable")
        end

        # Disable a specific driver
        #
        # @param name [String] Name of the driver to disable
        # @return [Integer] Result code of the operation
        def disable_driver(name)
            post("/drivers/#{name}/disable")
        end

    end

end
