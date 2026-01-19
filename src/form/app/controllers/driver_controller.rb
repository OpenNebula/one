# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

# Apps Controller
module OneFormServer

    # Drivers Controller
    module DriverController

        def self.registered(app)
            app.before do
                user = User.new_with_id(OpenNebula::User::SELF, @client)
                rc   = user.info

                halt 500, internal_error(
                    'Failed to retrieve user information',
                    ResponseHelper::INTERNAL_EC
                ) if OpenNebula.is_error?(rc)

                # Only allow oneadmin group users to perform actions
                halt 403, internal_error(
                    'Access denied. Only users belonging to the "oneadmin" group are ' \
                    'authorized to perform this action',
                    ResponseHelper::VALIDATION_EC
                ) if request.request_method != 'GET' && \
                     !(user['GID'] == '0' || user.groups.include?('0'))
            end

            # GET /drivers
            # Lists all available drivers and their metadata.
            #
            # Returns:
            #   200 OK - Driver object (JSON)
            #   500 Internal Server Error - On unexpected failure or OpenNebula error
            app.get '/drivers' do
                begin
                    rc = OneForm::Driver.list

                    return internal_error(
                        rc.message, one_error_to_http(rc.errno)
                    ) if OpenNebula.is_error?(rc)

                    status 200
                    body process_response(rc)
                rescue StandardError => e
                    internal_error(e.message, ResponseHelper::GENERAL_EC)
                end
            end

            # GET /drivers/:name
            # Retrieves information for a specific driver by name.
            #
            # Params:
            #   :name [String] - name of the driver
            #
            # Returns:
            #   200 OK - Array of driver objects
            #   404 Not Found - If driver is not found
            #   500 Internal Server Error - On unexpected failure or OpenNebula error
            app.get '/drivers/:name' do
                rc = OneForm::Driver.from_name(params[:name])

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 200
                body process_response(rc)
            rescue StandardError => e
                internal_error(e.message, ResponseHelper::GENERAL_EC)
            end

            # POST /drivers/sync
            # Tries to validate and enable all the drivers from the local folder.
            #
            # Behavior:
            #   - Validates presence of driver folders.
            #   - Verifies driver folder structure and template syntax.
            #   - Registers drivers and sets their state to ENABLED or ERROR.
            #   - Writes driver state and logs any failures.
            #
            # Returns:
            #   200 OK - JSON response with the result of the sync:
            #     {
            #       "success": ["driver1", "driver2", ...],
            #       "failed": [
            #         { "name": "driverX", "error": "reason" },
            #         ...
            #       ]
            #     }
            #   500 Internal Server Error - On unexpected failure or OpenNebula error
            app.post '/drivers/sync' do
                rc = OneForm::Driver.sync

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 200
                body process_response(rc)
            rescue StandardError => e
                internal_error(e.message, ResponseHelper::GENERAL_EC)
            end

            # POST /drivers/:name/enable
            # Enables a specific driver by name.
            #
            # Params:
            #   :name [String] - name of the driver
            #
            # Returns:
            #   200 OK - Driver successfully enabled
            #   400 Bad Request - If driver state is invalid
            #   404 Not Found - If driver is not found
            #   500 Internal Server Error - On unexpected failure or OpenNebula error
            app.post '/drivers/:name/enable' do
                rc = OneForm::Driver.enable(params[:name])

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 200
            rescue StandardError => e
                internal_error(e.message, ResponseHelper::GENERAL_EC)
            end

            # POST /drivers/:name/disable
            # Disables a specific driver by name.
            #
            # Params:
            #   :name [String] - name of the driver
            #
            # Returns:
            #   200 OK - Driver successfully disabled
            #   400 Bad Request - If driver state is invalid
            #   404 Not Found - If driver is not found
            #   500 Internal Server Error - On unexpected failure or OpenNebula error
            app.post '/drivers/:name/disable' do
                rc = OneForm::Driver.disable(params[:name])

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 200
            rescue StandardError => e
                internal_error(e.message, ResponseHelper::GENERAL_EC)
            end
        end

    end

end
