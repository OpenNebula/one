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

require 'opennebula/lockable_ext'
require 'opennebula/pool_element'

module OpenNebula

    class VirtualMachine < PoolElement

        #######################################################################
        # Constants and Class Methods
        #######################################################################

        VM_METHODS = {
            :info           => 'vm.info',
            :allocate       => 'vm.allocate',
            :action         => 'vm.action',
            :migrate        => 'vm.migrate',
            :deploy         => 'vm.deploy',
            :chown          => 'vm.chown',
            :chmod          => 'vm.chmod',
            :monitoring     => 'vm.monitoring',
            :attach         => 'vm.attach',
            :detach         => 'vm.detach',
            :rename         => 'vm.rename',
            :update         => 'vm.update',
            :resize         => 'vm.resize',
            :snapshotcreate => 'vm.snapshotcreate',
            :snapshotrevert => 'vm.snapshotrevert',
            :snapshotdelete => 'vm.snapshotdelete',
            :attachnic      => 'vm.attachnic',
            :detachnic      => 'vm.detachnic',
            :recover        => 'vm.recover',
            :disksaveas     => 'vm.disksaveas',
            :disksnapshotcreate => 'vm.disksnapshotcreate',
            :disksnapshotrevert => 'vm.disksnapshotrevert',
            :disksnapshotdelete => 'vm.disksnapshotdelete',
            :disksnapshotrename => 'vm.disksnapshotrename',
            :diskresize     => 'vm.diskresize',
            :updateconf     => 'vm.updateconf',
            :lock           => 'vm.lock',
            :unlock         => 'vm.unlock',
            :schedadd       => 'vm.schedadd',
            :scheddelete    => 'vm.scheddelete',
            :schedupdate    => 'vm.schedupdate',
            :attachsg       => 'vm.attachsg',
            :detachsg       => 'vm.detachsg',
            :backup         => 'vm.backup',
            :updatenic      => 'vm.updatenic',
            :backupcancel   => 'vm.backupcancel',
            :attachpci      => 'vm.attachpci',
            :detachpci      => 'vm.detachpci',
            :restore        => 'vm.restore'
        }

        VM_STATE=['INIT', 'PENDING', 'HOLD', 'ACTIVE', 'STOPPED', 'SUSPENDED', 'DONE', 'FAILED',
                  'POWEROFF', 'UNDEPLOYED', 'CLONING', 'CLONING_FAILURE']

        LCM_STATE=[
            'LCM_INIT',
            'PROLOG',
            'BOOT',
            'RUNNING',
            'MIGRATE',
            'SAVE_STOP',
            'SAVE_SUSPEND',
            'SAVE_MIGRATE',
            'PROLOG_MIGRATE',
            'PROLOG_RESUME',
            'EPILOG_STOP',
            'EPILOG',
            'SHUTDOWN',
            'CANCEL',
            'FAILURE',
            'CLEANUP_RESUBMIT',
            'UNKNOWN',
            'HOTPLUG',
            'SHUTDOWN_POWEROFF',
            'BOOT_UNKNOWN',
            'BOOT_POWEROFF',
            'BOOT_SUSPENDED',
            'BOOT_STOPPED',
            'CLEANUP_DELETE',
            'HOTPLUG_SNAPSHOT',
            'HOTPLUG_NIC',
            'HOTPLUG_SAVEAS',
            'HOTPLUG_SAVEAS_POWEROFF',
            'HOTPLUG_SAVEAS_SUSPENDED',
            'SHUTDOWN_UNDEPLOY',
            'EPILOG_UNDEPLOY',
            'PROLOG_UNDEPLOY',
            'BOOT_UNDEPLOY',
            'HOTPLUG_PROLOG_POWEROFF',
            'HOTPLUG_EPILOG_POWEROFF',
            'BOOT_MIGRATE',
            'BOOT_FAILURE',
            'BOOT_MIGRATE_FAILURE',
            'PROLOG_MIGRATE_FAILURE',
            'PROLOG_FAILURE',
            'EPILOG_FAILURE',
            'EPILOG_STOP_FAILURE',
            'EPILOG_UNDEPLOY_FAILURE',
            'PROLOG_MIGRATE_POWEROFF',
            'PROLOG_MIGRATE_POWEROFF_FAILURE',
            'PROLOG_MIGRATE_SUSPEND',
            'PROLOG_MIGRATE_SUSPEND_FAILURE',
            'BOOT_UNDEPLOY_FAILURE',
            'BOOT_STOPPED_FAILURE',
            'PROLOG_RESUME_FAILURE',
            'PROLOG_UNDEPLOY_FAILURE',
            'DISK_SNAPSHOT_POWEROFF',
            'DISK_SNAPSHOT_REVERT_POWEROFF',
            'DISK_SNAPSHOT_DELETE_POWEROFF',
            'DISK_SNAPSHOT_SUSPENDED',
            'DISK_SNAPSHOT_REVERT_SUSPENDED',
            'DISK_SNAPSHOT_DELETE_SUSPENDED',
            'DISK_SNAPSHOT',
            'DISK_SNAPSHOT_REVERT',
            'DISK_SNAPSHOT_DELETE',
            'PROLOG_MIGRATE_UNKNOWN',
            'PROLOG_MIGRATE_UNKNOWN_FAILURE',
            'DISK_RESIZE',
            'DISK_RESIZE_POWEROFF',
            'DISK_RESIZE_UNDEPLOYED',
            'HOTPLUG_NIC_POWEROFF',
            'HOTPLUG_RESIZE',
            'HOTPLUG_SAVEAS_UNDEPLOYED',
            'HOTPLUG_SAVEAS_STOPPED',
            'BACKUP',
            'BACKUP_POWEROFF',
            'RESTORE'
        ]

        SHORT_VM_STATES={
            'INIT'              => 'init',
            'PENDING'           => 'pend',
            'HOLD'              => 'hold',
            'ACTIVE'            => 'actv',
            'STOPPED'           => 'stop',
            'SUSPENDED'         => 'susp',
            'DONE'              => 'done',
            'FAILED'            => 'fail',
            'POWEROFF'          => 'poff',
            'UNDEPLOYED'        => 'unde',
            'CLONING'           => 'clon',
            'CLONING_FAILURE'   => 'fail'
        }

        SHORT_LCM_STATES={
            'PROLOG'            => 'prol',
            'BOOT'              => 'boot',
            'RUNNING'           => 'runn',
            'MIGRATE'           => 'migr',
            'SAVE_STOP'         => 'save',
            'SAVE_SUSPEND'      => 'save',
            'SAVE_MIGRATE'      => 'save',
            'PROLOG_MIGRATE'    => 'migr',
            'PROLOG_RESUME'     => 'prol',
            'EPILOG_STOP'       => 'epil',
            'EPILOG'            => 'epil',
            'SHUTDOWN'          => 'shut',
            'CANCEL'            => 'shut',
            'FAILURE'           => 'fail',
            'CLEANUP_RESUBMIT'  => 'clea',
            'UNKNOWN'           => 'unkn',
            'HOTPLUG'           => 'hotp',
            'SHUTDOWN_POWEROFF' => 'shut',
            'BOOT_UNKNOWN'      => 'boot',
            'BOOT_POWEROFF'     => 'boot',
            'BOOT_SUSPENDED'    => 'boot',
            'BOOT_STOPPED'      => 'boot',
            'CLEANUP_DELETE'    => 'clea',
            'HOTPLUG_SNAPSHOT'  => 'snap',
            'HOTPLUG_NIC'       => 'hotp',
            'HOTPLUG_SAVEAS'           => 'hotp',
            'HOTPLUG_SAVEAS_POWEROFF'  => 'hotp',
            'HOTPLUG_SAVEAS_SUSPENDED' => 'hotp',
            'SHUTDOWN_UNDEPLOY' => 'shut',
            'EPILOG_UNDEPLOY'   => 'epil',
            'PROLOG_UNDEPLOY'   => 'prol',
            'BOOT_UNDEPLOY'     => 'boot',
            'HOTPLUG_PROLOG_POWEROFF'   => 'hotp',
            'HOTPLUG_EPILOG_POWEROFF'   => 'hotp',
            'BOOT_MIGRATE'              => 'boot',
            'BOOT_FAILURE'              => 'fail',
            'BOOT_MIGRATE_FAILURE'      => 'fail',
            'PROLOG_MIGRATE_FAILURE'    => 'fail',
            'PROLOG_FAILURE'            => 'fail',
            'EPILOG_FAILURE'            => 'fail',
            'EPILOG_STOP_FAILURE'       => 'fail',
            'EPILOG_UNDEPLOY_FAILURE'   => 'fail',
            'PROLOG_MIGRATE_POWEROFF'   => 'migr',
            'PROLOG_MIGRATE_POWEROFF_FAILURE'   => 'fail',
            'PROLOG_MIGRATE_SUSPEND'            => 'migr',
            'PROLOG_MIGRATE_SUSPEND_FAILURE'    => 'fail',
            'BOOT_UNDEPLOY_FAILURE'     => 'fail',
            'BOOT_STOPPED_FAILURE'      => 'fail',
            'PROLOG_RESUME_FAILURE'     => 'fail',
            'PROLOG_UNDEPLOY_FAILURE'   => 'fail',
            'DISK_SNAPSHOT_POWEROFF'        => 'snap',
            'DISK_SNAPSHOT_REVERT_POWEROFF' => 'snap',
            'DISK_SNAPSHOT_DELETE_POWEROFF' => 'snap',
            'DISK_SNAPSHOT_SUSPENDED'       => 'snap',
            'DISK_SNAPSHOT_REVERT_SUSPENDED'=> 'snap',
            'DISK_SNAPSHOT_DELETE_SUSPENDED'=> 'snap',
            'DISK_SNAPSHOT'        => 'snap',
            'DISK_SNAPSHOT_DELETE' => 'snap',
            'PROLOG_MIGRATE_UNKNOWN' => 'migr',
            'PROLOG_MIGRATE_UNKNOWN_FAILURE' => 'fail',
            'DISK_RESIZE'            => 'drsz',
            'DISK_RESIZE_POWEROFF'   => 'drsz',
            'DISK_RESIZE_UNDEPLOYED' => 'drsz',
            'HOTPLUG_NIC_POWEROFF'   => 'hotp',
            'HOTPLUG_RESIZE'         => 'hotp',
            'HOTPLUG_SAVEAS_UNDEPLOYED'  => 'hotp',
            'HOTPLUG_SAVEAS_STOPPED'     => 'hotp',
            'BACKUP'            => 'back',
            'BACKUP_POWEROFF'   => 'back',
            'RESTORE'           => 'rest'
        }

        HISTORY_ACTION=[
          'none',
          'migrate',
          'live-migrate',
          'shutdown',
          'shutdown-hard',
          'undeploy',
          'undeploy-hard',
          'hold',
          'release',
          'stop',
          'suspend',
          'resume',
          'boot',
          'delete',
          'delete-recreate',
          'reboot',
          'reboot-hard',
          'resched',
          'unresched',
          'poweroff',
          'poweroff-hard',
          'disk-attach',
          'disk-detach',
          'nic-attach',
          'nic-detach',
          'disk-snapshot-create',
          'disk-snapshot-delete',
          'terminate',
          'terminate-hard',
          'disk-resize',
          'deploy',
          'chown',
          'chmod',
          'updateconf',
          'rename',
          'resize',
          'update',
          'snapshot-resize',
          'snapshot-delete',
          'snapshot-revert',
          'disk-saveas',
          'disk-snapshot-revert',
          'recover',
          'retry',
          'monitor',
          'disk-snapshot-rename',
          'alias-attach',
          'alias-detach',
          'poweroff-migrate',
          'poweroff-hard-migrate',
          'backup',
          'nic-update',
          'backup-cancel',
          'sched-add',
          'sched-update',
          'sched-delete',
          'sg-attach',
          'sg-detach',
          'pci-attach',
          'pci-detach',
          'restore'
        ]

        EXTERNAL_IP_ATTRS = [
            'GUEST_IP',
            'AWS_IP_ADDRESS',
            'AWS_PUBLIC_IP_ADDRESS',
            'AWS_PRIVATE_IP_ADDRESS',
            'AZ_IPADDRESS',
            'SL_PRIMARYIPADDRESS'
        ]

        # VirtualMachineDriver constants
        module Driver

            POLL_ATTRIBUTE = {
                :memory          => 'MEMORY',
                :cpu             => 'CPU',
                :nettx           => 'NETTX',
                :netrx           => 'NETRX',
                :state           => 'STATE',
                :disk_size       => 'DISK_SIZE',
                :snapshot_size   => 'SNAPSHOT_SIZE'
            }

            VM_STATE = {
                :active  => 'a',
                :paused  => 'p',
                :error   => 'e',
                :deleted => 'd',
                :unknown => '-'
            }

        end

        # Creates a VirtualMachine description with just its identifier
        # this method should be used to create plain VirtualMachine objects.
        # +id+ the id of the vm
        #
        # Example:
        #   vm = VirtualMachine.new(VirtualMachine.build_xml(3),rpc_client)
        #
        def self.build_xml(pe_id = nil)
            if pe_id
                vm_xml = "<VM><ID>#{pe_id}</ID></VM>"
            else
                vm_xml = '<VM></VM>'
            end

            XMLElement.build_xml(vm_xml, 'VM')
        end

        def self.get_history_action(action)
            HISTORY_ACTION[action.to_i]
        end

        # Class constructor
        def initialize(xml, client)
            LockableExt.make_lockable(self, VM_METHODS)

            super(xml, client)
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Machine Object
        #######################################################################

        # Retrieves the information of the given VirtualMachine.
        def info(decrypt = false)
            super(VM_METHODS[:info], 'VM', decrypt)
        end

        alias info! info

        # Allocates a new VirtualMachine in OpenNebula
        #
        # @param description [String] A string containing the template of
        #   the VirtualMachine.
        # @param hold [true,false] false to create the VM in pending state,
        #   true to create it on hold
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description, hold = false)
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
        def update(new_template = nil, append = false)
            super(VM_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Returns the <USER_TEMPLATE> element in text form
        #
        # @param indent [true,false] indents the resulting string, defaults to true
        #
        # @return [String] The USER_TEMPLATE
        def user_template_str(indent = true)
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

        def replace(opts = {})
            super(opts, 'USER_TEMPLATE')
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
        def deploy(host_id, enforce = false, ds_id = -1, extra_template = '')
            enforce ||= false
            ds_id ||= -1
            extra_template ||= ''

            info

            call(VM_METHODS[:deploy],
                 @pe_id,
                 host_id.to_i,
                 enforce,
                 ds_id.to_i,
                 extra_template)
        end

        # Shutdowns an already deployed VM
        def terminate(hard = false)
            action(hard ? 'terminate-hard' : 'terminate')
        end

        alias shutdown terminate

        # Shuts down an already deployed VM, saving its state in the system DS
        def undeploy(hard = false)
            action(hard ? 'undeploy-hard' : 'undeploy')
        end

        # Powers off a running VM
        def poweroff(hard = false)
            action(hard ? 'poweroff-hard' : 'poweroff')
        end

        # Reboots an already deployed VM
        def reboot(hard = false)
            action(hard ? 'reboot-hard' : 'reboot')
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
            call(VM_METHODS[:attach], @pe_id, disk_template)
        end

        alias attachdisk disk_attach

        # Detaches a disk from a running VM
        #
        # @param disk_id [Integer] Id of the disk to be detached
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def disk_detach(disk_id)
            call(VM_METHODS[:detach], @pe_id, disk_id)
        end

        alias detachdisk disk_detach

        # Attaches a NIC to a running VM
        #
        # @param nic_template [String] Template containing a NIC element
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def nic_attach(nic_template)
            call(VM_METHODS[:attachnic], @pe_id, nic_template)
        end

        # Detaches a NIC from a running VM
        #
        # @param nic_id [Integer] Id of the NIC to be detached
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def nic_detach(nic_id)
            call(VM_METHODS[:detachnic], @pe_id, nic_id)
        end

        # Updates a NIC for a running VM
        #
        # @param nic_id [Integer] Id of the NIC to be updated
        # @param nic_template [String] Template with updated attributes
        # @param append [true|false] True to append new attributes instead of
        #   replace the whole template
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def nic_update(nic_id, nic_template, append = false)
            call(VM_METHODS[:updatenic], @pe_id, nic_id, nic_template, append ? 1 : 0)
        end

        # Attaches a Security Groupt to a running VM
        #
        # @param nic_id [Integer] Id of the NIC, where to attach SG
        # @param sg_id [Integer] Id of the SG to be attached
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def sg_attach(nic_id, sg_id)
            call(VM_METHODS[:attachsg], @pe_id, nic_id, sg_id)
        end

        # Detaches a Security Group from a running VM
        #
        # @param sg_id [Integer] Id of the SG to be detached
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def sg_detach(nic_id, sg_id)
            call(VM_METHODS[:detachsg], @pe_id, nic_id, sg_id)
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
        # @param ds_id [Integer] The System Datastore where to migrate the VM.
        #   To use the current one, set it to -1
        # @param mtype [Integer] How to perform the cold migration:
        #     - 0: save - restore,
        #     - 1: power off - boot
        #     - 2: power off hard - boot
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def migrate(host_id, live = false, enforce = false, ds_id = -1, mtype = 0)
            call(VM_METHODS[:migrate], @pe_id, host_id.to_i, live==true,
                 enforce, ds_id.to_i, mtype)
        end

        # @deprecated use {#migrate} instead
        def live_migrate(host_id, enforce = false)
            migrate(host_id, true, enforce)
        end

        # Set the specified vm's disk to be saved as a new image
        #
        # @param disk_id [Integer] ID of the disk to be saved
        # @param image_name [String] Name for the new image where the
        #   disk will be saved
        # @param image_type [String] Type of the new image. Set to empty string
        #   to use the default type
        # @param snap_id [Integer] ID of the snapshot to save, -1 to use the
        # current disk image state
        #
        # @return [Integer, OpenNebula::Error] the new Image ID in case of
        #   success, error otherwise
        def disk_saveas(disk_id, image_name, image_type = '', snap_id = -1)
            return Error.new('ID not defined') unless @pe_id

            @client.call(VM_METHODS[:disksaveas],
                         @pe_id,
                         disk_id,
                         image_name,
                         image_type,
                         snap_id)
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
            call(VM_METHODS[:resize], @pe_id, capacity_template, enforce)
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
        #   vm.monitoring( ['CPU', 'NETTX'] )
        #
        #   {
        #    "CPU"=>[["1435085098", "47"], ["1435085253", "5"],
        #      ["1435085410", "48"], ["1435085566", "3"], ["1435088136", "2"]],
        #    "NETTX"=>[["1435085098", "0"], ["1435085253", "50"],
        #      ["1435085410", "50"], ["1435085566", "50"], ["1435085723", "50"]]
        #   }
        #
        def monitoring(xpath_expressions)
            super(VM_METHODS[:monitoring], xpath_expressions)
        end

        # Retrieves this VM's monitoring data from OpenNebula, in XML
        #
        # @return [String] VM monitoring data, in XML
        def monitoring_xml
            return Error.new('ID not defined') unless @pe_id

            @client.call(VM_METHODS[:monitoring], @pe_id)
        end

        # Renames this VM
        #
        # @param name [String] New name for the VM.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            call(VM_METHODS[:rename], @pe_id, name)
        end

        # Creates a new VM snapshot
        #
        # @param name [String] Name for the snapshot.
        #
        # @return [Integer, OpenNebula::Error] The new snaphost ID in case
        #   of success, Error otherwise
        def snapshot_create(name = '')
            return Error.new('ID not defined') unless @pe_id

            name ||= ''
            @client.call(VM_METHODS[:snapshotcreate], @pe_id, name)
        end

        # Reverts to a snapshot
        #
        # @param snap_id [Integer] Id of the snapshot
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def snapshot_revert(snap_id)
            call(VM_METHODS[:snapshotrevert], @pe_id, snap_id)
        end

        # Deletes a  VM snapshot
        #
        # @param snap_id [Integer] Id of the snapshot
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def snapshot_delete(snap_id)
            call(VM_METHODS[:snapshotdelete], @pe_id, snap_id)
        end

        # Takes a new snapshot of a disk
        #
        # @param disk_id [Integer] Id of the disk
        # @param name [String] description for the snapshot
        #
        # @return [Integer, OpenNebula::Error] The new snapshot ID or error
        def disk_snapshot_create(disk_id, name)
            call(VM_METHODS[:disksnapshotcreate], @pe_id, disk_id, name)
        end

        # Reverts disk state to a previously taken snapshot
        #
        # @param disk_id [Integer] Id of the disk
        # @param snap_id [Integer] Id of the snapshot
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def disk_snapshot_revert(disk_id, snap_id)
            call(VM_METHODS[:disksnapshotrevert], @pe_id, disk_id, snap_id)
        end

        # Deletes a disk snapshot
        #
        # @param disk_id [Integer] Id of the disk
        # @param snap_id [Integer] Id of the snapshot
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def disk_snapshot_delete(disk_id, snap_id)
            call(VM_METHODS[:disksnapshotdelete], @pe_id, disk_id, snap_id)
        end

        # Renames a disk snapshot
        #
        # @param disk_id  [Integer] Id of the disk
        # @param snap_id  [Integer] Id of the snapshot
        # @param new_name [String]  New name for the snapshot
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def disk_snapshot_rename(disk_id, snap_id, new_name)
            call(VM_METHODS[:disksnapshotrename], @pe_id, disk_id, snap_id, new_name)
        end

        # Changes the size of a disk
        #
        # @param disk_id [Integer] Id of the disk
        # @param size [Integer] new size in MiB
        #
        # @return [nil, OpenNebula::Error] nil in case of success or error
        def disk_resize(disk_id, size)
            call(VM_METHODS[:diskresize], @pe_id, disk_id, size.to_s)
        end

        # Recovers an ACTIVE VM
        #
        # @param result [Integer] Recover with failure (0), success (1),
        # retry (2), delete (3), delete-recreate (4), delete-db (5)
        # @param result [info] Additional information needed to recover the VM
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def recover(result)
            call(VM_METHODS[:recover], @pe_id, result)
        end

        # Deletes a VM from the pool
        def delete(recreate = false)
            if recreate
                recover(4)
            else
                recover(3)
            end
        end

        # Changes the attributes of a VM in power off, failure and undeploy
        #   states
        #
        # @param new_conf, string describing the new attributes. Each attribute
        #  will replace the existing ones or delete it if empty. Attributes that
        #  can be updated are: INPUT/{TYPE, BUS}; RAW/{TYPE, DATA, DATA_VMX},
        #  OS/{BOOT, BOOTLOADER, ARCH, MACHINE, KERNEL, INITRD},
        #  FEATURES/{ACPI, APIC, PAE, LOCALTIME, HYPERV, GUEST_AGENT, VIRTIO_SCSI_QUEUES, VIRTIO_BLK_QUEUES, IOTHREADS},
        #  GRAPHICS/{TYPE, LISTEN, PASSWD, KEYMAP},
        #  and VIDEO/{TYPE, IOMMU, ATS, VRAM, RESOLUTION}
        # @param append, append template, do not delete empty attributes
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def updateconf(new_conf, append = false)
            call(VM_METHODS[:updateconf], @pe_id, new_conf, append ? 1 : 0)
        end

        # Add sched actions
        #
        # @param sched_template [String] Template with SCHED_ACTIONs
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def sched_action_add(sched_template)
            call(VM_METHODS[:schedadd], @pe_id, sched_template)
        end

        # Delete sched action
        #
        # @param sched_id [Int] id of the SCHED_ACTION
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def sched_action_delete(sched_id)
            call(VM_METHODS[:scheddelete], @pe_id, sched_id.to_i)
        end

        # Update sched_action
        #
        # @param sched_id [Int] id of the SCHED_ACTION
        # @param sched_template [String] Template containing a SCHED_ACTION
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def sched_action_update(sched_id, sched_template)
            call(VM_METHODS[:schedupdate], @pe_id, sched_id.to_i,
                 sched_template)
        end

        # Generate a backup for the VM (backup config must be set)
        #
        # @param ds_id  [Integer] Id of the datastore to save the backup
        # @return [Integer, OpenNebula::Error] ID of the resulting BACKUP image
        # in case of success, Error otherwise.
        def backup(ds_id = -1, reset = false)
            @client.call(VM_METHODS[:backup], @pe_id, ds_id, reset)
        end

        # Cancel ongoing backup operation for the VM
        #
        # @return [nil, OpenNebula::Error] nil in case of sucess, Error
        #  otherwise.
        def backup_cancel
            @client.call(VM_METHODS[:backupcancel], @pe_id)
        end

        # Attaches a PCI to a VM
        #
        # @param pci [String] Template containing a PCI element
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def pci_attach(pci)
            call(VM_METHODS[:attachpci], @pe_id, pci)
        end

        # Detaches a PCI from a VM
        #
        # @param pci_id [Integer] Id of the PCI to be detached
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def pci_detach(pci_id)
            call(VM_METHODS[:detachpci], @pe_id, pci_id)
        end

        # Restore the VM from backup Image
        #
        # @return [nil, OpenNebula::Error] nil in case of sucess, Error
        #  otherwise.
        def restore(img_id, inc_id, disk_id)
            @client.call(VM_METHODS[:restore], @pe_id, img_id, inc_id, disk_id)
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

            if short_state_str=='actv'
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

        def get_history_record(seq)
            retrieve_xmlelements('//HISTORY')[seq].to_xml
        end

        def wait_state(state, timeout = 120)
            require 'opennebula/wait_ext'

            extend OpenNebula::WaitExt

            rc = wait2(state, 'LCM_INIT', timeout)

            return Error.new("Timeout expired for state #{state}.") unless rc

            true
        end

        def wait_state2(state, lcm_state, timeout = 120)
            extend OpenNebula::WaitExt

            rc = wait2(state, lcm_state, timeout)

            return Error.new("Timeout expired for state #{state}.") unless rc

            true
        end

        private

        def action(name)
            return Error.new('ID not defined') unless @pe_id

            rc = @client.call(VM_METHODS[:action], name, @pe_id)
            rc = nil unless OpenNebula.is_error?(rc)

            rc
        end

        def wait_lcm_state(state, timeout = 10)
            vm_state = ''
            lcm_state = ''

            timeout.times do
                rc = info
                return rc if OpenNebula.is_error?(rc)

                vm_state = state_str
                lcm_state = lcm_state_str

                if lcm_state == state
                    return true
                end

                sleep 1
            end

            Error.new("Timeout expired for state #{state}. "<<
                "VM is in state #{vm_state}, #{lcm_state}")
        end

    end

end
