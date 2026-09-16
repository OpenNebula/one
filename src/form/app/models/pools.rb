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

    # The ProviderDocumentPool is a set of Provider document elements
    class ProviderDocumentPool < ODS::Pool

        DOCUMENT_CLASS = OneForm::Provider
        DOCUMENT_TYPE  = OneForm::Provider::DOCUMENT_TYPE

        def exists_type?(type)
            any? {|provider| provider.driver == type }
        end

        # Ensure that a provider of the given type exists in the pool
        #
        # @param type [String]  Provider driver name (e.g. "onprem")
        # @param options [Hash] Extra options merged into the provider template
        #
        # @return [true, OpenNebula::Error]
        def ensure_type!(type, options = {})
            rc = info
            return rc if OpenNebula.is_error?(rc)
            return true if exists_type?(type)

            driver = OneForm::Driver.from_name(type)
            return driver if OpenNebula.is_error?(driver)

            return OpenNebula::Error.new(
                "Driver '#{type}' is in an unknown state",
                OpenNebula::Error::ENOTDEFINED
            ) if driver.nil?

            template = driver.connection_body
            return template if OpenNebula.is_error?(template)

            provider = OneForm::Provider.new(@client)
            rc = provider.allocate(template.merge(options))

            return rc if OpenNebula.is_error?(rc)

            true
        end

    end

    # The ProvisionDocumentPool is a set of Provision document elements
    class ProvisionDocumentPool < ODS::Pool

        DOCUMENT_CLASS = OneForm::Provision
        DOCUMENT_TYPE  = OneForm::Provision::DOCUMENT_TYPE

        # Resolves dependencies requested by the provision workflow
        def resolve_dependencies(provision, dependencies)
            Array(dependencies).to_h do |name|
                name = name.to_sym
                return super unless name == :provider

                provider = OneForm::Provider.new_from_id(
                    provision.client,
                    provision.provider_id
                )
                return provider if OpenNebula.is_error?(provider)

                [name, provider]
            end
        end

    end

end
