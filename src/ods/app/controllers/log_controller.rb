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

        # Log Controller
        module LogController

            def self.registered(app)
                app.helpers LogsHelper

                # GET /:resource_name/:id/logs
                # Returns the logs for the specified resource
                #
                # Params:
                #   :resource_name [String]  - Resource collection name in the URL
                #   :id            [String]  - Resource ID
                #   :page        [Integer] - Optional page number (default: 1)
                #   :per_page    [Integer] - Optional page size  (default: 100)
                #   :all         [String]  - "true" to return the full log history
                #
                # Returns:
                #   200 OK - JSON:
                #     {
                #       "meta":   { ... pagination / totals ... },
                #       "events": [
                #         {"level":"info","text":"..."},
                #         ...
                #       ]
                #     }
                #   500 Internal Server Error - If OpenNebula returns an error
                app.get '/:resource_name/:id/logs' do
                    auth_object = settings.log_auth_factory.call(
                        @client,
                        params[:id],
                        params[:resource_name]
                    )

                    return internal_error(
                        auth_object.message,
                        one_error_to_http(auth_object.errno)
                    ) if OpenNebula.is_error?(auth_object)

                    log_file = File.join(LOG_LOCATION, APP_NAME, "#{params[:id]}.log")

                    return internal_error('Log file not found', 404) unless File.exist?(log_file)

                    all_logs = params[:all] == 'true'
                    page     = (params[:page] || 1).to_i
                    per_page = (params[:per_page] || 100).to_i
                    logs     = get_logs_page(log_file, page, per_page, all_logs)

                    status 200
                    body process_response(logs)
                end
            end

        end

    end

end
