# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project (OpenNebula.org), C12G Labs        #
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


module RemoteCloudAuth

    # Gets the username associated with a password for users with driver public
    # It just matches the password.
    def get_username(password)
      select_username(password) { |u, p|
        u["AUTH_DRIVER"] == "public" && u["PASSWORD"] == p
      }
    end

    def do_auth(env, params={})
        # For Kerberos, the web service should be set to include the remote_user in the environment.
        remote_user   = env['REMOTE_USER'] || env['HTTP_X_AUTH_USERNAME']
        remote_user   = nil if remote_user == '(null)'

        # Use the https credentials for authentication
        unless remote_user.nil?
            # Password should be REMOTE_USER itself.
            username = get_username(remote_user)
            if username
                return username
            else
                raise "Username not found in local database: " + remote_user
            end
        else
            raise "REMOTE_USER not found in local environment"
        end

        return nil
    end
end
