# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

require 'uri'
require 'base64'

require 'opennebula/ods/client'
require 'opennebula/ods/helpers'
require 'opennebula/ks/clusters'
require 'opennebula/ks/nodegroups'
require 'cloud/CloudClient'

module OneKS

    # OneKS API client
    class Client < OpenNebula::DocumentServer::Client

        extend OpenNebula::DocumentServer::ClientHelpers

        DEFAULT_ENDPOINT = 'http://localhost:10780'
        POOLS = {
            :clusters => '/clusters',
            :groups   => '/nodegroups'
        }

        include OneKS::Clusters
        include OneKS::NodeGroups

        def initialize(username: nil, password: nil, endpoint: nil, opts: {})
            super(
                :app_name => 'ONEKS',
                :username => username,
                :password => password,
                :endpoint => endpoint,
                :opts     => opts
            )
        end

    end

end
