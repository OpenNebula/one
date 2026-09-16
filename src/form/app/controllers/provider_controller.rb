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

    # Providers controller
    module ProviderController

        extend ODS::DocumentController

        BASE_PATH = '/providers'
        ODS_CLASS = OneForm::Provider
        ODS_POOL  = OneForm::ProviderDocumentPool

        # GET /providers
        # Params:
        #   :enabled [Boolean] - Includes only enabled providers
        list do |provider|
            !params.key?(:enabled) || provider.enabled?
        end

        # GET /providers/:id
        show

        # GET /providers/:id/user_inputs
        attribute :user_inputs, :path => 'inputs', :raw => true

        # GET /providers/:id/path
        attribute :path, :oneadmin_only => true

        # POST /providers
        # Body:
        #   :driver [String] - Base driver name
        #   :connection_values [Hash] - Connection values
        #   :name [String] - Provider name
        #   :description [String] - Provider description
        create :schema => :PostProviderSchema do |body|
            OneForm::Provider.from_driver(@client, body)
        end

        # PATCH /providers/:id
        # Body:
        #   :name [String] - Provider name
        #   :description [String, nil] - Provider description
        #   :connection [Hash] - Connection values
        update :schema => :PatchProviderSchema do |provider, body|
            next 'The onprem provider is required by the system and cannot be edited' \
                 if provider.driver == 'onprem'

            next OpenNebula::Error.new(
                'Access denied. Only the provider owner or users belonging to ' \
                'the oneadmin group can update connection values',
                OpenNebula::Error::EAUTHENTICATION
            ) if body.key?(:connection) && !sensitive_access?(provider)
        end

        # POST /providers/:id/chmod
        chmod

        # POST /providers/:id/chown
        chown

        # POST /providers/:id/chgrp
        chgrp

        # DELETE /providers/:id
        delete do |provider|
            next 'The onprem provider is required by the system and cannot be deleted' \
                 if provider.driver == 'onprem'

            provider.delete
        end

        def self.registered(app)
            register_routes(app)
        end

    end

end
