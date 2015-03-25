# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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


require 'opennebula/pool_element'

module OpenNebula
    class VirtualMachine < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        VM_METHODS = {
            :info       => "vm.info",
            :allocate   => "vm.allocate",
            :action     => "vm.action",
            :migrate    => "vm.migrate",
            :deploy     => "vm.deploy",
            :savedisk   => "vm.savedisk",
            :chown      => "vm.chown",
            :chmod      => "vm.chmod",
            :monitoring => "vm.monitoring",
            :attach     => "vm.attach",
            :detach     => "vm.detach",
            :rename     => "vm.rename",
            :update     => "vm.update",
            :resize     => "vm.resize",
            :snapshotcreate => "vm.snapshotcreate",
            :snapshotrevert => "vm.snapshotrevert",
            :snapshotdelete => "vm.snapshotdelete",
            :attachnic  => "vm.attachnic",
            :detachnic  => "vm.detachnic",
            :recover    => "vm.recover"
        }

        VM_STATE=%w{INIT PENDING HOLD ACTIVE STOPPED SUSPENDED DONE FAILED
            POWEROFF UNDEPLOYED}

        LCM_STATE=%w{
            LCM_INIT
            PROLOG
            BOOT
            RUNNING
            MIGRATE
            SAVE_STOP
            SAVE_SUSPEND
            SAVE_MIGRATE
            PROLOG_MIGRATE
            PROLOG_RESUME
            EPILOG_STOP
            EPILOG
            SHUTDOWN
            CANCEL
            FAILURE
            CLEANUP_RESUBMIT
            UNKNOWN
            HOTPLUG
            SHUTDOWN_POWEROFF
            BOOT_UNKNOWN
            BOOT_POWEROFF
            BOOT_SUSPENDED
            BOOT_STOPPED
            CLEANUP_DELETE
            HOTPLUG_SNAPSHOT
            HOTPLUG_NIC
            HOTPLUG_SAVEAS
            HOTPLUG_SAVEAS_POWEROFF
            HOTPLUG_SAVEAS_SUSPENDED
            SHUTDOWN_UNDEPLOY
            EPILOG_UNDEPLOY
            PROLOG_UNDEPLOY
            BOOT_UNDEPLOY
            HOTPLUG_PROLOG_POWEROFF
            HOTPLUG_EPILOG_POWEROFF
            BOOT_MIGRATE
            BOOT_FAILURE
            BOOT_MIGRATE_FAILURE
            PROLOG_MIGRATE_FAILURE
            PROLOG_FAILURE
            EPILOG_FAILURE
            EPILOG_STOP_FAILURE
            EPILOG_UNDEPLOY_FAILURE
        }

        SHORT_VM_STATES={
            "INIT"      => "init",
            "PENDING"   => "pend",
            "HOLD"      => "hold",
            "ACTIVE"    => "actv",
            "STOPPED"   => "stop",
            "SUSPENDED" => "susp",
            "DONE"      => "done",
            "FAILED"    => "fail",
            "POWEROFF"  => "poff",
            "UNDEPLOYED"=> "unde"
        }

        SHORT_LCM_STATES={
            "PROLOG"            => "prol",
            "BOOT"              => "boot",
            "RUNNING"           => "runn",
            "MIGRATE"           => "migr",
            "SAVE_STOP"         => "save",
            "SAVE_SUSPEND"      => "save",
            "SAVE_MIGRATE"      => "save",
            "PROLOG_MIGRATE"    => "migr",
            "PROLOG_RESUME"     => "prol",
            "EPILOG_STOP"       => "epil",
            "EPILOG"            => "epil",
            "SHUTDOWN"          => "shut",
            "CANCEL"            => "shut",
            "FAILURE"           => "fail",
            "CLEANUP_RESUBMIT"  => "clea",
            "UNKNOWN"           => "unkn",
            "HOTPLUG"           => "hotp",
            "SHUTDOWN_POWEROFF" => "shut",
            "BOOT_UNKNOWN"      => "boot",
            "BOOT_POWEROFF"     => "boot",
            "BOOT_SUSPENDED"    => "boot",
            "BOOT_STOPPED"      => "boot",
            "CLEANUP_DELETE"    => "clea",
            "HOTPLUG_SNAPSHOT"  => "snap",
            "HOTPLUG_NIC"       => "hotp",
            "HOTPLUG_SAVEAS"           => "hotp",
            "HOTPLUG_SAVEAS_POWEROFF"  => "hotp",
            "HOTPLUG_SAVEAS_SUSPENDED" => "hotp",
            "SHUTDOWN_UNDEPLOY" => "shut",
            "EPILOG_UNDEPLOY"   => "epil",
            "PROLOG_UNDEPLOY"   => "prol",
            "BOOT_UNDEPLOY"     => "boot",
            "HOTPLUG_PROLOG_POWEROFF"   => "hotp",
            "HOTPLUG_EPILOG_POWEROFF"   => "hotp",
            "BOOT_MIGRATE"              => "boot",
            "BOOT_FAILURE"              => "fail",
            "BOOT_MIGRATE_FAILURE"      => "fail",
            "PROLOG_MIGRATE_FAILURE"    => "fail",
            "PROLOG_FAILURE"            => "fail",
            "EPILOG_FAILURE"            => "fail",
            "EPILOG_STOP_FAILURE"       => "fail",
            "EPILOG_UNDEPLOY_FAILURE"   => "fail",
        }

        MIGRATE_REASON=%w{NONE ERROR USER}

        SHORT_MIGRATE_REASON={
            "NONE"          => "none",
            "ERROR"         => "erro",
            "USER"          => "user"
        }

        HISTORY_ACTION=%w{none migrate live-migrate shutdown shutdown-hard
            undeploy undeploy-hard hold release stop suspend resume boot delete
            delete-recreate reboot reboot-hard resched unresched poweroff
            poweroff-hard}

        EXTERNAL_IP_ATTRS = [
            'GUEST_IP',
            'AWS_IP_ADDRESS',
            'AZ_IPADDRESS',
            'SL_PRIMARYIPADDRESS'
        ]

        # Creates a VirtualMachine description with just its identifier
        # this method should be used to create plain VirtualMachine objects.
        # +id+ the id of the vm
        #
        # Example:
        #   vnet = VirtualMachine.new(VirtualMachine.build_xml(3),rpc_client)
        #
        def VirtualMachine.build_xml(pe_id=nil)
            if pe_id
                vm_xml = "<VM><ID>#{pe_id}</ID></VM>"
            else
                vm_xml = "<VM></VM>"
            end

            XMLElement.build_xml(vm_xml, 'VM')
        end

        def VirtualMachine.get_reason(reason)
            reason=MIGRATE_REASON[reason.to_i]
            reason_str=SHORT_MIGRATE_REASON[reason]

            reason_str
        end

        def VirtualMachine.get_history_action(action)
            return HISTORY_ACTION[action.to_i]
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Machine Object
        #######################################################################

        # Retrieves the information of the given VirtualMachine.
        def info()
            super(VM_METHODS[:info], 'VM')
        end

        alias_method :info!, :info

        # Allocates a new VirtualMachine in OpenNebula
        #
        # @param description [String] A string containing the template of
        #   the VirtualMachine.
        # @param hold [true,false] false to create the VM in pending state,
        #   true to create it on hold
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description, hold=false)
            super(VM_METHODS[:allocate], description, hold)
        end

        # Replaces the template contents
        #
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template=nil, append=false)
            super(VM_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Returns the <USER_TEMPLATE> element in text form
        #
        # @param indent [true,false] indents the resulting string, defaults to true
        #
        # @return [String] The USER_TEMPLATE
        def user_template_str(indent=true)
            template_like_str('USER_TEMPLATE', indent)
        end

        # Returns the <USER_TEMPLATE> element in XML form
        #
        # @return [String] The USER_TEMPLATE
        def user_template_xml
            if NOKOGIRI
                @xml.xpath('USER_TEMPLATE').to_s
            else
                @xml.elements['USER_TEMPLATE'].to_s
            end
        end


        # Initiates the instance of the VM on the target host.
        #
        # @param host_id [Interger] The host id (hid) of the target host where
        #   the VM will be instantiated.
        # @param enforce [true|false] If it is set to true, the host capacity
        #   will be checked, and the deployment will fail if the host is
        #   overcommited. Defaults to false
        # @param ds_id [Integer] The System Datastore where to deploy the VM. To
        #   use the default, set it to -1
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def deploy(host_id, enforce=false, ds_id=-1)
            enforce ||= false
            ds_id ||= -1
            return call(VM_METHODS[:deploy],
                        @pe_id,
                        host_id.to_i,
                        enforce,
                        ds_id.to_i)
        end

        # Shutdowns an already deployed VM
        def shutdown(hard=false)
            action(hard ? 'shutdown-hard' : 'shutdown')
        end

        # Shuts down an already deployed VM, saving its state in the system DS
        def undeploy(hard=false)
            action(hard ? 'undeploy-hard' : 'undeploy')
        end

        # Powers off a running VM
        def poweroff(hard=false)
            action(hard ? 'poweroff-hard' : 'poweroff')
        end

        # Reboots an already deployed VM
        def reboot(hard=false)
            action(hard ? 'reboot-hard' : 'reboot')
        end

        # @deprecated use {#reboot}
        def reset
            reboot(true)
        end

        # @deprecated use {#shutdown}
        def cancel
            shutdown(true)
        end

        # Sets a VM to hold state, scheduler will not deploy it
        def hold
            action('hold')
        end

        # Releases a VM from hold state
        def release
            action('release')
        end

        # Stops a running VM
        def stop
            action('stop')
        end

        # Saves a running VM
        def suspend
            action('suspend')
        end

        # Resumes the execution of a saved VM
        def resume
            action('resume')
        end

        # Attaches a disk to a running VM
        #
        # @param disk_template [String] Template containing a DISK element
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def disk_attach(disk_template)
            return call(VM_METHODS[:attach], @pe_id, disk_template)
        end

        alias_method :attachdisk, :disk_attach

        # Detaches a disk from a running VM
        #
        # @param disk_id [Integer] Id of the disk to be detached
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def disk_detach(disk_id)
            return call(VM_METHODS[:detach], @pe_id, disk_id)
        end

        alias_method :detachdisk, :disk_detach

        # Attaches a NIC to a running VM
        #
        # @param nic_template [String] Template containing a NIC element
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def nic_attach(nic_template)
            return call(VM_METHODS[:attachnic], @pe_id, nic_template)
        end

        # Detaches a NIC from a running VM
        #
        # @param nic_id [Integer] Id of the NIC to be detached
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def nic_detach(nic_id)
            return call(VM_METHODS[:detachnic], @pe_id, nic_id)
        end

        # Deletes a VM from the pool
        def delete(recreate=false)
            if recreate
                action('delete-recreate')
            else
                action('delete')
            end
        end

        # @deprecated use {#delete} instead
        def finalize(recreate=false)
            delete(recreate)
        end

        # Forces a re-deployment of a VM in UNKNOWN or BOOT state
        def boot
            action('boot')
        end

        alias_method :restart, :boot

        # @deprecated use {#delete} instead
        def resubmit
            action('delete-recreate')
        end

        # Sets the re-scheduling flag for the VM
        def resched
            action('resched')
        end

        # Unsets the re-scheduling flag for the VM
        def unresched
            action('unresched')
        end

        # Moves a running VM to the specified host. With live=true the
        # migration is done withdout downtime.
        #
        # @param host_id [Interger] The host id (hid) of the target host where
        #   the VM will be migrated.
        # @param live [true|false] If true the migration is done without
        #   downtime. Defaults to false
        # @param enforce [true|false] If it is set to true, the host capacity
        #   will be checked, and the deployment will fail if the host is
        #   overcommited. Defaults to false
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def migrate(host_id, live=false, enforce=false)
            call(VM_METHODS[:migrate], @pe_id, host_id.to_i, live==true,
                enforce)
        end

        # @deprecated use {#migrate} instead
        def live_migrate(host_id, enforce=false)
            migrate(host_id, true, enforce)
        end

        # Set the specified vm's disk to be saved in a new image
        # when the VirtualMachine shutdowns
        #
        # @param disk_id [Integer] ID of the disk to be saved
        # @param image_name [String] Name for the new image where the
        #   disk will be saved
        # @param image_type [String] Type of the new image. Set to empty string
        #   to use the default type
        # @param hot [true|false] True to save the disk immediately, false will
        #   perform the operation when the VM shuts down
        # @param do_template [true|false] True to clone also the VM originating
        # template and replace the disk with the saved image
        #
        # @return [Integer, OpenNebula::Error] the new Image ID in case of
        #   success, error otherwise
        def disk_snapshot(disk_id, image_name, image_type="", hot=false,
            do_template=false)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VM_METHODS[:savedisk],
                              @pe_id,
                              disk_id,
                              image_name,
                              image_type,
                              hot,
                              do_template)
            return rc
        end

        # @deprecated use {#disk_snapshot}
        def save_as(disk_id, image_name, image_type="", hot=false)
            return disk_snapshot(disk_id, image_name, image_type, hot)
        end

        # Resize the VM
        #
        # @param capacity_template [String] Template containing the new capacity
        #   elements CPU, VCPU, MEMORY. If one of them is not present, or its
        #   value is 0, it will not be resized
        # @param enforce [true|false] If it is set to true, the host capacity
        #   will be checked. This will only affect oneadmin requests, regular users
        #   resize requests will always be enforced
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def resize(capacity_template, enforce)
            return call(VM_METHODS[:resize], @pe_id, capacity_template, enforce)
        end

        # Changes the owner/group
        # uid:: _Integer_ the new owner id. Set to -1 to leave the current one
        # gid:: _Integer_ the new group id. Set to -1 to leave the current one
        # [return] nil in case of success or an Error object
        def chown(uid, gid)
            super(VM_METHODS[:chown], uid, gid)
        end

        # Changes the permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(VM_METHODS[:chmod], octet)
        end

        # Changes the permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(VM_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        # Retrieves this VM's monitoring data from OpenNebula
        #
        # @param [Array<String>] xpath_expressions Elements to retrieve.
        #
        # @return [Hash<String, Array<Array<int>>>, OpenNebula::Error] Hash with
        #   the requested xpath expressions, and an Array of 'timestamp, value'.
        #
        # @example
        #   vm.monitoring( ['CPU', 'NET_TX', 'TEMPLATE/CUSTOM_PROBE'] )
        #
        #   { "NET_TX" =>
        #       [["1337264510", "210"],
        #        ["1337264553", "220"],
        #        ["1337264584", "230"]],
        #     "TEMPLATE/CUSTOM_PROBE" =>
        #       [],
        #     "CPU" =>
        #       [["1337264510", "0"],
        #        ["1337264553", "0"],
        #        ["1337264584", "0"]]
        #   }
        def monitoring(xpath_expressions)
            return super(VM_METHODS[:monitoring], 'VM',
                'LAST_POLL', xpath_expressions)
        end

        # Retrieves this VM's monitoring data from OpenNebula, in XML
        #
        # @return [String] VM monitoring data, in XML
        def monitoring_xml()
            return Error.new('ID not defined') if !@pe_id

            return @client.call(VM_METHODS[:monitoring], @pe_id)
        end

        # Renames this VM
        #
        # @param name [String] New name for the VM.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(VM_METHODS[:rename], @pe_id, name)
        end

        # Creates a new VM snapshot
        #
        # @param name [String] Name for the snapshot.
        #
        # @return [Integer, OpenNebula::Error] The new snaphost ID in case
        #   of success, Error otherwise
        def snapshot_create(name="")
            return Error.new('ID not defined') if !@pe_id

            name ||= ""
            return @client.call(VM_METHODS[:snapshotcreate], @pe_id, name)
        end

        # Reverts to a snapshot
        #
        # @param snap_id [Integer] Id of the snapshot
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def snapshot_revert(snap_id)
            return call(VM_METHODS[:snapshotrevert], @pe_id, snap_id)
        end

        # Deletes a  VM snapshot
        #
        # @param snap_id [Integer] Id of the snapshot
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def snapshot_delete(snap_id)
            return call(VM_METHODS[:snapshotdelete], @pe_id, snap_id)
        end

        # Recovers an ACTIVE VM
        #
        # @param result [Boolean] Recover with success (true) or failure (false)
        # @param result [info] Additional information needed to recover the VM
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def recover(result)
            return call(VM_METHODS[:recover], @pe_id, result)
        end

        ########################################################################
        # Helpers to get VirtualMachine information
        ########################################################################

        # Returns the VM state of the VirtualMachine (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the VM state of the VirtualMachine (string value)
        def state_str
            VM_STATE[state]
        end

        # Returns the LCM state of the VirtualMachine (numeric value)
        def lcm_state
            self['LCM_STATE'].to_i
        end

        # Returns the LCM state of the VirtualMachine (string value)
        def lcm_state_str
            LCM_STATE[lcm_state]
        end

        # Returns the short status string for the VirtualMachine
        def status
            short_state_str=SHORT_VM_STATES[state_str]

            if short_state_str=="actv"
                short_state_str=SHORT_LCM_STATES[lcm_state_str]
            end

            short_state_str
        end

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
        end

        # Returns the deploy_id of the VirtualMachine (numeric value)
        def deploy_id
            self['DEPLOY_ID']
        end

    private
        def action(name)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VM_METHODS[:action], name, @pe_id)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end
    end
end
