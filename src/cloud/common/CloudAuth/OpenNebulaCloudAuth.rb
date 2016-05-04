# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

require 'uri'

module OpenNebulaCloudAuth

    #
    #  Do custom initializations for the module
    #
    def initialize_auth
        @conf[:use_user_pool_cache] = false
    end

    #
    #  The Auth method creates an OpenNebula client and tries to get the
    #  user information.
    #
    def do_auth(env, params={})
        auth = Rack::Auth::Basic::Request.new(env)

        if auth.provided? && auth.basic?
            username, password = auth.credentials

            if @conf[:encode_user_password]
                if defined?(URI::Parser)
                    parser=URI::Parser.new
                else
                    parser=URI
                end

                username=parser.escape(username)
                password=parser.escape(password)
            end

            client = OpenNebula::Client.new("#{username}:#{password}", @conf[:one_xmlrpc])
            user   = OpenNebula::User.new_with_id(OpenNebula::User::SELF, client)

            rc = user.info
            if OpenNebula.is_error?(rc)
                if logger
                    logger.error{ "User #{username} could not be authenticated"}
                    logger.error { rc.message }
                end
                return nil
            end

            return username
        end

        return nil
    end
end
