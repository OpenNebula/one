# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'zona'

module OZonesHelper

    class OZHelper
        def initialize(user=nil, pass=nil, endpoint_str=nil,
                       timeout=nil, debug_flag=true)
            @client = Zona::Client.new(user,
                                       pass,
                                       endpoint_str,
                                       timeout,
                                       debug_flag)
        end

        def create_resource(kind, template)
            rc = @client.post_resource_file(kind, template)

            if Zona::is_error?(rc)
                [-1, rc.message]
            else
                id = get_id(rc)
                [0, "ID: #{id}"]
            end
        end

        def list_pool(kind, options)
            rc = @client.get_pool(kind)

            if Zona::is_error?(rc)
                [-1, rc.message]
            else
                pool=Zona::OZonesJSON.parse_json(rc.body, kind.upcase + "_POOL")
                format_pool(pool, options)
            end
        end

        def show_resource(kind, id, options)
            rc = @client.get_resource(kind, id)

            if Zona::is_error?(rc)
                [-1, rc.message]
            else
                resource=Zona::OZonesJSON.parse_json(rc.body, kind.upcase)
                format_resource(resource, options)
            end
        end

        def get_resource_pool(kind, id, pool)
            rc = @client.get_resource_pool(kind, id, pool)

            if Zona::is_error?(rc)
                [-1, rc.message]
            else
                [0 , Zona::OZonesJSON.parse_json(rc.body, pool.upcase+"_POOL")[pool.upcase.to_sym]]
            end
        end

        def delete_resource(kind, id, options)
            rc = @client.delete_resource(kind, id)

            if Zona::is_error?(rc)
                [-1, rc.message]
            else
                message=Zona::OZonesJSON.parse_json(rc.body, "message")
                [0, "#{message}"]
            end
        end

        ########################################################################
        # Helpers
        ########################################################################


        def get_id(rc)
            id = rc.body.match('\"ID\":(.*)$')[1].strip
            if id[-1..-1] == ","
                id = id[0..id.size-2]
            end

            return id
        end
    end
end
