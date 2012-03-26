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
    class HostJSON < OpenNebula::Host
        include JSONUtils

        def create(template_json)
            host_hash = parse_json(template_json, 'host')
            if OpenNebula.is_error?(host_hash)
                return host_hash
            end

            self.allocate(host_hash['name'],
                          host_hash['im_mad'],
                          host_hash['vm_mad'],
                          host_hash['vnm_mad'],
                          host_hash['cluster_id'].to_i)
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
                when "update" then self.update(action_hash['params'])
                else
                    error_msg = "#{action_hash['perform']} action not " <<
                                " available for this resource"
                    OpenNebula::Error.new(error_msg)
            end
        end

        def update(params=Hash.new)
            super(params['template_raw'])
        end

    end
end
