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

require 'opennebula/grpc/vrouter_services_pb'

module GRPCMappings

    VIRTUALROUTER_MAP = {
        'vrouter.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::AllocateRequest.new(:session_id => one_auth, :template => args[0])
            stub.allocate(req, options)
        end,

        'vrouter.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::DeleteRequest.new(:session_id => one_auth, :oid => args[0])
            stub.delete(req, options)
        end,

        'vrouter.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::UpdateRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :template   => args[1],
                                                   :append     => args[2])
            stub.update(req, options)
        end,

        'vrouter.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::RenameRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :name       => args[1])
            stub.rename(req, options)
        end,

        'vrouter.instantiate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::InstantiateRequest.new(:session_id => one_auth,
                                                        :oid        => args[0],
                                                        :n_vms      => args[1],
                                                        :template_id => args[2],
                                                        :name       => args[3],
                                                        :hold       => args[4],
                                                        :str_uattrs => args[5])
            stub.instantiate(req, options)
        end,

        'vrouter.attachnic' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::AttachNicRequest.new(:session_id => one_auth,
                                                      :oid        => args[0],
                                                      :template   => args[1])
            stub.attach_nic(req, options)
        end,

        'vrouter.detachnic' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::DetachNicRequest.new(:session_id => one_auth,
                                                      :oid        => args[0],
                                                      :nic_id     => args[1])
            stub.detach_nic(req, options)
        end,

        'vrouter.lock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::LockRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :level      => args[1],
                                                 :test       => args[2])
            stub.lock(req, options)
        end,

        'vrouter.unlock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::UnlockRequest.new(:session_id => one_auth,
                                                   :oid => args[0])
            stub.unlock(req, options)
        end,

        'vrouter.chown' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::ChownRequest.new(:session_id => one_auth,
                                                  :oid        => args[0],
                                                  :user_id    => args[1],
                                                  :group_id   => args[2])
            stub.chown(req, options)
        end,

        'vrouter.chmod' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::ChmodRequest.new(:session_id   => one_auth,
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

        'vrouter.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::InfoRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :decrypt    => args[1])
            stub.info(req, options)
        end,

        'vrouterpool.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vrouter::VirtualRouterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vrouter::PoolInfoRequest.new(:session_id => one_auth,
                                                     :filter_flag => args[0],
                                                     :start       => args[1],
                                                     :end         => args[2])
            stub.pool_info(req, options)
        end
    }.freeze

end
