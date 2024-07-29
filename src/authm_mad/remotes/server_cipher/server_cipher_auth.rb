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
require 'digest/sha2'

require 'base64'
require 'fileutils'

module OpenNebula; end

# Server authentication class. This method can be used by OpenNebula services
# to let access authenticated users by other means. It is based on OpenSSL
# symmetric ciphers
class OpenNebula::ServerCipherAuth
    ###########################################################################
    #Constants with paths to relevant files and defaults
    ###########################################################################

    CIPHER = "aes-256-cbc"

    ###########################################################################

    def initialize(srv_user, srv_passwd)
        @srv_user   = srv_user
        @srv_passwd = srv_passwd

        if !srv_passwd.empty?
            # truncate token to 32-bytes for Ruby >= 2.4
            @key = Digest::SHA256.hexdigest(@srv_passwd)[0..31]
            @iv = @key[0..15]
          else
            @key = ""
            @iv = ""
        end

        @cipher = OpenSSL::Cipher.new(CIPHER)
    end

    ###########################################################################
    # Client side
    ###########################################################################

    # Creates a ServerCipher for client usage
    def self.new_client(srv_user=nil, srv_passwd=nil)
        if ( srv_user == nil || srv_passwd == nil )
            begin
                if ENV["ONE_CIPHER_AUTH"] and !ENV["ONE_CIPHER_AUTH"].empty?
                    one_auth = File.read(ENV["ONE_CIPHER_AUTH"])
                else
                    raise "ONE_CIPHER_AUTH environment variable not set"
                end

                one_auth.rstrip!

                rc =  one_auth.match(/(.*?):(.*)/)

                if rc.nil?
                    raise "Bad format for one_auth token (<user>:<passwd>)"
                else
                    srv_user   = rc[1]
                    srv_passwd = rc[2]
                end
            rescue => e
                raise e.message
            end
        end

        self.new(srv_user, srv_passwd)
    end

    # Generates a login token in the form:
    #   - server_user:target_user:time_expires
    # The token is then encrypted with the contents of one_auth
    def login_token(expire, target_user=nil)
        target_user ||= @srv_user
        token_txt   =   "#{@srv_user}:#{target_user}:#{expire}"

        token   = encrypt(token_txt)
        token64 = Base64::encode64(token).strip.delete("\n")

        return "#{@srv_user}:#{target_user}:#{token64}"
    end

    # Returns a valid password string to create a user using this auth driver
    def password
        return @srv_passwd
    end

    ###########################################################################
    # Driver side
    ###########################################################################

    # Creates a ServerCipher for driver usage
    def self.new_driver()
        self.new("","")
    end

    # auth method for auth_mad
    def authenticate(srv_user, srv_pass, signed_text)
        begin
            # truncate token to 32-bytes for Ruby >= 2.4
            @key = srv_pass[0..31]
            @iv = srv_pass[0..15]

            token_array = decrypt(signed_text).split(':')

            s_user  = token_array[0]
            expires = token_array[-1]

            return "User name missmatch" if s_user != srv_user

            return "login token expired" if Time.now.to_i >= expires.to_i

            return true
        rescue => e
            return e.message
        end
    end

    private

    def encrypt(data)
        @cipher.encrypt
        @cipher.key = @key
        @cipher.iv = @iv
        rc = @cipher.update(data)
        rc << @cipher.final

        return rc
    end

    def decrypt(data)
        @cipher.decrypt
        @cipher.key = @key
        @cipher.iv = @iv
        rc = @cipher.update(Base64::decode64(data))
        rc << @cipher.final

        return rc
    end
end

