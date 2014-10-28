# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'opennebula/x509_auth'

module X509CloudAuth
    def do_auth(env, params={})
        # For https, the web service should be set to include the user cert in the environment.
        cert_line   = env['HTTP_SSL_CLIENT_CERT']
        cert_line   = nil if cert_line == '(null)' # For Apache mod_ssl
        chain_index = 0

        # Use the https credentials for authentication
        unless cert_line.nil?
            begin
                m      = cert_line.match(/(-+BEGIN CERTIFICATE-+)([^-]*)(-+END CERTIFICATE-+)/)
                cert_s = "#{m[1]}#{m[2].gsub(' ',"\n")}#{m[3]}"
                cert   = OpenSSL::X509::Certificate.new(cert_s)
            rescue
                raise "Could not create X509 certificate from " + cert_line
            end

            # Password should be DN with whitespace removed.
            username = get_username(OpenNebula::X509Auth.escape_dn(
                cert.subject.to_s))

            # For proxy certificates look at the issuer
            username = get_username(OpenNebula::X509Auth.escape_dn(
                cert.issuer.to_s)) if username.nil?

            return username if username

            cert_line   = env["HTTP_SSL_CLIENT_CERT_CHAIN_#{chain_index}"]
            cert_line   = nil if cert_line == '(null)' # For Apache mod_ssl
            chain_index += 1
        else
            raise "Username not found in certificate chain "
        end

        return nil
    end
end
