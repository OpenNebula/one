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

require 'opennebula/grpc/system_services_pb'

module GRPCMappings

    SYSTEM_MAP = {
        'system.version' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::System::SystemService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::System::VersionRequest.new(:session_id => one_auth)
            stub.version(req, options)
        end,

        'system.config' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::System::SystemService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::System::ConfigRequest.new(:session_id => one_auth)
            stub.config(req, options)
        end,

        'system.sql' => lambda do |one_auth, endpoint, *args, options|
            stub = One::System::SystemService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::System::SqlRequest.new(:session_id => one_auth,
                                               :sql        => args[0],
                                               :federate   => args[1])
            stub.sql(req, options)
        end,

        'system.sqlquery' => lambda do |one_auth, endpoint, *args, options|
            stub = One::System::SystemService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::System::SqlQueryRequest.new(:session_id => one_auth,
                                                    :sql        => args[0])
            stub.sql_query(req, options)
        end
    }.freeze

end
