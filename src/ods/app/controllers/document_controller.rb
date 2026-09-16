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

        # Registers common ownership and permission endpoints for documents
        module DocumentController

            # Returns routes declared by the extending controller
            # @return [Array<Proc>] Declared document routes
            def routes
                @routes ||= []
            end

            # Registers all routes declared by the extending controller
            # @param app [Sinatra::Base] App where the routes are registered
            def register_routes(app)
                app.helpers const_get(:Helpers, false) if const_defined?(:Helpers, false)

                routes.each {|route| route.call(app) }
            end

            # GET BASE_PATH
            # Declares a collection endpoint for the extending controller
            # Params:
            #   :include_sensitive [Boolean] - Includes sensitive values for the owner or oneadmin
            # @param options [Hash] Loading and Sinatra route options
            # @yieldparam document [OpenNebula::Document] Loaded document
            # @yieldreturn [Boolean] Whether the document is included in the response
            def list(**options, &filter)
                raw = options.delete(:raw) || false

                routes << lambda do |app|
                    base_path  = self::BASE_PATH
                    pool_class = self::ODS_POOL

                    app.get base_path, **options do
                        pool = pool_class.new(:client => @client)
                        rc   = pool.info

                        return internal_error(
                            rc.message, one_error_to_http(rc.errno)
                        ) if OpenNebula.is_error?(rc)

                        documents = []

                        pool.ids.each do |id|
                            document = pool_class::DOCUMENT_CLASS.new_from_id(
                                @client, id, :raw => raw
                            )

                            return internal_error(
                                document.message, one_error_to_http(document.errno)
                            ) if OpenNebula.is_error?(document)

                            next if filter && !instance_exec(document, &filter)

                            documents << document
                        end

                        response_body = process_response(documents) do |document|
                            { :include_sensitive => include_sensitive?(document) }
                        end

                        status 200
                        body response_body
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # GET BASE_PATH/:id
            # Declares a single-document endpoint for the extending controller
            # Params:
            #   :id [String] - Document ID
            #   :include_sensitive [Boolean] - Includes sensitive values for the owner or oneadmin
            # @param options [Hash] Loading and Sinatra route options
            # @yieldparam document [OpenNebula::Document] Loaded document
            def show(**options, &prepare)
                raw = options.delete(:raw) || false

                routes << lambda do |app|
                    base_path      = self::BASE_PATH
                    resource_class = self::ODS_CLASS

                    app.get "#{base_path}/:id", **options do
                        document = resource_class.new_from_id(@client, params[:id], :raw => raw)

                        return internal_error(
                            document.message, one_error_to_http(document.errno)
                        ) if OpenNebula.is_error?(document)

                        instance_exec(document, &prepare) if prepare

                        status 200
                        body process_response(
                            document,
                            :include_sensitive => include_sensitive?(document)
                        )
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # GET BASE_PATH/:id/:path
            # Loads a document and returns the value produced by the block
            # Params:
            #   :id [String] - Document ID
            # @param path [String] Endpoint path
            # @param options [Hash] Loading, validation and Sinatra route options
            # @option options [Class, Symbol] :params_schema Request params validation schema
            # @yieldparam document [OpenNebula::Document] Loaded document
            # @yieldparam args [Hash] Validated params when a schema is configured
            # @yieldreturn [Object, OpenNebula::Error] Response value or error
            def get(path, **options, &fetch)
                raw           = options.delete(:raw) || false
                params_schema = options.delete(:params_schema)

                routes << lambda do |app|
                    base_path       = self::BASE_PATH
                    resource_class  = self::ODS_CLASS
                    params_validator =
                        params_schema.is_a?(Symbol) ? const_get(params_schema) : params_schema

                    app.get "#{base_path}/:id/#{path}", **options do
                        args = check_params(params, params_validator) if params_validator

                        return internal_error(
                            args.message, one_error_to_http(args.errno)
                        ) if OpenNebula.is_error?(args)

                        document = resource_class.new_from_id(@client, params[:id], :raw => raw)

                        return internal_error(
                            document.message, one_error_to_http(document.errno)
                        ) if OpenNebula.is_error?(document)

                        value =
                            if args
                                instance_exec(document, args, &fetch)
                            else
                                instance_exec(document, &fetch)
                            end

                        return internal_error(
                            value.message, one_error_to_http(value.errno)
                        ) if OpenNebula.is_error?(value)

                        status 200
                        body process_response(value)
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # GET BASE_PATH/:id/:path
            # Declares a document attribute endpoint for the extending controller
            # Params:
            #   :id [String] - Document ID
            # @param attribute [Symbol] Document attribute to return
            # @param options [Hash] Loading and Sinatra route options
            # @option options [String, Symbol] :path Endpoint path (defaults to attribute)
            # @yieldparam document [OpenNebula::Document] Loaded document
            # @yieldparam value [Object] Attribute value
            # @yieldreturn [Object] Response value
            def attribute(attribute, **options, &transform)
                path = options.delete(:path) || attribute

                get(path, **options) do |document|
                    value = document.public_send(attribute)
                    transform ? instance_exec(document, value, &transform) : value
                end
            end

            # POST BASE_PATH/:id/:path
            # Loads a document and executes an action on it
            # Params:
            #   :id [String] - Document ID
            # @param path [String] Endpoint path
            # @param options [Hash] Loading, validation and Sinatra route options
            # @option options [Class, Symbol] :schema Request body validation schema
            # @option options [Class, Symbol] :params_schema Request params validation schema
            # @option options [Integer] :status HTTP status (204 by default)
            # @option options [Boolean] :response Whether to return the block value
            # @yieldparam document [OpenNebula::Document] Loaded document
            # @yieldparam params [Hash] Validated body or params when a schema is configured
            # @yieldreturn [Object, OpenNebula::Error] Action result or error
            def post(path, **options, &perform)
                raw           = options.delete(:raw) || false
                schema        = options.delete(:schema)
                params_schema = options.delete(:params_schema)
                response      = options.delete(:response) || false
                response_code = options.delete(:status) || 204

                raise ArgumentError, 'post accepts either schema or params_schema' \
                    if schema && params_schema

                routes << lambda do |app|
                    base_path         = self::BASE_PATH
                    resource_class    = self::ODS_CLASS
                    validation_schema = schema.is_a?(Symbol) ? const_get(schema) : schema
                    params_validator  =
                        params_schema.is_a?(Symbol) ? const_get(params_schema) : params_schema

                    app.post "#{base_path}/:id/#{path}", **options do
                        input =
                            if validation_schema
                                check_body(request, validation_schema)
                            elsif params_validator
                                check_params(params, params_validator)
                            end

                        return internal_error(
                            input.message, one_error_to_http(input.errno)
                        ) if OpenNebula.is_error?(input)

                        document = resource_class.new_from_id(@client, params[:id], :raw => raw)

                        return internal_error(
                            document.message, one_error_to_http(document.errno)
                        ) if OpenNebula.is_error?(document)

                        result =
                            if input
                                instance_exec(document, input, &perform)
                            else
                                instance_exec(document, &perform)
                            end

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

            # POST BASE_PATH
            # Declares a document creation endpoint for the extending controller
            # @param options [Hash] Validation and Sinatra route options
            # @yieldparam body [Hash] Validated request body
            # @yieldreturn [OpenNebula::Document, OpenNebula::Error] Created document or error
            def create(**options, &build)
                schema = options.delete(:schema)

                routes << lambda do |app|
                    base_path         = self::BASE_PATH
                    validation_schema = schema.is_a?(Symbol) ? const_get(schema) : schema

                    app.post base_path, **options do
                        body = check_body(request, validation_schema)

                        return internal_error(
                            body.message, one_error_to_http(body.errno)
                        ) if OpenNebula.is_error?(body)

                        document = instance_exec(body, &build)

                        return internal_error(
                            document.message, one_error_to_http(document.errno)
                        ) if OpenNebula.is_error?(document)

                        status 201
                        body process_response(
                            document,
                            :include_sensitive => include_sensitive?(document)
                        )
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # PATCH BASE_PATH/:id
            # Declares a document update endpoint for the extending controller
            # Params:
            #   :id [String] - Document ID
            #   :include_sensitive [Boolean] - Includes sensitive values for the owner or oneadmin
            # @param options [Hash] Loading, validation and Sinatra route options
            # @yieldparam document [OpenNebula::Document] Loaded document
            # @yieldparam body [Hash] Validated request body
            # @yieldreturn [String, OpenNebula::Error, nil] Validation error or nil
            def update(**options, &validate)
                raw    = options.delete(:raw) || false
                schema = options.delete(:schema)

                routes << lambda do |app|
                    base_path         = self::BASE_PATH
                    pool_class        = self::ODS_POOL
                    validation_schema = schema.is_a?(Symbol) ? const_get(schema) : schema

                    app.patch "#{base_path}/:id", **options do
                        patch_body = check_body(request, validation_schema)

                        return internal_error(
                            patch_body.message, one_error_to_http(patch_body.errno)
                        ) if OpenNebula.is_error?(patch_body)

                        validation = nil
                        pool       = pool_class.new(:auth => @cloud_auth)
                        document   = pool.get(params[:id], @username, :raw => raw) do |doc|
                            validation = instance_exec(doc, patch_body, &validate) if validate
                            next if validation

                            doc.update(patch_body)
                        end

                        return internal_error(
                            validation.message, one_error_to_http(validation.errno)
                        ) if OpenNebula.is_error?(validation)

                        return internal_error(
                            validation, ResponseHelper::VALIDATION_EC
                        ) if validation

                        return internal_error(
                            document.message, one_error_to_http(document.errno)
                        ) if OpenNebula.is_error?(document)

                        status 200
                        body process_response(
                            document,
                            :include_sensitive => include_sensitive?(document)
                        )
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # DELETE BASE_PATH/:id/:path
            # Declares a document deletion endpoint for the extending controller
            # Params:
            #   :id [String] - Document ID
            # @param path [String, nil] Endpoint path
            # @param options [Hash] Loading, validation and Sinatra route options
            # @option options [Class, Symbol] :schema Request body validation schema
            # @option options [Class, Symbol] :params_schema Request params validation schema
            # @option options [Integer] :status HTTP status (204 by default)
            # @yieldparam document [OpenNebula::Document] Loaded document
            # @yieldparam params [Hash] Validated body or params when a schema is configured
            # @yieldreturn [nil, String, OpenNebula::Error] Deletion result or error
            def delete(path = nil, **options, &destroy)
                raw           = options.delete(:raw) || false
                schema        = options.delete(:schema)
                params_schema = options.delete(:params_schema)
                response_code = options.delete(:status) || 204

                raise ArgumentError, 'delete accepts either schema or params_schema' \
                    if schema && params_schema

                routes << lambda do |app|
                    base_path         = self::BASE_PATH
                    resource_class    = self::ODS_CLASS
                    validation_schema = schema.is_a?(Symbol) ? const_get(schema) : schema
                    params_validator  =
                        params_schema.is_a?(Symbol) ? const_get(params_schema) : params_schema
                    endpoint          = path ? "#{base_path}/:id/#{path}" : "#{base_path}/:id"

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

                        document = resource_class.new_from_id(
                            @client, params[:id], :raw => raw
                        )

                        return internal_error(
                            document.message, one_error_to_http(document.errno)
                        ) if OpenNebula.is_error?(document)

                        status response_code
                        rc =
                            if destroy
                                if input
                                    instance_exec(document, input, &destroy)
                                else
                                    instance_exec(document, &destroy)
                                end
                            else
                                document.delete
                            end

                        return internal_error(
                            rc, ResponseHelper::VALIDATION_EC
                        ) if rc.is_a?(String)

                        return internal_error(
                            rc.message, one_error_to_http(rc.errno)
                        ) if OpenNebula.is_error?(rc)
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # GET BASE_PATH/:id/logs
            # Declares a logs endpoint for the extending controller
            # Params:
            #   :id [String] - Document ID
            #   :page [Integer] - Page number
            #   :per_page [Integer] - Entries per page
            #   :all [Boolean] - Returns the complete log history
            def logs
                routes << lambda do |app|
                    base_path      = self::BASE_PATH
                    resource_class = self::ODS_CLASS

                    app.get "#{base_path}/:id/logs", :ensure_resource_access => resource_class do
                        log_file = File.join(LOG_LOCATION, APP_NAME, "#{params[:id]}.log")
                        return internal_error(
                            'Log file not found', 404
                        ) unless File.exist?(log_file)

                        all_logs = params.key?(:all)
                        page     = [params.fetch(:page, 1).to_i, 1].max
                        per_page = [params.fetch(:per_page, 100).to_i, 1].max
                        logs     = get_logs_page(log_file, page, per_page, all_logs)

                        status 200
                        body process_response(logs)
                    end
                end
            end

            # POST BASE_PATH/:id/chmod
            # Declares a chmod endpoint for the extending controller
            # Params:
            #   :id [String] - Document ID
            # Body:
            #   :octet [String] - Permission octet
            def chmod
                routes << lambda do |app|
                    base_path      = self::BASE_PATH
                    resource_class = self::ODS_CLASS

                    app.post "#{base_path}/:id/chmod" do
                        body = check_body(request, ChmodSchema)

                        return internal_error(
                            body.message, one_error_to_http(body.errno)
                        ) if OpenNebula.is_error?(body)

                        document = resource_class.new_from_id(@client, params[:id])

                        return internal_error(
                            document.message, one_error_to_http(document.errno)
                        ) if OpenNebula.is_error?(document)

                        rc = document.chmod_octet(body[:octet])

                        return internal_error(
                            rc.message, one_error_to_http(rc.errno)
                        ) if OpenNebula.is_error?(rc)

                        status 204
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # POST BASE_PATH/:id/chown
            # Declares a chown endpoint for the extending controller
            # Params:
            #   :id [String] - Document ID
            # Body:
            #   :owner_id [Integer] - New owner ID
            #   :group_id [Integer] - New group ID (optional)
            def chown
                routes << lambda do |app|
                    base_path      = self::BASE_PATH
                    resource_class = self::ODS_CLASS

                    app.post "#{base_path}/:id/chown" do
                        body = check_body(request, ChownSchema)

                        return internal_error(
                            body.message, one_error_to_http(body.errno)
                        ) if OpenNebula.is_error?(body)

                        document = resource_class.new_from_id(@client, params[:id])

                        return internal_error(
                            document.message, one_error_to_http(document.errno)
                        ) if OpenNebula.is_error?(document)

                        rc = document.chown(
                            body[:owner_id].to_i, (body[:group_id] || -1).to_i
                        )

                        return internal_error(
                            rc.message, one_error_to_http(rc.errno)
                        ) if OpenNebula.is_error?(rc)

                        status 204
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # POST BASE_PATH/:id/chgrp
            # Declares a chgrp endpoint for the extending controller
            # Params:
            #   :id [String] - Document ID
            # Body:
            #   :group_id [Integer] - New group ID
            def chgrp
                routes << lambda do |app|
                    base_path      = self::BASE_PATH
                    resource_class = self::ODS_CLASS

                    app.post "#{base_path}/:id/chgrp" do
                        body = check_body(request, ChgrpSchema)

                        return internal_error(
                            body.message, one_error_to_http(body.errno)
                        ) if OpenNebula.is_error?(body)

                        document = resource_class.new_from_id(@client, params[:id])

                        return internal_error(
                            document.message, one_error_to_http(document.errno)
                        ) if OpenNebula.is_error?(document)

                        rc = document.chown(-1, body[:group_id].to_i)

                        return internal_error(
                            rc.message, one_error_to_http(rc.errno)
                        ) if OpenNebula.is_error?(rc)

                        status 204
                    rescue RequestHelper::InvalidRequestError => e
                        return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                    rescue StandardError => e
                        return general_error(e)
                    end
                end
            end

            # Schema for chmod POST requests
            class ChmodSchema < Dry::Validation::Contract

                params do
                    required(:octet).filled(:string)
                end

            end

            # Schema for chown POST requests
            class ChownSchema < Dry::Validation::Contract

                params do
                    required(:owner_id).filled(:integer)
                    optional(:group_id).filled(:integer)
                end

            end

            # Schema for chgrp POST requests
            class ChgrpSchema < Dry::Validation::Contract

                params do
                    required(:group_id).filled(:integer)
                end

            end

        end

    end

end
