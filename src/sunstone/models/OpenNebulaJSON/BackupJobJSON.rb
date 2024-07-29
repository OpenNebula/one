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
    class BackupJobJSON < OpenNebula::BackupJob
        include JSONUtils

        def create(template_json)
            backupjob_hash = parse_json(template_json, 'backupjob')
            if OpenNebula.is_error?(backupjob_hash)
                return backupjob_hash
            end
            template = template_to_str(backupjob_hash)
            
            self.allocate(template)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "update"               then self.update(action_hash['params'])
                 when "chown"                then self.chown(action_hash['params'])
                 when "chmod"                then self.chmod_octet(action_hash['params'])
                 when "rename"               then self.rename(action_hash['params'])
                 when "priority"             then self.priority(action_hash['params'])
                 when "lock"                 then lock(action_hash['params']['level'].to_i)
                 when 'sched_action_add'     then sched_action_add(action_hash['params'])
                 when "sched_action_update"  then sched_action_update(action_hash['params'])
                 when "sched_action_delete"  then sched_action_delete(action_hash['params'])
                 when "unlock"               then unlock()
                 when "backup"               then self.backup()
                 when "cancel"               then self.cancel()
                 when "retry"                then self.retry()
                 
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

        def chown(params=Hash.new)
            super(params['owner_id'].to_i,params['group_id'].to_i)
        end

        def chmod_octet(params=Hash.new)
            super(params['octet'])
        end

        def rename(params=Hash.new)
            super(params['name'])
        end

        def sched_action_add(params = {})
            super(params['sched_template'])
        end

        def sched_action_update(params = {})
            super(params['sched_id'], params['sched_template'])
        end

        def sched_action_delete(params = {})
            super(params['sched_id'])
        end
    end
end
