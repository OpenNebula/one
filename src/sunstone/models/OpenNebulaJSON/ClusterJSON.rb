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
    class ClusterJSON < OpenNebula::Cluster
        include JSONUtils

        def create(template_json)
            cluster_hash = parse_json(template_json, 'cluster')
            if OpenNebula.is_error?(cluster_hash)
                return cluster_hash
            end

            self.allocate(cluster_hash['name'])
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "addhost" then self.addhost(action_hash['params'])
                 when "delhost" then self.delhost(action_hash['params'])
                 when "adddatastore" then self.adddatastore(action_hash['params'])
                 when "deldatastore" then self.deldatastore(action_hash['params'])
                 when "addvnet" then self.addvnet(action_hash['params'])
                 when "delvnet" then self.delvnet(action_hash['params'])
                 when "update"  then self.update(action_hash['params'])
                 when "rename"  then self.rename(action_hash['params'])

                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def addhost(params=Hash.new)
            super(params['host_id'].to_i)
        end

        def delhost(params=Hash.new)
            super(params['host_id'].to_i)
        end

        def adddatastore(params=Hash.new)
            super(params['ds_id'].to_i)
        end

        def deldatastore(params=Hash.new)
            super(params['ds_id'].to_i)
        end

        def addvnet(params=Hash.new)
            super(params['vnet_id'].to_i)
        end

        def delvnet(params=Hash.new)
            super(params['vnet_id'].to_i)
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
    end
end
