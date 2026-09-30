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
require 'io/console'
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

                self.class.open_json_editor(
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
            mandatory   = input.fetch(:mandatory, false)
            sensitive   = input.fetch(:sensitive, false)

            puts "  * (#{name}) #{description} [type: #{input[:type]}]"

            header = '    '
            if input.key?(:default)
                value =
                    if sensitive
                        '<hidden>'
                    elsif default.is_a?(Array) || default.is_a?(Hash)
                        JSON.generate(default)
                    else
                        default.to_s
                    end
                header += "Press enter for default (#{value}). "
            end

            loop do
                answer =
                    if sensitive
                        ask_sensitive_input(header, default, type, match)
                    else
                        case type
                        when 'string'
                            ask_string_input(header, default, match)
                        when 'number'
                            ask_number_input(header, default, match)
                        when 'bool'
                            ask_bool_input(header, default)
                        when 'list', 'tuple'
                            ask_list_input(header, default, match)
                        when 'map', 'object'
                            ask_map_input(header, default)
                        else
                            STDERR.puts "Unknown input type '#{input[:type]}' for '#{name}'"
                            exit(-1)
                        end
                    end

                if answer.nil? && mandatory
                    puts '    A value is required.'
                    next
                end

                answers[name] = answer unless answer.nil?
                break
            end
        end

        answers
    end

    # Read and parse JSON input from a file or STDIN.
    #
    # If a file path is provided, the content is read from that file.
    # Otherwise, STDIN is used. If no input is available, nil is returned.
    #
    # @param file [String, nil] path to the JSON input file
    # @return [Hash, Array, nil]
    def self.read_json_input(file = nil)
        content = nil

        if file
            begin
                content = File.read(file)
            rescue Errno::ENOENT
                STDERR.puts "File not found: #{file}"
                exit(-1)
            end
        else
            stdin = OpenNebulaHelper.read_stdin
            content = stdin unless stdin.empty?
        end

        return if content.nil? || content.strip.empty?

        JSON.parse(content, :symbolize_names => true)
    rescue JSON::ParserError => e
        STDERR.puts "Invalid JSON - #{e.message}"
        exit(-1)
    end

    # Open the editor with JSON content and return the edited file path.
    # @param prefix  [String]
    # @param content [Object]
    # @return [String, nil]
    def self.open_json_editor(prefix, content)
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

    def self.update_from_editor(client, resource_id, get_method)
        response = client.public_send(get_method, resource_id)
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        body   = response.dig(:TEMPLATE, template_tag)
        prefix = client_class.name.split('::').first.downcase
        path   = open_json_editor("#{prefix}_#{resource_id}_tmp", body)

        read_json_input(path)
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
                    return if default.nil?

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
    # @return [Integer, Float, nil]
    def ask_number_input(header, default, match)
        min = match&.dig(:values, :min)
        max = match&.dig(:values, :max)

        begin
            range_msg = min && max ? " (#{min} to #{max})" : ''
            print "#{header}Enter a number#{range_msg}: "

            raw = STDIN.readline.strip
            return if raw.empty? && default.nil?

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

    # Prompt for boolean input
    # @param header  [String]
    # @param default [Object]
    # @return [Boolean, nil]
    def ask_bool_input(header, default)
        loop do
            print "#{header}Enter true or false: "
            raw = STDIN.readline.strip

            return default if raw.empty?
            return true if ['true', 'yes'].include?(raw.downcase)
            return false if ['false', 'no'].include?(raw.downcase)

            puts '    Input must be true or false.'
        end
    end

    # Prompt for list input
    # @param header  [String]
    # @param default [Object]
    # @param match   [Hash, nil]
    # @return [Array, nil]
    def ask_list_input(header, default, match)
        loop do
            print "#{header}Enter comma-separated values: "
            raw = STDIN.readline.strip

            if raw.empty?
                if default.is_a?(Array)
                    return default
                else
                    return
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
    # @return [Hash, nil]
    def ask_map_input(header, default)
        loop do
            print "#{header}Enter a JSON object or KEY=VALUE pairs separated by commas: "
            raw = STDIN.readline.strip

            if raw.empty?
                if default.is_a?(Hash)
                    return default
                else
                    return
                end
            end

            rc, answer = ODSHelper.parse_values_option(raw)
            return answer if rc.zero?

            puts '    Invalid map format. Expected KEY=VALUE,... or a JSON object.'
        end
    end

    # Prompt without echoing the entered value and coerce it to its declared type
    # @param header  [String]
    # @param default [Object]
    # @param type    [String]
    # @param match   [Hash, nil]
    # @return [Object, nil]
    def ask_sensitive_input(header, default, type, match)
        loop do
            print "#{header}Enter a value: "
            raw = read_sensitive_value

            return default if raw.nil?

            return coerce_user_input(raw, type, match)
        rescue ArgumentError => e
            puts "    #{e.message}"
        end
    end

    # Reads a value from the terminal without echoing it
    # @return [String, nil]
    def read_sensitive_value
        value = STDIN.noecho(&:gets)
        puts

        value&.chomp.then {|item| item.to_s.empty? ? nil : item }
    end

    # Coerces raw input for prompts that cannot use the visible type helpers
    # @param raw   [String]
    # @param type  [String]
    # @param match [Hash, nil]
    # @return [Object]
    def coerce_user_input(raw, type, match)
        case type
        when 'string'
            values = match[:values] if match&.dig(:type) == 'list'
            raise ArgumentError, 'Input is not one of the allowed values.' \
                if values && !values.include?(raw)

            raw
        when 'number'
            number = Integer(raw, :exception => false) || Float(raw, :exception => false)
            raise ArgumentError, 'Input must be a number.' unless number

            min = match&.dig(:values, :min)
            max = match&.dig(:values, :max)
            raise ArgumentError, "Input must be greater than or equal to #{min}." \
                if min && number < min
            raise ArgumentError, "Input must be less than or equal to #{max}." \
                if max && number > max

            number
        when 'bool'
            return true if ['true', 'yes'].include?(raw.downcase)
            return false if ['false', 'no'].include?(raw.downcase)

            raise ArgumentError, 'Input must be true or false.'
        when 'list', 'tuple'
            values = raw.split(',').map(&:strip).reject(&:empty?)
            allowed = Array(match[:values]) if match&.dig(:type) == 'list'
            invalid = values - allowed if allowed
            raise ArgumentError, "Invalid values: #{invalid.join(', ')}" \
                if invalid&.any?

            values
        when 'map', 'object'
            rc, value = ODSHelper.parse_values_option(raw)
            raise ArgumentError, value unless rc.zero?

            value
        else
            raise ArgumentError, "Unknown input type '#{type}'"
        end
    end

    # Normalize typed user input definitions
    # @param type [String]
    # @return [String]
    def normalize_input_type(type)
        type.to_s.downcase.gsub(/\(.*\)\z/, '')
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

# Print events progress
class EventProgressPrinter

    SPINNER = ['/', '-', '\\', '|']

    STARTED = 'started'
    SUCCESS = 'success'
    FAILURE = 'failure'

    def initialize(output: $stdout)
        @output          = output
        @spinner_index   = 0
        @spinner_thread  = nil
        @current_line    = nil
        @transient_lines = 0
        @mutex           = Mutex.new
    end

    def print_event(name, state, context = nil)
        return if name.nil? || name.to_s.empty?

        state = state.to_s

        stop_spinner
        clear_transient if interactive?

        if state == STARTED
            print_active_event(name, state, context)
        else
            print_event_line(name, state, context)
        end
    end

    def close
        stop_spinner
        clear_transient if interactive?
        show_cursor if interactive?
    end

    private

    def print_active_event(name, state, context)
        if context.nil? || (context.respond_to?(:empty?) && context.empty?)
            start_spinner(name)
            return
        end

        lines = print_event_line(name, state, context)
        @transient_lines = lines if interactive?
        start_spinner(name) if interactive?
    end

    def print_event_line(name, state, context = nil)
        @output.puts "#{state_label(state)} #{name}"
        1 + print_context(context, state_indent(state))
    end

    def start_spinner(name)
        unless interactive?
            @output.puts "#{state_label(STARTED)} #{name}"
            return
        end

        stop_spinner
        hide_cursor

        @current_line = name

        @spinner_thread = Thread.new do
            loop do
                @mutex.synchronize do
                    @output.print "\r#{spinner_label} #{@current_line}"
                    @output.flush
                    @spinner_index = (@spinner_index + 1) % SPINNER.size
                end

                sleep 0.15
            end
        end
    end

    def stop_spinner
        return unless @spinner_thread

        @spinner_thread.kill
        @spinner_thread.join
        @spinner_thread = nil

        clear_line if interactive?
        show_cursor
    end

    def print_context(context, indent)
        lines = 0

        (context.is_a?(Array) ? context : [context]).each do |detail|
            next if detail.nil?
            next if detail.respond_to?(:empty?) && detail.empty?

            detail.to_s.each_line do |line|
                @output.puts "#{indent}#{line.chomp}"
                lines += 1
            end
        end

        lines
    end

    def clear_transient
        return if @transient_lines.zero?

        @output.print "\e[#{@transient_lines}F"
        @output.print "\e[J"
        @output.flush
        @transient_lines = 0
    end

    def spinner_label
        colorize("[#{SPINNER[@spinner_index]}]", CLIHelper::ANSI_YELLOW)
    end

    def state_label(state)
        color =
            if state == SUCCESS
                CLIHelper::ANSI_GREEN
            elsif state == FAILURE
                CLIHelper::ANSI_RED
            else
                CLIHelper::ANSI_YELLOW
            end

        colorize(state_label_text(state), color)
    end

    def state_label_text(state)
        if state == SUCCESS
            '[OK]'
        elsif state == FAILURE
            '[FAIL]'
        else
            '[..]'
        end
    end

    def state_indent(state)
        ' ' * (state_label_text(state).length + 1)
    end

    def colorize(text, color)
        return text unless interactive?

        "#{color}#{text}#{CLIHelper::ANSI_RESET}"
    end

    def clear_line
        @output.print "\r"
        @output.print ' ' * terminal_width
        @output.print "\r"
        @output.flush
    end

    def terminal_width
        Integer(`tput cols 2>/dev/null`.strip)
    rescue StandardError
        120
    end

    def hide_cursor
        @output.print "\e[?25l"
        @output.flush
    end

    def show_cursor
        @output.print "\e[?25h"
        @output.flush
    end

    def interactive?
        @output.tty?
    end

end
