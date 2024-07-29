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
    class AclJSON < OpenNebula::Acl
        include JSONUtils

        def create(template_json)
            acl_string = parse_json(template_json, 'acl')
            acl_rule = Acl.parse_rule(acl_string)
            if OpenNebula.is_error?(acl_rule)
                return acl_rule
            end
            self.allocate(acl_rule[0],acl_rule[1],acl_rule[2],acl_rule[3])
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            error_msg = "#{action_hash['perform']} action not " <<
                " available for this resource"
            OpenNebula::Error.new(error_msg)

            # rc = case action_hash['perform']
            #          #no actions!
            #      else
            #          error_msg = "#{action_hash['perform']} action not " <<
            #              " available for this resource"
            #          OpenNebula::Error.new(error_msg)
            #      end
        end
    end
end
