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

require 'OpenNebulaJSON/JSONUtils'

module OpenNebulaJSON
    class GroupJSON < OpenNebula::Group
        include JSONUtils

        def create(template_json)
            group_hash = parse_json(template_json,'group')
            if OpenNebula.is_error?(group_hash)
                return group_hash
            end

            rc_alloc = self.allocate(group_hash['name'])

            #create default ACL rules
            if !OpenNebula.is_error?(rc_alloc)
                rc_acl, msg = self.create_acls

                puts msg if rc_acl == -1
            end

            return rc_alloc
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "chown"    then self.chown(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i)
        end
    end
end
