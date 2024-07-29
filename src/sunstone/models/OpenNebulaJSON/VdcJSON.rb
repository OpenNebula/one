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
    class VdcJSON < OpenNebula::Vdc
        include JSONUtils

        def create(template_json)
            vdc_hash = parse_json(template_json, 'vdc')

            if OpenNebula.is_error?(vdc_hash)
                return vdc_hash
            end

            if vdc_hash['vdc_raw']
                template = vdc_hash['vdc_raw']
            else
                template = template_to_str(vdc_hash)
            end

            self.allocate(template)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "add_group"   then self.add_group(action_hash['params'])
                 when "del_group"   then self.del_group(action_hash['params'])
                 when "add_cluster" then self.add_cluster(action_hash['params'])
                 when "del_cluster" then self.del_cluster(action_hash['params'])
                 when "add_host"    then self.add_host(action_hash['params'])
                 when "del_host"    then self.del_host(action_hash['params'])
                 when "add_datastore"   then self.add_datastore(action_hash['params'])
                 when "del_datastore"   then self.del_datastore(action_hash['params'])
                 when "add_vnet"    then self.add_vnet(action_hash['params'])
                 when "del_vnet"    then self.del_vnet(action_hash['params'])
                 when "update"      then self.update(action_hash['params'])
                 when "rename"      then self.rename(action_hash['params'])

                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def add_group(params=Hash.new)
            super(params['group_id'].to_i)
        end

        def del_group(params=Hash.new)
            super(params['group_id'].to_i)
        end

        def add_cluster(params=Hash.new)
            super(params['zone_id'].to_i, params['cluster_id'].to_i)
        end

        def del_cluster(params=Hash.new)
            super(params['zone_id'].to_i, params['cluster_id'].to_i)
        end

        def add_host(params=Hash.new)
            super(params['zone_id'].to_i, params['host_id'].to_i)
        end

        def del_host(params=Hash.new)
            super(params['zone_id'].to_i, params['host_id'].to_i)
        end

        def add_datastore(params=Hash.new)
            super(params['zone_id'].to_i, params['ds_id'].to_i)
        end

        def del_datastore(params=Hash.new)
            super(params['zone_id'].to_i, params['ds_id'].to_i)
        end

        def add_vnet(params=Hash.new)
            super(params['zone_id'].to_i, params['vnet_id'].to_i)
        end

        def del_vnet(params=Hash.new)
            super(params['zone_id'].to_i, params['vnet_id'].to_i)
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
