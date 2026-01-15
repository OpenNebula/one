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

require 'opennebula/grpc/vmgroup_services_pb'

module GRPCMappings

    VMGROUP_MAP = {
        'vmgroup.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::AllocateRequest.new(:session_id => one_auth, :template => args[0])
            stub.allocate(req, options)
        end,

        'vmgroup.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::DeleteRequest.new(:session_id => one_auth, :oid => args[0])
            stub.delete(req, options)
        end,

        'vmgroup.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::UpdateRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :template   => args[1],
                                                   :append     => args[2])
            stub.update(req, options)
        end,

        'vmgroup.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::RenameRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :name       => args[1])
            stub.rename(req, options)
        end,

        'vmgroup.chmod' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::ChmodRequest.new(:session_id   => one_auth,
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

        'vmgroup.chown' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::ChownRequest.new(:session_id => one_auth,
                                                  :oid        => args[0],
                                                  :user_id    => args[1],
                                                  :group_id   => args[2])
            stub.chown(req, options)
        end,

        'vmgroup.lock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::LockRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :level      => args[1],
                                                 :test       => args[2])
            stub.lock(req, options)
        end,

        'vmgroup.unlock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::UnlockRequest.new(:session_id => one_auth,
                                                   :oid        => args[0])
            stub.unlock(req, options)
        end,

        'vmgroup.roleadd' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::AddRoleRequest.new(:session_id => one_auth,
                                                    :oid        => args[0],
                                                    :template   => args[1])
            stub.add_role(req, options)
        end,

        'vmgroup.roledelete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::DelRoleRequest.new(:session_id => one_auth,
                                                    :oid        => args[0],
                                                    :role_id    => args[1])
            stub.del_role(req, options)
        end,

        'vmgroup.roleupdate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::UpdateRoleRequest.new(:session_id => one_auth,
                                                       :oid        => args[0],
                                                       :role_id    => args[1],
                                                       :template   => args[2])
            stub.update_role(req, options)
        end,

        'vmgroup.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::InfoRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :decrypt    => args[1])
            stub.info(req, options)
        end,

        'vmgrouppool.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vmgroup::VMGroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vmgroup::PoolInfoRequest.new(:session_id => one_auth,
                                                     :filter_flag => args[0],
                                                     :start       => args[1],
                                                     :end         => args[2])
            stub.pool_info(req, options)
        end
    }.freeze

end
