# -------------------------------------------------------------------------- #
# Copyright 2010-2012, C12G Labs S.L.                                        #
#                                                                            #
# Licensed under the C12G Commercial Open-source License (the                #
# "License"); you may not use this file except in compliance                 #
# with the License. You may obtain a copy of the License as part             #
# of the software distribution.                                              #
#                                                                            #
# Unless agreed to in writing, software distributed under the                #
# License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES             #
# OR CONDITIONS OF ANY KIND, either express or implied. See the              #
# License for the specific language governing permissions and                #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

require 'uri'
require 'CloudClient'

module Market
    class Client
        def initialize(username, password, url, user_agent="Ruby")
            @username = username || ENV['APPMARKET_USER']
            @password = password || ENV['APPMARKET_PASSWORD']

            url = url || ENV['APPMARKET_URL'] || 'http://localhost:6242/'
            @uri = URI.parse(url)

            @user_agent = "OpenNebula #{CloudClient::VERSION} (#{user_agent})"
        end

        def get(path)
            req = Net::HTTP::Get.new(path)

            do_request(req)
        end

        def delete(path)
            req = Net::HTTP::Delete.new(path)

            do_request(req)
        end

        def post(path, body)
            req = Net::HTTP::Post.new(path)
            req.body = body

            do_request(req)
        end

        def put(path, body)
            req = Net::HTTP::Put.new(path)
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

        def delete(id)
            super("/appliance/#{id}")
        end

        def update(body, id)
            put("/appliance/#{id}", body)
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

        def delete(id)
            super("/user/#{id}")
        end

        def enable(id)
            post("/user/#{id}/enable", "")
        end

        def update(body, id)
            put("/user/#{id}", body)
        end
    end
end