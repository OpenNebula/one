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

    # Provisions Controller
    module ProvisionsController

        # Provisions Helper functions
        module ProvisionsHelper

            def recover_provision(username, provision, recover_state, opts)
                return OpenNebula::Error.new(
                    "Cannot recover to state #{recover_state} from #{provision.str_state}",
                    ResponseHelper::OPERATION_EC
                ) unless provision.can_recover?(recover_state)

                return @lcm.recover_provision(username, provision.id, opts)
            end

        end

        def self.registered(app)
            app.helpers ProvisionsHelper

            # GET /provisions
            # Retrieves all provisions.
            #
            # Params:
            #   all [Boolean] - If true, show all provisions, including those in DONE state
            #                   (default: false)
            #
            # Returns:
            #   200 OK - Array of provisions (JSON)
            #   500 Internal Server Error - If OpenNebula or retrieval error
            app.get '/provisions' do
                show_all = params['all'] == 'true'

                pool   = OneForm::ProvisionDocumentPool.new(@client)
                rc     = pool.info

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                provisions = []

                pool.ids.each do |id|
                    provision = OneForm::Provision.new_from_id(@client, id)

                    return internal_error(
                        provision.message, one_error_to_http(provision.errno)
                    ) if OpenNebula.is_error?(provision)

                    next if provision.state == OneForm::Provision::STATE['DONE'] && !show_all

                    provisions << provision
                end

                status 200
                body process_response(provisions)
            end

            # GET /provisions/:id
            # Retrieves a specific provision by ID.
            #
            # Params:
            #   :id [String] - ID of the provision
            #   decode [Boolean] - If true, decode and returns the Terraform state
            #                      (default: false)
            #
            # Returns:
            #   200 OK - Provision object (JSON)
            #   404 Not Found - If provision does not exist
            #   500 Internal Server Error - If OpenNebula error
            app.get '/provisions/:id' do
                decode = params['decode'] == 'true'

                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                provision.decode_tfstate if decode

                status 200
                body process_response(provision)
            end

            # GET /provisions/:id/unmanged
            # Retrieves unmanaged resources related to a provision (e.g. VMs, images, leases).
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Response example:
            #   {
            #     "datastores": { "107": { "image": ["4"] } },
            #     "hosts": { "100": { "vms": ["1", "2"] }, "102": { "vm": ["3"] } },
            #     "networks": { "10": { "vms": ["1", "2"] } }
            #   }
            #
            # Returns:
            #   200 OK - List of unmanaged resources (JSON)
            #   404 Not Found - If provision does not exist
            #   500 Internal Server Error - If OpenNebula error
            app.get '/provisions/:id/unmanged' do
                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                rc = provision.check_unmanaged_resources

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 200
                body process_response(provision.unmanaged_resources_all)
            end

            # POST /provisions
            # Creates a new provision using a base driver definition.
            #
            # Body (JSON):
            #    - driver [String] - Name of the base driver to use
            #    - deployment_type [String] - Name of the deployment configuration file to use
            #    - provider_id [Integer] - ID of the provider credentials to use
            #    - user_inputs_Values [Hash] - User values for the provision
            #    - any additional values to overwrite the driver info (e.g. name, desc)
            #
            # Returns:
            #   201 Created - Provider successfully created (JSON)
            #   400 Bad Request - Missing or invalid body, driver not found, or driver not enabled
            #   500 Internal Server Error - If OpenNebula error occurs during allocation
            app.post '/provisions' do
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

                return internal_error(
                    'Missing `deployment_type` attribute', ResponseHelper::VALIDATION_EC
                ) unless body['deployment_type']

                return internal_error(
                    'Missing `provider_id` attribute', ResponseHelper::VALIDATION_EC
                ) unless body['provider_id']

                dname  = body['driver'].downcase
                dtype  = body['deployment_type'].downcase
                pid    = body['provider_id'].to_i

                driver = OneForm::Driver.from_name(dname)

                return internal_error(
                    driver.message, one_error_to_http(driver.errno)
                ) if OpenNebula.is_error?(driver)

                # Only allow create provision from enable driver
                return internal_error(
                    'Provision creation is not allowed from a disabled driver',
                    ResponseHelper::VALIDATION_EC
                ) unless driver.enable?

                # Merge request body to driver content
                driver.merge(body)
                pbody = driver.deployment_body(dtype)

                return internal_error(
                    pbody.message, one_error_to_http(pbody.errno)
                ) if OpenNebula.is_error?(pbody)

                # Get the provider to instantiate the provision
                provider = OneForm::Provider.new_from_id(@client, pid)

                return internal_error(
                    provider.message, one_error_to_http(provider.errno)
                ) if OpenNebula.is_error?(provider)

                # Check that driver and provider are compatibles
                return internal_error(
                    "The specified driver '#{provider.driver}' is not compatible " \
                    "with the '#{File.basename(driver.source)}' driver used for this provision.",
                    ResponseHelper::VALIDATION_EC
                ) if provider.driver != File.basename(driver.source)

                # Create provision from driver deployment body
                provision = OneForm::Provision.new(@client)
                rc        = provision.allocate(provider, pbody)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                @lcm.start_init(@username, provision.id)

                status 201
                body process_response(provision)
            end

            # POST /provisions/:id/undeploy
            # Starts the undeployment (deprovisioning) process of a provision.
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Body (JSON):
            #   force [Boolean] - force undeploy even in error state (default: false)
            #
            # Returns:
            #   204 No Content - If undeployment process started
            #   400 Bad Request - If request body or any flag is invalid
            #   500 Internal Server Error - If OpenNebula or LCM error
            app.post '/provisions/:id/undeploy' do
                return internal_error(
                    'Missing request body', ResponseHelper::VALIDATION_EC
                ) if request.body.eof?

                opts = JSON.parse(request.body.read)

                return internal_error(
                    '`force` must be a boolean value (true or false)', ResponseHelper::VALIDATION_EC
                ) unless opts['force'].nil? || [true, false].include?(opts['force'])

                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                rc = @lcm.start_deprovisioning_one(@username, provision.id, opts)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            end

            # POST /provisions/:id/recover
            # Recovers a provision from a specific state.
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Body (JSON):
            #   recover_state [String] - Required, state to recover to (e.g., 'RUNNING')
            #   force [Boolean] - force recovery even in error state (default: false)
            #
            # Returns:
            #   204 No Content - If recovery process started
            #   400 Bad Request - If input data is invalid or missing
            #   500 Internal Server Error - If OpenNebula or recovery error
            app.post '/provisions/:id/recover' do
                return internal_error(
                    'Missing request body', ResponseHelper::VALIDATION_EC
                ) if request.body.eof?

                body          = JSON.parse(request.body.read)
                recover_state = body['recover_state']
                force         = body['force'] || false

                return internal_error(
                    'Missing `recover_state` attribute', ResponseHelper::VALIDATION_EC
                ) unless recover_state

                return internal_error(
                    '`force` must be a boolean value (true or false)', ResponseHelper::VALIDATION_EC
                ) unless force.nil? || [true, false].include?(force)

                # Get provision and check if it can be recovered to recover_state
                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                opts = { 'force' => force }
                rc = recover_provision(@username, provision, recover_state, opts)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            end

            # POST /provisions/:id/retry
            # Retries a failed provision by recovering to the last retryable state.
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Body (JSON):
            #   force [Boolean] - force retry even in error state (default: false)
            #   opts [Hash] - additional options for the retry operation
            #
            # Returns:
            #   204 No Content - If retry process started
            #   400 Bad Request - If input data is invalid
            #   500 Internal Server Error - If OpenNebula or recovery error
            app.post '/provisions/:id/retry' do
                return internal_error(
                    'Missing request body', ResponseHelper::VALIDATION_EC
                ) if request.body.eof?

                opts  = JSON.parse(request.body.read)
                force = opts['force'] || false

                return internal_error(
                    '`force` must be a boolean value (true or false)', ResponseHelper::VALIDATION_EC
                ) unless force.nil? || [true, false].include?(force)

                # Get provision and check if it can be recovered to recover_state
                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                rc = recover_provision(@username, provision, provision.retry_state, opts)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            end

            # POST /provisions/:id/scale
            # Scales a provision up or down.
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Body (JSON):
            #   direction [String] - Required, either "up" or "down"
            #   nodes [Array] - Required, list of nodes to scale (e.g., ["node1", "node2"])
            #   opts [Hash] - additional scaling options (optional)
            #
            # Returns:
            #   204 No Content - If scaling started
            #   400 Bad Request - If input data is invalid or missing
            #   500 Internal Server Error - If OpenNebula or LCM error
            app.post '/provisions/:id/scale' do
                return internal_error(
                    'Missing request body', ResponseHelper::VALIDATION_EC
                ) if request.body.eof?

                body      = JSON.parse(request.body.read)
                direction = body['direction']
                nodes     = body['nodes']
                opts      = body['opts'] || {}

                return internal_error(
                    'Missing `direction` attribute', ResponseHelper::VALIDATION_EC
                ) unless direction

                return internal_error(
                    'Missing `nodes` attribute', ResponseHelper::VALIDATION_EC
                ) unless nodes

                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                rc = @lcm.start_scaling(@username, provision.id, direction, nodes, opts)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            end

            # POST /provisions/:id/add-ip
            # Add an amount of public IPs to the public network of the provision
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Body (JSON):
            #   amount [Integer] - Optional, number of IPs to add to the provision (1 by default)
            #
            # Returns:
            #   204 No Content - IP adedd correctly
            #   400 Bad Request - If input data is invalid or missing
            #   500 Internal Server Error - If OpenNebula error
            app.post '/provisions/:id/add-ip' do
                return internal_error(
                    'Missing request body', ResponseHelper::VALIDATION_EC
                ) if request.body.eof?

                body      = JSON.parse(request.body.read)
                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                rc = @lcm.start_scaling_network(@username, provision.id, 'up', body)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            end

            # POST /provisions/:id/remove-ip
            # Remove a concrete public IP (AR) from the public network of the provision
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Body (JSON):
            #   ar_id [Integer] - Required, AR ID of the IP to remove
            #
            # Returns:
            #   204 No Content - IP removed correctly
            #   400 Bad Request - If input data is invalid or missing
            #   500 Internal Server Error - If OpenNebula error
            app.post '/provisions/:id/remove-ip' do
                return internal_error(
                    'Missing request body', ResponseHelper::VALIDATION_EC
                ) if request.body.eof?

                body = JSON.parse(request.body.read)

                return internal_error(
                    'Missing `ar_id` attribute', ResponseHelper::VALIDATION_EC
                ) unless body['ar_id']

                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                rc = @lcm.start_scaling_network(@username, provision.id, 'down', body)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            end

            # POST /provisions/:id/chmod
            # Changes the permission mode of a provision.
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Body (JSON):
            #   octet [String] - Required, new octet permission string (e.g., "640")
            #
            # Returns:
            #   200 OK - Updated provision (JSON)
            #   400 Bad Request - If input data is invalid
            #   500 Internal Server Error - If OpenNebula error
            app.post '/provisions/:id/chmod' do
                begin
                    return internal_error(
                        'Missing request body', ResponseHelper::VALIDATION_EC
                    ) if request.body.eof?

                    provision_id = params[:id]

                    begin
                        chmod_body = JSON.parse(request.body.read)
                    rescue JSON::ParserError
                        return internal_error('Invalid JSON body', ResponseHelper::VALIDATION_EC)
                    end

                    return internal_error(
                        'Missing `octet` attribute', ResponseHelper::VALIDATION_EC
                    ) unless chmod_body['octet']

                    provision = OneForm::Provision.new_from_id(@client, provision_id)

                    return internal_error(
                        provision.message, one_error_to_http(provision.errno)
                    ) if OpenNebula.is_error?(provision)

                    octet = chmod_body['octet']
                    rc    = provision.chmod_octet(octet)

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
                    return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                end
            end

            # POST /provisions/:id/chown
            # Changes the owner of a provision.
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Body (JSON):
            #   owner_id [Integer] - Required, new user ID
            #   group_id [Integer] - Optional, new group ID
            #
            # Returns:
            #   200 OK - Updated provision (JSON)
            #   400 Bad Request - If input data is invalid or missing
            #   500 Internal Server Error - If OpenNebula error
            app.post '/provisions/:id/chown' do
                begin
                    return internal_error(
                        'Missing request body', ResponseHelper::VALIDATION_EC
                    ) if request.body.eof?

                    provision_id = params[:id]

                    begin
                        chown_body = JSON.parse(request.body.read)
                    rescue JSON::ParserError
                        return internal_error('Invalid JSON body', ResponseHelper::VALIDATION_EC)
                    end

                    return internal_error(
                        'Missing `owner_id` attribute', ResponseHelper::VALIDATION_EC
                    ) unless chown_body['owner_id']

                    provision = OneForm::Provision.new_from_id(@client, provision_id)

                    return internal_error(
                        provision.message, one_error_to_http(provision.errno)
                    ) if OpenNebula.is_error?(provision)

                    u_id = chown_body['owner_id'].to_i
                    g_id = (chown_body['group_id'] || -1).to_i
                    rc   = provision.chown(u_id, g_id)

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
                    return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                end
            end

            # POST /provisions/:id/chgrp
            # Changes the group ownership of a provision.
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Body (JSON):
            #   group_id [Integer] - Required, new group ID
            #
            # Returns:
            #   200 OK - Updated provision (JSON)
            #   400 Bad Request - If input data is invalid or missing
            #   500 Internal Server Error - If OpenNebula error
            app.post '/provisions/:id/chgrp' do
                begin
                    return internal_error(
                        'Missing request body', ResponseHelper::VALIDATION_EC
                    ) if request.body.eof?

                    provision_id = params[:id]

                    begin
                        chgrp_body = JSON.parse(request.body.read)
                    rescue JSON::ParserError
                        return internal_error('Invalid JSON body', ResponseHelper::VALIDATION_EC)
                    end

                    return internal_error(
                        'Missing `group_id` attribute', ResponseHelper::VALIDATION_EC
                    ) unless chgrp_body['group_id']

                    provision = OneForm::Provision.new_from_id(@client, provision_id)

                    return internal_error(
                        provision.message, one_error_to_http(provision.errno)
                    ) if OpenNebula.is_error?(provision)

                    g_id = chgrp_body['group_id'].to_i
                    rc   = provision.chown(-1, g_id)

                    if OpenNebula.is_error?(rc)
                        return internal_error(rc.message, one_error_to_http(rc.errno))
                    end

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

            # PATCH /provisions/:id
            # Updates a provision's internal data.
            #
            # Params:
            #   :id [String] - ID of the provision
            #
            # Body (JSON):
            #   Patch data for the provision (e.g., 'name', 'description', etc.)
            #
            # Returns:
            #   200 OK - Updated provision (JSON)
            #   400 Bad Request - If input is invalid or malformed
            #   500 Internal Server Error - If OpenNebula error
            app.patch '/provisions/:id' do
                begin
                    return internal_error(
                        'Missing request body', ResponseHelper::VALIDATION_EC
                    ) if request.body.eof?

                    patch_body = request.body.read
                    provision  = OneForm::Provision.new_from_id(@client, params[:id])

                    return internal_error(
                        provision.message, one_error_to_http(provision.errno)
                    ) if OpenNebula.is_error?(provision)

                    rc = provision.update(patch_body)

                    return internal_error(
                        rc.message, one_error_to_http(rc.errno)
                    ) if OpenNebula.is_error?(rc)

                    status 200
                    body process_response(provision)
                rescue JSON::ParserError
                    return internal_error('Invalid JSON format', ResponseHelper::VALIDATION_EC)
                rescue KeyError => e
                    return internal_error(
                        "Missing field: #{e.message}", ResponseHelper::VALIDATION_EC
                    )
                rescue StandardError => e
                    return internal_error(e.message, ResponseHelper::VALIDATION_EC)
                end
            end

            # DELETE /provisions/:id
            # Deletes a provision. Only provisions in DONE state can be deleted unless forced.
            #
            # Params:
            #   :id [String] - ID of the provision
            #   force [Boolean] - Optional, allows deletion in any state if true
            #
            # Returns:
            #   204 No Content - Provision deleted
            #   400 Bad Request - If provision is not in DONE and force is not true
            #   404 Not Found - If provision does not exist
            #   500 Internal Server Error - If OpenNebula error
            app.delete '/provisions/:id' do
                # By default only provisions in DONE state can be deleted
                force = params['force'] == 'true'

                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                # If provision is not in DONE and force is not set, return error
                if provision.state != OneForm::Provision::STATE['DONE'] && !force
                    return internal_error(
                        "Provision in state #{provision.str_state} cannot be deleted, " \
                        'use `force=true` to delete it',
                        ResponseHelper::OPERATION_EC
                    )
                end

                rc = if force
                         opts = { 'delete' => true, 'force' => true }
                         @lcm.start_deprovisioning_one(@username, provision.id, opts)
                     else
                         provision.delete(true)
                     end

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            end

            # TODO: remove debug endpoint
            app.patch '/patch-state/:id' do
                return internal_error(
                    'Missing request body', ResponseHelper::VALIDATION_EC
                ) if request.body.eof?

                id     = params[:id]
                body   = JSON.parse(request.body.read)

                new_state = body['new_state']
                provision = OneForm::Provision.new_from_id(@client, id)

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                provision.body['state'] = OneForm::Provision::STATE[new_state]

                rc = provision.update

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 200
                body process_response(provision)
            end
        end

    end

end
