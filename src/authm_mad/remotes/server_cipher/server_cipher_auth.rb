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

require 'openssl'
require 'digest/sha1'

require 'base64'
require 'fileutils'

# Server authentication class. This method can be used by OpenNebula services
# to let access authenticated users by other means. It is based on OpenSSL 
# symmetric ciphers
class ServerCipherAuth 
    ###########################################################################
    #Constants with paths to relevant files and defaults
    ###########################################################################

    CIPHER = "aes-256-cbc"

    ###########################################################################

    def initialize(one_auth = nil)
        begin 
            if one_auth  
                auth = one_auth
            elsif ENV["ONE_AUTH"] and !ENV["ONE_AUTH"].empty? and 
                  File.file?(ENV["ONE_AUTH"])
                auth = File.read(ENV["ONE_AUTH"])
            elsif File.file?(ENV["HOME"]+"/.one/one_auth")
                auth = File.read(ENV["HOME"]+"/.one/one_auth")
            else
                raise "ONE_AUTH file not present"
            end
             
            auth.rstrip! 
            
            @server_user, @passwd = auth.split(':')
            @key =  Digest::SHA1.hexdigest(@passwd)
   
            @cipher = OpenSSL::Cipher::Cipher.new(CIPHER)
        rescue
            raise 
        end
    end

    # Generates a login token in the form:
    #   - server_user:target_user:time_expires 
    # The token is then encrypted with the contents of one_auth
    def login_token(expire, target_user=nil)
        target_user ||= @server_user
        token_txt   =   "#{@server_user}:#{target_user}:#{expire}"

        token     = encrypt(token_txt)
        token64   = Base64::encode64(token).strip.delete("\n")

        return "#{@server_user}:#{target_user}:#{token64}"
    end

    # Returns a valid password string to create a user using this auth driver
    def password
        return @passwd
    end

    ###########################################################################
    # Server side
    ###########################################################################
    # auth method for auth_mad
    def authenticate(server_user,server_pass, signed_text)
        begin
            return false,"Server password missmatch" if server_pass != @key
            
            s_user, t_user, expires = decrypt(signed_text).split(':')

            if ( s_user != server_user || s_user != @server_user )
                return false, "User name missmatch" 
            end
           
            if Time.now.to_i >= expires.to_i 
                return false, "login token expired"
            end  

            return true
        rescue => e
            return false, e.message
        end
    end

    private

    def encrypt(data) 
        @cipher.encrypt
        @cipher.key = @key
        
        rc = @cipher.update(data)
        rc << @cipher.final

        return rc
    end

    def decrypt(data) 
        @cipher.decrypt
        @cipher.key = @key
        
        rc = @cipher.update(Base64::decode64(data))
        rc << @cipher.final

        return rc
    end
end
