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
    module NodeGroupController

        # Schema for NodeGroup POST requests
        class GroupPostSchema < Dry::Validation::Contract

            params do
                required(:name).filled(:string)
                optional(:family).filled(:string)
                required(:flavour).filled(:string)
                optional(:description).filled(:string)
                optional(:user_inputs_values).hash
            end

            rule(:name) do
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

        end

        # Schema for NodeGroup PATCH requests
        class PatchGroupSchema < Dry::Validation::Contract

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
            # GET /nodegroups/families
            # Retrieve all available nodegroup families and their flavours
            #
            # Returns:
            #   200 OK - Array of Nodegroups (JSON)
            #   401 Unauthorized
            #   500 Internal Server Error
            app.get '/nodegroups/families' do
                families = OneKS::NodeGroup.families(:except => [:templates])

                return internal_error(
                    families.message, one_error_to_http(families.errno)
                ) if OpenNebula.is_error?(families)

                status 200
                body process_response(families)
            rescue StandardError => e
                return general_error(e)
            end

            # GET /nodegroups/families/:family
            # Retrieve a specific nodegroup family by name
            #
            # Params:
            #   :family [String] - Nodegroup family name
            #
            # Returns:
            #   200 OK - Nodegroup family (JSON)
            #   401 Unauthorized
            #   500 Internal Server Error
            app.get '/nodegroups/families/:family' do
                family = OneKS::NodeGroup.family_by_name(
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

            # GET /nodegroups/families/:family/inputs
            # Retrieve inputs for a specific flavour of the family, including its default values
            #
            # Params:
            #   :family [String] - Nodegroup family name
            #   exclude_defaults [Flag] - If present, excludes default values from the response
            #
            # Returns:
            #   200 OK - Nodegroup flavour inputs (JSON)
            #   401 Unauthorized
            #   500 Internal Server Error
            app.get '/nodegroups/families/:family/:flavour/inputs' do
                exclude_defaults = params.key?(:exclude_defaults)
                inputs = OneKS::NodeGroup.inputs_for(
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

            # GET /clusters/:id/nodegroups
            # Retrieve all nodegroups in a cluster.
            #
            # Params:
            #   :id [String] - Cluster ID
            #
            # Returns:
            #   200 OK - Array of nodegroups
            #   401 Unauthorized
            #   404 Cluster not found
            #   500 Internal Server Error
            app.get '/clusters/:id/nodegroups' do
                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                rc = cluster.expand_references!

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 200
                body process_response(cluster.node_groups || [])
            rescue StandardError => e
                return general_error(e)
            end

            # GET /clusters/:id/nodegroups/:nodegroup_id
            # Retrieve a specific nodegroup in a cluster.
            #
            # Params:
            #   :id [String] - Cluster UUID
            #   :nodegroup_id [String] - NodeGroup UUID
            #
            # Returns:
            #   200 OK - NodeGroup found
            #   401 Unauthorized
            #   404 NodeGroup not found
            #   500 Internal Server Error
            app.get '/clusters/:id/nodegroups/:nodegroup_id' do
                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                group = cluster.node_group(params[:nodegroup_id])

                return internal_error(
                    "NodeGroup #{params[:nodegroup_id]} not found in Cluster #{params[:id]}",
                    404
                ) unless group

                nodegroup = OneKS::NodeGroup.new_from_id(
                    @client, params[:nodegroup_id], :raw => true
                )

                return internal_error(
                    nodegroup.message, one_error_to_http(nodegroup.errno)
                ) if OpenNebula.is_error?(nodegroup)

                status 200
                body process_response(nodegroup)
            rescue StandardError => e
                return general_error(e)
            end

            # POST /clusters/:id/nodegroups/:nodegroup_id
            # Add a new nodegroup to a cluster.
            #
            # Params:
            #   :id [String] - Cluster UUID
            #
            # Body (JSON):
            #   Fields to update
            #
            # Returns:
            #   200 OK - NodeGroup updated
            #   400 Bad Request
            #   401 Unauthorized
            #   404 NodeGroup not found
            #   500 Internal Server Error
            app.post '/clusters/:id/nodegroups' do
                body = check_body(request, GroupPostSchema)

                return internal_error(
                    body.message, one_error_to_http(body.errno)
                ) if OpenNebula.is_error?(body)

                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                nodegroup = cluster.provision_group(body, :actor => @username)

                return internal_error(
                    nodegroup.message, one_error_to_http(nodegroup.errno)
                ) if OpenNebula.is_error?(nodegroup)

                status 201
                body process_response(nodegroup)
            rescue ODS::RequestHelper::InvalidRequestError => e
                return internal_error(e.message, ODS::ResponseHelper::VALIDATION_EC)
            rescue StandardError => e
                return general_error(e)
            end

            # PATCH /clusters/:id/nodegroups/:nodegroup_id
            # Update a specific nodegroup in a cluster.
            #
            # Params:
            #   :id [String] - Cluster UUID
            #   :nodegroup_id [String] - NodeGroup UUID
            #
            # Body (JSON):
            #   Fields to update
            #
            # Returns:
            #   200 OK - NodeGroup updated
            #   400 Bad Request
            #   401 Unauthorized
            #   404 NodeGroup not found
            #   500 Internal Server Error
            app.patch '/clusters/:id/nodegroups/:nodegroup_id' do
                body = check_body(request, PatchGroupSchema)

                return internal_error(
                    body.message, one_error_to_http(body.errno)
                ) if OpenNebula.is_error?(body)

                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                group = cluster.update_group(params[:nodegroup_id], body)

                return internal_error(
                    group.message, one_error_to_http(group.errno)
                ) if OpenNebula.is_error?(group)

                status 200
                body process_response(group)
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

            # DELETE /clusters/:id/nodegroups/:nodegroup_id
            # Delete a specific nodegroup from a cluster.
            #
            # Params:
            #   :id [String] - Cluster UUID
            #   :nodegroup_id [String] - NodeGroup UUID
            #
            # Returns:
            #   204 No Content - Node Group deleted
            #   401 Unauthorized
            #   404 Not Found
            #   500 Internal Server Error
            app.delete '/clusters/:id/nodegroups/:nodegroup_id' do
                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                rc = cluster.deprovision_group(params[:nodegroup_id], :actor => @username)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
            rescue StandardError => e
                return general_error(e)
            end

            # POST /clusters/:id/nodegroups/:nodegroup_id/recover
            # Tries to recover a specific nodegroup in a cluster
            #
            # Params:
            #   :id [String] - Cluster UUID
            #   :nodegroup_id [String] - NodeGroup UUID
            #
            # Returns:
            #   200 OK - Recovery has been started
            #   401 Unauthorized
            #   404 Not Found
            #   500 Internal Server Error
            app.post '/clusters/:id/nodegroups/:nodegroup_id/recover' do
                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                rc = cluster.recover_group(params[:nodegroup_id], :actor => @username)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 204
                body process_response(cluster)
            rescue StandardError => e
                return general_error(e)
            end

            # POST /clusters/:id/nodegroups/:nodegroup_id/scale
            # Scale a specific nodegroup in a cluster.
            #
            # Params:
            #   :id [String] - Cluster UUID
            #   :nodegroup_id [String] - NodeGroup UUID
            #
            # Body (JSON):
            #   target [Integer] - target number of nodes
            #
            # Returns:
            #   200 OK - NodeGroup scaled
            #   400 Bad Request
            #   401 Unauthorized
            #   404 NodeGroup not found
            #   500 Internal Server Error
            app.post '/clusters/:id/nodegroups/:nodegroup_id/scale' do
                body = check_body(request)
                cluster = OneKS::Cluster.new_from_id(@client, params[:id])

                return internal_error(
                    cluster.message, one_error_to_http(cluster.errno)
                ) if OpenNebula.is_error?(cluster)

                target = body[:target]

                unless target.is_a?(Integer) && target >= 0
                    return internal_error(
                        'Field target must be an integer greater than or equal to 0',
                        ODS::ResponseHelper::VALIDATION_EC
                    )
                end

                rc = cluster.scale_group(params[:nodegroup_id], target, :actor => @username)

                return internal_error(
                    rc.message, one_error_to_http(rc.errno)
                ) if OpenNebula.is_error?(rc)

                status 201
                body process_response(rc)
            rescue ODS::RequestHelper::InvalidRequestError => e
                return internal_error(e.message, ODS::ResponseHelper::VALIDATION_EC)
            rescue StandardError => e
                return general_error(e)
            end

            #------------------------------------------------------
            # Global group operations (read only)
            #------------------------------------------------------

            # GET /groups
            # Retrieve a list of all existing groups
            #
            # Returns:
            #   200 OK - Array of groups (JSON)
            #   401 Unauthorized
            #   500 Internal Server Error
            app.get '/groups' do
                pool   = OneKS::K8sGroupDocumentPool.new(:client => @client)
                rc     = pool.info

                if OpenNebula.is_error?(rc)
                    return internal_error(rc.message, one_error_to_http(rc.errno))
                end

                groups = []

                pool.ids.each do |id|
                    group = K8sGroup.new_from_id(@client, id, :raw => true)

                    return internal_error(
                        group.message, one_error_to_http(group.errno)
                    ) if OpenNebula.is_error?(group)

                    groups << group
                end

                status 200
                body process_response(groups)
            rescue StandardError => e
                return general_error(e)
            end

            # GET /groups/:id
            # Retrieve a specific group
            #
            # Params:
            #   :id [String] - Group ID
            #
            # Returns:
            #   200 OK - Group found
            #   401 Unauthorized
            #   404 Not Found
            #   500 Internal Server Error
            app.get '/groups/:id' do
                group = K8sGroup.new_from_id(@client, params[:id], :raw => true)

                return internal_error(
                    group.message, one_error_to_http(group.errno)
                ) if OpenNebula.is_error?(group)

                status 200
                body process_response(group)
            rescue StandardError => e
                return general_error(e)
            end
        end

    end

end
