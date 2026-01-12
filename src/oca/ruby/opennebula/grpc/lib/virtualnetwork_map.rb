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

require 'opennebula/grpc/vn_services_pb'

module GRPCMappings

    VIRTUALNETWORK_MAP = {
        'vn.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::AllocateRequest.new(:session_id => one_auth,
                                                :template   => args[0],
                                                :cluster_id => args[1])
            stub.allocate(req, options)
        end,

        'vn.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::DeleteRequest.new(:session_id => one_auth,
                                              :oid        => args[0])
            stub.delete(req, options)
        end,

        'vn.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::InfoRequest.new(:session_id => one_auth,
                                            :oid        => args[0],
                                            :decrypt    => args[1])
            stub.info(req, options)
        end,

        'vn.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::UpdateRequest.new(:session_id => one_auth,
                                              :oid        => args[0],
                                              :template   => args[1],
                                              :append     => args[2])
            stub.update(req, options)
        end,

        'vn.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::RenameRequest.new(:session_id   => one_auth,
                                              :oid          => args[0],
                                              :name         => args[1])
            stub.rename(req, options)
        end,

        'vn.chmod' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::ChmodRequest.new(:session_id   => one_auth,
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

        'vn.chown' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::ChownRequest.new(:session_id => one_auth,
                                             :oid        => args[0],
                                             :user_id    => args[1],
                                             :group_id   => args[2])
            stub.chown(req, options)
        end,

        'vn.lock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::LockRequest.new(:session_id => one_auth,
                                            :oid        => args[0],
                                            :level      => args[1],
                                            :test       => args[2])
            stub.lock(req, options)
        end,

        'vn.unlock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::UnlockRequest.new(:session_id => one_auth,
                                              :oid        => args[0])
            stub.unlock(req, options)
        end,

        'vn.add_ar' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::AddARRequest.new(:session_id => one_auth,
                                             :oid        => args[0],
                                             :template   => args[1])
            stub.add_ar(req, options)
        end,

        'vn.rm_ar' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::RmARRequest.new(:session_id => one_auth,
                                            :oid        => args[0],
                                            :ar_id      => args[1],
                                            :force      => args[2])
            stub.rm_ar(req, options)
        end,

        'vn.update_ar' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::UpdateARRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :template   => args[1])
            stub.update_ar(req, options)
        end,

        'vn.reserve' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::ReserveRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :template   => args[1])
            stub.reserve(req, options)
        end,

        'vn.free_ar' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::FreeARRequest.new(:session_id => one_auth,
                                              :oid        => args[0],
                                              :ar_id      => args[1])
            stub.free_ar(req, options)
        end,

        'vn.hold' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::HoldRequest.new(:session_id => one_auth,
                                            :oid        => args[0],
                                            :template   => args[1])
            stub.hold(req, options)
        end,

        'vn.release' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::ReleaseRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :template   => args[1])
            stub.release(req, options)
        end,

        'vn.recover' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vn::RecoverRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :operation  => args[1])
            stub.recover(req, options)
        end,

        'vnpool.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vn::VirtualNetworkService::Stub.new(endpoint, :this_channel_is_insecure)
            req = One::Vn::PoolInfoRequest.new(:session_id  => one_auth,
                                               :filter_flag => args[0],
                                               :start       => args[1],
                                               :end         => args[2])
            stub.pool_info(req, options)
        end
    }.freeze

end
