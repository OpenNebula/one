# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
    class VirtualNetworkJSON < OpenNebula::VirtualNetwork
        include JSONUtils

        def create(template_json)
            vnet_hash = parse_json(template_json, 'vnet')
            if OpenNebula.is_error?(vnet_hash)
                return vnet_hash
            end

            if vnet_hash['vnet_raw']
                template = vnet_hash['vnet_raw']
            else
                template = template_to_str(vnet_hash)
            end

            self.allocate(template)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "addleases" then self.addleases(action_hash['params'])
                 when "rmleases"  then self.rmleases(action_hash['params'])
                 when "publish"   then self.publish
                 when "unpublish" then self.unpublish
                 when "update"    then self.update(action_hash['params'])
                 when "chown"     then self.chown(action_hash['params'])
                 when "chmod"     then self.chmod_octet(action_hash['params'])
                 when "hold"      then self.hold(action_hash['params'])
                 when "release"   then self.release(action_hash['params'])
                 when "rename"    then self.rename(action_hash['params'])
                 when "rm_ar"     then self.rm_ar(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                                " available for this resource"
                     OpenNebula::Error.new(error_msg)
            end
        end

        def addleases(params=Hash.new)
            super(params['ip'],params['mac'])
        end

        def rmleases(params=Hash.new)
            super(params['ip'])
        end

        def update(params=Hash.new)
            super(params['template_raw'])
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

        def rm_ar(params=Hash.new)
            super(params['ar_id'])
        end
    end
end
