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

# rubocop:disable Style/Documentation
# rubocop:disable Style/ClassVars
# rubocop:disable Style/EnvHome
# rubocop:disable Naming/AccessorMethodName
module OpenNebula

    DEFAULT_POOL_PAGE_SIZE = 200
    size = ENV['ONE_POOL_PAGE_SIZE']

    @@pool_page_size =
        if size&.strip&.match?(/^\d+$/) && size.to_i >= 2
            size.to_i
        else
            DEFAULT_POOL_PAGE_SIZE
        end

    def self.pool_page_size
        @@pool_page_size
    end

    class Client

        NO_ONE_AUTH_ERROR = 'ONE_AUTH file not present'

        attr_reader :client, :one_auth, :one_endpoint, :one_zmq

        # Initialize an OpenNebula client
        #
        # @param [String, nil] secret user credentials ("user:password") or
        #   nil to get the credentials from user auth file
        # @param [String, nil] endpoint OpenNebula server endpoint
        #   or nil to get it form the environment or use the default endpoint
        # @param [Hash] options specific XML client options (see XMLClient
        #   and GRPCClient for details)
        #
        # @return [OpenNebula::XMLClient || OpenNebula::GRPCClient]
        def initialize(secret = nil, endpoint = nil, options = {})
            if options[:subscriber_endpoint]
                @one_zmq = options[:subscriber_endpoint]
            elsif ENV['ONE_ZMQ']
                @one_zmq = ENV['ONE_ZMQ']
            else
                @one_zmq = 'tcp://localhost:2101'
            end

            auth_file     = File.join(ENV['HOME'], '/.one/one_auth')
            one_auth_file = '/var/lib/one/.one/one_auth'

            @one_auth =
                if secret
                    secret
                elsif ENV['ONE_AUTH'] && File.file?(ENV['ONE_AUTH'])
                    File.read(ENV['ONE_AUTH'])
                elsif File.file?(auth_file)
                    File.read(auth_file)
                elsif File.file?(one_auth_file)
                    File.read(one_auth_file)
                else
                    raise NO_ONE_AUTH_ERROR
                end

            @one_auth = @one_auth.rstrip

            is_grpc = ENV['ONEAPI_PROTOCOL'] == 'grpc' || options.key?(:grpc)

            # Override protocol from endpoint name, if endpoint is defined
            is_grpc = !endpoint.include?('RPC2') if !endpoint.nil? && !endpoint.empty?

            if is_grpc
                require_relative 'grpc_client'
                @one_endpoint = mk_endpoint(endpoint,
                                            'ONE_GRPC',
                                            'localhost:2634').rstrip

                @client = GRPCClient.new(@one_auth, @one_endpoint, options)
            else
                require_relative 'xml_client'
                @one_endpoint = mk_endpoint(endpoint,
                                            'ONE_XMLRPC',
                                            'http://localhost:2633/RPC2').rstrip

                @client = XMLClient.new(@one_auth, @one_endpoint, options)
            end
        end

        def call(action, *args)
            @client.call(action, *args)
        end

        def get_version
            call('system.version')
        end

        def mk_endpoint(endpoint, env_var, default)
            ep_file      = File.join(ENV['HOME'], '/.one/one_endpoint')
            one_ep_file  = '/var/lib/one/.one/one_endpoint'

            if endpoint
                endpoint
            elsif ENV[env_var]
                ENV[env_var]
            elsif File.exist?(ep_file)
                File.read(ep_file)
            elsif File.exist?(one_ep_file)
                File.read(one_ep_file)
            else
                default
            end
        end

    end

end
# rubocop:enable Style/Documentation
# rubocop:enable Style/ClassVars
# rubocop:enable Style/EnvHome
# rubocop:enable Naming/AccessorMethodName
