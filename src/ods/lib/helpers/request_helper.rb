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

module OpenNebula

    module DocumentServer

        # Request Helper module
        module RequestHelper

            RFC1123_NAME  = /\A[a-z0-9]([-a-z0-9]*[a-z0-9])?\z/
            RFC1123_ERROR = 'must be a valid RFC 1123 name'

            class InvalidRequestError < StandardError; end

            def self.rfc1123_name?(value)
                value.is_a?(String) && value.length <= 63 && value.match?(RFC1123_NAME)
            end

            # Checks that the body contains the required keys with correct types
            #
            # @param body [String] raw JSON body from the request
            # @param required [Dry::Validation::Contract] Schema to validate
            #
            # @return [Hash] parsed and validated JSON body
            #
            # @raise [InvalidRequestError] if parsing fails, key is missing, or type mismatch
            def check_body(request, schema = nil)
                raise InvalidRequestError, 'Missing request body' if request.body.eof?

                begin
                    body = JSON.parse(request.body.read)
                rescue JSON::ParserError => e
                    raise InvalidRequestError, "Invalid JSON body: #{e.message}"
                end

                unless body.is_a?(Hash)
                    raise InvalidRequestError, 'JSON body must be an object'
                end

                return body.deep_symbolize_keys unless schema

                # Validate request body based on schema (if exists)
                validation = schema.new.call(body)

                return OpenNebula::Error.new(
                    {
                        'message' => 'Error validating request body',
                        'context' => validation.errors.to_h
                    },
                    OpenNebula::Error::ENOTDEFINED
                ) if validation.failure?

                body.deep_symbolize_keys
            end

        end

    end

end
