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
require 'tempfile'
require 'json'
require 'yaml'

require 'one_helper'
require 'cloud/CloudClient'

# Generic CLI helper for ODS-based services
class ODSHelper < OpenNebulaHelper::OneHelper

    # Configuration file name used by the helper
    def self.conf_file
        raise NotImplementedError, "#{name}.conf_file must be implemented"
    end

    def self.template_tag
        raise NotImplementedError, "#{name}.template_tag must be implemented"
    end

    # ODS client class used by the helper
    def self.client_class(options = {})
        raise NotImplementedError, "#{name}.client_class must be implemented"
    end

    def client(options = {})
        self.class.client_class.new(
            :username => options[:username],
            :password => options[:password],
            :endpoint => options[:endpoint] || options[:server],
            :opts     => {
                :version    => options[:api_version],
                :user_agent => USER_AGENT
            }
        )
    end

    #------------------------------------------------------
    # Operations wrappers
    #------------------------------------------------------

    # Generic list flow
    # @param client      [ODSClient]
    # @param list_method [Symbol]
    # @param options     [Hash]
    # @yield [response] Custom renderer for normal output mode
    # @return [Integer, Array]
    def list_resources(client, list_method, options = {})
        response = client.public_send(list_method, options)
        render_response(response, options) {|data| yield(data) if block_given? }
    end

    # Generic show flow
    # @param client      [ODSClient]
    # @param resource_id [Integer, String]
    # @param get_method  [Symbol]
    # @param options     [Hash]
    # @yield [response] Custom renderer for normal output mode
    # @return [Integer, Array]
    def show_resource(client, get_method, resource_id, options = {})
        response = client.public_send(get_method, resource_id, options)
        render_response(response, options) {|data| yield(data) if block_given? }
    end

    # Generic continuous loop for top-like views.
    # @param delay [Integer, Float, nil]
    # @yield Body to execute in each refresh
    # @return [Integer]
    def top_resources(delay = nil)
        delay ||= 5

        begin
            loop do
                CLIHelper.scr_cls
                CLIHelper.scr_move(0, 0)

                yield

                sleep delay
            end
        rescue StandardError => e
            STDERR.puts e.message
            exit(-1)
        end

        0
    end

    # Generic update flow for JSON resources.
    # If no file is provided, current resource body is fetched, dumped into a
    # tempfile, opened in the editor, and then sent back using update_method.
    # @param client        [ODSClient]
    # @param resource_id   [Integer, String]
    # @param get_method    [Symbol]
    # @param update_method [Symbol]
    # @param file_path     [String, nil]
    # @return [Integer, Array]
    def update_resource_from_editor(client, resource_id, get_method, update_method, file_path)
        path =
            if file_path
                file_path
            else
                response = client.public_send(get_method, resource_id)

                if CloudClient.is_error?(response)
                    return [response[:err_code], response[:message]]
                end

                body   = response.dig(:TEMPLATE, self.class.template_tag)
                prefix = self.class.client_class.name.split('::').first.downcase

                open_json_editor(
                    "#{prefix}_#{resource_id}_tmp",
                    body
                )
            end

        response = client.public_send(update_method, resource_id, File.read(path))

        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        else
            0
        end
    end

    #------------------------------------------------------
    # Inputs
    #------------------------------------------------------

    def ask_required_value(label)
        loop do
            prompt = "> #{label}: "
            print prompt

            value = STDIN.readline.strip
            return value unless value.to_s.empty?

            puts '    A value is required.'
        end
    end

    def ask_required_integer(label)
        loop do
            prompt = "> #{label}: "
            print prompt

            raw = STDIN.readline.strip
            return raw.to_i if raw.match?(/\A-?\d+\z/)

            puts "    #{label} must be an integer."
        end
    end

    def select_by_index(items)
        loop do
            print '    Select an option by number: '
            input = STDIN.readline.strip

            if input =~ /\A\d+\z/
                index = input.to_i
                return items[index] if index >= 0 && index < items.size
            end

            puts '    Invalid selection, please try again.'
        end
    end

    # Ask user values for a list of user inputs.
    # @param user_inputs [Array<Hash>, nil]
    # @return [Hash, nil]
    def get_user_values(user_inputs)
        return if user_inputs.nil? || user_inputs.empty?

        ask_user_inputs(user_inputs)
    end

    # Prompt interactively for input values
    # @param inputs [Array<Hash>]
    # @return [Hash]
    def ask_user_inputs(inputs)
        puts 'There are some parameters that require user input.'

        answers = {}

        inputs.each do |input|
            name        = input[:name]
            description = input[:description] || ''
            type        = normalize_input_type(input[:type])
            default     = input[:default]
            match       = input[:match]

            puts "  * (#{name}) #{description} [type: #{input[:type]}]"

            header = '    '
            header += "Press enter for default (#{default}). " if default

            answer = case type
                     when 'string'
                         ask_string_input(header, default, match)
                     when 'number'
                         ask_number_input(header, default, match)
                     when 'list'
                         ask_list_input(header, default, match)
                     when 'map'
                         ask_map_input(header, default)
                     else
                         STDERR.puts "Unknown input type '#{input[:type]}' for '#{name}'"
                         exit(-1)
                     end

            answers[name] = answer
        end

        answers
    end

    # Read JSON input from a file or stdin.
    # @param file [String, nil]
    # @return [Hash, Array, nil]
    def read_json_input(file)
        if file
            begin
                content = File.read(file)
            rescue Errno::ENOENT
                return OpenNebula::Error.new("File not found: #{file}", OpenNebula::Error::EACTION)
            end
        else
            stdin = OpenNebulaHelper.read_stdin
            return OpenNebula::Error.new(
                'Empty input from stdin', OpenNebula::Error::EACTION
            ) if stdin.empty?

            content = stdin
        end

        begin
            JSON.parse(content, :symbolize_names => true)
        rescue JSON::ParserError => e
            source = file ? "file: #{file}" : 'stdin'

            OpenNebula::Error.new(
                "Invalid JSON in #{source} - #{e.message}",
                OpenNebula::Error::EACTION
            )
        end
    end

    # Open the editor with JSON content and return the edited file path.
    # @param prefix  [String]
    # @param content [Object]
    # @return [String]
    def open_json_editor(prefix, content)
        tmp  = Tempfile.new(prefix)
        path = tmp.path

        tmp.write(JSON.pretty_generate(content))
        tmp.flush

        editor_path = ENV['EDITOR'] || OpenNebulaHelper::EDITOR_PATH
        system("#{editor_path} #{path}")

        unless $CHILD_STATUS.exitstatus.zero?
            STDERR.puts 'Editor not defined'
            exit(-1)
        end

        tmp.close

        path
    end

    # Prompt for string input
    # @param header  [String]
    # @param default [Object]
    # @param match   [Hash, nil]
    # @return [String]
    def ask_string_input(header, default, match)
        if match&.dig(:type) == 'list'
            options = match[:values] || []

            options.each_with_index {|opt, i| puts "    #{i}: #{opt}" }
            puts

            loop do
                print "#{header}Please type the selection number: "
                raw = STDIN.readline.strip

                if raw.empty?
                    answer = default
                    return answer if options.include?(answer)
                else
                    index  = Integer(raw, :exception => false)
                    answer = options[index] if index && index >= 0
                    return answer if answer
                end

                puts '    Invalid selection, please try again.'
            end
        else
            print header
            answer = STDIN.readline.strip
            answer = OpenNebulaHelper.editor_input if answer == '<<EDITOR>>'
            answer = default if answer.empty?
            answer
        end
    end

    # Prompt for numeric input
    # @param header  [String]
    # @param default [Object]
    # @param match   [Hash, nil]
    # @return [Integer, Float]
    def ask_number_input(header, default, match)
        min = match&.dig(:values, :min)
        max = match&.dig(:values, :max)

        begin
            range_msg = min && max ? " (#{min} to #{max})" : ''
            print "#{header}Enter a number#{range_msg}: "

            raw = STDIN.readline.strip
            raw = default.to_s if raw.empty?

            if raw.match?(/\A-?\d+\z/)
                answer = raw.to_i
            elsif raw.match?(/\A-?\d+\.\d+\z/)
                answer = raw.to_f
            else
                puts 'Not a valid number'
                raise ArgumentError
            end

            raise ArgumentError if min && answer < min
            raise ArgumentError if max && answer > max

            answer
        rescue StandardError
            puts '    Invalid number, please try again.'
            retry
        end
    end

    # Prompt for list input
    # @param header  [String]
    # @param default [Object]
    # @param match   [Hash, nil]
    # @return [Array]
    def ask_list_input(header, default, match)
        loop do
            print "#{header}Enter comma-separated values: "
            raw = STDIN.readline.strip

            if raw.empty?
                if default.is_a?(Array)
                    return default
                else
                    puts '    No default available.'
                    next
                end
            end

            answer = raw.split(',').map(&:strip).reject(&:empty?)

            if match&.dig(:type) == 'list'
                invalid = answer - Array(match[:values])

                if invalid.any?
                    puts "    Invalid values: #{invalid.join(', ')}"
                    puts "    Allowed: #{Array(match[:values]).join(', ')}"
                    next
                end
            end

            return answer
        end
    end

    # Prompt for map input
    # @param header  [String]
    # @param default [Object]
    # @return [Hash]
    def ask_map_input(header, default)
        loop do
            print "#{header}Enter KEY=VALUE pairs separated by commas: "
            raw = STDIN.readline.strip

            if raw.empty?
                if default.is_a?(Hash)
                    return default
                else
                    puts '    No default available.'
                    next
                end
            end

            begin
                answer = {}

                raw.split(',').each do |pair|
                    key, value = pair.split('=', 2)

                    raise ArgumentError if key.nil? || value.nil?
                    raise ArgumentError if key.strip.empty? || value.strip.empty?

                    answer[key.strip] = value.strip
                end

                return answer
            rescue StandardError
                puts '    Invalid map format. Expected KEY=VALUE,...'
            end
        end
    end

    # Normalize typed user input definitions
    # @param type [String]
    # @return [String]
    def normalize_input_type(type)
        case type
        when /\Amap\(/
            'map'
        when /\Alist\(/
            'list'
        else
            type
        end
    end

    #------------------------------------------------------
    # Utilities
    #------------------------------------------------------

    # Parse a JSON string or KEY=VALUE string to a hash
    def self.parse_values_option(raw)
        value = raw.to_s.strip
        return [0, {}] if value.empty?

        begin
            if value.start_with?('{')
                parsed = JSON.parse(value)
                return [0, parsed.transform_keys(&:to_s)] if parsed.is_a?(Hash)
            end
        rescue JSON::ParserError
            nil
        end

        parsed = {}

        begin
            value.split(',').each do |pair|
                key, item = pair.split('=', 2)

                raise ArgumentError if key.nil? || item.nil?

                key  = key.strip
                item = item.strip

                raise ArgumentError if key.empty?

                parsed[key] = item
            end
        rescue ArgumentError
            return [-1, 'Invalid --values format. Use KEY=VALUE[,KEY=VALUE...] or a JSON object']
        end

        [0, parsed]
    end

    # Checks whether a helper hook returned a CLI error tuple.
    # @param value [Object]
    # @return [Boolean]
    def is_error?(value)
        value.is_a?(Array) && value.size == 2 && value[0].is_a?(Integer)
    end

    # Render a response in JSON, YAML or custom formatted output
    # @param response [Object]
    # @param options  [Hash]
    # @yield [response] Custom rendering block for table/plain output
    # @return [Integer, Array]
    def render_response(response, options = {})
        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        elsif options[:json]
            [0, JSON.pretty_generate(response)]
        elsif options[:yaml]
            [0, response.to_yaml(:indent => 4)]
        else
            yield(response) if block_given?
            0
        end
    end

    def format_template(template, indent = 6)
        return 'N/A' unless template

        template.map do |k, v|
            value =
                if v.is_a?(Hash)
                    v.map {|k2, v2| ' ' * indent + "#{k}: #{k2}=#{v2}" }
                elsif v.is_a?(Array)
                    v.map do |elem|
                        if elem.is_a?(Hash)
                            elem.map {|k2, v2| ' ' * indent + "#{k}: #{k2}=#{v2}" }
                        else
                            ' ' * indent + "#{k}: #{elem}"
                        end
                    end.flatten
                else
                    ' ' * indent + "#{k}: #{v}"
                end
            value.is_a?(Array) ? value.join("\n") : value
        end.join("\n")
    end

end
