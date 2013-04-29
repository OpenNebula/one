# -------------------------------------------------------------------------- #
# Copyright 2010-2013, C12G Labs S.L.                                        #
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

APPMARKET_CONF_FILE = ETC_LOCATION + "/sunstone-appmarket.conf"

$: << RUBY_LIB_LOCATION+"/oneapps/market"

require 'appmarket_client'

begin
    appmarket_conf = YAML.load_file(APPMARKET_CONF_FILE)
rescue Exception => e
    STDERR.puts "Error parsing config file #{APPMARKET_CONF_FILE}: #{e.message}"
    exit 1
end

set :appmarket_config, appmarket_conf

helpers do
    def am_build_client
        Market::ApplianceClient.new(
            settings.appmarket_config[:appmarket_username],
            settings.appmarket_config[:appmarket_password],
            settings.appmarket_config[:appmarket_url],
            "Sunstone")
    end

    def am_format_response(response)
        if CloudClient::is_error?(response)
            error = Error.new(response.to_s)
            [response.code.to_i, error.to_json]
        else
            [200, response.body]
        end
    end
end

get '/appmarket' do
    client = am_build_client

    response = client.list

    am_format_response(response)
end

get '/appmarket/:id' do
    client = am_build_client

    response = client.show(params[:id])

    am_format_response(response)
end