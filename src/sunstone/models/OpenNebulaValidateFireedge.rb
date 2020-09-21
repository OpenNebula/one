# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

require 'CloudServer'


require 'net/http'

class ValidateFireedge < CloudServer

    def initialize(config, logger)
        super(config, logger)
        @time = 1
        @max_tries = config[:max_waiting_tries]
    end

    def send_request(url)
        response = nil
        uri = URI(url)
        
        begin
            Net::HTTP.start(uri.host, uri.port) do |http|
                request = Net::HTTP::Get.new uri
                response = http.request request
            end

            return response.kind_of? Net::HTTPSuccess
        rescue
            return false
        end
    end

    def validate_fireedge_running
        fireedge_endpoint = $conf[:fireedge_server_endpoint]
        if (fireedge_endpoint)
            tries = 0
            while (!$conf[:fireedge_up] || tries <= max_tries) do
                if (!$conf[:fireedge_up] && send_request(fireedge_endpoint))
                    $conf[:fireedge_up] = true;
                else
                    sleep 1
                end
                tries = tries + 1
            end
        else
            $conf[:fireedge_up] = false;
        end
    end

end