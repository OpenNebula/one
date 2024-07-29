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
    class VirtualRouterJSON < OpenNebula::VirtualRouter
        include JSONUtils

        def create(template_json)
            vrouter_hash = parse_json(template_json, 'virtual_router')

            if OpenNebula.is_error?(vrouter_hash)
                return vrouter_hash
            end

            if vrouter_hash['virtual_router_raw']
                template = vrouter_hash['virtual_router_raw']
            else
                template = template_to_str(vrouter_hash)
            end

            self.allocate(template)

        end

       def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "instantiate" then self.instantiate(action_hash['params'])
                 when "update"      then self.update(action_hash['params'])
                 when "chown"       then self.chown(action_hash['params'])
                 when "chmod"       then self.chmod_json(action_hash['params'])
                 when "rename"      then self.rename(action_hash['params'])
                 when "attachnic"   then self.nic_attach(action_hash['params'])
                 when "detachnic"   then self.nic_detach(action_hash['params'])
                 when "lock"         then lock(action_hash['params']['level'].to_i)
                 when "unlock"       then unlock()
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def instantiate(params=Hash.new)
            if params['template']
                select_network = self['TEMPLATE/SUNSTONE/NETWORK_SELECT']
                if (select_network && select_network.upcase == "NO")
                    params['template'].delete("NIC")
                end

                template = template_to_str(params['template'])
                super(params['n_vms'], params['template_id'], params['vm_name'], params['hold'], template)
            else
                super(params['n_vms'], params['template_id'], params['vm_name'], params['hold'])
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

        def nic_attach(params=Hash.new)
            template_json = params['nic_template']
            template = template_to_str(template_json)
            super(template)
        end

        def nic_detach(params=Hash.new)
            super(params['nic_id'].to_i)
        end
    end
end
