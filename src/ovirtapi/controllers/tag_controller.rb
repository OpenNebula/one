# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require 'json'
require 'opennebula'

require_relative 'user_controller'
require_relative 'vm_controller'

# TagController manages OpenNebula tags
class TagController

    # List the tags owned by the authenticated user.
    def self.get_tags(client, u)
        user = UserController.get_user(client, u)
        tags = user.to_hash.dig('USER', 'TEMPLATE', 'LABELS')&.split(',')&.reject(&:empty?)
        return 200, {} if tags.nil?

        return 200, tags
    end

    # Add a tag to a given VM
    def self.add_vm_tag(client, vm_id, tag)
        vm = VmController.get_one_vms(client, 'oneadmin:oneadmin', vm_id)

        old_tags = vm.to_hash['VM']['USER_TEMPLATE']['LABELS']
        user_template = <<-EOT
      LABELS = "#{old_tags},#{tag}"
        EOT

        vm.update(user_template, true)
    end

    # List vm tags
    def self.get_vm_tags(client, vm_id)
        vm = VmController.get_one_vms(client, :vm_id => vm_id)
        tags = Helper.resource_hash(client, vm).dig('VM', 'USER_TEMPLATE', 'LABELS')

        if tags.nil?
            LOGGER.warn("No tags found for VM ID #{vm_id}")
            return { :tags => [] }
        end

        tags = tags&.split(',')&.reject(&:empty?)
        ovirt_tags = []
        tags.each do |tag|
            ovirt_tags << {
                :name => tag
            }
        end
        return { :tags => ovirt_tags }
    end

end
