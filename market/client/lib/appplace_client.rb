require 'uri'
require 'CloudClient'

module Market
    class Client
        def initialize(username, password, url, user_agent="Ruby")
            @username = username
            @password = password

            url ||= 'http://marketplace.c12g.com/'
            @uri = URI.parse(url)

            @user_agent = "OpenNebula #{CloudClient::VERSION} (#{user_agent})"
        end

        def get(path)
            req = Net::HTTP::Get.new(path)

            do_request(req)
        end

        def post(path, body)
            req = Net::HTTP::Post.new(path)
            req.body = body

            do_request(req)
        end

        private

        def do_request(req)
            if @username && @password
                req.basic_auth @username, @password
            end

            req['User-Agent'] = @user_agent

            res = CloudClient::http_start(@uri, @timeout) do |http|
                http.request(req)
            end

            res
        end
    end


    class ApplianceClient < Client
        def initialize(user, password, url, agent)
            super(user, password, url, agent)
        end

        def list
            get("/appliance")
        end

        def create(body)
            post("/appliance", body)
        end

        def show(id)
            get("/appliance/#{id}")
        end
    end


    class UserClient < Client
        def initialize(user, password, url, agent)
            super(user, password, url, agent)
        end

        def list
            get("/user")
        end

        def create(body)
            post("/user", body)
        end

        def show(id)
            get("/user/#{id}")
        end
    end
end