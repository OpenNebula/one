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

require 'openssl'
require 'base64'
require 'fileutils'
require 'yaml'

# X509 authentication class. It can be used as a driver for auth_mad
# as auth method is defined. It also holds some helper methods to be used
# by oneauth command
class X509Auth
    ###########################################################################
    #Constants with paths to relevant files and defaults
    ###########################################################################
    if !ENV["ONE_LOCATION"]
        ETC_LOCATION      = "/etc/one"
    else
        ETC_LOCATION      = ENV["ONE_LOCATION"] + "/etc"
    end

    LOGIN_PATH = ENV['HOME']+'/.one/one_x509'

    X509_AUTH_CONF_PATH = ETC_LOCATION + "/auth/x509_auth.conf"

    X509_DEFAULTS = {
        :ca_dir   => ETC_LOCATION + "/auth/certificates"
    }

    ###########################################################################
    # Initialize x509Auth object
    #
    # @param [Hash] default options for path
    # @option options [String] :certs_pem
    #         cert chain array in colon-separated pem format
    # @option options [String] :key_pem
    #         key in pem format
    # @option options [String] :ca_dir
    #         directory of trusted CA's. Needed for auth method, not for login.
    def initialize(options={})
        @options ||= X509_DEFAULTS
        @options.merge!(options)

        load_options(X509_AUTH_CONF_PATH)

        @cert_chain = @options[:certs_pem].collect do |cert_pem|
            OpenSSL::X509::Certificate.new(cert_pem)
        end

        if @options[:key_pem]
            @key  = OpenSSL::PKey::RSA.new(@options[:key_pem])
        end
    end

    ###########################################################################
    # Client side
    ###########################################################################

    # Creates the login file for x509 authentication at ~/.one/one_x509.
    # By default it is valid as long as the certificate is valid. It can
    # be changed to any number of seconds with expire parameter (sec.)
    def login(user, expire=0)
        write_login(login_token(user,expire))
    end

    # Returns a valid password string to create a user using this auth driver.
    # In this case the dn of the user certificate.
    def password
        @cert_chain[0].subject.to_s.delete("\s")
    end

    # Generates a login token in the form:
    # user_name:x509:user_name:time_expires:cert_chain
    #   - user_name:time_expires is encrypted with the user certificate
    #   - user_name:time_expires:cert_chain is base64 encoded
    def login_token(user, expire)
        if expire != 0
            expires = Time.now.to_i + expire.to_i
        else
            expires = @cert_chain[0].not_after.to_i
        end

        text_to_sign = "#{user}:#{expires}"
        signed_text  = encrypt(text_to_sign)

        certs_pem = @cert_chain.collect{|cert| cert.to_pem}.join(":")

        token     = "#{signed_text}:#{certs_pem}"
        token64   = Base64::encode64(token).strip.delete("\n")

        login_out = "#{user}:#{token64}"

        login_out
    end

    ###########################################################################
    # Server side
    ###########################################################################
    # auth method for auth_mad
    def authenticate(user, pass, signed_text)
        begin
            # Decryption demonstrates that the user posessed the private key.
            _user, expires = decrypt(signed_text).split(':')

            return "User name missmatch" if user != _user

            return "x509 proxy expired"  if Time.now.to_i >= expires.to_i

            # Some DN in the chain must match a DN in the password
            dn_ok = @cert_chain.each do |cert|
                if pass.split('|').include?(cert.subject.to_s.delete("\s"))
                    break true
                end
            end

            unless dn_ok == true
                return "Certificate subject missmatch"
            end

            validate

            return true
        rescue => e
            return e.message
        end
    end

private
    # Writes a login_txt to the login file as defined in LOGIN_PATH
    # constant
    def write_login(login_txt)
        # Inits login file path and creates ~/.one directory if needed
        # Set instance variables
        login_dir = File.dirname(LOGIN_PATH)

        begin
            FileUtils.mkdir_p(login_dir)
        rescue Errno::EEXIST
        end

        file = File.open(LOGIN_PATH, "w")
        file.write(login_txt)
        file.close

        File.chmod(0600,LOGIN_PATH)
    end

    # Load class options form a configuration file (yaml syntax)
    def load_options(conf_file)
        if File.readable?(conf_file)
            conf_txt = File.read(conf_file)
            conf_opt = YAML::load(conf_txt)

            @options.merge!(conf_opt) if conf_opt != false
        end
    end

    ###########################################################################
    #                       Methods to encrpyt/decrypt keys
    ###########################################################################
    # Encrypts data with the private key of the user and returns
    # base 64 encoded output in a single line
    def encrypt(data)
        return nil if !@key
        Base64::encode64(@key.private_encrypt(data)).delete("\n").strip
    end

    # Decrypts base 64 encoded data with pub_key (public key)
    def decrypt(data)
        @cert_chain[0].public_key.public_decrypt(Base64::decode64(data))
    end

    ###########################################################################
    # Validate the user certificate
    ###########################################################################
    def validate
        now    = Time.now
        failed = "Could not validate user credentials: "

        # Check start time and end time of certificates
        @cert_chain.each do |cert|
            if cert.not_before > now || cert.not_after < now
                raise failed +  "Certificate not valid. Current time is " +
                  now.localtime.to_s + "."
            end
        end

        begin
            # Validate the proxy certifcates
            signee = @cert_chain[0]

            @cert_chain[1..-1].each do |cert|
                if !((signee.issuer.to_s == cert.subject.to_s) &&
                     (signee.verify(cert.public_key)))
                    raise  failed + signee.subject.to_s + " with issuer " +
                           signee.issuer.to_s + " was not verified by " +
                           cert.subject.to_s + "."
                end
                signee = cert
            end

            # Validate the End Entity certificate
            if !@options[:ca_dir]
                raise failed + "No certifcate authority directory was specified."
            end

            begin
                ca_hash = signee.issuer.hash.to_s(16)
                ca_path = @options[:ca_dir] + '/' + ca_hash + '.0'

                ca_cert = OpenSSL::X509::Certificate.new(File.read(ca_path))

                if !((signee.issuer.to_s == ca_cert.subject.to_s) &&
                     (signee.verify(ca_cert.public_key)))
                    raise  failed + signee.subject.to_s + " with issuer " +
                           signee.issuer.to_s + " was not verified by " +
                           ca_cert.subject.to_s + "."
                end

                signee = ca_cert
            end while ca_cert.subject.to_s != ca_cert.issuer.to_s
        rescue
            raise
        end
    end
end
