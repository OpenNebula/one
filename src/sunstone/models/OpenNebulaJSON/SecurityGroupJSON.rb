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
    class SecurityGroupJSON < OpenNebula::SecurityGroup
        include JSONUtils

        def create(template_json)
            secgroup_hash = parse_json(template_json, 'security_group')

            if OpenNebula.is_error?(secgroup_hash)
                return secgroup_hash
            end

            if secgroup_hash['security_group_raw']
                template = secgroup_hash['security_group_raw']
            else
                template = template_to_str(secgroup_hash)
            end

            self.allocate(template)

        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "update"      then self.update(action_hash['params'])
                 when "chown"       then self.chown(action_hash['params'])
                 when "chmod"       then self.chmod_json(action_hash['params'])
                 when "clone"       then self.clone(action_hash['params'])
                 when "rename"      then self.rename(action_hash['params'])
                 when "commit"      then self.commit(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def update(params=Hash.new)
            if !params['append'].nil?
                super(params['template_raw'], params['append'])
            else
                super(params['template_raw'])
            end
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i,params['group_id'].to_i)
        end

        def chmod_json(params=Hash.new)
            if params['octet']
                self.chmod_octet(params['octet'])
            else
                self.chmod((params['owner_u']||-1),
                    (params['owner_m']||-1),
                    (params['owner_a']||-1),
                    (params['group_u']||-1),
                    (params['group_m']||-1),
                    (params['group_a']||-1),
                    (params['other_u']||-1),
                    (params['other_m']||-1),
                    (params['other_a']||-1))
            end
        end

        def rename(params=Hash.new)
            super(params['name'])
        end

        def clone(params=Hash.new)
            super(params['name'])
        end

        def commit(params=Hash.new)
            super(params['recover'] == true)
        end
    end
end
