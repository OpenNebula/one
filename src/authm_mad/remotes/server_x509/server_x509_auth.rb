# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'openssl'
require 'base64'
require 'fileutils'

require 'opennebula/x509_auth'

module OpenNebula; end

# Server authentication class. This authmethod can be used by opennebula services
# to let access authenticated users by other means. It is based on x509 server
# certificates
class OpenNebula::ServerX509Auth < OpenNebula::X509Auth
    ###########################################################################
    #Constants with paths to relevant files and defaults
    ###########################################################################

    SERVER_AUTH_CONF_PATH = ETC_LOCATION + "/auth/server_x509_auth.conf"

    SERVER_DEFAULTS = {
        :one_cert => ETC_LOCATION + "/auth/cert.pem",
        :one_key  => ETC_LOCATION + "/auth/key.pem"
    }

    ###########################################################################

    def initialize()
        @options = SERVER_DEFAULTS

        load_options(SERVER_AUTH_CONF_PATH)

        begin
            certs = [ File.read(@options[:one_cert]) ]
            key   =   File.read(@options[:one_key])

            super(:certs_pem => certs, :key_pem => key)
        rescue
            raise
        end

        if @options[:srv_user] == nil || @options[:srv_user].empty?
           raise "User for x509 server not defined"
        end
    end

    ###########################################################################
    # Client side
    ###########################################################################

    # Creates a ServerCipher for client and driver sage
    class << OpenNebula::ServerX509Auth
        alias :new_client :new
        alias :new_driver :new
    end

    # Generates a login token in the form:
    #   - server_user:target_user:time_expires
    def login_token(expire, target_user=nil)
        target_user ||= @options[:srv_user]
        token_txt   =   "#{@options[:srv_user]}:#{target_user}:#{expire}"

        token   = encrypt(token_txt)
        token64 = Base64::encode64(token).strip.delete("\n")

        return "#{@options[:srv_user]}:#{target_user}:#{token64}"
    end

    ###########################################################################
    # Server side
    ###########################################################################

    # auth method for auth_mad
    def authenticate(server_user, server_pass, signed_text)
        begin
            token_array = decrypt(signed_text).split(':')

            s_user  = token_array[0]
            expires = token_array[-1]

            return "Server password missmatch" if server_pass != password

            return "User name missmatch" if ( s_user != server_user ||
                                              s_user != @options[:srv_user] )

            return "login token expired" if Time.now.to_i >= expires.to_i

            return true
        rescue => e
            return e.message
        end
    end
end
