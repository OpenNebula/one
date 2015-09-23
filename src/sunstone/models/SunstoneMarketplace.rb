# ---------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                  #
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

require 'marketplace/marketplace_client'

module SunstoneMarketplace
    USER_AGENT = "Sunstone"

    def get_appliance_pool
        client = Market::ApplianceClient.new(
                    @config[:marketplace_username],
                    @config[:marketplace_password],
                    @config[:marketplace_url],
                    USER_AGENT)

        response = client.list

        if CloudClient::is_error?(response)
            error = Error.new(response.to_s)
            return [response.code.to_i, error.to_json]
        end

        [200, response.body]
    end

    def get_appliance(app_id)
        client = Market::ApplianceClient.new(
                    @config[:marketplace_username],
                    @config[:marketplace_password],
                    @config[:marketplace_url],
                    USER_AGENT)

        response = client.show(app_id)

        if CloudClient::is_error?(response)
            error = Error.new(response.to_s)
            return [response.code.to_i, error.to_json]
        end

        [200, response.body]
    end
end
