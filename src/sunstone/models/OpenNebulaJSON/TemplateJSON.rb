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
    class TemplateJSON < OpenNebula::Template
        include JSONUtils

        def create(template_json)
            template_hash = parse_json(template_json, 'vmtemplate')
            if OpenNebula.is_error?(template_hash)
                return template_hash
            end

            if template_hash['template_raw']
                template = template_hash['template_raw']
            else
                template = template_to_str(template_hash)
            end

            self.allocate(template)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "publish"     then self.publish
                 when "unpublish"   then self.unpublish
                 when "update"      then self.update(action_hash['params'])
                 when "chown"       then self.chown(action_hash['params'])
                 when "chmod"       then self.chmod_json(action_hash['params'])
                 when "instantiate" then self.instantiate(action_hash['params'])
                 when "clone"       then self.clone(action_hash['params'])
                 when "rename"      then self.rename(action_hash['params'])
                 when "delete_recursive" then self.delete_recursive(action_hash['params'])
                 when "lock"        then lock(action_hash['params']['level'].to_i)
                 when "unlock"      then unlock()
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def info(extended=false)
          if extended
            super(true)
          else
            super()
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
            recursive = (params['recursive'] == true)

            if params['octet']
                self.chmod_octet(params['octet'], recursive)
            else
                self.chmod((params['owner_u']||-1),
                    (params['owner_m']||-1),
                    (params['owner_a']||-1),
                    (params['group_u']||-1),
                    (params['group_m']||-1),
                    (params['group_a']||-1),
                    (params['other_u']||-1),
                    (params['other_m']||-1),
                    (params['other_a']||-1),
                    recursive)
            end
        end

        def instantiate(params=Hash.new)
            persistent = (params['persistent'] == true)

            if params['template']
                select_network = self['TEMPLATE/SUNSTONE/NETWORK_SELECT']
                if (select_network && select_network.upcase == "NO")
                    params['template'].delete("NIC")
                    params['template'].delete("NIC_ALIAS")
                end

                template = template_to_str(params['template'])

                ['NIC', 'NIC_ALIAS', 'SCHED_ACTION', 'SCHED_REQUIREMENTS', 'SCHED_DS_REQUIREMENTS'].each { |i|
                    if params['template'][i] && params['template'][i].empty?
                        template << "\n#{i} = []"
                    end
                }

                super(params['vm_name'], params['hold'], template, persistent)
            else
                super(params['vm_name'], params['hold'], "", persistent)
            end
        end

        def clone(params=Hash.new)
            recursive = (params['recursive'] == true)

            rc = super(params['name'], recursive)

            if OpenNebula.is_error?(rc)
                return rc
            else
                return TemplateJSON.new_with_id(rc, @client)
            end
        end

        def rename(params=Hash.new)
            super(params['name'])
        end

        def delete_recursive(params=Hash.new)
            recursive = (params['recursive'] == true)
            self.delete(recursive)
        end
    end
end
