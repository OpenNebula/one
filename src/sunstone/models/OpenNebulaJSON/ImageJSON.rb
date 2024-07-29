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
                 when "chmod"         then self.chmod_json(action_hash['params'])
                 when "chtype"        then self.chtype(action_hash['params'])
                 when "clone"         then self.clone(action_hash['params'])
                 when "rename"        then self.rename(action_hash['params'])
                 when "snapshot_flatten"    then self.snapshot_flatten(action_hash['params'])
                 when "snapshot_revert"     then self.snapshot_revert(action_hash['params'])
                 when "snapshot_delete"     then self.snapshot_delete(action_hash['params'])
                 when "lock"         then lock(action_hash['params']['level'].to_i)
                 when "unlock"       then unlock()
                 when "restore"      then restore(action_hash['params'])
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

        def remove_attr(params=Hash.new)
            super(params['name'])
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

        def chtype(params=Hash.new)
            super(params['type'])
        end

        def clone(params=Hash.new)
            if params['target_ds']
                rc = super(params['name'], params['target_ds'].to_i)
            else
                rc = super(params['name'])
            end

            if OpenNebula.is_error?(rc)
                return rc
            else
                return ImageJSON.new_with_id(rc, @client)
            end
        end

        def rename(params=Hash.new)
            super(params['name'])
        end

        def snapshot_flatten(params=Hash.new)
            super(params['snapshot_id'].to_i)
        end

        def snapshot_revert(params=Hash.new)
            super(params['snapshot_id'].to_i)
        end

        def snapshot_delete(params=Hash.new)
            super(params['snapshot_id'].to_i)
        end

        def restore(params=Hash.new)
            restore_opts = params['restore_opts'] || ""
            super(params['dst_id'].to_i, restore_opts)
        end
    end
end
