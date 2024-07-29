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
require 'yaml'

module OpenNebula; end

# X509 authentication class. It can be used as a driver for auth_mad
# as auth method is defined. It also holds some helper methods to be used
# by oneauth command
class OpenNebula::X509Auth
    ###########################################################################
    #Constants with paths to relevant files and defaults
    ###########################################################################
    if !ENV["ONE_LOCATION"]
        ETC_LOCATION = "/etc/one"
    else
        ETC_LOCATION = ENV["ONE_LOCATION"] + "/etc"
    end

    X509_AUTH_CONF_PATH = ETC_LOCATION + "/auth/x509_auth.conf"

    X509_DEFAULTS = {
        :ca_dir   => ETC_LOCATION + "/auth/certificates"
    }

    def self.escape_dn(dn)
        dn.gsub(/\s/) { |s| "\\"+s[0].ord.to_s(16) }
    end

    def self.unescape_dn(dn)
        dn.gsub(/\\[0-9a-f]{2}/) { |s| s[1,2].to_i(16).chr }
    end

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

    # Returns a valid password string to create a user using this auth driver.
    # In this case the dn of the user certificate.
    def password
        self.class.escape_dn(@cert_chain[0].subject.to_s)
    end

    # Generates a login token in the form:
    # user_name:x509:user_name:time_expires:cert_chain
    #   - user_name:time_expires is encrypted with the user certificate
    #   - user_name:time_expires:cert_chain is base64 encoded.
    # By default it is valid as long as the certificate is valid. It can
    # be changed to any number of seconds with expire parameter (sec.)
    def login_token(user, expire=0)
        if expire != 0
            expires = Time.now.to_i + expire.to_i
        else
            expires = @cert_chain[0].not_after.to_i
        end

        text_to_sign = "#{user}:#{expires}"
        signed_text  = encrypt(text_to_sign)

        certs_pem = @cert_chain.collect{|cert| cert.to_pem}.join(":")
        token     = "#{signed_text}:#{certs_pem}"

        return Base64::encode64(token).strip.delete("\n")
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
                if pass.split('|').include?(
                        self.class.escape_dn(cert.subject.to_s))
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
    # Load class options form a configuration file (yaml syntax)
    def load_options(conf_file)
        if File.readable?(conf_file)
            conf_txt = File.read(conf_file)
            conf_opt = YAML::load(conf_txt)

            @options.merge!(conf_opt) if conf_opt
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

        # Check start time and end time of certificates
        @cert_chain.each do |cert|
            if cert.not_before > now || cert.not_after < now
                raise "Certificate not valid. Current time is #{now.localtime}"
            end
        end

        begin
            # Validate the proxy certifcates
            signee = @cert_chain[0]

            check_crl(signee)

            @cert_chain[1..-1].each do |cert|
                if !((signee.issuer.to_s == cert.subject.to_s) &&
                     (signee.verify(cert.public_key)))
                    raise "#{signee.subject} with issuer #{signee.issuer} " \
                          "was not verified by #{cert.subject}"
                end

                signee = cert
            end

            # Validate the End Entity certificate
            if !@options[:ca_dir]
                raise "No certifcate authority directory was specified."
            end

            begin
                ca_hash = signee.issuer.hash.to_s(16)
                ca_path = @options[:ca_dir] + '/' + ca_hash + '.0'

                ca_cert = OpenSSL::X509::Certificate.new(File.read(ca_path))

                if !((signee.issuer.to_s == ca_cert.subject.to_s) &&
                     (signee.verify(ca_cert.public_key)))
                    raise "#{signee.subject} with issuer #{signee.issuer} " \
                          "was not verified by #{ca_cert.subject}"
                end

                signee = ca_cert
            end while ca_cert.subject.to_s != ca_cert.issuer.to_s
        rescue
            raise
        end
    end

    def check_crl(signee)
        failed = "Could not validate user credentials: "

        ca_hash = signee.issuer.hash.to_s(16)
        ca_path = @options[:ca_dir] + '/' + ca_hash + '.0'

        crl_path = @options[:ca_dir] + '/' + ca_hash + '.r0'

        if !File.exist?(crl_path)
            if @options[:check_crl]
                raise "#{failed} CRL file #{crl_path} does not exist"
            else
                return
            end
        end

        ca_cert = OpenSSL::X509::Certificate.new( File.read(ca_path) )
        crl_cert = OpenSSL::X509::CRL.new( File.read(crl_path) )

        # First verify the CRL itself with its signer
        unless crl_cert.verify( ca_cert.public_key ) then
            raise "#{failed} CRL is not verified by its Signer"
        end

        # Extract the list of revoked certificates from the CRL
        rc_array = crl_cert.revoked

        # Loop over the list and compare with the target personal
        # certificate
        rc_array.each do |e|
            if e.serial.eql?(signee.serial) then
                raise "#{failed} #{signee.subject} is found in the " \
                      "CRL, i.e. it is revoked"
            end
        end
    end
end
