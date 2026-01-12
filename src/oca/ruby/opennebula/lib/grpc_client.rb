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

require 'grpc'

$LOAD_PATH << File.join(File.dirname(__FILE__), '..', 'grpc')

require 'lib/grpc_map_loader'

# rubocop:disable Style/Documentation
module OpenNebula

    class GRPCClient

        # gRPC mappings from OpenNebula actions to gRPC actions
        GRPC_MAP = GRPCMappings::MapLoader.load

        # Creates a new gRPC client object that will be used to call OpenNebula
        # functions.
        #
        # @param [String] secret user credentials ("user:password") or
        #   nil to get the credentials from user auth file
        # @param [String] endpoint OpenNebula gRPC server endpoint
        #   (http://host:2634) or nil to get it from the environment
        #   variable ONE_GRPC or use the default endpoint
        #
        # @return [OpenNebula::GRPCClient]
        def initialize(secret, endpoint, options = {})
            @one_auth     = secret
            @one_endpoint = endpoint
            @timeout      = options[:timeout] || ENV['ONE_GRPC_TIMEOUT']&.to_i
        end

        def call(action, *args)
            handler = GRPC_MAP[action]
            raise Error.new("Method 'one.#{action}' not defined", Error::EGRPC_CALL) unless handler

            options = {}
            options[:deadline] = Time.now.to_i + @timeout if @timeout

            response = handler.call(@one_auth, @one_endpoint, *args, options)

            if response.respond_to?(:oid)
                response.oid
            elsif response.respond_to?(:xml)
                response.xml
            else
                Error.new("Unexpected response: #{response.inspect}", Error::EGRPC_CALL)
            end
        rescue GRPC::DeadlineExceeded
            Error.new("Timeout exceeded for gRPC call '#{action}'", Error::ETIMEOUT)
        rescue GRPC::Unavailable => e
            Error.new("#{action}: #{clean_error_message(e.message)}", Error::EGRPC_CALL)
        rescue GRPC::BadStatus => e
            Error.new(clean_error_message(e.message), grpc_code_to_one(e.code))
        rescue StandardError => e
            Error.new("#{action}: #{e.message}", Error::EGRPC_CALL)
        end

        private

        def clean_error_message(msg)
            cleaned = msg.sub(/\A\d+:/, '').strip
            cleaned.sub(/debug_error_string:.*$/, '').strip
        end

        # Maps gRPC status codes to OpenNebula error codes
        def grpc_code_to_one(grpc_code)
            case grpc_code
            when GRPC::Core::StatusCodes::UNAUTHENTICATED
                Error::EAUTHENTICATION
            when GRPC::Core::StatusCodes::PERMISSION_DENIED
                Error::EAUTHORIZATION
            when GRPC::Core::StatusCodes::NOT_FOUND
                Error::ENO_EXISTS
            when GRPC::Core::StatusCodes::INVALID_ARGUMENT
                Error::ERPC_API
            when GRPC::Core::StatusCodes::INTERNAL
                Error::EINTERNAL
            when GRPC::Core::StatusCodes::ALREADY_EXISTS
                Error::EALLOCATE
            when GRPC::Core::StatusCodes::UNIMPLEMENTED
                Error::ENOTDEFINED
            else
                Error::EGRPC_CALL
            end
        end

    end

end
# rubocop:enable Style/Documentation
