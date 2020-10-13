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

require 'base64'

module OneProvision

    # Provider class as wrapper of DocumentJSON
    class Provider < ProvisionElement

        DOCUMENT_TYPE = 102

        # These attributes can not be changed when updating the provider
        UNMUTABLE_ATTRS = %w[provider registration_time]

        # Allocates a new document
        #
        # @param template [Hash] Document information
        def allocate(template)
            rc = Provider.by_name(@client, template['name'])

            return rc if OpenNebula.is_error?(rc)

            if rc
                return OpenNebula::Error.new("Provider #{template['name']} " \
                                             'already exists')
            end

            rc = nil

            begin
                rc = to_json(template)

                return rc if OpenNebula.is_error?(rc)
            rescue StandardError => e
                return OpenNebula::Error.new(e)
            end

            super(rc, template['name'], TEMPLATE_TAG)
        end

        # Delete provider
        def delete
            info(true)

            # Check if the provider is being used in any provision
            pool = ProvisionPool.new(@client)
            rc   = pool.info_all

            return rc if OpenNebula.is_error?(rc)

            pool.each do |p|
                next unless p.body['provider'] == body['provider']

                next if p.body['state'] == Provision::STATE['DONE']

                return OpenNebula::Error.new(
                    'Provider can not be deleted, it is used by ' \
                    "provision with ID: #{p['ID']}"
                )
            end

            pool = ProvisionTemplatePool.new(@client)
            rc   = pool.info_all

            return rc if OpenNebula.is_error?(rc)

            pool.each do |p|
                next unless Integer(p.body['provider']) == Integer(self['ID'])

                return OpenNebula::Error.new(
                    'Provider can not be deleted, it is used by ' \
                    "provision template with ID: #{p['ID']}"
                )
            end

            super
        end

        # Gets connection information
        def connection
            conn             = @body['connection']
            conn['provider'] = self['NAME']

            conn
        end

        # Gets provider object by name or ID
        #
        # @param client   [Client] Client to make OpenNebula calls
        # @param provider [String] Provider name or ID
        #
        # @return [Provider]
        def self.by_name(client, provider)
            if provider.to_s.match(/^[0123456789]+$/)
                provider = Provider.new_with_id(Integer(provider), client)
                rc       = provider.info(true)

                return rc if OpenNebula.is_error?(rc)

                provider
            else
                pool = ProviderPool.new(client)
                rc   = pool.info_group

                return rc if OpenNebula.is_error?(rc)

                pool.find {|p| p['NAME'] == provider }
            end
        end

        private

        # Generates document JSON information
        #
        # @param template [Hash] Provision information
        #
        # @return [JSON] Document information in JSON format
        def to_json(template)
            document = {}

            # Create document JSON
            document['provider']          = template['name']
            document['connection']        = template['connection']
            document['registration_time'] = Time.now.to_i

            document.to_json
        end

    end

end
