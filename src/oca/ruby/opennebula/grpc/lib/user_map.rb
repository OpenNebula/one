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

require 'opennebula/grpc/user_services_pb'

module GRPCMappings

    USER_MAP = {
        'user.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::AllocateRequest.new(:session_id => one_auth,
                                                  :username   => args[0],
                                                  :password   => args[1],
                                                  :driver     => args[2],
                                                  :group_ids  => args[3])
            stub.allocate(req, options)
        end,

        'user.passwd' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::PasswordRequest.new(:session_id   => one_auth,
                                                  :oid          => args[0],
                                                  :new_password => args[1])
            stub.password(req, options)
        end,

        'user.chauth' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::ChangeAuthRequest.new(:session_id   => one_auth,
                                                    :oid          => args[0],
                                                    :new_password => args[1])
            stub.change_auth(req, options)
        end,

        'user.quota' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::QuotaRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :quota      => args[1])
            stub.quota(req, options)
        end,

        'user.enable' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::EnableRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :enable     => args[1])
            stub.enable(req, options)
        end,

        'user.chgrp' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::ChangeGroupRequest.new(:session_id => one_auth,
                                                     :oid        => args[0],
                                                     :new_gid    => args[1])
            stub.change_group(req, options)
        end,

        'user.addgroup' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::AddGroupRequest.new(:session_id => one_auth,
                                                  :oid        => args[0],
                                                  :group_id   => args[1])
            stub.add_group(req, options)
        end,

        'user.delgroup' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::DelGroupRequest.new(:session_id => one_auth,
                                                  :oid        => args[0],
                                                  :group_id   => args[1])
            stub.del_group(req, options)
        end,

        'user.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::DeleteRequest.new(:session_id => one_auth, :oid => args[0])
            stub.delete(req, options)
        end,

        'user.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::UpdateRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :template   => args[1],
                                                :append     => args[2])
            stub.update(req, options)
        end,

        'user.login' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::LoginRequest.new(:session_id => one_auth,
                                               :uname      => args[0],
                                               :token      => args[1],
                                               :valid      => args[2],
                                               :egid       => args[3])
            stub.login(req, options)
        end,

        'user.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::InfoRequest.new(:session_id => one_auth,
                                              :oid        => args[0],
                                              :decrypt    => args[1])
            stub.info(req, options)
        end,

        'userquota.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::InfoRequest.new(:session_id => one_auth)
            stub.default_quota_info(req, options)
        end,

        'userquota.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::DefaultQuotaUpdateRequest.new(:session_id => one_auth,
                                                            :quota      => args[0])
            stub.default_quota_update(req, options)
        end,

        'userpool.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::User::UserService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::User::PoolInfoRequest.new(:session_id => one_auth)
            stub.pool_info(req, options)
        end
    }.freeze

end
