# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
                 when "delete_from_provision"
                          then self.delete_from_provision(action_hash['params'])
                 when "chmod_from_provision"
                          then self.chmod_from_provision(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def update(params=Hash.new)
            template_hash = parse_json(params, 'vmtemplate')
            if template_hash['template_raw']
                template = template_hash['template_raw']
            else
                template = template_to_str(template_hash)
            end

            super(template)
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

        def instantiate(params=Hash.new)
            if params['template']
                select_capacity = self['TEMPLATE/SUNSTONE_CAPACITY_SELECT']
                if (select_capacity && select_capacity.upcase == "NO")
                    params['template'].delete("CPU")
                    params['template'].delete("MEMORY")
                end

                select_network = self['TEMPLATE/SUNSTONE_NETWORK_SELECT']
                if (select_network && select_network.upcase == "NO")
                    params['template'].delete("NIC")
                end

                template = template_to_str(params['template'])
                super(params['vm_name'], params['hold'], template)
            else
                super(params['vm_name'], params['hold'])
            end
        end

        def clone(params=Hash.new)
            super(params['name'])
        end

        def rename(params=Hash.new)
            super(params['name'])
        end

        def delete_from_provision(params=Hash.new)
            # Delete associated images
            self.each("TEMPLATE/DISK/IMAGE_ID"){|image_id|
                img = OpenNebula::Image.new_with_id(image_id.text, @client)
                rc  = img.delete
                if OpenNebula::is_error?(rc)
                   error_msg = "Some of the resources associated with " <<
                      "this template couldn't be deleted. Error: " << rc.message
                   return OpenNebula::Error.new(error_msg)
                end
            }

            # Delete template
            self.delete
        end

        def chmod_from_provision(params=Hash.new)
            # Chmod associated images
            self.each("TEMPLATE/DISK/IMAGE_ID"){|image_id|
                img = OpenNebulaJSON::ImageJSON.new_with_id(image_id.text, @client)
                rc  = img.chmod_json(params)
                if OpenNebula::is_error?(rc)
                   error_msg = "Some of the resources associated with " <<
                    "this template couldn't be published. Error: " << rc.message
                   return OpenNebula::Error.new(error_msg)
                end
            }

            # Chmod template
            self.chmod_json(params)
        end
    end
end
