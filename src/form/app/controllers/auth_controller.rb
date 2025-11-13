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

    # Auth controller
    module AuthController

        def self.registered(app)
            register_cloud_auth(app, ConfigLoader.instance.conf)

            app.before do
                auth = Rack::Auth::Basic::Request.new(request.env)

                if auth.provided? && auth.basic?
                    @cloud_auth = app.settings.cloud_auth
                    @username   = @cloud_auth.auth(request.env)
                    @client     = @cloud_auth.client(@username)

                    error 401, 'Invalid credentials' if @username.nil?
                else
                    error 401, 'A username and password must be provided'
                end
            end
        end

        def self.register_cloud_auth(app, conf)
            require 'CloudAuth'

            ENV['ONE_CIPHER_AUTH'] = ONEFORM_AUTH
            app.set :cloud_auth, CloudAuth.new(conf)
        rescue StandardError => e
            message = "Error initializing authentication system: #{e.message}\n"
            puts message
            exit(1)
        end

    end

end
