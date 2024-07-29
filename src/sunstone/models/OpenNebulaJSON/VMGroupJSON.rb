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

    class VMGroupJSON < OpenNebula::VMGroup
        include JSONUtils

        def create(template_json)
            vm_grp_hash = parse_json(template_json, 'vm_group')
            if OpenNebula.is_error?(vm_grp_hash)
                return vm_grp_hash
            end

            if vm_grp_hash['vm_grp_raw']
                template = vm_grp_hash['vm_grp_raw']
            else
                template = template_to_str(vm_grp_hash)
            end

            self.allocate(template)
       end

        def perform_action(template_json)
            action_hash = parse_json(template_json,'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end
            rc = case action_hash['perform']
                 when "delete"       then self.delete(action_hash['params'])
                 when "chown"        then self.chown(action_hash['params'])
                 when "chmod"        then self.chmod_octet(action_hash['params'])
                 when "update"       then self.update(action_hash['params'])
                 when "rename"       then self.rename(action_hash['params'])
                 when "lock"         then lock(action_hash['params']['level'].to_i)
                 when "unlock"       then unlock()
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def delete(params=Hash.new)
            super()
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i,params['name'].to_i)
        end

        def chmod_octet(params=Hash.new)
            super(params['octet'])
        end

        def update(params=Hash.new)
            if !params['append'].nil?
                super(params['template_raw'], params['append'])
            else
                super(params['template_raw'])
            end
        end

        def rename(params=Hash.new)
            super(params['name'])
        end
    end
end
