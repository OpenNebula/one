# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require 'one_helper'

# Oneflow Template command helper
class OneProviderHelper < OpenNebulaHelper::OneHelper

    # Configuration file
    def self.conf_file
        'oneprovider.yaml'
    end

    # Get client to make request
    #
    # @options [Hash] CLI options
    def client(options)
        OneForm::Client.new(
            :username => options[:username],
            :password => options[:password],
            :url => options[:server],
            :api_version => options[:api_version],
            :user_agent => USER_AGENT
        )
    end

    # Get provider pool
    def format_provider_pool
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'ID', :size => 10 do |d|
                d[:ID]
            end

            column :USER, 'Username', :left, :size => 15 do |d|
                d[:UNAME]
            end

            column :GROUP, 'Group', :left, :size => 15 do |d|
                d[:GNAME]
            end

            column :NAME, 'Name', :left, :expand => true do |d|
                d[:NAME]
            end

            column :REGTIME,
                   'Registration time of the Provider',
                   :size => 15 do |d|
                begin
                    provider_body = d[:TEMPLATE][:PROVIDER_BODY]
                    timestamp     = provider_body[:registration_time]

                    OpenNebulaHelper.time_to_str(timestamp)
                rescue NoMethodError, KeyError, TypeError
                    'N/A'
                end
            end

            default :ID, :USER, :GROUP, :NAME, :REGTIME
        end
    end

    # List provider pool
    #
    # @param client  [Service::Client] Petition client
    # @param options [Hash]            CLI options
    def list_provider_pool(client, options)
        response = client.list_providers

        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        else
            if options[:json]
                [0, JSON.pretty_generate(response)]
            elsif options[:yaml]
                [0, response.to_yaml(:indent => 4)]
            else
                table = format_provider_pool

                table.show(response, options)
                table.describe_columns if options[:describe]

                0
            end
        end
    end

    # List provider pool continiously
    #
    # @param client  [Service::Client] Petition client
    # @param options [Hash]            CLI options
    def top_provider_pool(client, options)
        options[:delay] ? delay = options[:delay] : delay = 4

        begin
            loop do
                CLIHelper.scr_cls
                CLIHelper.scr_move(0, 0)

                list_provider_pool(client, options)

                sleep delay
            end
        rescue StandardError => e
            STDERR.puts e.message
            exit(-1)
        end

        0
    end

    # Show provider detailed information
    #
    # @param client           [Service::Client] Petition client
    # @param service_template [Integer]         Provider ID
    # @param options          [Hash]            CLI options
    def format_resource(client, provider_id, options)
        response = client.get_provider(provider_id)

        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        else
            if options[:json]
                [0, JSON.pretty_generate(response)]
            elsif options[:yaml]
                [0, response.to_yaml(:indent => 4)]
            else
                str    = '%-20s: %-20s'
                str_h1 = '%-80s'

                body     = response[:TEMPLATE][:PROVIDER_BODY]
                reg_time = OpenNebulaHelper.time_to_str(body[:registration_time])

                CLIHelper.print_header(
                    str_h1 % "PROVIDER #{response[:ID]} INFORMATION"
                )

                puts Kernel.format str, 'ID',   response[:ID]
                puts Kernel.format str, 'NAME', response[:NAME]
                puts Kernel.format str, 'DESCRIPTION', body[:description]
                puts Kernel.format str, 'USER', response[:UNAME]
                puts Kernel.format str, 'GROUP', response[:GNAME]
                puts Kernel.format str, 'DRIVER', body[:driver]
                puts Kernel.format str, 'VERSION', body[:version]
                puts Kernel.format str, 'REGISTRATION TIME', reg_time

                puts

                CLIHelper.print_header(str_h1 % 'PERMISSIONS', false)

                ['OWNER', 'GROUP', 'OTHER'].each do |e|
                    mask = '---'
                    permissions_hash = response[:PERMISSIONS]
                    mask[0] = 'u' if permissions_hash["#{e}_U".to_sym] == '1'
                    mask[1] = 'm' if permissions_hash["#{e}_M".to_sym] == '1'
                    mask[2] = 'a' if permissions_hash["#{e}_A".to_sym] == '1'

                    puts Kernel.format str, e, mask
                end

                puts

                CLIHelper.print_header(str_h1 % 'CONNECTION VALUES', false)

                connection_values = body[:connection] || {}
                connection_values.each do |key, value|
                    puts Kernel.format(str, key.to_s, value.to_s)
                end

                puts

                CLIHelper.print_header(str_h1 % 'ASSOCIATED PROVISIONS', false)
                ids = body[:provision_ids]
                puts Kernel.format str, 'IDS:', ids.empty? ? '--' : ids.join(', ')

                puts

                remaining = body.reject do |k, _|
                    [
                        :name,
                        :description,
                        :fireedge,
                        :connection,
                        :registration_time,
                        :provision_ids,
                        :version,
                        :driver
                    ].include?(k)
                end

                if remaining.any?
                    CLIHelper.print_header('USER TEMPLATE', false)
                    puts JSON.pretty_generate(remaining)
                end

                0
            end
        end
    end

    def update_resource(client, provider_id, file_path)
        if file_path
            path = file_path
        else
            response = client.get_provider(provider_id)
            body     = response[:TEMPLATE][:PROVIDER_BODY]

            tmp  = Tempfile.new("provider_#{provider_id}_tmp")
            path = tmp.path

            tmp.write(JSON.pretty_generate(body))
            tmp.flush

            if ENV['EDITOR']
                editor_path = ENV['EDITOR']
            else
                editor_path = OpenNebulaHelper::EDITOR_PATH
            end

            system("#{editor_path} #{path}")

            unless $CHILD_STATUS.exitstatus.zero?
                STDERR.puts 'Editor not defined'
                exit(-1)
            end

            tmp.close
        end

        body = read_json_input(path)
        response = client.update_provider(provider_id, body)

        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        else
            0
        end
    end

    def read_json_input(file)
        if file
            begin
                content = File.read(file)
            rescue Errno::ENOENT
                STDERR.puts "File not found: #{file}"
                exit(-1)
            end
        else
            stdin = OpenNebulaHelper.read_stdin
            return if stdin.empty?

            content = stdin
        end

        begin
            JSON.parse(content, :symbolize_names => true)
        rescue JSON::ParserError => e
            source = file ? "file: #{file}" : 'stdin'
            STDERR.puts "Invalid JSON in #{source} - #{e.message}"
            exit(-1)
        end
    end

    def get_user_values(user_inputs)
        return {} if user_inputs.nil? || user_inputs.empty?

        ask_user_inputs(user_inputs)
    end

    def ask_user_inputs(inputs)
        puts 'There are some parameters that require user input.'

        answers = {}

        inputs.each do |input|
            name        = input[:name]
            description = input[:description] || ''
            type        = input[:type]
            default     = input[:default]
            match       = input[:match]

            puts "  * (#{name}) #{description} [type: #{type}]"
            header = '    '
            header += "Press enter for default (#{default}). " if default

            answer = nil

            type = case type
                   when /\Amap\(/ then 'map'
                   when /\Alist\(/ then 'list'
                   else type
                   end

            case type
            when 'string'
                if match&.dig(:type) == 'list'
                    options = match[:values] || []
                    options.each_with_index {|opt, i| puts "    #{i}: #{opt}" }
                    puts

                    loop do
                        print "#{header}Please type the selection number: "
                        raw = STDIN.readline.strip

                        if raw.empty?
                            answer = default
                            break if options.include?(answer)
                        else
                            index = raw.to_i rescue nil
                            answer = options[index] if index && index >= 0
                            break if answer
                        end

                        puts '    Invalid selection, please try again.'
                    end
                else
                    print header

                    loop do
                        answer = STDIN.readline.strip || ''
                        answer = OpenNebulaHelper.editor_input if answer == '<<EDITOR>>'
                        answer = default if answer.to_s.empty?

                        break unless answer.to_s.empty?

                        print '    Input cannot be empty. Please try again: '
                    end
                end
            when 'number'
                min = match&.dig(:values, :min)
                max = match&.dig(:values, :max)

                begin
                    range_msg = min && max ? " (#{min} to #{max})" : ''
                    print "#{header}Enter a number#{range_msg}: "
                    raw = STDIN.readline.strip
                    raw = default.to_s if raw.empty?

                    answer = Float(raw)
                    raise if min && answer < min
                    raise if max && answer > max
                rescue StandardError => _e
                    puts '    Invalid number, please try again.'
                    retry
                end
            when 'list'
                loop do
                    print "#{header}Enter comma-separated values: "

                    raw = STDIN.readline.strip

                    if raw.empty?
                        if default.is_a?(Array)
                            answer = default
                            break
                        else
                            puts '    No default available.'
                            next
                        end
                    end

                    answer = raw.split(',').map(&:strip).reject(&:empty?)

                    if match&.dig(:type) == 'list'
                        invalid = answer - match[:values]
                        if invalid.any?
                            puts "    Invalid values: #{invalid.join(', ')}"
                            puts "    Allowed: #{match[:values].join(', ')}"
                            next
                        end
                    end

                    break
                end
            when 'map'
                loop do
                    print "#{header}Enter KEY=VALUE pairs separated by commas: "

                    raw = STDIN.readline.strip

                    if raw.empty?
                        if default.is_a?(Hash)
                            answer = default
                            break
                        else
                            puts '    No default available.'
                            next
                        end
                    end

                    begin
                        answer = {}
                        raw.split(',').each do |pair|
                            k, v = pair.split('=', 2)
                            raise if k.nil? || v.nil? || k.strip.empty? || v.strip.empty?

                            answer[k.strip] = v.strip
                        end
                        break
                    rescue StandardError => _e
                        puts '    Invalid map format. Expected KEY=VALUE,...'
                    end
                end

            else
                STDERR.puts "Unknown input type '#{type}' for '#{name}'"
                exit(-1)
            end

            answers[name] = answer
        end

        answers
    end

end
