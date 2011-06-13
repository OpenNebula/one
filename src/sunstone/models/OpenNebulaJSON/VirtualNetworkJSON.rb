# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'OpenNebulaJSON/JSONUtils'

module OpenNebulaJSON
    class VirtualNetworkJSON < OpenNebula::VirtualNetwork
        include JSONUtils

        def create(template_json)
            vnet_hash = parse_json(template_json, 'vnet')
            if OpenNebula.is_error?(vnet_hash)
                return vnet_hash
            end

            if vnet_hash['vnet_raw']
                template = vnet_hash['vnet_raw']
            else
                template = template_to_str(vnet_hash)
            end
            
            self.allocate(template)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "publish"   then self.publish
                 when "unpublish" then self.unpublish
                 when "chown"     then self.chown(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                                " available for this resource"
                     OpenNebula::Error.new(error_msg)
            end
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i,params['group_id'].to_i)
        end
    end
end
