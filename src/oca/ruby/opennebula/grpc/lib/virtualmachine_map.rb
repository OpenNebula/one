# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula/grpc/vm_services_pb'

module GRPCMappings

    MAX_MESSAGE_SIZE = 100 * 1024 * 1024 # 100 MB

    VIRTUALMACHINE_MAP = {
        'vm.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::AllocateRequest.new(:session_id => one_auth,
                                                :template   => args[0],
                                                :hold       => args[1])
            stub.allocate(req, options)
        end,

        'vm.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::InfoRequest.new(:session_id => one_auth,
                                            :oid        => args[0],
                                            :decrypt    => args[1])
            stub.info(req, options)
        end,

        'vm.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::UpdateRequest.new(:session_id => one_auth,
                                              :oid        => args[0],
                                              :template   => args[1],
                                              :append     => args[2])
            stub.update(req, options)
        end,

        'vm.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::RenameRequest.new(:session_id   => one_auth,
                                              :oid          => args[0],
                                              :name         => args[1])
            stub.rename(req, options)
        end,

        'vm.chmod' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::ChmodRequest.new(:session_id   => one_auth,
                                             :oid          => args[0],
                                             :user_use     => args[1],
                                             :user_manage  => args[2],
                                             :user_admin   => args[3],
                                             :group_use    => args[4],
                                             :group_manage => args[5],
                                             :group_admin  => args[6],
                                             :other_use    => args[7],
                                             :other_manage => args[8],
                                             :other_admin  => args[9])
            stub.chmod(req, options)
        end,

        'vm.chown' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::ChownRequest.new(:session_id => one_auth,
                                             :oid        => args[0],
                                             :user_id    => args[1],
                                             :group_id   => args[2])
            stub.chown(req, options)
        end,

        'vm.lock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::LockRequest.new(:session_id => one_auth,
                                            :oid        => args[0],
                                            :level      => args[1],
                                            :test       => args[2])
            stub.lock(req, options)
        end,

        'vm.unlock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::UnlockRequest.new(:session_id => one_auth,
                                              :oid        => args[0])
            stub.unlock(req, options)
        end,

        'vm.deploy' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::DeployRequest.new(:session_id    => one_auth,
                                              :oid           => args[0],
                                              :hid           => args[1],
                                              :no_overcommit => args[2],
                                              :ds_id         => args[3],
                                              :nic_template  => args[4])
            stub.deploy(req, options)
        end,

        'vm.action' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::ActionRequest.new(:session_id  => one_auth,
                                              :action_name => args[0],
                                              :oid         => args[1])
            stub.action(req, options)
        end,

        'vm.migrate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::MigrateRequest.new(:session_id     => one_auth,
                                               :oid            => args[0],
                                               :hid            => args[1],
                                               :live           => args[2],
                                               :no_overcommit  => args[3],
                                               :ds_id          => args[4],
                                               :migration_type => args[5])
            stub.migrate(req, options)
        end,

        'vm.disksaveas' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::DiskSaveAsRequest.new(:session_id  => one_auth,
                                                  :oid         => args[0],
                                                  :disk_id     => args[1],
                                                  :name        => args[2],
                                                  :image_type  => args[3],
                                                  :snap_id     => args[4])
            stub.disk_save_as(req, options)
        end,

        'vm.disksnapshotcreate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::DiskSnapshotCreateRequest.new(:session_id => one_auth,
                                                          :oid        => args[0],
                                                          :disk_id    => args[1],
                                                          :name       => args[2])
            stub.disk_snapshot_create(req, options)
        end,

        'vm.disksnapshotdelete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::DiskSnapshotDeleteRequest.new(:session_id => one_auth,
                                                          :oid        => args[0],
                                                          :disk_id    => args[1],
                                                          :snap_id    => args[2])
            stub.disk_snapshot_delete(req, options)
        end,

        'vm.disksnapshotrevert' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::DiskSnapshotRevertRequest.new(:session_id => one_auth,
                                                          :oid        => args[0],
                                                          :disk_id    => args[1],
                                                          :snap_id    => args[2])
            stub.disk_snapshot_revert(req, options)
        end,

        'vm.disksnapshotrename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::DiskSnapshotRenameRequest.new(:session_id => one_auth,
                                                          :oid       => args[0],
                                                          :disk_id   => args[1],
                                                          :snap_id   => args[2],
                                                          :name      => args[3])
            stub.disk_snapshot_rename(req, options)
        end,

        'vm.attach' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::DiskAttachRequest.new(:session_id => one_auth,
                                                  :oid        => args[0],
                                                  :template   => args[1])
            stub.disk_attach(req, options)
        end,

        'vm.detach' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::DiskDetachRequest.new(:session_id => one_auth,
                                                  :oid        => args[0],
                                                  :disk_id    => args[1])
            stub.disk_detach(req, options)
        end,

        'vm.diskresize' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::DiskResizeRequest.new(:session_id => one_auth,
                                                  :oid       => args[0],
                                                  :disk_id   => args[1],
                                                  :size      => args[2])
            stub.disk_resize(req, options)
        end,

        'vm.attachnic' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::NicAttachRequest.new(:session_id => one_auth,
                                                 :oid       => args[0],
                                                 :template  => args[1])
            stub.nic_attach(req, options)
        end,

        'vm.detachnic' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::NicDetachRequest.new(:session_id => one_auth,
                                                 :oid       => args[0],
                                                 :nic_id    => args[1])
            stub.nic_detach(req, options)
        end,

        'vm.updatenic' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::NicUpdateRequest.new(:session_id => one_auth,
                                                 :oid       => args[0],
                                                 :nic_id    => args[1],
                                                 :template  => args[2],
                                                 :append    => args[3])
            stub.nic_update(req, options)
        end,

        'vm.attachsg' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::SGAttachRequest.new(:session_id => one_auth,
                                                :oid       => args[0],
                                                :nic_id    => args[1],
                                                :sg_id     => args[2])
            stub.sg_attach(req, options)
        end,

        'vm.detachsg' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::SGDetachRequest.new(:session_id => one_auth,
                                                :oid       => args[0],
                                                :nic_id    => args[1],
                                                :sg_id     => args[2])
            stub.sg_detach(req, options)
        end,

        'vm.snapshotcreate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::SnapshotCreateRequest.new(:session_id => one_auth,
                                                      :oid        => args[0],
                                                      :name       => args[1])
            stub.snapshot_create(req, options)
        end,

        'vm.snapshotdelete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::SnapshotDeleteRequest.new(:session_id => one_auth,
                                                      :oid        => args[0],
                                                      :snap_id    => args[1])
            stub.snapshot_delete(req, options)
        end,

        'vm.snapshotrevert' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::SnapshotRevertRequest.new(:session_id => one_auth,
                                                      :oid        => args[0],
                                                      :snap_id    => args[1])
            stub.snapshot_revert(req, options)
        end,

        'vm.resize' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::ResizeRequest.new(:session_id     => one_auth,
                                              :oid           => args[0],
                                              :template      => args[1],
                                              :no_overcommit => args[2])
            stub.resize(req, options)
        end,

        'vm.updateconf' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::UpdateConfRequest.new(:session_id => one_auth,
                                                  :oid       => args[0],
                                                  :template  => args[1],
                                                  :append    => args[2])
            stub.update_conf(req, options)
        end,

        'vm.recover' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::RecoverRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :operation  => args[1])
            stub.recover(req, options)
        end,

        'vm.monitoring' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::MonitoringRequest.new(:session_id => one_auth,
                                                  :oid       => args[0])
            stub.monitoring(req, options)
        end,

        'vm.schedadd' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::SchedAddRequest.new(:session_id => one_auth,
                                                :oid       => args[0],
                                                :template  => args[1])
            stub.sched_add(req, options)
        end,

        'vm.schedupdate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::SchedUpdateRequest.new(:session_id => one_auth,
                                                   :oid       => args[0],
                                                   :sched_id  => args[1],
                                                   :template  => args[2])
            stub.sched_update(req, options)
        end,

        'vm.scheddelete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::SchedDeleteRequest.new(:session_id => one_auth,
                                                   :oid       => args[0],
                                                   :sched_id  => args[1])
            stub.sched_delete(req, options)
        end,

        'vm.backup' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::BackupRequest.new(:session_id => one_auth,
                                              :oid       => args[0],
                                              :ds_id     => args[1],
                                              :reset     => args[2])
            stub.backup(req, options)
        end,

        'vm.backupcancel' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::BackupCancelRequest.new(:session_id => one_auth,
                                                    :oid       => args[0])
            stub.backup_cancel(req, options)
        end,

        'vm.restore' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::RestoreRequest.new(:session_id   => one_auth,
                                               :oid          => args[0],
                                               :image_id     => args[1],
                                               :increment_id => args[2],
                                               :disk_id      => args[3])
            stub.restore(req, options)
        end,

        'vm.attachpci' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::PciAttachRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :template   => args[1])
            stub.pci_attach(req, options)
        end,

        'vm.detachpci' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::PciDetachRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :pci_id     => args[1])
            stub.pci_detach(req, options)
        end,

        'vm.exec' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::ExecRequest.new(:session_id => one_auth,
                                            :oid        => args[0],
                                            :cmd        => args[1],
                                            :cmd_stdin  => args[2])
            stub.exec(req, options)
        end,

        'vm.retryexec' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::ExecRetryRequest.new(:session_id => one_auth,
                                                 :oid        => args[0])
            stub.exec_retry(req, options)
        end,

        'vm.cancelexec' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vm::ExecCancelRequest.new(:session_id => one_auth,
                                                  :oid        => args[0])
            stub.exec_cancel(req, options)
        end,

        'vmpool.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(
                endpoint,
                :this_channel_is_insecure,
                :channel_args => { 'grpc.max_receive_message_length' => MAX_MESSAGE_SIZE }
            )
            req = One::Vm::PoolInfoRequest.new(:session_id  => one_auth,
                                               :filter_flag => args[0],
                                               :start       => args[1],
                                               :end         => args[2],
                                               :state       => args[3],
                                               :filter      => args[4])
            stub.pool_info(req, options)
        end,

        'vmpool.infoextended' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req = One::Vm::PoolInfoRequest.new(:session_id  => one_auth,
                                               :filter_flag => args[0],
                                               :start       => args[1],
                                               :end         => args[2],
                                               :state       => args[3],
                                               :filter      => args[4])
            stub.pool_info_extended(req, options)
        end,

        'vmpool.infoset' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req = One::Vm::PoolInfoSetRequest.new(:session_id => one_auth,
                                                  :ids        => args[0],
                                                  :extended   => args[1])
            stub.pool_info_set(req, options)
        end,

        'vmpool.monitoring' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req = One::Vm::PoolMonitoringRequestRequest.new(:session_id  => one_auth,
                                                            :filter_flag => args[0],
                                                            :seconds     => args[1])
            stub.pool_monitoring(req, options)
        end,

        'vmpool.accounting' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req = One::Vm::PoolAccountingRequest.new(:session_id  => one_auth,
                                                     :filter_flag => args[0],
                                                     :start_time  => args[1],
                                                     :end_time    => args[2])
            stub.pool_accounting(req, options)
        end,

        'vmpool.showback' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req = One::Vm::PoolShowbackRequest.new(:session_id  => one_auth,
                                                   :filter_flag => args[0],
                                                   :start_month => args[1],
                                                   :start_year  => args[2],
                                                   :end_month   => args[3],
                                                   :end_year    => args[4])
            stub.pool_showback(req, options)
        end,

        'vmpool.calculateshowback' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vm::VirtualMachineService::Stub.new(endpoint, :this_channel_is_insecure)
            req = One::Vm::PoolCalculateShowbackRequest.new(:session_id  => one_auth,
                                                            :start_month => args[0],
                                                            :start_year  => args[1],
                                                            :end_month   => args[2],
                                                            :end_year    => args[3])
            stub.pool_calculate_showback(req, options)
        end

    }.freeze

end
