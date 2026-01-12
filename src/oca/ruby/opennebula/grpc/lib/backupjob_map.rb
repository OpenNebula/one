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

require 'opennebula/grpc/backupjob_services_pb'

module GRPCMappings

    BACKUPJOB_MAP = {
        'backupjob.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::AllocateRequest.new(:session_id => one_auth,
                                                       :template => args[0])
            stub.allocate(req, options)
        end,

        'backupjob.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::DeleteRequest.new(:session_id => one_auth, :oid => args[0])
            stub.delete(req, options)
        end,

        'backupjob.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::UpdateRequest.new(:session_id => one_auth,
                                                     :oid        => args[0],
                                                     :template   => args[1],
                                                     :append     => args[2])
            stub.update(req, options)
        end,

        'backupjob.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::RenameRequest.new(:session_id => one_auth,
                                                     :oid        => args[0],
                                                     :name       => args[1])
            stub.rename(req, options)
        end,

        'backupjob.chmod' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::ChmodRequest.new(:session_id   => one_auth,
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

        'backupjob.chown' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::ChownRequest.new(:session_id => one_auth,
                                                    :oid        => args[0],
                                                    :user_id    => args[1],
                                                    :group_id   => args[2])
            stub.chown(req, options)
        end,

        'backupjob.lock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::LockRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :level      => args[1],
                                                   :test       => args[2])
            stub.lock(req, options)
        end,

        'backupjob.unlock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::UnlockRequest.new(:session_id => one_auth,
                                                     :oid        => args[0])
            stub.unlock(req, options)
        end,

        'backupjob.backup' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::BackupRequest.new(:session_id => one_auth,
                                                     :oid        => args[0])
            stub.backup(req, options)
        end,

        'backupjob.cancel' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::CancelRequest.new(:session_id => one_auth,
                                                     :oid        => args[0])
            stub.cancel(req, options)
        end,

        'backupjob.retry' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::RetryRequest.new(:session_id => one_auth,
                                                    :oid        => args[0])
            stub.retry(req, options)
        end,

        'backupjob.priority' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::PriorityRequest.new(:session_id => one_auth,
                                                       :oid        => args[0],
                                                       :priority   => args[1])
            stub.priority(req, options)
        end,

        'backupjob.schedadd' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::SchedAddRequest.new(:session_id => one_auth,
                                                       :oid        => args[0],
                                                       :template   => args[1])
            stub.sched_add(req, options)
        end,

        'backupjob.scheddelete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::SchedDelRequest.new(:session_id => one_auth,
                                                       :oid        => args[0],
                                                       :sa_id      => args[1])
            stub.sched_del(req, options)
        end,

        'backupjob.schedupdate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::SchedUpdateRequest.new(:session_id => one_auth,
                                                          :oid        => args[0],
                                                          :sa_id      => args[1],
                                                          :template   => args[2])
            stub.sched_update(req, options)
        end,

        'backupjob.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::InfoRequest.new(:session_id => one_auth,
                                                   :oid        => args[0])
            stub.info(req, options)
        end,

        'backupjobpool.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Backupjob::BackupJobService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Backupjob::PoolInfoRequest.new(:session_id => one_auth,
                                                       :filter_flag => args[0],
                                                       :start       => args[1],
                                                       :end         => args[2])
            stub.pool_info(req, options)
        end
    }.freeze

end
