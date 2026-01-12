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

require 'opennebula/grpc/datastore_services_pb'

module GRPCMappings

    DATASTORE_MAP = {
        'datastore.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Datastore::DatastoreService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Datastore::AllocateRequest.new(:session_id          => one_auth,
                                                       :template            => args[0],
                                                       :cluster_id          => args[1])
            stub.allocate(req, options)
        end,

        'datastore.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Datastore::DatastoreService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Datastore::DeleteRequest.new(:session_id => one_auth,
                                                     :oid        => args[0])
            stub.delete(req, options)
        end,

        'datastore.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Datastore::DatastoreService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Datastore::InfoRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :decrypt    => args[1])
            stub.info(req, options)
        end,

        'datastore.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Datastore::DatastoreService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Datastore::UpdateRequest.new(:session_id => one_auth,
                                                     :oid        => args[0],
                                                     :template   => args[1],
                                                     :append     => args[2])
            stub.update(req, options)
        end,

        'datastore.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Datastore::DatastoreService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Datastore::RenameRequest.new(:session_id   => one_auth,
                                                     :oid          => args[0],
                                                     :name         => args[1])
            stub.rename(req, options)
        end,

        'datastore.chmod' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Datastore::DatastoreService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Datastore::ChmodRequest.new(:session_id   => one_auth,
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

        'datastore.chown' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Datastore::DatastoreService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Datastore::ChownRequest.new(:session_id => one_auth,
                                                    :oid        => args[0],
                                                    :user_id    => args[1],
                                                    :group_id   => args[2])
            stub.chown(req, options)
        end,

        'datastore.enable' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Datastore::DatastoreService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Datastore::EnableRequest.new(:session_id => one_auth,
                                                     :oid        => args[0],
                                                     :enable     => args[1])
            stub.enable(req, options)
        end,

        'datastorepool.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::Datastore::DatastoreService::Stub.new(endpoint, :this_channel_is_insecure)
            req = One::Datastore::PoolInfoRequest.new(:session_id => one_auth)
            stub.pool_info(req, options)
        end
    }.freeze

end
