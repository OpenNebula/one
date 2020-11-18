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
require 'tempfile'

module OneProvision

    # Provision Template class as wrapper of DocumentJSON
    class ProvisionTemplate < ProvisionElement

        DOCUMENT_TYPE   = 104

        # These attributes can not be changed when updating the template
        IMMUTABLE_ATTRS = %w[name provider]

        # Allocates a new document
        #
        # @param template [Hash] Document information
        def allocate(template)
            pool = ProvisionTemplatePool.new(@client)
            rc   = pool.info_group

            return rc if OpenNebula.is_error?(rc)

            rc = pool.find do |p|
                p['NAME'] == template['name']
            end

            if rc
                return OpenNebula::Error.new(
                    "Provision template #{template['name']} already exists"
                )
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

        # Instantiate the template
        #
        # @param inputs   [Array]   User inputs values
        # @param cleanup  [Boolean] True to cleanup everything
        # @param timeout  [Integer] Timeout in seconds to connect to hosts
        # @param skip     [Symbol]  Skip provision, configuration or anything
        # @param provider [String]  Provider ID or name
        # @param extra    [String]  Path to extra template information
        #
        # @param [Intenger] New provision ID
        # rubocop:disable Metrics/ParameterLists
        def instantiate(inputs, cleanup, timeout, skip, provider, extra)
            # rubocop:enable Metrics/ParameterLists
            rc = info(true)

            return rc if OpenNebula.is_error?(rc)

            # If provider option is provided, respect it and ignore provision
            # template provider information
            if provider
                provider = Provider.by_name(@client, provider)
            else
                if @body['provider']
                    provider = Provider.new_with_id(@body['provider'], @client)
                    rc       = provider.info(true)

                    return rc if OpenNebula.is_error?(rc)

                    @body['defaults']['provision'] = provider.connection
                end
            end

            # Merge extra information supplied by the user with the current
            # information stored in the template
            if extra
                begin
                    extra = YAML.load_file(extra)
                    @body = @body.merge(extra)
                rescue StandardError => e
                    return OpenNebula::Error.new(e)
                end
            end

            tempfile = Tempfile.new('provision-template')
            tempfile << @body.to_yaml
            tempfile.close

            xml       = OneProvision::Provision.build_xml
            provision = OneProvision::Provision.new(xml, @client)

            provision.deploy({ :config => tempfile.path, :inputs => inputs },
                             cleanup,
                             timeout,
                             skip,
                             provider)
        ensure
            tempfile.unlink if tempfile
        end

        private

        # Generates document JSON information
        #
        # @param template [Hash] Provision information
        #
        # @return [JSON] Document information in JSON format
        def to_json(template)
            document = {}
            provider = Provision.read_provider(template)
            provider = Provider.by_name(@client, provider)

            return provider if OpenNebula.is_error?(provider)

            return OpenNebula::Error.new('Provider not found') unless provider

            # Remove provider information as it has been converted to ID
            if template['defaults']['provision']['provider']
                template['defaults']['provision'].delete('provider')
            end

            if template['hosts']
                template['hosts'].each do |host|
                    next unless host['provision']['provider']

                    host['provision'].delete('provider')
                end
            end

            # Create document JSON
            document['name']              = template['name']
            document['provider']          = provider['ID']
            document['registration_time'] = Time.now.to_i
            document['playbooks']         = template['playbook']
            document['defaults']          = template['defaults']

            if template['inputs']
                document['inputs'] = template['inputs']
            end

            (Provision::RESOURCES + Provision::FULL_CLUSTER).each do |resource|
                next unless template[resource]

                document[resource] = template[resource]
            end

            document['cluster'] = template['cluster'] if template['cluster']

            document.to_json
        end

    end

end
