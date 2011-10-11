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

module X509CloudAuth
    # Gets the username associated with a password
    # password:: _String_ the password
    # [return] _Hash_ with the username
    def get_username(password)
        @oneadmin_client ||= OpenNebula::Client.new(nil, @conf[:one_xmlrpc])

        if @user_pool.nil?
            @user_pool ||= OpenNebula::UserPool.new(@oneadmin_client)

            rc = @user_pool.info
            if OpenNebula.is_error?(rc)
                raise rc.message
            end
        end

        username = @user_pool["USER[PASSWORD=\"#{password}\"]/NAME"]
        return username if (username != nil)
     
        # Check if the DN is part of a |-separted multi-DN password
        user_elts = Array.new
        @user_pool.each {|e| user_elts << e['PASSWORD']}
        multiple_users = user_elts.select {|e| e=~ /\|/ }
        matched = nil
        multiple_users.each do |e|
            e.to_s.split('|').each do |w|
                if (w == password)
                    matched=e
                    break
                end
            end
            break if matched
        end
        if matched
            password = matched.to_s
        end

        return @user_pool["USER[PASSWORD=\"#{password}\"]/NAME"]
    end

    def auth(env, params={})
        failed = 'Authentication failed. '
        # For https, the web service should be set to include the user cert in the environment.
        cert_line = env['HTTP_SSL_CLIENT_CERT']
        cert_line = nil if cert_line == '(null)' # For Apache mod_ssl

        #  Use the https credentials for authentication
        require 'server_auth'
        while cert_line
            begin
                cert_array=cert_line.scan(/([^\s]*)\s/)
                cert_array = cert_array[2..-2]
                cert_array.unshift('-----BEGIN CERTIFICATE-----')
                cert_array.push('-----END CERTIFICATE-----')
                cert_pem = cert_array.join("\n")
                cert = OpenSSL::X509::Certificate.new(cert_pem)
            rescue
                raise failed + "Could not create X509 certificate from " + cert_line
            end

            # Password should be DN with whitespace removed.
            subjectname = cert.subject.to_s.delete("\s")
            begin
                username = get_username(subjectname)
            rescue
                username = nil
            end

            break if username

            chain_dn = (!chain_dn ? "" : chain_dn) + "\n" + subjectname
            chain_index = !chain_index ? 0 : chain_index + 1
            cert_line = env["HTTP_SSL_CLIENT_CERT_CHAIN_#{chain_index}"]
            cert_line = nil if cert_line == '(null)' # For Apache mod_ssl
        end

        if !cert_line
            msg = ""
            msg << failed
            msg << "Username not found in certificate chain "
            msg << chain_dn if chain_dn
            raise msg
        end

        auth = ServerAuth.new

        @token = auth.login_token(username, subjectname, 300)
        @client = Client.new(@token, @conf[:one_xmlrpc])

        return nil
    end
end
