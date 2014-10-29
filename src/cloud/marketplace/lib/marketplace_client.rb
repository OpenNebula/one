# ---------------------------------------------------------------------------- #
# Copyright 2010-2014, C12G Labs S.L                                           #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

require 'uri'
require 'cloud/CloudClient'

require 'ostruct'

module Market
    class Client
        def initialize(username, password, url, user_agent="Ruby")
            @username = username
            @password = password

            url ||= 'http://marketplace.opennebula.systems/'
            @uri = URI.parse(url)

            @user_agent = "OpenNebula #{CloudClient::VERSION} (#{user_agent})"

            @host = nil
            @port = nil

            if ENV['http_proxy']
                uri_proxy  = URI.parse(ENV['http_proxy'])
                @host = uri_proxy.host
                @port = uri_proxy.port
            end
        end

        def get(path)
            req = Net::HTTP::Proxy(@host, @port)::Get.new(path)
            do_request(req)
        end

        def post(path, body)
            req = Net::HTTP::Proxy(@host, @port)::Post.new(path)
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
end
