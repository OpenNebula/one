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

    class VirtualMachineJSON < OpenNebula::VirtualMachine
        include JSONUtils

        def create(template_json)
            vm_hash = parse_json(template_json, 'vm')
            if OpenNebula.is_error?(vm_hash)
                return vm_hash
            end

            if vm_hash['vm_raw']
                template = vm_hash['vm_raw']
            else
                template = template_to_str(vm_hash)
            end

            self.allocate(template)
       end

        def perform_action(template_json)
            action_hash = parse_json(template_json,'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "cancel"       then self.cancel
                 when "deploy"       then self.deploy(action_hash['params'])
                 when "finalize"     then self.finalize
                 when "hold"         then self.hold
                 when "livemigrate"  then self.migrate(action_hash['params'], true)
                 when "migrate"      then self.migrate(action_hash['params'], false)
                 when "resume"       then self.resume
                 when "release"      then self.release
                 when "stop"         then self.stop
                 when "suspend"      then self.suspend
                 when "restart"      then self.restart
                 when "reset"        then self.reset
                 when "saveas"       then self.save_as(action_hash['params'])
                 when "snapshot_create"       then self.snapshot_create(action_hash['params'])
                 when "snapshot_revert"       then self.snapshot_revert(action_hash['params'])
                 when "snapshot_delete"       then self.snapshot_delete(action_hash['params'])
                 when "shutdown"     then self.shutdown
                 when "reboot"       then self.reboot
                 when "poweroff"     then self.poweroff(action_hash['params'])
                 when "resubmit"     then self.resubmit
                 when "chown"        then self.chown(action_hash['params'])
                 when "chmod"        then self.chmod_octet(action_hash['params'])
                 when "resize"       then self.resize(action_hash['params'])
                 when "attachdisk"   then self.disk_attach(action_hash['params'])
                 when "detachdisk"   then self.disk_detach(action_hash['params'])
                 when "attachnic"    then self.nic_attach(action_hash['params'])
                 when "detachnic"    then self.nic_detach(action_hash['params'])
                 when "update"       then self.update(action_hash['params'])
                 when "rename"       then self.rename(action_hash['params'])
                 when "undeploy"     then self.undeploy(action_hash['params'])
                 when "resched"      then self.resched
                 when "unresched"    then self.unresched
                 when "recover"      then self.recover(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def delete
            super()
        end

        def deploy(params=Hash.new)
            super(params['host_id'], params['enforce'], params['ds_id'])
        end

        def undeploy(params=Hash.new)
            super(params['hard'])
        end

        def poweroff(params=Hash.new)
            super(params['hard'])
        end

        def migrate(params=Hash.new, live=false)
            super(params['host_id'], live, params['enforce'])
        end

        def save_as(params=Hash.new)
            clone = params['clonetemplate']
            clone = false if clone.nil?

            disk_snapshot(params['disk_id'].to_i, params['image_name'], params['type'], params['hot'], clone)
        end

        def snapshot_create(params=Hash.new)
            super(params['snapshot_name'])
        end

        def snapshot_revert(params=Hash.new)
            super(params['snapshot_id'].to_i)
        end

        def snapshot_delete(params=Hash.new)
            super(params['snapshot_id'].to_i)
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i,params['group_id'].to_i)
        end

        def chmod_octet(params=Hash.new)
            super(params['octet'])
        end

        def resize(params=Hash.new)
            template_json = params['vm_template']
            template = template_to_str(template_json)
            super(template, params['enforce'])
        end

        def disk_attach(params=Hash.new)
            template_json = params['disk_template']
            template = template_to_str(template_json)
            super(template)
        end

        def disk_detach(params=Hash.new)
            super(params['disk_id'].to_i)
        end

        def nic_attach(params=Hash.new)
            template_json = params['nic_template']
            template = template_to_str(template_json)
            super(template)
        end

        def nic_detach(params=Hash.new)
            super(params['nic_id'].to_i)
        end

        def update(params=Hash.new)
            super(params['template_raw'])
        end

        def rename(params=Hash.new)
            super(params['name'])
        end

        def recover(params=Hash.new)
            result = params['with'] == "success" ? true : false
            super(result)
        end
    end
end
