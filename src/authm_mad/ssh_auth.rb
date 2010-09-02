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


require 'pp'
require 'openssl'
require 'base64'
require 'fileutils'

# SSH key authentication class. It can be used as a driver for auth_mad
# as auth method is defined. It also holds some helper methods to be used
# by oneauth command
class SshAuth
    # Reads id_rsa file from user .ssh directory
    def get_priv_key
        path=ENV['HOME']+'/.ssh/id_rsa'
        File.read(path)
    end
    
    # Returns an opened file object to ~/.one/one_ssh
    def get_proxy_file
        proxy_dir=ENV['HOME']+'/.one'
        
        # Creates ~/.one directory if it does not exist
        begin
            FileUtils.mkdir_p(proxy_dir)
        rescue Errno::EEXIST
        end
        
        File.open(proxy_dir+'/one_ssh', "w")
    end
    
    # Encrypts data with the private key of the user and returns
    # base 64 encoded output
    def encrypt(data)
        rsa=OpenSSL::PKey::RSA.new(get_priv_key)
        # base 64 output is joined into a single line as opennebula
        # ascii protocol ends messages with newline
        Base64::encode64(rsa.private_encrypt(data)).gsub!(/\n/, '').strip
    end
    
    # Decrypts base 64 encoded data with pub_key (public key)
    def decrypt(data, pub_key)
        rsa=OpenSSL::PKey::RSA.new(Base64::decode64(pub_key))
        rsa.public_decrypt(Base64::decode64(data))
    end
    
    # Gets public key from user's private key file. ssh private keys are
    # stored in a format not compatible with openssl. This method
    # will be used by oneauth so users can extrar their public keys
    # that the administrator then can add to the database
    def extract_public_key
        key=OpenSSL::PKey::RSA.new(get_priv_key)
        public_key=key.public_key.to_pem.split("\n")
        # gets rid of "---- BEGIN/END RSA PUBLIC KEY ----" lines and
        # joins resuklt into a single line
        public_key.reject {|l| l.match(/RSA PUBLIC KEY/) }.join('')
    end
    
    # Creates the login file for ssh authentication at ~/.one/one_ssh.
    # By default it is valid for 1 hour but it can be changed to any number
    # of seconds with expire parameter (in seconds)
    def login(user, expire=3600)
        time=Time.now.to_i+expire
        proxy_text="#{user}:#{time}"
        proxy_crypted=encrypt(proxy_text)
        proxy="#{user}:plain:#{proxy_crypted}"
        file=get_proxy_file
        file.write(proxy)
        file.close
        
        # Help string
        puts "export ONE_AUTH=#{ENV['HOME']}/.one/one_ssh"
        
        proxy_crypted
    end
    
    # auth method for auth_mad
    def auth(user_id, user, password, token)
        begin
            decrypted=decrypt(token, password)
        
            username, time=decrypted.split(':')
            
            pp [username, time]
        
            if user==username
                if Time.now.to_i>=time.to_i
                    "proxy expired, login again"
                else
                    true
                end
            else
                "invalid credentials"
            end
        rescue
            "error"
        end
    end
    
end
