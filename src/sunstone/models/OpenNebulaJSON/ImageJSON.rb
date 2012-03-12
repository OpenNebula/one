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
    class ImageJSON < OpenNebula::Image
        include JSONUtils

        def create(template_json)
            image_hash = parse_json(template_json, 'image')
            if OpenNebula.is_error?(image_hash)
                return image_hash
            end

            ds_id = parse_json(template_json, 'ds_id')
            if OpenNebula.is_error?(ds_id)
                return ds_id
            end

            if image_hash['image_raw']
                template = image_hash['image_raw']
            else
                template = template_to_str(image_hash)
            end

            self.allocate(template,ds_id.to_i)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "disable"       then self.disable
                 when "enable"        then self.enable
                 when "nonpersistent" then self.nonpersistent
                 when "persistent"    then self.persistent
                 when "publish"       then self.publish
                 when "rm_attr"       then self.remove_attr(action_hash['params'])
                 when "unpublish"     then self.unpublish
                 when "update"        then self.update(action_hash['params'])
                 when "chown"         then self.chown(action_hash['params'])
                 when "chmod"         then self.chmod_octet(action_hash['params'])
                 when "chtype"        then self.chtype(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def update(params=Hash.new)
            super(params['template_raw'])
        end

        def remove_attr(params=Hash.new)
            super(params['name'])
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i,params['group_id'].to_i)
        end

        def chmod_octet(params=Hash.new)
            super(params['octet'])
        end

        def chtype(params=Hash.new)
            super(params['type'])
        end
    end
end
