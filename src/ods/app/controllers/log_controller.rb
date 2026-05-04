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

            # Registers a logs endpoint for a document backed resource
            # @param app [Sinatra::Base] App where the route is registered
            # @param base_path [String] Resource collection path
            # @param resource_class [Class] Document backed resource class
            def self.logs(app, base_path, resource_class)
                # GET /base/:id/logs
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
                app.get "#{base_path}/:id/logs", :ensure_resource_access => resource_class do
                    log_file = File.join(LOG_LOCATION, APP_NAME, "#{params[:id]}.log")
                    return internal_error('Log file not found', 404) unless File.exist?(log_file)

                    all_logs = params.key?(:all)
                    page     = [params.fetch(:page, 1).to_i, 1].max
                    per_page = [params.fetch(:per_page, 100).to_i, 1].max
                    logs     = get_logs_page(log_file, page, per_page, all_logs)

                    status 200
                    body process_response(logs)
                end
            end

            def self.registered(app)
                app.define_singleton_method(:logs) do |base_path, resource_class|
                    LogController.logs(self, base_path, resource_class)
                end
            end

        end

    end

end
