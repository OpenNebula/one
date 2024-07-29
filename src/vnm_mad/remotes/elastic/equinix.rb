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
require 'net/http'
require 'uri'
require 'json'

ENDPOINT = 'https://api.equinix.com/metal/v1'

# Class covering Equinix client
class Equinix

    def initialize(token)
        @eq_token    = token
        @eq_endpoint = ENDPOINT
    end

    def api_call(path, type = Net::HTTP::Get, data = {})
        uri = URI.parse(@eq_endpoint + path)
        https = Net::HTTP.new(uri.host, uri.port)
        https.use_ssl = true
        req = type.new(uri.path)
        req['Content-Type'] = 'application/json'
        req['X-Auth-Token'] = @eq_token
        req.body = data.to_json unless data.empty?

        return https.request(req)
    end

end
