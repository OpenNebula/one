# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'yaml'
require 'erb'
require 'nokogiri'
require 'open3'
require 'tempfile'
require 'highline'
require 'highline/import'

# Cleanup Exception
class OneProvisionCleanupException < RuntimeError
end

# Loop Exception
class OneProvisionLoopException < RuntimeError

    attr_reader :text

    def initialize(text = nil)
        @text = text
    end

end

module OneProvision

    # Utils
    module Utils

        class << self

            ERROR_OPEN  = 'ERROR MESSAGE --8<------'
            ERROR_CLOSE = 'ERROR MESSAGE ------>8--'

            # Checks if oned is running
            def one_running?
                system = OpenNebula::System.new(OpenNebula::Client.new)
                config = system.get_configuration

                OpenNebula.is_error?(config)
            end

            # Validates the configuration file
            #
            # @param config [String]  Path to the configuration file
            # @param dump   [Boolean] True to show the result in the console
            def validate_configuration(config, dump)
                config = read_config(config)

                config = config.delete_if {|_k, v| v.nil? }

                check_config(config)

                puts config.to_yaml if dump

                0
            end

            # Checks configuration fole
            #
            # @param config [Hash] Configuration content
            def check_config(config)
                name = config['name']
                version = config['version']

                if !version.nil? && version != 1
                    Utils.fail('There is an error in your configuration ' \
                               'file: Unsupported version')
                end

                if name.nil?
                    Utils.fail('There is an error in your configuration ' \
                               'file: no name given')
                end

                if config['hosts']
                    config['hosts'].each_with_index do |h, i|
                        im = h['im_mad']
                        vm = h['vm_mad']
                        name = h['provision']['hostname']

                        if im.nil?
                            Utils.fail('There is an error in your ' \
                                       'configuration file: there is ' \
                                       "no im_mad in host #{i + 1}")
                        end

                        if vm.nil?
                            Utils.fail('There is an error in your ' \
                                       'configuration file: there is ' \
                                       "no vm_mad in host #{i + 1}")
                        end

                        if name.nil?
                            Utils.fail('There is an error in your ' \
                                       'configuration file: there is ' \
                                       "no hostname in host #{i + 1}")
                        end

                        next
                    end
                end

                if config['datastores']
                    config['datastores'].each_with_index do |d, i|
                        if d['tm_mad'].nil?
                            Utils.fail('There is an error in your ' \
                                       'configuration file: there is '\
                                       "no tm_mad in datastore #{i + 1}")
                        end

                        next
                    end
                end

                return unless config['networks']

                config['networks'].each_with_index do |n, i|
                    if n['vn_mad'].nil?
                        Utils.fail('There is an error in your ' \
                                   'configuration file: there is '\
                                   "no vn_mad in newtork #{i + 1}")
                    end

                    next
                end
            end

            # Creates configuration
            #
            # @param yaml [Hash] Configuration content
            #
            # @return [Hash]     Configuration for drivers
            def create_config(yaml)
                begin
                    check_config(yaml)

                    cluster = yaml['cluster']

                    yaml['cluster'] = { 'name' => yaml['name'] } if cluster.nil?

                    defaults = yaml['defaults']

                    # TODO: schema check
                    if yaml['hosts']
                        yaml['hosts'] = yaml['hosts'].map do |host|
                            sections = %w[connection provision configuration]
                            sections.each do |section|
                                data = CONFIG_DEFAULTS[section] || {}

                                if yaml['defaults']
                                    defaults = yaml['defaults'][section]
                                end

                                h_sec = host[section]
                                # merge defaults with globals
                                # and device specific params
                                data.merge!(defaults) unless defaults.nil?
                                data.merge!(h_sec) unless h_sec.nil?

                                host[section] = data
                            end

                            host
                        end
                    end

                    %w[datastores networks].each do |r|
                        next unless yaml[r]

                        yaml[r] = yaml[r].map do |x|
                            x['provision'] ||= {}

                            if defaults && defaults.key?('provision')
                                x['provision'].merge!(defaults['provision'])
                            end

                            x
                        end
                    end

                    yaml['cluster']['provision'] ||= {}

                    if defaults && defaults.key?('provision')
                        yaml['cluster']['provision']
                            .merge!(defaults['provision'])
                    end
                rescue StandardError => e
                    Utils.fail("Failed to read configuration: #{e}")
                end

                yaml
            end

            # Reads configuration content
            #
            # @param name [String] Path to the configuration file
            #
            # @return [Hash]       Configuration content
            def read_config(name)
                begin
                    yaml = YAML.load_file(name)
                rescue StandardError => e
                    Utils.fail("Failed to read template: #{e}")
                end

                return yaml unless yaml['extends']

                base = read_config(yaml['extends'])

                yaml.delete('extends')
                base['defaults'] ||= {}
                yaml['defaults'] ||= {}

                # replace scalars or append array from child YAML
                yaml.each do |key, value|
                    next if key == 'defaults'

                    if (value.is_a? Array) && (base[key].is_a? Array)
                        base[key].concat(value)
                    else
                        base[key] = value
                    end
                end

                # merge each defaults section separately
                %w[connection provision configuration].each do |section|
                    base['defaults'][section] ||= {}
                    yaml['defaults'][section] ||= {}
                    defaults = yaml['defaults'][section]

                    base['defaults'][section].merge!(defaults)
                end

                base
            end

            # Gets the value of an ERB expression
            #
            # @param provision [OneProvision::Provision] Provision object
            # @value           [String]         Value to evaluate
            #
            # @return          [String]         Evaluated value
            def get_erb_value(provision, value)
                unless value.match(/@./)
                    raise OneProvisionLoopException,
                          "value #{value} not allowed"
                end

                template = ERB.new value
                ret = template.result(provision._binding)

                if ret.empty?
                    raise OneProvisionLoopException,
                          "#{value} not found."
                end

                ret
            end

            # Evaluates ERB values
            #
            # @param provision [OneProvision::Provision] Provision object
            # @param root      [Hash]           Hash with values to evaluate
            #
            # @return          [Hash]           Hash with evaluated values
            def evaluate_erb(provision, root)
                if root.is_a? Hash
                    root.each_pair do |key, value|
                        if value.is_a? Array
                            root[key] = value.map do |x|
                                evaluate_erb(provision, x)
                            end
                        elsif value.is_a? Hash
                            root[key] = evaluate_erb(provision, value)
                        elsif value.is_a? String
                            if value =~ /<%= /
                                root[key] = get_erb_value(provision, value)
                            end
                        end
                    end
                else
                    root = root.map {|x| evaluate_erb(provision, x) }
                end

                root
            end

            # Checks if the file can be read
            #
            # @param name [String] Path to file to read
            def try_read_file(name)
                File.read(name).strip
            rescue StandardError
                name
            end

            # Creates the host deployment file
            #
            # @param host           [Hash]   Hash with host information
            # @param provision_id   [String] ID of the provision
            # @param provision_name [String] Name of the provision
            #
            # @return             [Nokogiri::XML] XML with the host information
            def create_deployment_file(host, provision_id, provision_name)
                ssh_key = try_read_file(host['connection']['public_key'])
                config = Base64.strict_encode64(host['configuration'].to_yaml)

                Nokogiri::XML::Builder.new do |xml|
                    xml.HOST do
                        xml.NAME "provision-#{SecureRandom.hex(24)}"
                        xml.TEMPLATE do
                            xml.IM_MAD host['im_mad']
                            xml.VM_MAD host['vm_mad']
                            xml.PM_MAD host['provision']['driver']
                            xml.PROVISION do
                                host['provision'].each do |key, value|
                                    if key != 'driver'
                                        xml.send(key.upcase, value)
                                    end
                                end
                                xml.send('PROVISION_ID', provision_id)
                                xml.send('NAME', provision_name)
                            end
                            if host['configuration']
                                xml.PROVISION_CONFIGURATION_BASE64 config
                            end
                            xml.PROVISION_CONFIGURATION_STATUS 'pending'
                            if host['connection']
                                xml.PROVISION_CONNECTION do
                                    host['connection'].each do |key, value|
                                        xml.send(key.upcase, value)
                                    end
                                end
                            end
                            if host['connection']
                                xml.CONTEXT do
                                    if host['connection']['public_key']
                                        xml.SSH_PUBLIC_KEY ssh_key
                                    end
                                end
                            end
                        end
                    end
                end.doc.root
            end

            # Shows and error message and exit with fail code
            #
            # @param text [String]  Error message
            # @param code [Integer] Error code
            def fail(text, code = -1)
                STDERR.puts "ERROR: #{text}"
                exit(code)
            end

            # Checks if the return_code is error
            def exception(return_code)
                error = OpenNebula.is_error?(return_code)

                raise OneProvisionLoopException, return_code.message if error
            end

            # Gets error message
            #
            # @param text [String] Text with error message inside
            #
            # @return     [String] Error message
            def get_error_message(text)
                msg = '-'

                if text
                    tmp = text.scan(/^#{ERROR_OPEN}\n(.*?)#{ERROR_CLOSE}$/m)
                    msg = tmp[0].join(' ').strip if tmp[0]
                end

                msg
            end

            # Converts XML template to string
            #
            # @param attributes [Hash]    XML attributes
            # @paran indent     [Bollean] True to format indentation
            #
            # @return           [String]  String with the template information
            def template_like_str(attributes, indent = true)
                if indent
                    ind_enter = "\n"
                    ind_tab = '  '
                else
                    ind_enter = ''
                    ind_tab = ' '
                end

                str = attributes.collect do |key, value|
                    next unless value

                    str_line = ''

                    if value.class == Array

                        value.each do |value2|
                            str_line << key.to_s.upcase << '=[' << ind_enter

                            if value2 && value2.class == Hash
                                str_line << value2.collect do |key3, value3|
                                    str = ind_tab + key3.to_s.upcase + '='

                                    if value3
                                        str += "\"#{value3}\""
                                    end

                                    str
                                end.compact.join(",\n")
                            end
                            str_line << "\n]\n"
                        end

                    elsif value.class == Hash
                        str_line << key.to_s.upcase << '=[' << ind_enter

                        str_line << value.collect do |key3, value3|
                            str = ind_tab + key3.to_s.upcase + '='

                            if value3
                                str += "\"#{value3}\""
                            end

                            str
                        end.compact.join(",\n")

                        str_line << "\n]\n"

                    else
                        str_line << key.to_s.upcase << '=' << "\"#{value}\""
                    end
                    str_line
                end.compact.join("\n")

                str
            end

        end

    end

end
