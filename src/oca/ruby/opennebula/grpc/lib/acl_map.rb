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

require 'opennebula/grpc/acl_services_pb'

module GRPCMappings

    ACL_MAP = {
        'acl.addrule' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Acl::AclService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Acl::AddRuleRequest.new(
                :session_id => one_auth,
                :user       => args[0],
                :resource   => args[1],
                :rights     => args[2],
                :zone       => args[3]
            )
            stub.add_rule(req, options)
        end,

        'acl.delrule' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Acl::AclService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Acl::DelRuleRequest.new(
                :session_id => one_auth,
                :oid        => args[0]
            )
            stub.del_rule(req, options)
        end,

        'acl.info' => lambda do |one_auth, endpoint, *_args, options|
            stub = One::Acl::AclService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Acl::InfoRequest.new(:session_id => one_auth)
            stub.info(req, options)
        end
    }.freeze

end
