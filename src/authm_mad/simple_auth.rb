# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

# Password authentication module. This one just compares stored password
# with the token sent by the client.
class SimpleAuth
    # Method called by authentication driver. It should awnser true if
    # successful or a string with the error message if failure. All
    # parameters are strings extracted from the authorization message.
    #
    # * user_id: OpenNebula user identifier
    # * user: user name
    # * password: password stored in OpenNebula dabatase
    # * token: password sent by the client trying to connect
    def auth(user_id, user, password, token)
        auth=(password==token)
        auth="Invalid credentials" if auth!=true or token=='-'
        auth
    end
end


