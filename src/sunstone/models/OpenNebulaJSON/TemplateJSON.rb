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
                when "publish"       then self.publish
                when "rm_attr"       then self.remove_attr(action_hash['params'])
                when "unpublish"     then self.unpublish
                when "update"        then self.update(action_hash['params'])
                else
                    error_msg = "#{action_hash['perform']} action not " <<
                                " available for this resource"
                    OpenNebula::Error.new(error_msg)
            end
            
        end
        
        def update(params=Hash.new)
            super(params['name'], params['value'])
        end

        def remove_attr(params=Hash.new)
            super(params['name'])
        end
    end
end
