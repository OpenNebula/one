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
require 'base64'
require 'fileutils'

# X509 authentication class. It can be used as a driver for auth_mad
# as auth method is defined. It also holds some helper methods to be used
# by oneauth command
class X509Auth

    # Initialize x509Auth object
    #
    # @param [Hash] default options for path
    # @option options [String] :cert public cert for the user
    # @option options [String] :key private key for the user
    def initialize(options={})
        @options={
            :cert => nil,
            :key  => nil 
        }.merge!(options)

        @cert = OpenSSL::X509::Certificate.new(@options[:cert])
        @dn   = @cert.subject.to_s

        if @options[:key]
            @key  = OpenSSL::PKey::RSA.new(@options[:key])
        end            
    end

    ###########################################################################
    # Client side
    ###########################################################################

    # Creates the login file for x509 authentication at ~/.one/one_x509.
    # By default it is valid for 1 hour but it can be changed to any number
    # of seconds with expire parameter (in seconds)
    def login(user, expire=3600)
        # Init proxy file path and creates ~/.one directory if needed
        # Set instance variables
        proxy_dir=ENV['HOME']+'/.one'
        
        begin
            FileUtils.mkdir_p(proxy_dir)
        rescue Errno::EEXIST
        end
       
        one_proxy_path = proxy_dir + '/one_x509'

        #Create the x509 proxy
        time = Time.now.to_i+expire
        
        text_to_sign = "#{@dn}:#{time}"
        signed_text  = encrypt(text_to_sign)

	    token   = "#{signed_text}:#{@cert.to_pem}"	
	    token64 = Base64::encode64(token).strip.delete!("\n")

        proxy="#{user}:x509:#{token64}"

        file = File.open(one_proxy_path, "w")

        file.write(proxy)
        
        file.close
 
        # Help string
        puts "export ONE_AUTH=#{ENV['HOME']}/.one/one_x509"
        
        token64
    end
    
    ###########################################################################
    # Server side
    ###########################################################################
    # auth method for auth_mad
    def authenticate(user, pass, token)        
        begin
            plain = decrypt(token)
        
            subject, time_expire = plain.split(':')
            
            if ((subject != @dn) || (subject != pass))
                return "Certificate subject missmatch"
            elsif Time.now.to_i >= time_expire.to_i
                return "x509 proxy expired, login again to renew it"
            end

            return true
        rescue
            return "Can not decrypt security token" 
        end
    end
 
private
    ###########################################################################
    #                       Methods to handle ssh keys
    ###########################################################################
    # Encrypts data with the private key of the user and returns
    # base 64 encoded output in a single line 
    def encrypt(data)
        return nil if !@key
        Base64::encode64(@key.private_encrypt(data)).delete!("\n").strip
    end

    # Decrypts base 64 encoded data with pub_key (public key)
    def decrypt(data)       
        @cert.public_key.public_decrypt(Base64::decode64(data))
    end      
end      
