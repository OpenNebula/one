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
        IMMUTABLE_ATTRS = %w[provider name]

        # These providers get the credentials via some file
        CREDENTIALS_FILE = { 'google' => 'credentials' }

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
                Terraform.p_load

                Terraform.check_connection(template)

                rc = to_json(template)

                return rc if OpenNebula.is_error?(rc)
            rescue StandardError => e
                return OpenNebula::Error.new(e)
            end

            template['plain']           ||= {}
            template['plain']['provider'] = template['provider']

            super(rc, template['name'], template['plain'])
        end

        # Replaces the template contents
        #
        # @param template_json [String]  New template contents
        # @param plain         [Boolean] Update plain information
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(template_json = nil, plain = false)
            # Provider is inmutable
            if plain
                template_json = JSON.parse(template_json)

                template_json['provider'] = @body['provider']
                template_json             = template_json.to_json
            end

            super
        end

        # Delete provider
        def delete
            info(true)

            # Check if the provider is being used in any provision
            pool = ProvisionPool.new(@client)
            rc   = pool.info_all

            return rc if OpenNebula.is_error?(rc)

            pool.each do |p|
                next unless p.body['provider'] == self['NAME']

                return OpenNebula::Error.new(
                    'Provider can not be deleted, it is used by ' \
                    "provision with ID: #{p['ID']}"
                )
            end

            super
        end

        # Gets connection information
        def connection
            # Onprem case
            return unless @body

            conn             = {}
            conn['provider'] = @body['provider']

            @body['connection'].each do |k, v|
                conn[k.upcase] = v
            end

            conn
        end

        # Gets inputs information
        def inputs
            # Onprem case
            return unless @body

            @body['inputs'] || []
        end

        # Gets provider type
        def type
            # Onprem case
            return 'onprem' unless @body

            @body['provider']
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
            skip     = %w[provider connection registration_time plain]

            # Create document JSON
            document['provider']          = template['provider']
            document['connection']        = template['connection']
            document['registration_time'] = Time.now.to_i

            if CREDENTIALS_FILE.keys.include?(template['provider'])
                c_key  = CREDENTIALS_FILE[template['provider']]
                c_file = template['connection'][c_key]

                # Load credentials file if exists
                begin
                    if File.exist?(c_file)
                        c_file = Base64.strict_encode64(File.read(c_file))
                    end
                rescue StandardError => e
                    return OpenNebula::Error.new("Loading credentials: #{e}")
                end

                document['connection'][c_key] = c_file
            end

            template.each do |key, value|
                next if skip.include?(key)

                document[key] = value
            end

            document.to_json
        end

    end

end
