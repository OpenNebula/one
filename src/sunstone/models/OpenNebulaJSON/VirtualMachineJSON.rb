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
require 'opennebula/virtual_machine_ext'

module OpenNebulaJSON

    # Sunstone VirtualMachineJSON class
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

            allocate(template)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            case action_hash['perform']
            when 'deploy'
                deploy(action_hash['params'])
            when 'hold'
                hold
            when 'livemigrate'
                migrate(0, action_hash['params'], true)
            when 'migrate'
                migrate(0, action_hash['params'], false)
            when 'migrate_poff'
                migrate(1, action_hash['params'], false)
            when 'migrate_poff_hard'
                migrate(2, action_hash['params'], false)
            when 'resume'
                resume
            when 'release'
                release
            when 'stop'
                stop
            when 'suspend'
                suspend
            when 'disk_saveas'
                disk_saveas(action_hash['params'])
            when 'snapshot_create'
                snapshot_create(action_hash['params'])
            when 'snapshot_revert'
                snapshot_revert(action_hash['params'])
            when 'snapshot_delete'
                snapshot_delete(action_hash['params'])
            when 'disk_snapshot_create'
                disk_snapshot_create(action_hash['params'])
            when 'disk_snapshot_revert'
                disk_snapshot_revert(action_hash['params'])
            when 'disk_snapshot_rename'
                disk_snapshot_rename(action_hash['params'])
            when 'disk_snapshot_delete'
                disk_snapshot_delete(action_hash['params'])
            when 'terminate'
                terminate(action_hash['params'])
            when 'reboot'
                reboot(action_hash['params'])
            when 'poweroff'
                poweroff(action_hash['params'])
            when 'chown'
                chown(action_hash['params'])
            when 'chmod'
                chmod_octet(action_hash['params'])
            when 'resize'
                resize(action_hash['params'])
            when 'attachdisk'
                disk_attach(action_hash['params'])
            when 'detachdisk'
                disk_detach(action_hash['params'])
            when 'attachnic'
                nic_attach(action_hash['params'])
            when 'detachnic'
                nic_detach(action_hash['params'])
            when 'updatenic'
                nic_update(action_hash['params'])
            when 'update'
                update(action_hash['params'])
            when 'updateconf'
                updateconf(action_hash['params'])
            when 'rename'
                rename(action_hash['params'])
            when 'undeploy'
                undeploy(action_hash['params'])
            when 'resched'
                resched
            when 'unresched'
                unresched
            when 'recover'
                recover(action_hash['params'])
            when 'save_as_template'
                save_as_template(action_hash['params'])
            when 'disk_resize'
                disk_resize(action_hash['params'])
            when 'lock'
                lock(action_hash['params']['level'].to_i)
            when 'unlock'
                unlock
            when 'sched_action_add'
                sched_action_add(action_hash['params'])
            when 'sched_action_update'
                sched_action_update(action_hash['params'])
            when 'sched_action_delete'
                sched_action_delete(action_hash['params'])
            when 'sg_attach'
                sg_attach(action_hash['params'])
            when 'sg_detach'
                sg_detach(action_hash['params'])
            when 'backup'
                backup(action_hash['params']['dst_id'].to_i, action_hash['params']['reset'])
            else
                error_msg = "#{action_hash['perform']} action not " \
                            ' available for this resource'
                OpenNebula::Error.new(error_msg)
            end
        end

        def deploy(params = {})
            super(params['host_id'], params['enforce'], params['ds_id'])
        end

        def undeploy(params = {})
            super(params['hard'])
        end

        def terminate(params = {})
            super(params['hard'])
        end

        def reboot(params = {})
            super(params['hard'])
        end

        def poweroff(params = {})
            super(params['hard'])
        end

        def migrate(mtype, params = {}, live = false)
            super(params['host_id'],
                live,
                params['enforce'],
                params['ds_id'],
                mtype
            )
        end

        def disk_saveas(params = {})
            super(params['disk_id'].to_i, params['image_name'],
                params['type'], params['snapshot_id'].to_i)
        end

        def disk_resize(params = {})
            super(params['disk_id'].to_i, params['new_size'])
        end

        def snapshot_create(params = {})
            super(params['snapshot_name'])
        end

        def snapshot_revert(params = {})
            super(params['snapshot_id'].to_i)
        end

        def snapshot_delete(params = {})
            super(params['snapshot_id'].to_i)
        end

        def disk_snapshot_create(params = {})
            super(params['disk_id'].to_i, params['snapshot_name'])
        end

        def disk_snapshot_revert(params = {})
            super(params['disk_id'].to_i, params['snapshot_id'].to_i)
        end

        def disk_snapshot_rename(params = {})
            super(params['disk_id'].to_i,
                params['snapshot_id'].to_i,
                params['new_name']
            )
        end

        def disk_snapshot_delete(params = {})
            super(params['disk_id'].to_i, params['snapshot_id'].to_i)
        end

        def chown(params = {})
            super(params['owner_id'].to_i, params['group_id'].to_i)
        end

        def chmod_octet(params = {})
            super(params['octet'])
        end

        def resize(params = {})
            template_json = params['vm_template']
            template = template_to_str(template_json)
            super(template, params['enforce'])
        end

        def disk_attach(params = {})
            template_json = params['disk_template']
            template = template_to_str(template_json)
            super(template)
        end

        def disk_detach(params = {})
            super(params['disk_id'].to_i)
        end

        def nic_attach(params = {})
            template_json = params['nic_template']
            template = template_to_str(template_json)
            super(template)
        end

        def nic_detach(params = {})
            super(params['nic_id'].to_i)
        end

        def nic_update(params = {})
            template_json = params['nic_template']
            template = template_to_str(template_json)
            super(params['nic_id'].to_i, template)
        end

        def update(params = {})
            if !params['append'].nil?
                super(params['template_raw'], params['append'])
            else
                super(params['template_raw'])
            end
        end

        def updateconf(params = {})
            super(params['template_raw'])
        end

        def rename(params = {})
            super(params['name'])
        end

        def recover(params = {})
            super(params['result'].to_i)
        end

        def save_as_template(params = {})
            begin
                vm_new = VirtualMachine.new(
                    VirtualMachine.build_xml(@pe_id),
                    @client
                )

                vm_new.extend(VirtualMachineExt)

                vm_new.save_as_template(params['name'],
                                        params['description'],
                                        :persistent => params['persistent'])
            rescue StandardError => e
                OpenNebula::Error.new(e.message)
            end
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

        def sg_attach(params = {})
            super(params['nic_id'], params['sg_id'])
        end

        def sg_detach(params = {})
            super(params['nic_id'], params['sg_id'])
        end

    end

end
