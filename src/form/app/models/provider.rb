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

module OneForm

    # Provider Schema
    class ProviderSchema < FormDocumentSchema

        params do
            required(:name).filled(:string)
            optional(:description).filled(:string)
            required(:driver).filled(:string)

            required(:fireedge).hash do
                optional(:logo).filled(:string)
            end

            required(:connection).hash
            required(:user_inputs).array(:hash)
            optional(:user_inputs_values).hash

            required(:provision_ids).array(:integer)
            required(:registration_time).filled(:integer)
        end

    end

    # The ProviderDocumentPool is a set of Provider document elements
    class ProviderDocumentPool < OpenNebula::DocumentPoolJSON

        DOCUMENT_TYPE = 103

        def initialize(client, user_id = OpenNebula::Pool::INFO_ALL)
            super(client, user_id)
        end

        def list
            map(&:name)
        end

        def ids
            map(&:id)
        end

        def exists?(id)
            ids.include?(id)
        end

        def exists_type?(type)
            any? do |provider|
                raw = provider.to_hash.dig('DOCUMENT', 'TEMPLATE', 'PROVIDER_BODY')
                next false if raw.nil? || raw.empty?

                body = JSON.parse(raw)
                body['driver'] == type
            rescue JSON::ParserError
                false
            end
        end

        # Ensure that a provider of the given type exists in the pool
        #
        # @param type [String]   Provider driver name (e.g. "onprem")
        # @param options [Hash]  Extra options merged into the provider template
        #
        # @return [true, OpenNebula::Error]
        def ensure_type!(type, options = {})
            rc = info
            return rc if OpenNebula.is_error?(rc)
            return true if exists_type?(type)

            driver   = OneForm::Driver.from_name(type)
            provider = OneForm::Provider.new(@client)

            template = driver.connection_body.merge(options)
            rc = provider.allocate(template)

            return rc if OpenNebula.is_error?(rc)

            true
        end

    end

    # Provider class
    class Provider < OpenNebula::DocumentJSON

        attr_reader :client, :body, :tag

        DOCUMENT_TYPE = ProviderDocumentPool::DOCUMENT_TYPE
        TEMPLATE_TAG  = 'PROVIDER_BODY'
        REDACTED_MARK = '__redacted__'

        PROVIDER_ATTRS = [
            'name',
            'description',
            'driver',
            'version',
            'fireedge',
            'user_inputs',
            'connection',
            'provision_ids',
            'registration_time'
        ]

        # List of attributes that can't be changed in update operation
        # registration_time: this is internal info managed by OneForm server
        IMMUTABLE_ATTRS = [
            'driver',
            'registration_time',
            'provision_ids'
        ]

        # Attributes update properties
        UPDATE_ATTRS = [
            'name',
            'description',
            'connection'
        ]

        def initialize(client, opts = {})
            @tag = TEMPLATE_TAG

            @xml = if opts[:id]
                       OpenNebula::Document.build_xml(opts[:id])
                   elsif opts[:xml]
                       opts[:xml]
                   else
                       OpenNebula::Document.build_xml
                   end

            super(@xml, client)
        end

        # Create a new Provider object from the given XML element
        #
        # @param [OpenNebula::Client] client the OpenNebula client
        # @param [String] XML object
        def self.new_from_xml(client, xml)
            Provider.new(client, :xml => xml)
        end

        # Create a new Provider object from the given ID
        # and tries to retrieve the body xml representation of the Provider
        #
        # @param [OpenNebula::Client] client the OpenNebula client
        # @param [String] id the object ID
        def self.new_from_id(client, id)
            provider = Provider.new(client, :id => id)
            rc = provider.info

            return rc if OpenNebula.is_error?(rc)

            provider
        end

        # Validate a Provider against the schema
        #
        # @return [nil, OpenNebula::Error] nil in case of success
        def self.validate(provider)
            schema = ProviderSchema.new
            validation = schema.call(provider)

            return OpenNebula::Error.new(
                {
                    'message' => 'Error validating Provider',
                    'context' => validation.errors.to_h
                },
                OpenNebula::Error::ENOTDEFINED
            ) if validation.failure?
        end

        def to_h(opts = {})
            include_sensitive = opts[:include_sensitive] == true

            document = to_hash.clone
            template = Marshal.load(Marshal.dump(@body))

            ui        = template['user_inputs'] || []
            ui_values = (template['connection'] || {}).dup

            unless include_sensitive
                ui.each do |input|
                    sensitive = input[:sensitive] || input['sensitive']
                    name      = input[:name] || input['name']
                    next unless sensitive && name

                    ui_values[name] = REDACTED_MARK if ui_values.key?(name)
                end
            end

            template = template.merge('connection' => ui_values)
            document['DOCUMENT']['TEMPLATE'][TEMPLATE_TAG] = template

            document
        end

        def to_json(*args)
            super
        end

        def enabled?
            rc = OneForm::Driver.from_name(driver)
            return false if OpenNebula.is_error?(rc)

            rc.enabled?
        end

        def driver_path
            rc = OneForm::Driver.from_name(driver)
            return rc.system_path if OpenNebula.is_error?(rc) == false

            nil
        end

        ########################################################
        ## ATTRIBUTES                                         ##
        ########################################################

        def add_provision_id(id)
            provision_ids.push(id) unless provision_ids.include?(id)
        end

        def remove_provision_id(id)
            provision_ids.delete(id)
        end

        ########################################################
        ## PROVIDER OPERATIONS                                ##
        ########################################################

        # Fetch the provider body and define the accessors
        def info
            rc = super(true)

            return rc if OpenNebula.is_error?(rc)

            @body.each do |key, _|
                next unless PROVIDER_ATTRS.include?(key)

                self.class.define_method(key) do
                    @body[key]
                end

                self.class.define_method("#{key}=") do |new_value|
                    @body[key] = new_value
                end
            end
        end

        # Allocate a new provider
        def allocate(provider_template)
            template = provider_template.to_hash

            template['provision_ids']      = []
            template['registration_time']  = Time.now.to_i

            rc = Provider.validate(template)
            return rc if OpenNebula.is_error?(rc)

            super(template.slice(*PROVIDER_ATTRS).to_json, template['name'])

            # Fill the body once allocated
            rc = info
            return rc if OpenNebula.is_error?(rc)
        end

        # Delete the provider
        # @return [nil, OpenNebula::Error] nil in case of success
        def delete
            return OpenNebula::Error.new(
                "Cannot delete a Provider with existing Provisions: #{provision_ids}",
                OpenNebula::Error::EACTION
            ) unless provision_ids.empty?

            super
        end

        # Update the provider info
        # @return [nil, OpenNebula::Error] nil in case of success
        def update(json = {})
            json  = JSON.parse(json) if json.is_a?(String)
            nbody = @body.clone

            UPDATE_ATTRS.each do |attribute|
                next unless json[attribute]

                nbody[attribute] = json[attribute]
            end

            rc = rename(nbody['name']) if nbody['name'] != name
            return rc if OpenNebula.is_error?(rc)

            rc = super(nbody.to_json)
            return rc if OpenNebula.is_error?(rc)

            @body = nbody
        rescue StandardError => e
            return OpenNebula::Error.new(
                "Error updating provider: #{e.message}"
            )
        end

    end

end
