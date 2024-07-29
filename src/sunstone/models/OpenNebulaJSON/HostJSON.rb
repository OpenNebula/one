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
    class HostJSON < OpenNebula::Host
        include JSONUtils

        def create(template_json)
            host_hash = parse_json(template_json, 'host')
            if OpenNebula.is_error?(host_hash)
                return host_hash
            end

            id = self.allocate(host_hash['name'],
                          host_hash['im_mad'],
                          host_hash['vm_mad'],
                          host_hash['cluster_id'].to_i)
            delete_values = ['name', 'im_mad', 'vm_mad', 'cluster_id']

            template_str = template_to_str(host_hash, delete_values)
            if !template_str.nil?
                params=Hash.new
                params['template_raw'] = template_str
                params['append'] = true
                self.update(params)
            end
        end

        def delete
            if self['HOST_SHARE/RUNNING_VMS'].to_i != 0
                OpenNebula::Error.new("Host still has associated VMs, aborting delete.")
            else
                super
            end
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                when "enable"  then self.enable
                when "disable" then self.disable
                when "offline" then self.offline
                when "update" then self.update(action_hash['params'])
                when "rename" then self.rename(action_hash['params'])
                when "import_wild" then self.import_wild(action_hash['params'])
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

        def rename(params=Hash.new)
            super(params['name'])
        end

        def import_wild(params=Hash.new)
            rc = super(params['name'])
            if OpenNebula.is_error?(rc)
                return rc
            else
                return VirtualMachineJSON.new_with_id(rc, @client)
            end
        end
    end
end
