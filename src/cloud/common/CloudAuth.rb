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
    # These are the authentication methods for the user requests
    AUTH_MODULES = {
        "basic"    => 'BasicCloudAuth',
        "sunstone" => 'SunstoneCloudAuth' ,
        "ec2"      => 'EC2CloudAuth',
        "x509"     => 'X509CloudAuth'
    }

    # These are the authentication modules for the OpenNebula requests
    # Each entry is an array with the filename  for require and class name
    # to instantiate the object.
    AUTH_CORE_MODULES = {
       "cipher" => [ 'server_cipher_auth', 'ServerCipherAuth' ],
       "x509"   => [ 'server_x509_auth',   'ServerX509Auth' ]
    } 

    # Default interval for timestamps. Tokens will be generated using the same
    # timestamp for this interval of time.
    EXPIRE_DELTA = 36000

    # Tokens will be generated if time > EXPIRE_TIME - EXPIRE_MARGIN
    EXPIRE_MARGIN = 300

    attr_reader :client, :token

    # conf a hash with the configuration attributes as symbols
    def initialize(conf)
        @conf = conf

        @token_expiration_delta = @conf[:token_expiration_delta] || EXPIRE_DELTA
        @token_expiration_time  = Time.now.to_i + @token_expiration_delta

        if AUTH_MODULES.include?(@conf[:auth])
            require 'CloudAuth/' + AUTH_MODULES[@conf[:auth]]
            extend Kernel.const_get(AUTH_MODULES[@conf[:auth]])
        else
            raise "Auth module not specified"
        end


        if AUTH_CORE_MODULES.include?(@conf[:core_auth])
            core_auth = AUTH_CORE_MODULES[@conf[:core_auth]]
        else
            core_auth =AUTH_CORE_MODULES["cipher"]
        end
         
        begin
            require core_auth[0]
            @server_auth = Kernel.const_get(core_auth[1]).new_client
        rescue => e
            raise e.message
        end
    end

    def client(username)
        token = @server_auth.login_token(expiration_time,username) 
        Client.new(token,@conf[:one_xmlrpc])
    end

    protected

    def expiration_time
        time_now = Time.now.to_i

        expire = time_now - @token_expiration_time
        if expire < EXPIRE_MARGIN
            @token_expiration_time = time_now + @token_expiration_delta
        end

        @token_expiration_time
    end

    def get_password(username)
        token = @server_auth.login_token(expiration_time)
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