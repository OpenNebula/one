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

require 'opennebula/grpc/zone_services_pb'

module GRPCMappings

    ZONE_MAP = {
        'zone.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::AllocateRequest.new(:session_id => one_auth, :template => args[0])
            stub.allocate(req, options)
        end,

        'zone.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::DeleteRequest.new(:session_id => one_auth, :oid => args[0])
            stub.delete(req, options)
        end,

        'zone.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::UpdateRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :template   => args[1],
                                                :append     => args[2])
            stub.update(req, options)
        end,

        'zone.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::RenameRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :name       => args[1])
            stub.rename(req, options)
        end,

        'zone.addserver' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::AddServerRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :zs_str     => args[1])
            stub.add_server(req, options)
        end,

        'zone.delserver' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::DelServerRequest.new(:session_id => one_auth,
                                                   :oid        => args[0],
                                                   :zs_id      => args[1])
            stub.del_server(req, options)
        end,

        'zone.enable' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::EnableRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :enable     => args[1])
            stub.enable(req, options)
        end,

        'zone.resetserver' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::ResetServerRequest.new(:session_id => one_auth,
                                                     :oid        => args[0],
                                                     :zs_id      => args[1])
            stub.reset_server(req, options)
        end,

        'zone.replicate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::ReplicateLogRequest.new(:session_id  => one_auth,
                                                      :leader_id   => args[0],
                                                      :leader_term => args[1],
                                                      :index       => args[2],
                                                      :term        => args[3],
                                                      :prev_index  => args[4],
                                                      :prev_term   => args[5],
                                                      :fed_index   => args[6],
                                                      :sql         => args[7])
            stub.replicate_log(req, options)
        end,

        'zone.voterequest' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::VoteRequest.new(:session_id => one_auth,
                                              :candidate_term      => args[0],
                                              :candidate_id        => args[1],
                                              :candidate_log_index => args[2],
                                              :candidate_log_term  => args[3])
            stub.vote(req, options)
        end,

        'zone.raftstatus' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::RaftStatusRequest.new(:session_id => one_auth)
            stub.raft_status(req, options)
        end,

        'zone.fedreplicate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::ReplicateFedLogRequest.new(:session_id => one_auth,
                                                         :index      => args[0],
                                                         :prev       => args[1],
                                                         :sql        => args[2])
            stub.replicate_fed_log(req, options)
        end,

        'zone.updatedb' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::UpdateDBRequest.new(:session_id => one_auth,
                                                  :oid        => args[0],
                                                  :xml        => args[1])
            stub.update_db(req, options)
        end,

        'zone.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::InfoRequest.new(:session_id => one_auth,
                                              :oid        => args[0],
                                              :decrypt    => args[1])
            stub.info(req, options)
        end,

        'zonepool.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::Zone::ZoneService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Zone::PoolInfoRequest.new(:session_id => one_auth)
            stub.pool_info(req, options)
        end
    }.freeze

end
