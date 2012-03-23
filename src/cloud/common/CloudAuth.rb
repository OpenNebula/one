# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'thread'

class CloudAuth
    # These are the authentication methods for the user requests
    AUTH_MODULES = {
        "occi"       => 'OCCICloudAuth',
        "sunstone"   => 'SunstoneCloudAuth' ,
        "ec2"        => 'EC2CloudAuth',
        "x509"       => 'X509CloudAuth',
        "opennebula" => 'OpenNebulaCloudAuth'
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
    # THIS VALUE CANNOT BE LOWER THAN EXPIRE_MARGIN
    EXPIRE_DELTA = 1800

    # Tokens will be generated if time > EXPIRE_TIME - EXPIRE_MARGIN
    EXPIRE_MARGIN = 300

    attr_reader :client, :token, :logger

    # conf a hash with the configuration attributes as symbols
    def initialize(conf, logger=nil)
        @conf   = conf
        @logger = logger

        @lock   = Mutex.new

        @token_expiration_time = Time.now.to_i + EXPIRE_DELTA

        if AUTH_MODULES.include?(@conf[:auth])
            require 'CloudAuth/' + AUTH_MODULES[@conf[:auth]]
            extend Kernel.const_get(AUTH_MODULES[@conf[:auth]])
        else
            raise "Auth module not specified"
        end

        if AUTH_CORE_MODULES.include?(@conf[:core_auth])
            core_auth = AUTH_CORE_MODULES[@conf[:core_auth]]
        else
            core_auth = AUTH_CORE_MODULES["cipher"]
        end

        begin
            require core_auth[0]
            @server_auth = Kernel.const_get(core_auth[1]).new_client
        rescue => e
            raise e.message
        end

        @user_pool = OpenNebula::UserPool.new(client)

        rc = @user_pool.info
        raise rc.message if OpenNebula.is_error?(rc)
    end

    # Generate a new OpenNebula client for the target User, if the username
    # is nil the Client is generated for the server_admin
    # ussername:: _String_ Name of the User
    # [return] _Client_
    def client(username=nil)
        expiration_time = @lock.synchronize {
            time_now = Time.now.to_i
    
            if time_now > @token_expiration_time - EXPIRE_MARGIN
                @token_expiration_time = time_now + EXPIRE_DELTA
            end

            @token_expiration_time
        }

        token = @server_auth.login_token(expiration_time,username)
 
        Client.new(token,@conf[:one_xmlrpc])
    end

    #
    #
    #
    def auth(env, params={})
        username = do_auth(env, params)

        if username.nil?
            update_userpool_cache
            do_auth(env, params)
        else
            username
        end
    end

    protected

    # Gets the password associated with a username
    # username:: _String_ the username
    # driver:: _String_ list of valid drivers for the user, | separated
    # [return] _Hash_ with the username
    def get_password(username, driver=nil)
        xpath = "USER[NAME=\"#{username}\""
        if driver
            xpath << " and (AUTH_DRIVER=\""
            xpath << driver.split('|').join("\" or AUTH_DRIVER=\"") << '")'
        end
        xpath << "]/PASSWORD"

        retrieve_from_userpool(xpath)
    end

    # Gets the username associated with a password
    # password:: _String_ the password
    # [return] _Hash_ with the username
    def get_username(password)
        xpath = "USER[contains(PASSWORD, \"#{password}\")]/NAME"

        retrieve_from_userpool(xpath)
    end

    private

    def retrieve_from_userpool(xpath)
        @lock.synchronize {
            @user_pool[xpath]
        }
    end


    def update_userpool_cache
        oneadmin_client = client

        @lock.synchronize {
            @user_pool = OpenNebula::UserPool.new(oneadmin_client)

            rc = @user_pool.info
            raise rc.message if OpenNebula.is_error?(rc)
        }
    end
end