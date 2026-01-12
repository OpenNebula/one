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

require 'opennebula/grpc/secgroup_services_pb'

module GRPCMappings

    SECURITYGROUP_MAP = {
        'secgroup.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Secgroup::SecurityGroupService::Stub.new(endpoint,
                                                                 :this_channel_is_insecure)
            req  = One::Secgroup::AllocateRequest.new(:session_id => one_auth, :template => args[0])
            stub.allocate(req, options)
        end,

        'secgroup.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Secgroup::SecurityGroupService::Stub.new(endpoint,
                                                                 :this_channel_is_insecure)
            req  = One::Secgroup::DeleteRequest.new(:session_id => one_auth, :oid => args[0])
            stub.delete(req, options)
        end,

        'secgroup.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Secgroup::SecurityGroupService::Stub.new(endpoint,
                                                                 :this_channel_is_insecure)
            req  = One::Secgroup::UpdateRequest.new(:session_id => one_auth,
                                                    :oid        => args[0],
                                                    :template   => args[1],
                                                    :append     => args[2])
            stub.update(req, options)
        end,

        'secgroup.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Secgroup::SecurityGroupService::Stub.new(endpoint,
                                                                 :this_channel_is_insecure)
            req  = One::Secgroup::RenameRequest.new(:session_id => one_auth,
                                                    :oid        => args[0],
                                                    :name       => args[1])
            stub.rename(req, options)
        end,

        'secgroup.chmod' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Secgroup::SecurityGroupService::Stub.new(endpoint,
                                                                 :this_channel_is_insecure)
            req  = One::Secgroup::ChmodRequest.new(:session_id   => one_auth,
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

        'secgroup.chown' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Secgroup::SecurityGroupService::Stub.new(endpoint,
                                                                 :this_channel_is_insecure)
            req  = One::Secgroup::ChownRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :user_id    => args[1],
                                                   :group_id   => args[2])
            stub.chown(req, options)
        end,

        'secgroup.clone' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Secgroup::SecurityGroupService::Stub.new(endpoint,
                                                                 :this_channel_is_insecure)
            req  = One::Secgroup::CloneRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :name       => args[1])
            stub.clone(req, options)
        end,

        'secgroup.commit' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Secgroup::SecurityGroupService::Stub.new(endpoint,
                                                                 :this_channel_is_insecure)
            req  = One::Secgroup::CommitRequest.new(:session_id => one_auth,
                                                    :oid        => args[0],
                                                    :recovery   => args[1])
            stub.commit(req, options)
        end,

        'secgroup.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Secgroup::SecurityGroupService::Stub.new(endpoint,
                                                                 :this_channel_is_insecure)
            req  = One::Secgroup::InfoRequest.new(:session_id => one_auth,
                                                  :oid        => args[0],
                                                  :decrypt    => args[1])
            stub.info(req, options)
        end,

        'secgrouppool.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Secgroup::SecurityGroupService::Stub.new(endpoint,
                                                                 :this_channel_is_insecure)
            req  = One::Secgroup::PoolInfoRequest.new(:session_id => one_auth,
                                                      :filter_flag => args[0],
                                                      :start       => args[1],
                                                      :end         => args[2])
            stub.pool_info(req, options)
        end
    }.freeze

end
