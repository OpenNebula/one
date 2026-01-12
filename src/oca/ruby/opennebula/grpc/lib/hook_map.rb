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

require 'opennebula/grpc/hook_services_pb'

module GRPCMappings

    HOOK_MAP = {
        'hook.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Hook::HookService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Hook::AllocateRequest.new(:session_id => one_auth,
                                                  :template   => args[0])
            stub.allocate(req, options)
        end,

        'hook.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Hook::HookService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Hook::DeleteRequest.new(:session_id => one_auth, :oid => args[0])
            stub.delete(req, options)
        end,

        'hook.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Hook::HookService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Hook::UpdateRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :template   => args[1],
                                                :append     => args[2])
            stub.update(req, options)
        end,

        'hook.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Hook::HookService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Hook::RenameRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :name       => args[1])
            stub.rename(req, options)
        end,

        'hook.lock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Hook::HookService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Hook::LockRequest.new(:session_id => one_auth,
                                              :oid        => args[0],
                                              :level      => args[1],
                                              :test       => args[2])
            stub.lock(req, options)
        end,

        'hook.unlock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Hook::HookService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Hook::UnlockRequest.new(:session_id => one_auth,
                                                :oid        => args[0])
            stub.unlock(req, options)
        end,

        'hook.retry' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Hook::HookService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Hook::RetryRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :hk_exe_id  => args[1])
            stub.retry(req, options)
        end,

        'hook.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Hook::HookService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Hook::InfoRequest.new(:session_id => one_auth,
                                              :oid        => args[0],
                                              :decrypt    => args[1])
            stub.info(req, options)
        end,

        'hookpool.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::Hook::HookService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Hook::PoolInfoRequest.new(:session_id => one_auth)
            stub.pool_info(req, options)
        end,

        'hooklog.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Hook::HookService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Hook::LogInfoRequest.new(:session_id => one_auth,
                                                 :min_ts     => args[0],
                                                 :max_ts     => args[1],
                                                 :hook_id    => args[2],
                                                 :rc_hook    => args[3])
            stub.log_info(req, options)
        end
    }.freeze

end
