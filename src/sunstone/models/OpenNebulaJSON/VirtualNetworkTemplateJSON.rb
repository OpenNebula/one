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
    class VNTemplateJSON < OpenNebula::VNTemplate
        include JSONUtils

        def create(template_json)
            vntemplate_hash = parse_json(template_json, 'vntemplate')
            if OpenNebula.is_error?(vntemplate_hash)
                return vntemplate_hash
            end

            if vntemplate_hash['vntemplate_raw']
                template = vntemplate_hash['vntemplate_raw']
            else
                template = template_to_str(vntemplate_hash)
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
                 when "chmod"       then self.chmod_octet(action_hash['params'])
                 when "hold"        then self.hold(action_hash['params'])
                 when "release"     then self.release(action_hash['params'])
                 when "rename"      then self.rename(action_hash['params'])
                 when "lock"        then lock(action_hash['params']['level'].to_i)
                 when "unlock"      then unlock()
                 when "instantiate" then self.instantiate(action_hash['params'])
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

        def chmod_octet(params=Hash.new)
            super(params['octet'])
        end

        def hold(params=Hash.new)
            super(params['ip'])
        end

        def release(params=Hash.new)
            super(params['ip'])
        end

        def rename(params=Hash.new)
            super(params['name'])
        end

        def lock(params=Hash.new)
            super(params['level'].to_i)
        end

        def unlock(params=Hash.new)
            super()
        end

        def instantiate(params=Hash.new)

            if params['template']
                template = template_to_str(params['template'])

                super(params['vnet_name'], template)
            else
                super(params['vnet_name'], "")
            end
        end
    end
end
