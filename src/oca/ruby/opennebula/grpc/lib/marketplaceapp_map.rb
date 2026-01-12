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

require 'opennebula/grpc/marketplaceapp_services_pb'

module GRPCMappings

    MARKETPLACEAPP_MAP = {
        'marketapp.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::AllocateRequest.new(:session_id => one_auth,
                                                       :template   => args[0],
                                                       :market_id  => args[1])
            stub.allocate(req, options)
        end,

        'marketapp.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::DeleteRequest.new(:session_id => one_auth,
                                                     :oid        => args[0])
            stub.delete(req, options)
        end,

        'marketapp.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::InfoRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :decrypt    => args[1])
            stub.info(req, options)
        end,

        'marketapp.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::UpdateRequest.new(:session_id => one_auth,
                                                     :oid        => args[0],
                                                     :template   => args[1],
                                                     :append     => args[2])
            stub.update(req, options)
        end,

        'marketapp.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::RenameRequest.new(:session_id   => one_auth,
                                                     :oid          => args[0],
                                                     :name         => args[1])
            stub.rename(req, options)
        end,

        'marketapp.chmod' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::ChmodRequest.new(:session_id   => one_auth,
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

        'marketapp.chown' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::ChownRequest.new(:session_id => one_auth,
                                                    :oid        => args[0],
                                                    :user_id    => args[1],
                                                    :group_id   => args[2])
            stub.chown(req, options)
        end,

        'marketapp.enable' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::EnableRequest.new(:session_id => one_auth,
                                                     :oid        => args[0],
                                                     :enable     => args[1])
            stub.enable(req, options)
        end,

        'marketapp.lock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::LockRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :level      => args[1],
                                                   :test       => args[2])
            stub.lock(req, options)
        end,

        'marketapp.unlock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::UnlockRequest.new(:session_id => one_auth,
                                                     :oid        => args[0])
            stub.unlock(req, options)
        end,

        'marketapp.allocatedb' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::AllocateDBRequest.new(:session_id => one_auth,
                                                         :xml        => args[0])
            stub.allocate_db(req, options)
        end,

        'marketapp.updatedb' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::UpdateDBRequest.new(:session_id => one_auth,
                                                       :oid        => args[0],
                                                       :xml        => args[1])
            stub.update_db(req, options)
        end,

        'marketapp.dropdb' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(endpoint,
                                                                   :this_channel_is_insecure)
            req  = One::Marketapp::DropDBRequest.new(:session_id => one_auth,
                                                     :oid        => args[0])
            stub.drop_db(req, options)
        end,

        'marketapppool.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Marketapp::MarketPlaceAppService::Stub.new(
                endpoint, :this_channel_is_insecure
            )
            req = One::Marketapp::PoolInfoRequest.new(:session_id => one_auth,
                                                      :filter_flag => args[0],
                                                      :start       => args[1],
                                                      :end         => args[2])
            stub.pool_info(req, options)
        end
    }.freeze

end
