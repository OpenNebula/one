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

module OneKS

    # Kubernetes cluster controller
    module ClusterController

        # Schema for Cluster POST requests
        class PostClusterSchema < Dry::Validation::Contract

            params do
                required(:name).filled(:string)
                optional(:description).filled(:string)
                required(:kubernetes_version).filled(:string)
                required(:deployment).hash(ClusterDeployment::SCHEMA)

                # Control Plane specification
                required(:spec).hash do
                    optional(:name).filled(:string)
                    optional(:description).filled(:string)
                    optional(:family).filled(:string)
                    required(:flavour).filled(:string)
                    optional(:user_inputs_values).hash
                end
            end

            rule(:name) do
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

            rule(:spec => :name) do
                next unless key?
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

        end

        # Schema for Cluster deployment validation/check requests
        class DeploymentSchema < Dry::Validation::Contract

            params(ClusterDeployment::SCHEMA)

        end

        # Schema for Cluster PATCH requests
        class PatchClusterSchema < Dry::Validation::Contract

            params do
                optional(:name).filled(:string)
                optional(:description).filled(:string)
            end

            rule(:name) do
                next unless key?
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

        end

        def self.registered(app)
            app.logs '/clusters', OneKS::Cluster

            # GET /clusters/families
            # Retrieve a list of all available clusters families and their flavours
            #
            # Returns:
            #   200 OK - Array of clusters (JSON)
            #   401 Unauthorized
            #   500 Internal Server Error
            app.get '/clusters/families' do
                families = OneKS::ControlPlane.families(:except => [:templates])

                return internal_error(
                    families.message, one_error_to_http(families.errno)
                ) if OpenNebula.is_error?(families)

                status 200
                body process_response(families)
            rescue StandardError => e
                return general_error(e)
            end

            # GET /clusters/families/:family
            # Retrieve a specific cluster family and its flavours by name
            #
            # Params:
            #   :family [String] - Cluster family name
            #
            # Returns:
            #   200 OK - Cluster family (JSON)
            #   401 Unauthorized
            #   500 Internal Server Error
            app.get '/clusters/families/:family' do
                family = OneKS::ControlPlane.family_by_name(
                    params[:family],
                    :except => [:templates]
                )

                return internal_error(
                    family.message, one_error_to_http(family.errno)
                ) if OpenNebula.is_error?(family)

                status 200
                body process_response(family)
            rescue StandardError => e
                return general_error(e)
            end

            # GET /clusters/families/:family/inputs
            # Retrieve inputs for a specific flavour of the family, including its default values
            #
            # Params:
            #   :family [String] - Cluster family name
            #   :flavour [String] - Cluster flavour name
            #   exclude_defaults [Flag] - If present, excludes default values from the response
            #
            # Returns:
            #   200 OK - Cluster flavour inputs (JSON)
            #   401 Unauthorized
            #   500 Internal Server Error
            app.get '/clusters/families/:family/:flavour/inputs' do
                exclude_defaults = params.key?(:exclude_defaults)
                inputs = OneKS::ControlPlane.inputs_for(
                    params[:family], params[:flavour], :exclude_defaults => exclude_defaults
                )

                return internal_error(
                    inputs.message, one_error_to_http(inputs.errno)
                ) if OpenNebula.is_error?(inputs)

                status 200
                body process_response(inputs)
            rescue StandardError => e
                return general_error(e)
            end

            # GET /clusters
            # Retrieve a list of all existing clusters
            #
            # Returns:
            #   200 OK - Array of clusters (JSON)
            #   401 Unauthorized
            #   500 Internal Server Error
            app.get '/clusters' do
                pool   = OneKS::ClusterDocumentPool.new(:client => @client)
                rc     = pool.info

                if OpenNebula.is_error?(rc)
                    return internal_error(rc.message, one_error_to_http(rc.errno))
                end

                clusters = []

                pool.ids.each do |id|
                    cluster = OneKS::Cluster.new_from_id(@client, id, :raw => true)

                    return internal_error(
                        cluster.message, one_error_to_http(cluster.errno)
                    ) if OpenNebula.is_error?(cluster)

                    clusters << cluster
                end

                status 200
                body process_response(clusters)
            rescue StandardError => e
                return general_error(e)
            end

            # GET /clusters/deployment/check
            # Retrieve OneKS readiness check service status.
            #
            # Returns:
            #   200 OK - Readiness check status (JSON)
            #   401 Unauthorized
            #   500 Internal Server Error
            app.get '/clusters/deployment/check', :oneadmin_only => true do
                status 200
                body process_response({ :enabled => OneKS::ClusterReadiness.enabled? })
            rescue StandardError => e
                return general_error(e)
            end

            # GET /:id
            # Retrieve a specific cluster.
            #
            # Params:
            #   :id [String] - Cluster ID
            #   expand [Flag] - If present, expands the cluster content
            #
            # Returns:
            #   200 OK - Cluster found (JSON)
            #   401 Unauthorized
            #   404 Not Found
            #   500 Internal Server Error
            app.get '/clusters/:id' do
                expand  = params.key?(:expand)
                cluster = OneKS::Cluster.new_from_id(@client, params[:id], :raw => true)

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                cluster.expand_references! if expand

                status 200
                body process_response(cluster)
            rescue StandardError => e
                return general_error(e)
            end

            # POST /clusters/deployment/validate
            # Validate deployment placement and required appliances without
            # creating or importing any resources.
            #
            # Body (JSON):
            #   cluster.id [Integer]          - OpenNebula cluster ID
            #   networks.public.id [Integer]  - Public network ID
            #   networks.private.id [Integer] - Private network ID
            #   datastores.image.id [Integer] - Optional image datastore ID
            #
            # Returns:
            #   200 OK - Deployment can be used
            #   400 Bad Request
            #   401 Unauthorized
            #   500 Internal Server Error
            app.post '/clusters/deployment/validate' do
                body = check_body(request, DeploymentSchema)

                return internal_error(
                    body.message, one_error_to_http(body.errno)
                ) if OpenNebula.is_error?(body)

                rc = ClusterDeployment.validate(@client, body)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 200
                body process_response({ :valid => true })
            rescue ODS::RequestHelper::InvalidRequestError => e
                return internal_error(e.message, ODS::ResponseHelper::VALIDATION_EC)
            rescue StandardError => e
                return general_error(e)
            end

            # POST /clusters/deployment/check
            # Run a live provisioning test to verify that the selected deployment
            # can successfully deploy and operate a OneKS cluster
            #
            # Body (JSON):
            #   cluster.id [Integer]          - OpenNebula cluster ID
            #   networks.public.id [Integer]  - Public network ID
            #   networks.private.id [Integer] - Private network ID
            #   datastores.image.id [Integer] - Optional image datastore ID
            #
            # Returns:
            #   200 OK - Health check events
            #   400 Bad Request
            #   401 Unauthorized
            #   500 Internal Server Error
            app.post '/clusters/deployment/check', :oneadmin_only => true do
                unless OneKS::ClusterReadiness.enabled?
                    return internal_error(
                        'OneKS readiness check service is not enabled',
                        ODS::ResponseHelper::OPERATION_EC
                    )
                end

                body = check_body(request, DeploymentSchema)

                return internal_error(
                    body.message, one_error_to_http(body.errno)
                ) if OpenNebula.is_error?(body)

                rc = ClusterDeployment.validate(@client, body)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                stream_events(:event_name => 'check_cluster') do |events|
                    OneKS::ClusterReadiness.run(@client, body, :stream => events)
                end
            rescue ODS::RequestHelper::InvalidRequestError => e
                return internal_error(e.message, ODS::ResponseHelper::VALIDATION_EC)
            rescue StandardError => e
                return general_error(e)
            end

            # POST /
            # Create a new cluster.
            #
            # Body (JSON):
            #   name [String]               - Name of the cluster
            #   kubernetes_version [String] - k8s version to use
            #   deployment.cluster.id [Integer]          - OpenNebula cluster ID
            #   deployment.networks.public.id [Integer]  - Public network ID
            #   deployment.networks.private.id [Integer] - Private network ID
            #   deployment.datastores.image.id [Integer] - Optional image datastore ID
            #   spec.family [String]        - Control plane family to use
            #   spec.flavour [String]       - Flavour of the family to use
            #   spec.user_inputs_values [Hash] - Inputs values for the flavour
            #
            # Returns:
            #   201 Created - Cluster deployment initialized
            #   400 Bad Request
            #   401 Unauthorized
            #   500 Internal Server Error
            app.post '/clusters' do
                body = check_body(request, PostClusterSchema)

                return internal_error(
                    body.message, one_error_to_http(body.errno)
                ) if OpenNebula.is_error?(body)

                cluster = OneKS::Cluster.create(@client, body)

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                rc = cluster.provision(:actor => @username)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 201
                body process_response(cluster)
            rescue ODS::RequestHelper::InvalidRequestError => e
                return internal_error(e.message, ODS::ResponseHelper::VALIDATION_EC)
            rescue StandardError => e
                return general_error(e)
            end

            # PATCH /:id
            # Updates a cluster's internal data.
            #
            # Params:
            #   :id [String] - ID of the cluster
            #
            # Body (JSON):
            #   Patch data for the cluster (e.g., 'name', 'description', etc.)
            #
            # Returns:
            #   200 OK - Updated cluster (JSON)
            #   400 Bad Request - If input is invalid or malformed
            #   500 Internal Server Error - If OpenNebula error
            app.patch '/clusters/:id' do
                body = check_body(request, PatchClusterSchema)

                return internal_error(
                    body.message, one_error_to_http(body.errno)
                ) if OpenNebula.is_error?(body)

                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                rc = cluster.update(body)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                rc = cluster.info

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 200
                body process_response(cluster)
            rescue ODS::RequestHelper::InvalidRequestError => e
                return internal_error(e.message, ODS::ResponseHelper::VALIDATION_EC)
            rescue KeyError => e
                return internal_error(
                    "Missing field: #{e.message}",
                    ODS::ResponseHelper::VALIDATION_EC
                )
            rescue StandardError => e
                return general_error(e)
            end

            # POST /clusters/:id/chmod
            # Changes the permissions of a cluster and all associated group documents.
            #
            # Params:
            #   :id [String] - Cluster ID
            #
            # Body (JSON):
            #   octet [String] - Required, new octet permission string (e.g., "640")
            #
            # Returns:
            #   204 No Content - Cluster permissions updated
            #   400 Bad Request - If input data is invalid
            #   404 Not Found - Cluster not found
            #   500 Internal Server Error - If OpenNebula error
            app.post '/clusters/:id/chmod' do
                body = check_body(request)

                return internal_error(
                    'Missing `octet` attribute', ODS::ResponseHelper::VALIDATION_EC
                ) unless body[:octet]

                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                rc = cluster.chmod_octet(body[:octet])

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            rescue ODS::RequestHelper::InvalidRequestError => e
                return internal_error(e.message, ODS::ResponseHelper::VALIDATION_EC)
            rescue StandardError => e
                return general_error(e)
            end

            # POST /clusters/:id/chown
            # Changes the owner of a cluster and all associated group documents.
            #
            # Params:
            #   :id [String] - Cluster ID
            #
            # Body (JSON):
            #   owner_id [Integer] - Required, new user ID
            #   group_id [Integer] - Optional, new group ID
            #
            # Returns:
            #   204 No Content - Cluster ownership updated
            #   400 Bad Request - If input data is invalid or missing
            #   404 Not Found - Cluster not found
            #   500 Internal Server Error - If OpenNebula error
            app.post '/clusters/:id/chown' do
                body = check_body(request)

                return internal_error(
                    'Missing `owner_id` attribute', ODS::ResponseHelper::VALIDATION_EC
                ) unless body[:owner_id]

                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                owner_id = body[:owner_id].to_i
                group_id = (body[:group_id] || -1).to_i
                rc       = cluster.chown(owner_id, group_id)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            rescue ODS::RequestHelper::InvalidRequestError => e
                return internal_error(e.message, ODS::ResponseHelper::VALIDATION_EC)
            rescue StandardError => e
                return general_error(e)
            end

            # POST /clusters/:id/chgrp
            # Changes the group ownership of a cluster and all associated group documents.
            #
            # Params:
            #   :id [String] - Cluster ID
            #
            # Body (JSON):
            #   group_id [Integer] - Required, new group ID
            #
            # Returns:
            #   204 No Content - Cluster group ownership updated
            #   400 Bad Request - If input data is invalid or missing
            #   404 Not Found - Cluster not found
            #   500 Internal Server Error - If OpenNebula error
            app.post '/clusters/:id/chgrp' do
                body = check_body(request)

                return internal_error(
                    'Missing `group_id` attribute', ODS::ResponseHelper::VALIDATION_EC
                ) unless body[:group_id]

                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                rc = cluster.chgrp(body[:group_id].to_i)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            rescue ODS::RequestHelper::InvalidRequestError => e
                return internal_error(e.message, ODS::ResponseHelper::VALIDATION_EC)
            rescue StandardError => e
                return general_error(e)
            end

            # DELETE /:id
            # Delete a specific cluster.
            #
            # Params:
            #   :id [String] - Cluster ID
            #   force [Flag] - If present, force the cluster deletion
            #
            # Returns:
            #   204 No Content - Cluster deleted
            #   401 Unauthorized
            #   404 Not Found
            #   500 Internal Server Error
            app.delete '/clusters/:id' do
                force   = params.key?(:force)
                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                rc = cluster.deprovision(:actor => @username, :force => force)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            rescue StandardError => e
                return general_error(e)
            end

            # GET /:id/kubeconfig
            # Retrieve the kubeconfig of a specific workload cluster.
            #
            # Params:
            #   :id [String] - Cluster UUID
            #
            # Returns:
            #   200 OK - Kubeconfig YAML
            #   401 Unauthorized
            #   404 Not Found
            #   500 Internal Server Error
            app.get '/clusters/:id/kubeconfig' do
                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                kubeconfig = cluster.kubeconfig

                return internal_error(
                    kubeconfig.message, one_error_to_http(kubeconfig.errno)
                ) if OpenNebula.is_error?(kubeconfig)

                return internal_error(
                    kubeconfig.message, one_error_to_http(kubeconfig.errno)
                ) if OpenNebula.is_error?(kubeconfig)

                status 200
                body process_response({ :kubeconfig => kubeconfig })
            rescue StandardError => e
                return general_error(e)
            end

            # POST /clusters/:id/recover
            # Tries to recover a cluster in a warning or failure state
            #
            # Params:
            #   :id [String] - Cluster UUID
            #
            # Returns:
            #   204 OK - Recovery has been started
            #   401 Unauthorized
            #   404 Not Found
            #   500 Internal Server Error
            app.post '/clusters/:id/recover' do
                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                rc = cluster.recover(:actor => @username)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            rescue StandardError => e
                return general_error(e)
            end

            # POST /clusters/:id/upgrade
            # Initiates an upgrade of a Kubernetes cluster.
            #
            # Params:
            #   :id [String] - ID of the cluster
            #
            # Body (JSON):
            #   kubernetes_version [String] - New k8s version to upgrade to
            #
            # Returns:
            #   200 OK - Upgrade has been started
            #   400 Bad Request - If input is invalid or malformed
            #   404 Not Found - Cluster not found
            #   500 Internal Server Error - If OpenNebula error
            app.post '/clusters/:id/upgrade' do
                body    = check_body(request)
                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                cp_family = ControlPlane.family_by_name(cluster.control_plane[:family])

                return internal_error(
                    "Control plane family #{cluster.control_plane[:family]} not found",
                    one_error_to_http(OpenNebula::Error::ENO_EXISTS)
                ) if cp_family.nil?

                return internal_error(
                    "Kubernetes version #{body[:kubernetes_version]} not valid. " \
                    "Valid versions: #{cp_family[:supported_k8s_versions].join(', ')}",
                    ODS::ResponseHelper::VALIDATION_EC
                ) unless cp_family[:supported_k8s_versions].include?(body[:kubernetes_version])

                rc = cluster.upgrade(body[:kubernetes_version], :actor => @username)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 200
                body process_response(cluster)
            rescue ODS::RequestHelper::InvalidRequestError => e
                return internal_error(e.message, ODS::ResponseHelper::VALIDATION_EC)
            rescue KeyError => e
                return internal_error(
                    "Missing field: #{e.message}",
                    ODS::ResponseHelper::VALIDATION_EC
                )
            rescue StandardError => e
                return general_error(e)
            end
        end

    end

end
