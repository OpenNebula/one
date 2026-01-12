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

require 'opennebula/grpc/vdc_services_pb'

module GRPCMappings

    VDC_MAP = {
        'vdc.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::AllocateRequest.new(:session_id => one_auth,
                                                 :template   => args[0])
            stub.allocate(req, options)
        end,

        'vdc.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::DeleteRequest.new(:session_id => one_auth, :oid => args[0])
            stub.delete(req, options)
        end,

        'vdc.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::UpdateRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :template   => args[1],
                                               :append     => args[2])
            stub.update(req, options)
        end,

        'vdc.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::RenameRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :name       => args[1])
            stub.rename(req, options)
        end,

        'vdc.addgroup' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::AddGroupRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :group_id   => args[1])
            stub.add_group(req, options)
        end,

        'vdc.delgroup' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::DelGroupRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :group_id   => args[1])
            stub.del_group(req, options)
        end,

        'vdc.addcluster' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::AddClusterRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :zone_id    => args[1],
                                                   :cluster_id => args[2])
            stub.add_cluster(req, options)
        end,

        'vdc.delcluster' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::DelClusterRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :zone_id    => args[1],
                                                   :cluster_id => args[2])
            stub.del_cluster(req, options)
        end,

        'vdc.addhost' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::AddHostRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :zone_id    => args[1],
                                                :host_id    => args[2])
            stub.add_host(req, options)
        end,

        'vdc.delhost' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::DelHostRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :zone_id    => args[1],
                                                :host_id    => args[2])
            stub.del_host(req, options)
        end,

        'vdc.adddatastore' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::AddDatastoreRequest.new(:session_id => one_auth,
                                                     :oid        => args[0],
                                                     :zone_id    => args[1],
                                                     :ds_id      => args[2])
            stub.add_datastore(req, options)
        end,

        'vdc.deldatastore' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::DelDatastoreRequest.new(:session_id => one_auth,
                                                     :oid        => args[0],
                                                     :zone_id    => args[1],
                                                     :ds_id      => args[2])
            stub.del_datastore(req, options)
        end,

        'vdc.addvnet' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::AddVnetRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :zone_id    => args[1],
                                                :vnet_id    => args[2])
            stub.add_vnet(req, options)
        end,

        'vdc.delvnet' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::DelVnetRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :zone_id    => args[1],
                                                :vnet_id    => args[2])
            stub.del_vnet(req, options)
        end,

        'vdc.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::InfoRequest.new(:session_id => one_auth,
                                             :oid        => args[0],
                                             :decrypt    => args[1])
            stub.info(req, options)
        end,

        'vdcpool.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::Vdc::VdcService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Vdc::PoolInfoRequest.new(:session_id => one_auth)
            stub.pool_info(req, options)
        end
    }.freeze

end
