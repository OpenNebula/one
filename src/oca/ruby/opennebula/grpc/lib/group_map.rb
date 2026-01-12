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

require 'opennebula/grpc/group_services_pb'

module GRPCMappings

    GROUP_MAP = {
        'group.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Group::GroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Group::AllocateRequest.new(:session_id => one_auth, :gname => args[0])
            stub.allocate(req, options)
        end,

        'group.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Group::GroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Group::DeleteRequest.new(:session_id => one_auth, :oid => args[0])
            stub.delete(req, options)
        end,

        'group.quota' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Group::GroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Group::QuotaRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :quota      => args[1])
            stub.quota(req, options)
        end,

        'group.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Group::GroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Group::UpdateRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :template   => args[1],
                                                 :append     => args[2])
            stub.update(req, options)
        end,

        'group.addadmin' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Group::GroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Group::AddAdminRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :user_id    => args[1])
            stub.add_admin(req, options)
        end,

        'group.deladmin' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Group::GroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Group::DelAdminRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :user_id    => args[1])
            stub.del_admin(req, options)
        end,

        'group.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Group::GroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Group::InfoRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :decrypt    => args[1])
            stub.info(req, options)
        end,

        'groupquota.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::Group::GroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Group::InfoRequest.new(:session_id => one_auth)
            stub.default_quota_info(req, options)
        end,

        'groupquota.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Group::GroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Group::DefaultQuotaUpdateRequest.new(:session_id => one_auth,
                                                             :quota      => args[0])
            stub.default_quota_update(req, options)
        end,

        'grouppool.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::Group::GroupService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Group::PoolInfoRequest.new(:session_id => one_auth)
            stub.pool_info(req, options)
        end
    }.freeze

end
