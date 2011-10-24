# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'server_cipher_auth'

class CloudAuth
    AUTH_MODULES = {
        "basic" => 'BasicCloudAuth',
        "ec2"   => 'EC2CloudAuth',
        "x509"  => 'X509CloudAuth'
    }

    attr_reader :client, :token

    def initialize(conf)
        @conf = conf

        if AUTH_MODULES.include?(@conf[:auth])
            require 'CloudAuth/' + AUTH_MODULES[@conf[:auth]]
            extend Kernel.const_get(AUTH_MODULES[@conf[:auth]])
        else
            raise "Auth module not specified"
        end

        @server_auth = ServerCipherAuth.new
    end

    protected

    def get_password(username)
        token = @server_auth.login_token
        @oneadmin_client ||= OpenNebula::Client.new(token, @conf[:one_xmlrpc])

        if @user_pool.nil?
            @user_pool ||= OpenNebula::UserPool.new(@oneadmin_client)

            rc = @user_pool.info
            if OpenNebula.is_error?(rc)
                raise rc.message
            end
        end

        return @user_pool["USER[NAME=\"#{username}\"]/PASSWORD"]
    end
end