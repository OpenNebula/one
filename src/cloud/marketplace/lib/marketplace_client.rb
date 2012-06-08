require 'uri'
require 'cloud/CloudClient'

module Market
    class Client
        def initialize(username, password, url)
            @username = username || 'admin'
            @password = password || 'password'
            url ||= 'http://localhost:9292/'

            @uri = URI.parse(url)
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

            res = CloudClient::http_start(@uri, @timeout) do |http|
                http.request(req)
            end

            res
        end
    end


    class ApplianceClient < Client
        def initialize(user, password, url)
            super(user, password, url)
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
end