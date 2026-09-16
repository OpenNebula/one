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

    # Provider class
    class Provider < ODS::Document

        attr_reader :client, :body, :tag

        COMP             = 'PRD'
        RESOURCE_NAME    = 'Provider'
        TEMPLATE_TAG     = 'PROVIDER_BODY'
        DOCUMENT_TYPE    = 103
        USER_VALUES_ATTR = :connection

        DOCUMENT_ATTRS = [
            :name,
            :description,
            :driver,
            :version,
            :fireedge,
            :user_inputs,
            :connection,
            :provision_ids,
            :registration_time
        ]

        # Attributes that can be modified during an user update
        UPDATE_ATTRS = [
            :name,
            :description,
            :connection
        ]

        #------------------------------------------------------
        # Schema and driver methods
        #------------------------------------------------------

        def self.schema
            ProviderSchema.new(:document_class => self)
        end

        # Creates and allocates a provider from an enabled driver definition
        # @param client [OpenNebula::Client] OpenNebula client
        # @param attributes [Hash] Driver name and provider overrides
        # @return [Provider, OpenNebula::Error] Allocated provider or creation error
        def self.from_driver(client, attributes)
            driver_name = attributes[:driver].downcase

            return OpenNebula::Error.new(
                'The onprem provider already exists and cannot be created again',
                OpenNebula::Error::ENOTDEFINED
            ) if driver_name == 'onprem'

            driver = OneForm::Driver.from_name(driver_name)
            return driver if OpenNebula.is_error?(driver)

            return OpenNebula::Error.new(
                'Provider creation is not allowed from a disabled driver',
                OpenNebula::Error::ENOTDEFINED
            ) unless driver.enabled?

            driver.merge(attributes)
            body = driver.connection_body
            return body if OpenNebula.is_error?(body)

            provider = new(client)
            rc       = provider.allocate(body)

            return rc if OpenNebula.is_error?(rc)

            provider
        end

        def enabled?
            rc = OneForm::Driver.from_name(driver)
            return false if OpenNebula.is_error?(rc)

            rc.enabled?
        end

        def path
            rc = OneForm::Driver.from_name(driver)
            return rc.system_path if OpenNebula.is_error?(rc) == false

            nil
        end

        #------------------------------------------------------
        # Document operations
        #------------------------------------------------------

        # Allocate a new provider
        def allocate(body)
            template = {
                :provision_ids     => [],
                :registration_time => Time.now.to_i
            }.merge(body)

            super(template)
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

        # Serializes the provider response without its input definitions
        # @param opts [Hash] ODS serialization options
        # @return [String] JSON without provider input definitions
        def to_json(opts = {})
            opts     = {} unless opts.is_a?(Hash)
            document = to_h(opts)
            body     = document['DOCUMENT']['TEMPLATE'][TEMPLATE_TAG]

            body.delete(:user_inputs)

            document.to_json
        end

        #------------------------------------------------------
        # Provider actions
        #------------------------------------------------------

        def add_provision_id(id)
            provision_ids.push(id) unless provision_ids.include?(id)
        end

        def remove_provision_id(id)
            provision_ids.delete(id)
        end

    end

end
