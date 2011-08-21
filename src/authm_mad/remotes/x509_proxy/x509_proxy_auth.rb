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

# Authentication class based on x509 proxy certificate. 
class X509ProxyAuth

    # Initialize x509ProxyAuth object
    #
    # @param [Hash] default options for path
    # @option options [String] :proxy ($X509_PROXY_CERT) 
    #         proxy cert for the user
    # @option options [String] :proxy_cert (nil) 
    #         public cert of a user proxy
    # @option options [String] :user_cert (nil) 
    #         user cert, used to generate the proxy
    # @option options [String] :ca_dir (/etc/grid-security/certificates) 
    #         trusted CA directory. If nil it will not be used to verify
    #         certificates
    def initialize(options={})
        @options={
            :proxy      => ENV['X509_PROXY_CERT']
            :proxy_cert => nil,
            :user_cert  => nil,
            :ca_dir     => "/etc/grid-security/certificates",
        }.merge!(options)

        proxy_cert_txt = @options[:proxy_cert]
        user_cert_txt  = @options[:user_cert]

        #Read certificates from a grid proxy file
        if @options[:proxy] && File.readable?(@options[:proxy])
            proxy = File.read(@options[:proxy])

            rc = proxy.scan(/-+BEGIN CERTIFICATE-+\n([^-]*)\n-+END CERTIFICATE-+/)
            rc.flatten!

            proxy_cert_txt = rc[0]
            user_cert_txt  = rc[1]
 
            rc = proxy.match(/-+BEGIN RSA PRIVATE KEY-+\n([^-]*)\n-+END RSA PRIVATE KEY-+/)

            proxy_key_txt  = rc[1]
        end
        
        if !proxy_cert_txt || !user_cert_txt
            raise "Can not get user or proxy certificates"
        end
        
        @proxy_cert = OpenSSL::X509::Certificate.new(proxy_cert_txt)
        @user_cert  = OpenSSL::X509::Certificate.new(user_cert_txt)
        @dn         = @user_cert.subject.to_s
        
        if proxy_ket_txt
            @poxy_key = OpenSSL::PKey::RSA.new(proxy_key_txt)
        end

        # Load configuration file
        #@auth_conf_path  = ETC_LOCATION+'/auth/auth.conf'
		
        #if File.readable?(@auth_conf_path)
        #     config = File.read(@auth_conf_path)
        #     config = YAML::load(config_data)

        #    @options.merge!(config)
        #end	
    end

    ###########################################################################
    # Client side
    ###########################################################################

    # Creates the login file for x509 authentication at ~/.one/one_x509_proxy.
    def login(user)
        # Init proxy file path and creates ~/.one directory if needed
        # Set instance variables
        proxy_dir=ENV['HOME']+'/.one'
        
        begin
            FileUtils.mkdir_p(proxy_dir)
        rescue Errno::EEXIST
        end
       
        one_proxy_path  = proxy_dir + '/one_x509_proxy'
        
        #Generate token for authentication
        text_to_sign = "#{user}:#{@dn}"
        signed_text  = encrypt(text_to_sign)

	    token   = "#{signed_text}:#{@proxy_cert.to_pem}:#{@user_cert.to_pem}"	
	    token64 = Base64::encode64(token).strip.delete!("\n")

        proxy="#{user}:grid:#{token64}"

        file = File.open(one_proxy_path, "w")

        file.write(proxy)
        
        file.close
 
        # Help string
        puts "export ONE_AUTH=#{ENV['HOME']}/.one/one_grid"
        
        token64
    end
    
    ###########################################################################
    # Server side
    ###########################################################################

    # auth method for auth_mad
    def authenticate(user, pass, token)        
        begin
            validate_chain

            plain = decrypt(token)
        
            _user, subject = plain.split(':')

            if (user != _user)
                return "User name missmatch"
            elsif ((subject != @dn) || (subject != pass))
                return "Certificate subject missmatch"
            end

            return true
        rescue => e
            return e.message
        end

private
    ###########################################################################
    #                       Methods to encrpyt/decrypt keys
    ###########################################################################
    # Encrypts data with the private key of the user and returns
    # base 64 encoded output in a single line 
    def encrypt(data)
        return nil if !@proxy_key
        Base64::encode64(@proxy_key.private_encrypt(data)).delete!("\n").strip
    end

    # Decrypts base 64 encoded data with pub_key (public key)
    def decrypt(data)       
        @proxy_cert.public_key.public_decrypt(Base64::decode64(data))
    end

    ###########################################################################
    # Validates the certificate chain
    ###########################################################################
    def validate_chain
 	    now    = Time.now
        failed = "Could not validate user credentials: "

        # Check start time and end time of proxy
        if @proxy_cert.not_before > now || @proxy_cert.not_after < now
            raise failed +  "Certificate not valid. Current time is " + 
                  now.localtime.to_s + "."
        end
 
	    # Check that the issuer of the proxy is the same user as in the user certificate
        if @proxy_cert.issuer.to_s != @user_cert.subject.to_s
            raise failed + "Proxy with issuer " + @proxy_cert.issuer.to_s + 
                  " does not match user " + @dn
        end
 	
    	# Check that the user signed the proxy
        if !@proxy_cert.verify(@user_cert.public_key)
            raise "Proxy with subject " + @proxy_cert.subject.to_s + 
                  " was not verified by " + @dn + "."
        end
 	
 	    # Check the rest of the certificate chain if specified
        if !@options[:ca_dir]
            return
        end

        begin
            signee = @user_cert
            
            begin
                ca_hash = signee.issuer.hash.to_s(16)
                ca_path = @options[:ca_dir] + '/' + ca_hash + '.0'

                ca_cert = OpenSSL::X509::Certificate.new(File.read(ca_path))
                
                if !((signee.issuer.to_s == ca_cert.subject.to_s) && 
                     (signee.verify(ca_cert.public_key)))
                    raise  failed + signee.subject.to_s + " with issuer " + 
                           signee.issuer.to_s + " was not verified by " + 
                           ca.subject.to_s + "."
                end

                signee = ca_cert
            end while ca_cert.subject.to_s != ca_cert.issuer.to_s
        rescue
            raise  
        end
    end
end
