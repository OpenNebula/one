# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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
    class MarketPlaceAppJSON < OpenNebula::MarketPlaceApp
        include JSONUtils

        def create(template_json)
            mp_hash = parse_json(template_json, 'marketplaceapp')
            if OpenNebula.is_error?(mp_hash)
                return mp_hash
            end

            mp_id = parse_json(template_json, 'mp_id')
            if OpenNebula.is_error?(mp_id)
                return mp_id
            end

            if mp_hash['marketplaceapp_raw']
                template = mp_hash['marketplaceapp_raw']
            else
                template = template_to_str(mp_hash)
            end

            self.allocate(template, mp_id.to_i)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "update"        then self.update(action_hash['params'])
                 when "export"        then self.export(action_hash['params'])
                 when "chown"         then self.chown(action_hash['params'])
                 when "chmod"         then self.chmod_octet(action_hash['params'])
                 when "rename"        then self.rename(action_hash['params'])
                 when "disable"       then self.disable
                 when "enable"        then self.enable
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def update(params=Hash.new)
            super(params['template_raw'])
        end

        def export(params=Hash.new)
            dsid = params['dsid'] ? params['dsid'].to_i : params['dsid'] 
            name = params['name']
            super({:dsid => dsid, :name => name})
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i,params['group_id'].to_i)
        end

        def chmod_octet(params=Hash.new)
            super(params['octet'])
        end

        def rename(params=Hash.new)
            super(params['name'])
        end
    end
end
