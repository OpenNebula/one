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

require 'opennebula/grpc/cluster_services_pb'

module GRPCMappings

    CLUSTER_MAP = {
        'cluster.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::AllocateRequest.new(
                :session_id => one_auth,
                :name       => args[0]
            )
            stub.allocate(req, options)
        end,

        'cluster.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::DeleteRequest.new(
                :session_id => one_auth,
                :oid        => args[0]
            )
            stub.delete(req, options)
        end,

        'cluster.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::InfoRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :decrypt    => args[1]
            )
            stub.info(req, options)
        end,

        'cluster.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::UpdateRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :template   => args[1],
                :append     => args[2]
            )
            stub.update(req, options)
        end,

        'cluster.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::RenameRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :name       => args[1]
            )
            stub.rename(req, options)
        end,

        'cluster.addhost' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::AddHostRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :host_id    => args[1]
            )
            stub.add_host(req, options)
        end,

        'cluster.delhost' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::DelHostRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :host_id    => args[1]
            )
            stub.del_host(req, options)
        end,

        'cluster.adddatastore' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::AddDatastoreRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :ds_id      => args[1]
            )
            stub.add_datastore(req, options)
        end,

        'cluster.deldatastore' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::DelDatastoreRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :ds_id    => args[1]
            )
            stub.del_datastore(req, options)
        end,

        'cluster.addvnet' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::AddVNetRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :vnet_id    => args[1]
            )
            stub.add_v_net(req, options)
        end,

        'cluster.delvnet' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::DelVNetRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :vnet_id    => args[1]
            )
            stub.del_v_net(req, options)
        end,

        'cluster.optimize' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::OptimizeRequest.new(
                :session_id => one_auth,
                :oid        => args[0]
            )
            stub.optimize(req, options)
        end,

        'cluster.planexecute' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::PlanExecuteRequest.new(
                :session_id => one_auth,
                :oid        => args[0]
            )
            stub.plan_execute(req, options)
        end,

        'cluster.plandelete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::PlanDeleteRequest.new(
                :session_id => one_auth,
                :oid        => args[0]
            )
            stub.plan_delete(req, options)
        end,

        'clusterpool.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::Cluster::ClusterService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Cluster::PoolInfoRequest.new(:session_id => one_auth)
            stub.pool_info(req, options)
        end

    }.freeze

end
