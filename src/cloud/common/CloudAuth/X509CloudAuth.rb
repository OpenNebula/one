module X509CloudAuth
    # TBD Adapt to the new CloudAuth system
    
    # Gets the username associated with a password
    # password:: _String_ the password
    # [return] _Hash_ with the username
    def get_username(password)
        @user_pool.info
        #STDERR.puts 'the password is ' + password
        #STDERR.puts @user_pool["User[PASSWORD=\"#{password}\"]"]
        username = @user_pool["User[PASSWORD=\"#{password}\"]/NAME"]
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
        puts("The password is " + password)
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
                cert_array = cert_array[2..-3]
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
            msg << chain_dn
            raise msg
        end

        auth = ServerAuth.new

        login = auth.login_token(username, subjectname, 300)

        STDERR.puts login

        return one_client_user("dummy", login)
    end
end