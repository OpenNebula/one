# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

# OneProvisionTemplate Helper
class OneProvisionTemplateHelper < OpenNebulaHelper::OneHelper

    TAG = OneProvision::ProvisionElement::TEMPLATE_TAG

    # Resource name
    def self.rname
        'DOCUMENT'
    end

    # Configuration file name
    def self.conf_file
        'oneprovision_template.yaml'
    end

    # Format pool for CLI list operation
    def format_pool(_)
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'Provision Template identifier', :size => 4 do |p|
                p['ID']
            end

            column :NAME, 'Name of the template', :left, :size => 25 do |p|
                p['NAME']
            end

            column :REGTIME,
                   'Registration time of the Provision Template',
                   :size => 15 do |p|
                p.extend(CLIHelper::HashWithSearch)
                p = JSON.parse(p.dsearch("TEMPLATE/#{TAG}"))

                OpenNebulaHelper.time_to_str(p['registration_time'])
            end

            default :ID, :NAME, :REGTIME
        end
    end

    # Shows provision template information
    #
    # @param id      [Integer] Template ID
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
    # @param template [Hash] Provision template information
    def format_resource(template, _)
        str_h1 = '%-80s'
        id     = template['ID']
        body   = template.body

        CLIHelper.print_header(str_h1 % "PROVISION TEMPLATE #{id} INFORMATION")
        puts format('ID   : %<s>s', :s => id)
        puts format('NAME : %<s>s', :s => template['NAME'])

        puts
        CLIHelper.print_header(str_h1 % 'PROVISION TEMPLATE')
        puts JSON.pretty_generate(body)
    end

    #######################################################################
    # Helper provision template functions
    #######################################################################

    # Creates a new provision template
    #
    # @param template [String] Path to file with template information
    #
    # @param [Integer] Provision Template ID
    def create(template)
        rc = validate(template)

        return rc if OpenNebula.is_error?(rc)

        xml      = OneProvision::ProvisionTemplate.build_xml
        template = OneProvision::ProvisionTemplate.new(xml, @client)

        rc = template.allocate(rc)

        return rc if OpenNebula.is_error?(rc)

        rc = template.info(true)

        return rc if OpenNebula.is_error?(rc)

        template['ID']
    end

    # Updates provision template information
    #
    # @param template [OneProvision::ProvisionTemplate] Template object
    # @param file     [String]  Path to file with update content
    # @param plain    [Boolean] True to update plain
    #
    # @return [0, OpenNebula::Error]
    def update(template, file, plain)
        OpenNebulaHelper.update_obj(template, file, plain) do |tmpl|
            if plain
                JSON.pretty_generate(tmpl.plain)
            else
                JSON.pretty_generate(tmpl.body)
            end
        end
    end

    # Updates provision template information
    #
    # @param template [OneProvision::ProvisionTemplate] Template object
    #
    # @return [0, OpenNebula::Error]
    def instantiate(template)
        rc = template.info(true)

        return rc if OpenNebula.is_error?(rc)

        template.instantiate
    end

    private

    # Validates that configuration file can be loaded and it follows structure
    #
    # @param template [String] Path to file with template information
    #
    # @return [YAML] Template in YAML format
    def validate(template)
        begin
            config   = OneProvision::ProvisionConfig.new(template)
            template = config.validate
            provider = OneProvision::Provision.read_provider(config)

            raise 'Name not found' unless template['name']
            raise 'Provider not found in template' unless provider

            template
        rescue StandardError => e
            OpenNebula::Error.new("ERROR: #{e}")
        end
    end

    # Returns a new provision template object
    #
    # @param id [Integer] Provision Template ID
    def factory(id = nil)
        if id
            OneProvision::ProvisionTemplate.new_with_id(id, @client)
        else
            xml = OneProvision::ProvisionTemplate.build_xml
            OneProvision::ProvisionTemplate.new(xml, @client)
        end
    end

    # Returns provision template pool
    def factory_pool(_)
        OneProvision::ProvisionTemplatePool.new(@client)
    end

end
