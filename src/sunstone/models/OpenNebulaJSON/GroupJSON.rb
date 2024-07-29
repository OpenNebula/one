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

require 'OpenNebulaJSON/JSONUtils'

module OpenNebulaJSON
    class GroupJSON < OpenNebula::Group
        include JSONUtils

        def create(template_json)
            group_hash = parse_json_sym(template_json,:group)
            if OpenNebula.is_error?(group_hash)
                return group_hash
            end

            super(group_hash)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "chown"       then self.chown(action_hash['params'])
                 when "update"       then self.update_json(action_hash['params'])
                 when "set_quota"   then self.set_quota(action_hash['params'])
                 when "add_admin"   then self.add_admin_json(action_hash['params'])
                 when "del_admin"   then self.del_admin_json(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i)
        end

        def update_json(params=Hash.new)
            if !params['append'].nil?
                update(params['template_raw'], params['append'])
            else
                update(params['template_raw'])
            end
        end

        def set_quota(params=Hash.new)
            quota_json = params['quotas']
            quota_template = template_to_str(quota_json)
            super(quota_template)
        end

        def add_admin_json(params=Hash.new)
            add_admin(params['admin_id'].to_i)
        end

        def del_admin_json(params=Hash.new)
            del_admin(params['admin_id'].to_i)
        end
    end
end
