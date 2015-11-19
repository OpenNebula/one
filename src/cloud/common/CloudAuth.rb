# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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
        "remote"     => 'RemoteCloudAuth',
        "opennebula" => 'OpenNebulaCloudAuth',
        "onegate"    => 'OneGateCloudAuth'
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

    # The user pool will be updated every EXPIRE_USER_CACHE seconds.
    EXPIRE_USER_CACHE = 60

    attr_reader :client, :token, :logger

    # conf a hash with the configuration attributes as symbols
    def initialize(conf, logger=nil)
        @conf   = conf
        @logger = logger

        @lock   = Mutex.new

        @token_expiration_time = Time.now.to_i + EXPIRE_DELTA
        @upool_expiration_time = 0

        @conf[:use_user_pool_cache] = true

        # ------ Load Authorization Modules ------

        if AUTH_MODULES.include?(@conf[:auth])
            require 'CloudAuth/' + AUTH_MODULES[@conf[:auth]]
            extend Kernel.const_get(AUTH_MODULES[@conf[:auth]])

            if Kernel.const_get(AUTH_MODULES[@conf[:auth]]).method_defined?(:initialize_auth)
                initialize_auth
            end
        else
            raise "Auth module not specified"
        end

        if AUTH_CORE_MODULES.include?(@conf[:core_auth])
            core_auth = AUTH_CORE_MODULES[@conf[:core_auth]]
        else
            core_auth = AUTH_CORE_MODULES["cipher"]
        end

        begin
            require "opennebula/#{core_auth[0]}"
            @server_auth = Kernel.const_get(core_auth[1]).new_client
        rescue => e
            raise e.message
        end
    end

    # Generate a new OpenNebula client for the target User, if the username
    # is nil the Client is generated for the server_admin
    # username:: _String_ Name of the User
    # [return] _Client_
    def client(username=nil, endpoint=nil)
        expiration_time = @lock.synchronize {
            time_now = Time.now.to_i

            if time_now > @token_expiration_time - EXPIRE_MARGIN
                @token_expiration_time = time_now + EXPIRE_DELTA
            end

            @token_expiration_time
        }

        token = @server_auth.login_token(expiration_time,username)

        if endpoint and endpoint != "-"
            return OpenNebula::Client.new(token,endpoint)
        else
            return OpenNebula::Client.new(token,@conf[:one_xmlrpc])
        end
    end

    # Authenticate the request. This is a wrapper method that executes the
    # specific do_auth module method. It updates the user cache (if needed)
    # before calling the do_auth module.
    def auth(env, params={})

        update_userpool_cache if @conf[:use_user_pool_cache]

        return do_auth(env, params)
    end

    def logger
        @logger
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

    # Selects the username that matches the driver and evaluates to true the 
    # block passed to the function
    # block:: { |user| true or false }
    # [return] the username or nil
    def select_username(password)
        @lock.synchronize do
            @user_pool.each_with_xpath(
                "USER[contains(PASSWORD, \"#{password}\")]") do |user|
                    return user["NAME"] if yield user, password
            end
        end
    end

    private

    def retrieve_from_userpool(xpath)
        @lock.synchronize {
            @user_pool[xpath]
        }
    end

    # Updates the userpool cache every EXPIRE_USER_CACHE seconds.
    # The expiration time is updated if the cache is successfully updated.
    def update_userpool_cache
        oneadmin_client = client

        @lock.synchronize {
            if Time.now.to_i > @upool_expiration_time
                @logger.info { "Updating user pool cache." }

                @user_pool = OpenNebula::UserPool.new(oneadmin_client)

                rc = @user_pool.info
                raise rc.message if OpenNebula.is_error?(rc)

                @upool_expiration_time = Time.now.to_i + EXPIRE_USER_CACHE
            end
        }
    end
end
