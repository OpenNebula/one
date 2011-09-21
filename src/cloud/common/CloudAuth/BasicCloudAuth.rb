module BasicCloudAuth
    def auth(env, params={})
        auth = Rack::Auth::Basic::Request.new(env)

        if auth.provided? && auth.basic?
            username, password = auth.credentials

            if @conf[:hash_passwords]
                password =  Digest::SHA1.hexdigest(password)
            end

            one_pass = get_password(username)
            if one_pass && one_pass == password
                @token = "#{username}:#{password}"
                @client = Client.new(@token, @xmlrpc, false)
                return nil
            else
                return "Authentication failure"
            end
        else
            return "Basic auth not provided"
        end
    end
end