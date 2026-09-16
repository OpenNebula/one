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

module OneForm

    # Provisions Controller
    module ProvisionController

        extend ODS::DocumentController

        BASE_PATH = '/provisions'
        ODS_CLASS = OneForm::Provision
        ODS_POOL  = OneForm::ProvisionDocumentPool

        # GET /provisions
        # Params:
        #   :include_provider [Boolean] - Embeds the provider
        list :raw => true do |provision|
            embed_provider(provision) if params.key?(:include_provider)
            true
        end

        # GET /provisions/:id
        # Params:
        #   :include_provider [Boolean] - Embeds the provider
        show :raw => true do |provision|
            embed_provider(provision) if params.key?(:include_provider)
        end

        # GET /provisions/:id/user_inputs
        attribute :user_inputs, :path => 'inputs', :raw => true

        # GET /provisions/:id/tfstate
        # Params:
        #   :decode [Boolean] - Decodes the stored Terraform state
        attribute :tfstate, :raw => true, :oneadmin_only => true do |provision, tfstate|
            next tfstate unless params.key?(:decode)

            provision.decode_tfstate
            provision.tfstate
        end

        # GET /provisions/:id/cluster
        get 'cluster' do |provision|
            object = provision.resources.cluster&.one_object(@client)
            next object if OpenNebula.is_error?(object)

            object&.to_hash
        end

        # GET /provisions/:id/hosts
        get 'hosts' do |provision|
            objects = Array(provision.resources.hosts).map do |resource|
                resource.one_object(@client)
            end
            error = objects.find {|object| OpenNebula.is_error?(object) }

            next error if error

            objects.compact.map(&:to_hash)
        end

        # GET /provisions/:id/networks
        get 'networks' do |provision|
            objects = Array(provision.resources.networks).map do |resource|
                resource.one_object(@client)
            end
            error = objects.find {|object| OpenNebula.is_error?(object) }

            next error if error

            objects.compact.map(&:to_hash)
        end

        # GET /provisions/:id/datastores
        get 'datastores' do |provision|
            objects = Array(provision.resources.datastores).map do |resource|
                resource.one_object(@client)
            end
            error = objects.find {|object| OpenNebula.is_error?(object) }

            next error if error

            objects.compact.map(&:to_hash)
        end

        # GET /provisions/:id/unmanaged
        get 'unmanaged' do |provision|
            provision.resources.unmanaged
        end

        # GET /provisions/:id/jobs
        get 'jobs', :raw => true, :oneadmin_only => true do |provision|
            active_job = provision.active_job
            next [] unless active_job

            runtime_job = OneForm::Provision.lcm.scheduler.job_for(provision.id, active_job.id)
            status = if OneForm::Provision.lcm.class.failure_states.value?(provision.state)
                         :failed
                     else
                         runtime_job&.[](:status)
                     end

            [active_job.to_h.merge(
                :status  => status,
                :command => runtime_job&.[](:command)
            )]
        end

        # POST /provisions
        # Body:
        #   :driver [String] - Base driver name
        #   :deployment_type [String] - Deployment configuration name
        #   :provider_id [Integer] - Provider ID
        #   :user_inputs_values [Hash] - Provision input values
        #   :name [String] - Provision name
        #   :description [String] - Provision description
        create :schema => :PostProvisionSchema do |body|
            provision = OneForm::Provision.from_driver(@client, body)
            next provision if OpenNebula.is_error?(provision)

            rc = provision.provision(:actor => @username)
            next rc if OpenNebula.is_error?(rc)

            provision
        end

        # POST /provisions/:id/chmod
        chmod

        # POST /provisions/:id/chown
        chown

        # POST /provisions/:id/chgrp
        chgrp

        # PATCH /provisions/:id
        # Body:
        #   :name [String] - Provision name
        #   :description [String, nil] - Provision description
        update :schema => :PatchProvisionSchema

        # POST /provisions/:id/cancel
        post 'cancel', :status => 202, :response => true do |provision|
            result = provision.cancel(:actor => @username, :oneadmin => oneadmin?)
            next result if OpenNebula.is_error?(result)

            { :status => result }
        end

        # POST /provisions/:id/recover
        # Params:
        #   :force [Boolean] - Forces recovery protections
        post 'recover', :status => 202 do |provision|
            provision.recover(:force => params.key?(:force), :actor => @username)
        end

        # POST /provisions/:id/hosts
        # Body:
        #   :amount [Integer] - Number of cloud hosts to add
        #   :hosts [Array<String>] - On-premises host IPs or hostnames to add
        post 'hosts', :schema => :PostHostsSchema, :status => 202 do |provision, body|
            provision.add_hosts(
                :amount => body[:amount], :hosts => body[:hosts], :actor => @username
            )
        end

        # POST /provisions/:id/public-network/ips
        # Body:
        #   :amount [Integer] - Number of ARs (public IPs) to add
        post(
            'public-network/ips',
            :schema => :PostPublicIpsSchema,
            :status => 202
        ) do |provision, body|
            provision.add_public_ips(:actor => @username, :amount => body.fetch(:amount, 1))
        end

        # DELETE /provisions/:id/hosts
        # Params:
        #   :ids [String] - Comma-separated OpenNebula host IDs to delete
        delete(
            'hosts',
            :params_schema => :DeleteHostSchema,
            :status => 202
        ) do |provision, args|
            provision.delete_hosts(args[:ids].split(',').map(&:to_i), :actor => @username)
        end

        # DELETE /provisions/:id/public-network/ips/:ar_id
        # Params:
        #   :ar_id [String] - OpenNebula address range ID
        delete(
            'public-network/ips/:ar_id',
            :params_schema => :DeletePublicIpSchema,
            :status        => 202
        ) do |provision, args|
            provision.delete_public_ip(args[:ar_id], :actor => @username)
        end

        # DELETE /provisions/:id
        # Params:
        #   :force [Boolean]   - Forces deprovisioning
        #   :from_db [Boolean] - Deletes the provision document without deprovisioning
        delete :status => 202 do |provision|
            next provision.delete if params.key?(:from_db)

            provision.deprovision(
                :force => params.key?(:force), :actor => @username
            )
        end

        # GET /provisions/:id/logs
        logs

        def self.registered(app)
            register_routes(app)
        end

        # HTTP presentation helpers for provisions.
        module Helpers

            # Embeds a provider body inside the provision
            # @param provision [Provision] Provision receiving its provider body
            # @raise [OpenNebula::Error] If the provider cannot be retrieved
            def embed_provider(provision)
                return unless provision.provider_id

                provider = OneForm::Provider.new_from_id(@client, provision.provider_id)
                raise provider if OpenNebula.is_error?(provider)

                provider_body = provider.to_h(
                    :include_sensitive => include_sensitive?(provider)
                ).dig('DOCUMENT', 'TEMPLATE', OneForm::Provider::TEMPLATE_TAG)

                provision.include_provider(provider_body)
            end

        end

    end

end
