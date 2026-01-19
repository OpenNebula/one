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

module OneFormServer

    # App routes configuration
    module AppRoutes

        def self.registered(app)
            # Helpers and modules
            app.helpers  ResponseHelper
            app.register AuthController
            app.register ErrorController

            app.configure do
                lcm = OneForm::ProvisionLCM.new(app.settings.cloud_auth)
                app.set :lcm, lcm

                # Automatically synchronize OneForm drivers during startup
                OneForm::Driver.sync

                # Create the onprem provider by default when server starts
                begin
                    client = app.settings.cloud_auth.client('oneadmin')
                    pool   = OneForm::ProviderDocumentPool.new(client)
                    rc     = pool.ensure_type!('onprem', { 'connection' => {} })

                    raise rc if OpenNebula.is_error?(rc)
                rescue StandardError => e
                    Log.error("Server startup failed ensuring onprem provider: #{e.message}")
                    exit(1)
                end
            end

            app.before do
                @lcm = app.settings.lcm
                content_type :json
            end

            # Routes namespaces
            app.register Sinatra::Namespace
            app.namespace '/api/v1' do
                get '/' do
                    'Welcome to the OpenNebula Formation Server v1'
                end

                register DriverController
                register ProvidersController
                register ProvisionsController
                register LogController
            end
        end

    end

end
