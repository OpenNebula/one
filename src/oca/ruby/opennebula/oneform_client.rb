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

require 'opennebula/ods/client'
require 'opennebula/ods/helpers'
require 'opennebula/form/helpers'
require 'opennebula/form/drivers'
require 'opennebula/form/providers'
require 'opennebula/form/provisions'

module OneForm

    # OneForm API client
    class Client < OpenNebula::DocumentServer::Client

        extend OpenNebula::DocumentServer::ClientHelpers

        DEFAULT_ENDPOINT = 'http://localhost:13013'
        POOLS = {
            :providers  => '/providers',
            :provisions => '/provisions'
        }

        include OneForm::Drivers
        include OneForm::Providers
        include OneForm::Provisions

        def initialize(opts = {})
            ods_opts = opts[:opts] || {}
            client_opts = {
                :content_type => opts[:content_type] || ods_opts[:content_type],
                :version      => opts[:api_version] || opts[:version] || ods_opts[:version],
                :user_agent   => opts[:user_agent] || ods_opts[:user_agent] || 'Ruby'
            }.compact

            super(
                :app_name => 'ONEFORM',
                :username => opts[:username],
                :password => opts[:password],
                :endpoint => opts[:url] || opts[:endpoint],
                :opts     => client_opts
            )
        end

        private

        def query_params(params)
            params.reject {|_, value| value.nil? || value == false }
        end

        def post_with_params(path, params = {})
            uri = build_uri(path, query_params(params))
            request = Net::HTTP::Proxy(@host, @port)::Post.new(uri, default_headers)
            perform_request(uri, request)
        end

    end

end
