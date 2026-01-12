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

require 'opennebula/grpc/host_services_pb'

module GRPCMappings

    HOST_MAP = {
        'host.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Host::HostService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Host::AllocateRequest.new(
                :session_id => one_auth,
                :name       => args[0],
                :im_mad     => args[1],
                :vm_mad     => args[2],
                :cluster_id => args[3]
            )
            stub.allocate(req, options)
        end,

        'host.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Host::HostService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Host::DeleteRequest.new(
                :session_id => one_auth,
                :oid        => args[0]
            )
            stub.delete(req, options)
        end,

        'host.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Host::HostService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Host::InfoRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :decrypt    => args[1]
            )
            stub.info(req, options)
        end,

        'host.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Host::HostService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Host::UpdateRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :template   => args[1],
                :append     => args[2]
            )
            stub.update(req, options)
        end,

        'host.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Host::HostService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Host::RenameRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :name       => args[1]
            )
            stub.rename(req, options)
        end,

        'host.status' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Host::HostService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Host::StatusRequest.new(
                :session_id => one_auth,
                :oid        => args[0],
                :status     => args[1]
            )
            stub.status(req, options)
        end,

        'host.monitoring' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Host::HostService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Host::MonitoringRequest.new(
                :session_id => one_auth,
                :oid        => args[0]
            )
            stub.monitoring(req, options)
        end,

        'hostpool.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::Host::HostService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Host::PoolInfoRequest.new(
                :session_id => one_auth
            )
            stub.pool_info(req, options)
        end,

        'hostpool.monitoring' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Host::HostService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Host::PoolMonitoringRequest.new(
                :session_id => one_auth,
                :seconds => args[0]
            )
            stub.pool_monitoring(req, options)
        end
    }.freeze

end
