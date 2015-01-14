# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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


require 'pp'
require 'openssl'
require 'base64'
require 'fileutils'

module OpenNebula; end

# SSH key authentication class. It can be used as a driver for auth_mad
# as auth method is defined. It also holds some helper methods to be used
# by oneauth command
class OpenNebula::SshAuth
    # Initialize SshAuth object
    #
    # @param [Hash] default options for path
    # @option options [String] :public_key public key for the user
    # @option options [String] :private_key key private key for the user.
    def initialize(options={})
        @private_key = nil
        @public_key  = nil

        # Initialize the private key
        if options[:private_key]
            begin
                @private_key = File.read(options[:private_key])
            rescue Exception => e
                raise "Cannot read #{options[:private_key]}"
            end

            @private_key_rsa = OpenSSL::PKey::RSA.new(@private_key)
        end

        # Initialize the public key
        if options[:public_key]
            @public_key = options[:public_key]
        elsif @private_key != nil
            # Init ssh keys using private key. public key is extracted in a
            # format compatible with openssl. The public key does not contain
            # "---- BEGIN/END PUBLIC KEY ----" and is in a single line
            @public_key = @private_key_rsa.public_key.to_pem.split("\n")
            @public_key = @public_key.reject {|l| l.match(/PUBLIC KEY/) }.join('')
        end

        if @private_key.nil? && @public_key.nil?
            raise "You have to define at least one of the keys"
        end

        @public_key_rsa = OpenSSL::PKey::RSA.new(Base64::decode64(@public_key))
    end

    # Creates a login token for ssh authentication.
    # By default it is valid for 1 hour but it can be changed to any number
    # of seconds with expire parameter (in seconds)
    def login_token(user, expire=3600)
        expire ||= 3600

        return encrypt("#{user}:#{Time.now.to_i + expire.to_i}")
    end

    # Returns a valid password string to create a user using this auth driver.
    # In this case the ssh public key.
    def password
        @public_key
    end

    # Checks the proxy created with the login method
    def authenticate(user, token)
        begin
            token_plain = decrypt(token)
            _user, time = token_plain.split(':')

            if user == _user
                if Time.now.to_i >= time.to_i
                    return "ssh proxy expired, login again to renew it"
                else
                    return true
                end
            else
                return "invalid credentials"
            end
        rescue
            return "error"
        end
    end

    private

    ###########################################################################
    #                       Methods to handle ssh keys
    ###########################################################################
    # Encrypts data with the private key of the user and returns
    # base 64 encoded output in a single line
    def encrypt(data)
        Base64::encode64(@private_key_rsa.private_encrypt(data)).gsub!(/\n/, '').strip
    end

    # Decrypts base 64 encoded data with pub_key (public key)
    def decrypt(data)
        @public_key_rsa.public_decrypt(Base64::decode64(data))
    end
end
