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

    class VirtualMachineJSON < OpenNebula::VirtualMachine
        include JSONUtils

        def create(template_json)
            vm_hash = parse_json(template_json, 'vm')
            if OpenNebula.is_error?(vm_hash)
                return vm_hash
            end

            if vm_hash['vm_raw']
                template = vm_hash['vm_raw']
            elsif vm_hash['template_id']
                template_id = vm_hash['template_id']

                template = "TEMPLATE_ID = #{template_id}"
                template << "\nNAME = #{vm_hash['vm_name']}" if vm_hash['vm_name']

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
                 when "livemigrate"  then self.live_migrate(action_hash['params'])
                 when "migrate"      then self.migrate(action_hash['params'])
                 when "resume"       then self.resume
                 when "release"      then self.release
                 when "stop"         then self.stop
                 when "suspend"      then self.suspend
                 when "restart"      then self.restart
                 when "reset"        then self.reset
                 when "saveas"       then self.save_as(action_hash['params'])
                 when "shutdown"     then self.shutdown
                 when "reboot"       then self.reboot
                 when "poweroff"     then self.poweroff
                 when "resubmit"     then self.resubmit
                 when "chown"        then self.chown(action_hash['params'])
                 when "chmod"        then self.chmod_octet(action_hash['params'])
                 when "attachdisk"   then self.attachdisk(action_hash['params'])
                 when "detachdisk"   then self.detachdisk(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def delete
            self.finalize
        end

        def deploy(params=Hash.new)
            super(params['host_id'])
        end

        def live_migrate(params=Hash.new)
            super(params['host_id'])
        end

        def migrate(params=Hash.new)
            super(params['host_id'])
        end

        def save_as(params=Hash.new)
            super(params['disk_id'].to_i, params['image_name'], params['type'])
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i,params['group_id'].to_i)
        end

        def chmod_octet(params=Hash.new)
            super(params['octet'])
        end

        def attachdisk(params=Hash.new)
            template_json = params['disk_template']
            template = template_to_str(template_json)
            super(template)
        end

        def detachdisk(params=Hash.new)
            super(params['disk_id'].to_i)
        end
    end
end
