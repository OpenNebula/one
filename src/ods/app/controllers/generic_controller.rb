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

        # Registers generic endpoints that are not backed by a document
        module GenericController

            # Returns routes declared by the extending controller
            # @return [Array<Proc>] Declared routes
            def routes
                @routes ||= []
            end

            # Registers all routes declared by the extending controller
            # @param app [Sinatra::Base] App where the routes are registered
            def register_routes(app)
                app.helpers const_get(:Helpers, false) if const_defined?(:Helpers, false)

                routes.each {|route| route.call(app) }
            end

            # GET BASE_PATH[/path]
            # Executes a read endpoint and returns the block result
            # @param path [String, nil] Endpoint path
            # @param options [Hash] Validation and Sinatra route options
            # @option options [Class, Symbol] :params_schema Request params validation schema
            # @yieldparam args [Hash] Validated params when a schema is configured
            # @yieldreturn [Object, OpenNebula::Error] Response value or error
            def get(path = nil, **options, &fetch)
                params_schema = options.delete(:params_schema)

                routes << lambda do |app|
                    base_path       = self::BASE_PATH
                    endpoint        = path ? "#{base_path}/#{path}" : base_path
                    params_validator =
                        params_schema.is_a?(Symbol) ? const_get(params_schema) : params_schema

                    app.get endpoint, **options do
                        args = check_params(params, params_validator) if params_validator

                        return internal_error(
                            args.message, one_error_to_http(args.errno)
                        ) if OpenNebula.is_error?(args)

                        result = args ? instance_exec(args, &fetch) : instance_exec(&fetch)

                        return internal_error(
                            result.message, one_error_to_http(result.errno)
                        ) if OpenNebula.is_error?(result)

                        status 200
                        body process_response(result)
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # POST BASE_PATH[/path]
            # Executes a create or action endpoint
            # @param path [String, nil] Endpoint path
            # @param options [Hash] Validation and Sinatra route options
            # @option options [Class, Symbol] :schema Request body validation schema
            # @option options [Class, Symbol] :params_schema Request params validation schema
            # @option options [Integer] :status HTTP status (200 by default)
            # @option options [Boolean] :response Whether to return the block value
            #   (true by default)
            # @yieldparam input [Hash] Validated body or params when a schema is configured
            # @yieldreturn [Object, OpenNebula::Error] Response value or error
            def post(path = nil, **options, &perform)
                schema        = options.delete(:schema)
                params_schema = options.delete(:params_schema)
                response      = options.key?(:response) ? options.delete(:response) : true
                response_code = options.delete(:status) || 200

                raise ArgumentError, 'post accepts either schema or params_schema' \
                    if schema && params_schema

                routes << lambda do |app|
                    base_path         = self::BASE_PATH
                    endpoint          = path ? "#{base_path}/#{path}" : base_path
                    validation_schema = schema.is_a?(Symbol) ? const_get(schema) : schema
                    params_validator  =
                        params_schema.is_a?(Symbol) ? const_get(params_schema) : params_schema

                    app.post endpoint, **options do
                        input =
                            if validation_schema
                                check_body(request, validation_schema)
                            elsif params_validator
                                check_params(params, params_validator)
                            end

                        return internal_error(
                            input.message, one_error_to_http(input.errno)
                        ) if OpenNebula.is_error?(input)

                        result = input ? instance_exec(input, &perform) : instance_exec(&perform)

                        return internal_error(
                            result.message, one_error_to_http(result.errno)
                        ) if OpenNebula.is_error?(result)

                        status response_code
                        body process_response(result) if response
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # PATCH BASE_PATH[/path]
            # Executes an update endpoint
            # @param path [String, nil] Endpoint path
            # @param options [Hash] Validation and Sinatra route options
            # @option options [Class, Symbol] :schema Request body validation schema
            # @option options [Class, Symbol] :params_schema Request params validation schema
            # @option options [Integer] :status HTTP status (200 by default)
            # @option options [Boolean] :response Whether to return the block value
            #   (true by default)
            # @yieldparam input [Hash] Validated body or params when a schema is configured
            # @yieldreturn [Object, OpenNebula::Error] Response value or error
            def patch(path = nil, **options, &perform)
                schema        = options.delete(:schema)
                params_schema = options.delete(:params_schema)
                response      = options.key?(:response) ? options.delete(:response) : true
                response_code = options.delete(:status) || 200

                raise ArgumentError, 'patch accepts either schema or params_schema' \
                    if schema && params_schema

                routes << lambda do |app|
                    base_path         = self::BASE_PATH
                    endpoint          = path ? "#{base_path}/#{path}" : base_path
                    validation_schema = schema.is_a?(Symbol) ? const_get(schema) : schema
                    params_validator =
                        params_schema.is_a?(Symbol) ? const_get(params_schema) : params_schema

                    app.patch endpoint, **options do
                        input =
                            if validation_schema
                                check_body(request, validation_schema)
                            elsif params_validator
                                check_params(params, params_validator)
                            end

                        return internal_error(
                            input.message, one_error_to_http(input.errno)
                        ) if OpenNebula.is_error?(input)

                        result = input ? instance_exec(input, &perform) : instance_exec(&perform)

                        return internal_error(
                            result.message, one_error_to_http(result.errno)
                        ) if OpenNebula.is_error?(result)

                        status response_code
                        body process_response(result) if response
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # DELETE BASE_PATH[/path]
            # Executes a deletion endpoint
            # @param path [String, nil] Endpoint path
            # @param options [Hash] Validation and Sinatra route options
            # @option options [Class, Symbol] :schema Request body validation schema
            # @option options [Class, Symbol] :params_schema Request params validation schema
            # @option options [Integer] :status HTTP status (204 by default)
            # @option options [Boolean] :response Whether to return the block value
            #   (false by default)
            # @yieldparam input [Hash] Validated body or params when a schema is configured
            # @yieldreturn [Object, OpenNebula::Error] Response value or error
            def delete(path = nil, **options, &perform)
                schema        = options.delete(:schema)
                params_schema = options.delete(:params_schema)
                response      = options.delete(:response) || false
                response_code = options.delete(:status) || 204

                raise ArgumentError, 'delete accepts either schema or params_schema' \
                    if schema && params_schema

                routes << lambda do |app|
                    base_path         = self::BASE_PATH
                    endpoint          = path ? "#{base_path}/#{path}" : base_path
                    validation_schema = schema.is_a?(Symbol) ? const_get(schema) : schema
                    params_validator  =
                        params_schema.is_a?(Symbol) ? const_get(params_schema) : params_schema

                    app.delete endpoint, **options do
                        input =
                            if validation_schema
                                check_body(request, validation_schema)
                            elsif params_validator
                                check_params(params, params_validator)
                            end

                        return internal_error(
                            input.message, one_error_to_http(input.errno)
                        ) if OpenNebula.is_error?(input)

                        result = input ? instance_exec(input, &perform) : instance_exec(&perform)

                        return internal_error(
                            result.message, one_error_to_http(result.errno)
                        ) if OpenNebula.is_error?(result)

                        status response_code
                        body process_response(result) if response
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

        end

    end

end
