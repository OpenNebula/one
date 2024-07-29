# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'json'
require 'yaml'

require 'provision_element'

# OneProvider Helper
class OneProviderHelper < OpenNebulaHelper::OneHelper

    TAG = OneProvision::ProvisionElement::TEMPLATE_TAG

    # Resource name
    def self.rname
        'DOCUMENT'
    end

    # Configuration file name
    def self.conf_file
        'oneprovider.yaml'
    end

    # Format pool for CLI list operation
    def format_pool(_)
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'Provider identifier', :size => 4 do |p|
                p['ID']
            end

            column :NAME, 'Name of the provider', :left, :size => 25 do |p|
                p['NAME']
            end

            column :REGTIME,
                   'Registration time of the Provider',
                   :size => 15 do |p|
                p.extend(CLIHelper::HashWithSearch)
                p = JSON.parse(p.dsearch("TEMPLATE/#{TAG}"))

                OpenNebulaHelper.time_to_str(p['registration_time'])
            end

            default :ID, :NAME, :REGTIME
        end
    end

    # Shows provider information
    #
    # @param id      [Integer] Provider ID
    # @param options [Hash]    User CLI options
    #
    # @return [Array] [rc, information to show]
    def show_resource(id, options)
        # Add body paremter to get resource in hash format
        options[:body]    = true
        options[:decrypt] = true
        info              = super

        return info if info[0] != 0

        if options[:json]
            info[1]['DOCUMENT']['TEMPLATE'][TAG] = JSON.parse(
                info[1]['DOCUMENT']['TEMPLATE'][TAG]
            )
            info[1] = JSON.pretty_generate(info[1])
        elsif options[:yaml]
            yaml = YAML.safe_load(info[1])
            yaml['DOCUMENT']['TEMPLATE'][TAG] = JSON.parse(
                yaml['DOCUMENT']['TEMPLATE'][TAG]
            )
            info[1] = yaml.to_yaml(:indent => 4)
        end

        info
    end

    # Format resource to output it in show command
    #
    # @param provider [Hash] Provider information
    def format_resource(provider, _)
        str_h1 = '%-80s'
        id     = provider['ID']
        body   = provider.body

        CLIHelper.print_header(str_h1 % "PROVIDER #{id} INFORMATION")
        puts format('ID   : %<s>s', :s => id)
        puts format('NAME : %<s>s', :s => provider['NAME'])

        return if body['provider'] == 'onprem'

        # Get max size to adjust all the values
        size = body['connection'].keys.map {|k| k.size }.max
        data = {}

        # Generate data value with the new key adjusted format
        body['connection'].map {|k, v| data[k.ljust(size)] = v }

        puts
        CLIHelper.print_header(str_h1 % 'CONNECTION INFORMATION')
        data.each do |key, value|
            CLIHelper.scr_bold
            print "#{key} : "
            CLIHelper.scr_restore
            puts value
        end
    end

    #######################################################################
    # Helper provider functions
    #######################################################################

    # Creates a new provider
    #
    # @param template [String] Path to file with template information
    #
    # @param [Integer] Provider ID
    def create(template)
        rc = validate(template)

        return rc if OpenNebula.is_error?(rc)

        xml      = OneProvision::Provider.build_xml
        provider = OneProvision::Provider.new(xml, @client)

        rc = provider.allocate(rc)

        return rc if OpenNebula.is_error?(rc)

        rc = provider.info(true)

        return rc if OpenNebula.is_error?(rc)

        provider['ID']
    end

    # Updates provider information
    #
    # @param provider [OneProvision::Provider] Provider object
    # @param file     [String]                 Path to file with update content
    # @param plain    [Boolean]                True to update plain
    #
    # @return [0, OpenNebula::Error]
    def update(provider, file, plain)
        OpenNebulaHelper.update_obj(provider, file, plain) do |prov|
            if plain
                JSON.pretty_generate(prov.plain)
            else
                JSON.pretty_generate(prov.body)
            end
        end
    end

    private

    # Validates that configuration file can be loaded and it follows structure
    #
    # @param template [String] Path to file with template information
    #
    # @return [YAML] Template in YAML format
    def validate(template)
        begin
            template = YAML.load_file(template)

            raise 'Name not found' unless template['name']

            OneProvision::Terraform.p_load

            unless OneProvision::Terraform.exist?(template['provider'])
                raise 'Invalid provider, available providers: ' \
                      "#{OneProvision::Terraform.providers.join(', ')}"
            end

            return template if template['provider'] == 'onprem'

            raise 'Connection info not found' unless template['connection']

            template
        rescue StandardError => e
            OpenNebula::Error.new("ERROR: #{e}")
        end
    end

    # Returns a new provider object
    #
    # @param id [Integer] Provider ID
    def factory(id = nil)
        if id
            OneProvision::Provider.new_with_id(id, @client)
        else
            OneProvision::Provider.new(OneProvision::Provider.build_xml,
                                       @client)
        end
    end

    # Returns provider pool
    def factory_pool(_)
        OneProvision::ProviderPool.new(@client)
    end

end
