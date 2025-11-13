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

module OneFormServer

    # Providers controller
    module ProvidersController

        def self.registered(app)
            # GET /providers
            # Retrieves all providers.
            #
            # Params:
            #   None
            #
            # Returns:
            #   200 OK - Array of providers (JSON)
            #   500 Internal Server Error - If OpenNebula or retrieval error
            app.get '/providers' do
                pool   = OneForm::ProviderDocumentPool.new(@client)
                rc     = pool.info

                if OpenNebula.is_error?(rc)
                    return internal_error(rc.message, one_error_to_http(rc.errno))
                end

                providers = []

                pool.ids.each do |id|
                    provider = OneForm::Provider.new_from_id(@client, id)

                    return internal_error(
                        provider.message, one_error_to_http(provider.errno)
                    ) if OpenNebula.is_error?(provider)

                    providers << provider
                end

                status 200
                body process_response(providers)
            end

            # GET /providers/:id
            # Retrieves a specific provider by ID.
            #
            # Params:
            #   :id [String] - ID of the provider
            #
            # Returns:
            #   200 OK - Provider object (JSON)
            #   404 Not Found - If provider does not exist
            #   500 Internal Server Error - If OpenNebula error
            app.get '/providers/:id' do
                id = params[:id]

                provider = OneForm::Provider.new_from_id(@client, id)

                return internal_error(
                    provider.message, one_error_to_http(provider.errno)
                ) if OpenNebula.is_error?(provider)

                status 200
                body process_response(provider)
            end

            # GET /providers/:id/path
            # Retrieves the local path of the provider.
            #
            # Params:
            #   :id [String] - ID of the provider
            #
            # Returns:
            #   200 OK - Path to the provider directory (JSON)
            #   404 Not Found - If provider does not exist
            #   500 Internal Server Error - If OpenNebula error
            app.get '/providers/:id/path' do
                id = params[:id]

                provider = OneForm::Provider.new_from_id(@client, id)

                return internal_error(
                    provider.message, one_error_to_http(provider.errno)
                ) if OpenNebula.is_error?(provider)

                path = File.join(DRIVERS_PATH, provider.driver)

                status 200
                body process_response({ 'path' => path })
            end

            # POST /providers
            # Creates a new provider using a base driver definition.
            #
            # Body (JSON):
            #    - driver [String] - Name of the base driver to use,
            #    - connection_values [Hash] - Connection values for the provider
            #    - any additional values to overwrite the driver info (e.g. name, desc)
            #
            # Returns:
            #   201 Created - Provider successfully created (JSON)
            #   400 Bad Request - Missing or invalid body, driver not found, or driver not enabled
            #   500 Internal Server Error - If OpenNebula error occurs during allocation
            app.post '/providers' do
                return internal_error(
                    'Missing request body', ResponseHelper::VALIDATION_EC
                ) if request.body.eof?

                begin
                    body = JSON.parse(request.body.read)
                rescue JSON::ParserError
                    return internal_error('Invalid JSON body', ResponseHelper::VALIDATION_EC)
                end

                return internal_error(
                    'Missing `driver` attribute', ResponseHelper::VALIDATION_EC
                ) unless body['driver']

                dname  = body['driver'].downcase
                driver = OneForm::Driver.from_name(dname)

                return internal_error(
                    driver.message, one_error_to_http(driver.errno)
                ) if OpenNebula.is_error?(driver)

                # Ensure the driver is enabled before creating a provider
                return internal_error(
                    'Provider creation is not allowed from a disabled driver',
                    ResponseHelper::VALIDATION_EC
                ) unless driver.enable?

                # Merge request body to driver content
                driver.merge(body)
                pbody = driver.connection_body

                return internal_error(
                    pbody.message, one_error_to_http(pbody.errno)
                ) if OpenNebula.is_error?(pbody)

                provider = OneForm::Provider.new(@client)
                rc       = provider.allocate(pbody)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 201
                body process_response(provider)
            end

            # POST /providers/:id/chmod
            # Changes permissions of a provider using an octet representation.
            #
            # Params:
            #   :id [String] - ID of the provider
            #
            # Body (JSON):
            #   octet [String] - Octet permissions (e.g., '640')
            #
            # Returns:
            #   200 OK - Provider permissions updated (JSON)
            #   400 Bad Request - Missing or invalid request body
            #   500 Internal Server Error - If OpenNebula error
            app.post '/providers/:id/chmod' do
                begin
                    return internal_error(
                        'Missing request body', ResponseHelper::VALIDATION_EC
                    ) if request.body.eof?

                    provider_id = params[:id]

                    begin
                        chmod_body = JSON.parse(request.body.read)
                    rescue JSON::ParserError
                        return internal_error('Invalid JSON body', ResponseHelper::VALIDATION_EC)
                    end

                    return internal_error(
                        'Missing `octet` attribute', ResponseHelper::VALIDATION_EC
                    ) unless chmod_body['octet']

                    provider = OneForm::Provider.new_from_id(@client, provider_id)

                    return internal_error(
                        provider.message, one_error_to_http(provider.errno)
                    ) if OpenNebula.is_error?(provider)

                    octet = chmod_body['octet']
                    rc    = provider.chmod_octet(octet)

                    return internal_error(
                        rc.message, one_error_to_http(rc.errno)
                    ) if OpenNebula.is_error?(rc)

                    status 204
                rescue JSON::ParserError
                    return internal_error('Invalid JSON format', ResponseHelper::VALIDATION_EC)
                rescue KeyError => e
                    return internal_error(
                        "Missing field: #{e.message}", ResponseHelper::VALIDATION_EC
                    )
                rescue StandardError => e
                    return internal_error(e.message, ResponseHelper::GENERAL_EC)
                end
            end

            # POST /providers/:id/chown
            # Changes the owner and optionally the group of a provider.
            #
            # Params:
            #   :id [String] - ID of the provider
            #
            # Body (JSON):
            #   owner_id [Integer] - New owner ID (required)
            #   group_id [Integer] - New group ID (optional)
            #
            # Returns:
            #   200 OK - Provider ownership changed (JSON)
            #   400 Bad Request - Missing or invalid request body
            #   500 Internal Server Error - If OpenNebula error
            app.post '/providers/:id/chown' do
                begin
                    return internal_error(
                        'Missing request body', ResponseHelper::VALIDATION_EC
                    ) if request.body.eof?

                    provider_id = params[:id]

                    begin
                        chown_body = JSON.parse(request.body.read)
                    rescue JSON::ParserError
                        return internal_error('Invalid JSON body', ResponseHelper::VALIDATION_EC)
                    end

                    return internal_error(
                        'Missing `owner_id` attribute', ResponseHelper::VALIDATION_EC
                    ) unless chown_body['owner_id']

                    provider = OneForm::Provider.new_from_id(@client, provider_id)

                    return internal_error(
                        provider.message, one_error_to_http(provider.errno)
                    ) if OpenNebula.is_error?(provider)

                    u_id = chown_body['owner_id'].to_i
                    g_id = (chown_body['group_id'] || -1).to_i
                    rc   = provider.chown(u_id, g_id)

                    return internal_error(
                        rc.message, one_error_to_http(rc.errno)
                    ) if OpenNebula.is_error?(rc)

                    status 204
                rescue JSON::ParserError
                    return internal_error('Invalid JSON format', ResponseHelper::VALIDATION_EC)
                rescue KeyError => e
                    return internal_error(
                        "Missing field: #{e.message}", ResponseHelper::VALIDATION_EC
                    )
                rescue StandardError => e
                    return internal_error(e.message, ResponseHelper::GENERAL_EC)
                end
            end

            # POST /providers/:id/chgrp
            # Changes the group of a provider.
            #
            # Params:
            #   :id [String] - ID of the provider
            #
            # Body (JSON):
            #   group_id [Integer] - New group ID
            #
            # Returns:
            #   200 OK - Provider group changed (JSON)
            #   400 Bad Request - Missing or invalid request body
            #   500 Internal Server Error - If OpenNebula error
            app.post '/providers/:id/chgrp' do
                begin
                    return internal_error(
                        'Missing request body', ResponseHelper::VALIDATION_EC
                    ) if request.body.eof?

                    provider_id = params[:id]

                    begin
                        chgrp_body = JSON.parse(request.body.read)
                    rescue JSON::ParserError
                        return internal_error('Invalid JSON body', ResponseHelper::VALIDATION_EC)
                    end

                    return internal_error(
                        'Missing `group_id` attribute', ResponseHelper::VALIDATION_EC
                    ) unless chgrp_body['group_id']

                    provider = OneForm::Provider.new_from_id(@client, provider_id)

                    return internal_error(
                        provider.message, one_error_to_http(provider.errno)
                    ) if OpenNebula.is_error?(provider)

                    g_id = chgrp_body['group_id'].to_i
                    rc   = provider.chown(-1, g_id)

                    return internal_error(
                        rc.message, one_error_to_http(rc.errno)
                    ) if OpenNebula.is_error?(rc)

                    status 204
                rescue JSON::ParserError
                    return internal_error('Invalid JSON format', ResponseHelper::VALIDATION_EC)
                rescue KeyError => e
                    return internal_error(
                        "Missing field: #{e.message}", ResponseHelper::VALIDATION_EC
                    )
                rescue StandardError => e
                    return internal_error(e.message, ResponseHelper::GENERAL_EC)
                end
            end

            # PATCH /providers/:id
            # Updates a provider with the given body.
            #
            # Params:
            #   :id [String] - ID of the provider
            #
            # Body (JSON):
            #   Fields to update in the provider template
            #
            # Returns:
            #   200 OK - Provider updated (JSON)
            #   400 Bad Request - Missing or invalid request body
            #   500 Internal Server Error - If OpenNebula or update error
            app.patch '/providers/:id' do
                begin
                    return internal_error(
                        'Missing request body', ResponseHelper::VALIDATION_EC
                    ) if request.body.eof?

                    provider_id = params[:id]
                    patch_body  = request.body.read

                    provider = OneForm::Provider.new_from_id(@client, provider_id)

                    return internal_error(
                        provider.message, one_error_to_http(provider.errno)
                    ) if OpenNebula.is_error?(provider)

                    rc = provider.update(patch_body)

                    if OpenNebula.is_error?(rc)
                        return internal_error(rc.message, one_error_to_http(rc.errno))
                    end

                    status 200
                    body process_response(provider)
                rescue JSON::ParserError
                    return internal_error('Invalid JSON format', ResponseHelper::VALIDATION_EC)
                rescue KeyError => e
                    return internal_error(
                        "Missing field: #{e.message}", ResponseHelper::VALIDATION_EC
                    )
                rescue StandardError => e
                    return internal_error(e.message, ResponseHelper::GENERAL_EC)
                end
            end

            # DELETE /providers/:id
            # Deletes a provider by ID.
            #
            # Params:
            #   :id [String] - ID of the provider
            #
            # Returns:
            #   204 No Content - Provider deleted successfully
            #   404 Not Found - If provider does not exist
            #   500 Internal Server Error - If OpenNebula or deletion error
            app.delete '/providers/:id' do
                provider = OneForm::Provider.new_from_id(@client, params[:id])

                return internal_error(
                    provider.message, one_error_to_http(provider.errno)
                ) if OpenNebula.is_error?(provider)

                rc = provider.delete

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            end
        end

    end

end
