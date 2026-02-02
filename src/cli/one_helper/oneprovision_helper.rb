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
require 'cloud/CloudClient'

# Oneflow Template command helper
class OneProvisionHelper < OpenNebulaHelper::OneHelper

    # Configuration file
    def self.conf_file
        'oneprovision.yaml'
    end

    # Get client to make request
    #
    # @options [Hash] CLI options
    def client(options = {})
        OneForm::Client.new(
            :username => options[:username],
            :password => options[:password],
            :url => options[:server],
            :api_version => options[:api_version],
            :user_agent => USER_AGENT
        )
    end

    def valid_ip?(str)
        str =~ /\A(?:\d{1,3}\.){3}\d{1,3}\z/
    end

    def valid_ip_list?(str)
        str.split(',').all? {|ip| valid_ip?(ip.strip) }
    end

    # Get provider pool
    def format_provision_pool
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

            column :STATE, 'State', :left, :size => 35 do |d|
                provision_body = d[:TEMPLATE][:PROVISION_BODY]
                provision_body[:state] ||= 'N/A'
            end

            column :REGTIME,
                   'Registration time of the Provision',
                   :size => 15 do |d|
                begin
                    provision_body = d[:TEMPLATE][:PROVISION_BODY]
                    timestamp      = provision_body[:registration_time]

                    OpenNebulaHelper.time_to_str(timestamp)
                rescue NoMethodError, KeyError, TypeError
                    'N/A'
                end
            end

            default :ID, :USER, :GROUP, :NAME, :STATE, :REGTIME
        end
    end

    # List provider pool
    #
    # @param client  [Service::Client] Petition client
    # @param options [Hash]            CLI options
    def list_provision_pool(client, options, params = {})
        response = client.list_provisions(params)

        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        else
            if options[:json]
                [0, JSON.pretty_generate(response)]
            elsif options[:yaml]
                [0, response.to_yaml(:indent => 4)]
            else
                table = format_provision_pool

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
    def top_provision_pool(client, options, params = {})
        options[:delay] ? delay = options[:delay] : delay = 4

        begin
            loop do
                CLIHelper.scr_cls
                CLIHelper.scr_move(0, 0)

                list_provision_pool(client, options, params)

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
    def format_resource(client, provision_id, options, params = {})
        response = client.get_provision(provision_id, params)

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

                body     = response[:TEMPLATE][:PROVISION_BODY]
                reg_time = OpenNebulaHelper.time_to_str(body[:registration_time])

                CLIHelper.print_header(
                    str_h1 % "PROVISION #{response[:ID]} INFORMATION"
                )

                puts Kernel.format str, 'ID',   response[:ID]
                puts Kernel.format str, 'NAME', response[:NAME]
                puts Kernel.format str, 'DESCRIPTION', body[:description]
                puts Kernel.format str, 'USER', response[:UNAME]
                puts Kernel.format str, 'GROUP', response[:GNAME]
                puts Kernel.format str, 'STATE', body[:state]
                puts Kernel.format str, 'PROVIDER ID', body[:provider_id]
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

                CLIHelper.print_header(str_h1 % 'PROVISION VALUES', false)

                user_input_values = body[:user_inputs_values].sort.to_h
                user_input_values.each do |key, value|
                    puts Kernel.format(str, key.to_s, value.to_s)
                end

                puts

                unless body[:tags].nil? || body[:tags].empty?
                    CLIHelper.print_header(str_h1 % 'TAGS', false)

                    body[:tags].each do |k, v|
                        puts Kernel.format(str, k.capitalize, v)
                    end

                    puts
                end

                CLIHelper.print_header(str_h1 % 'OPENNEBULA RESOURCES', false)

                resources = body[:one_objects]

                # Cluster
                cluster = resources[:cluster]

                CLIHelper.print_header(str_h1 % 'CLUSTER', false)
                puts Kernel.format(str, 'ID', cluster[:id] || 'N/A')
                puts Kernel.format(str, 'NAME', cluster[:name])

                puts

                # Hosts
                hosts = resources[:hosts]

                CLIHelper.print_header(str_h1 % 'HOSTS', false)
                CLIHelper::ShowTable.new(nil, self) do
                    column :ID, '', :left, :size => 4 do |d|
                        d[:id]
                    end

                    column :NAME, '', :left, :size => 15, :adjust => true do |d|
                        d[:name]
                    end

                    column :RESOURCE_ID, '', :left, :size => 50 do |d|
                        d[:resource_id]
                    end

                    default :ID, :NAME, :RESOURCE_ID
                end.show(hosts, {})

                puts

                # Networks
                networks = resources[:networks]

                CLIHelper.print_header(str_h1 % 'NETWORKS', false)
                CLIHelper::ShowTable.new(nil, self) do
                    column :ID, '', :left, :size => 4 do |d|
                        d[:id] || 'N/A'
                    end

                    column :TYPE, '', :left, :size => 15, :adjust => true do |d|
                        d[:template][:vn_mad]
                    end

                    column :NAME, '', :left, :size => 50 do |d|
                        d[:name]
                    end

                    default :ID, :TYPE, :NAME
                end.show(networks, {})

                puts

                # Datastores
                datastores = resources[:datastores]

                CLIHelper.print_header('DATASTORES', false)
                CLIHelper::ShowTable.new(nil, self) do
                    column :ID, '', :left, :size => 4 do |d|
                        d[:id] || 'N/A'
                    end

                    column :TYPE, '', :left, :size => 15, :adjust => true do |d|
                        d[:template][:type].downcase
                    end

                    column :NAME, '', :left, :size => 50 do |d|
                        d[:name]
                    end

                    default :ID, :TYPE, :NAME
                end.show(datastores, {})

                puts

                CLIHelper.print_header('PROVISION HISTORIC', false)
                CLIHelper::ShowTable.new(nil, self) do
                    column :ACTION, '', :left, :size => 30, :adjust => true do |d|
                        d[:action]
                    end

                    column :DESCRIPTION, '', :left, :size => 50, :expand => true do |d|
                        d[:description]
                    end

                    column :TIME, '', :left, :size => 15 do |d|
                        OpenNebulaHelper.time_to_str(d[:time])
                    end

                    default :TIME, :ACTION, :DESCRIPTION
                end.show(body[:historic], {})

                puts

                remaining = body.reject do |k, _|
                    [
                        :name,
                        :description,
                        :fireedge,
                        :state,
                        :deployment_file,
                        :user_inputs,
                        :user_inputs_values,
                        :provider_id,
                        :registration_time,
                        :tags,
                        :historic,
                        :one_objects
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

    def update_resource(client, provision_id, file_path)
        if file_path
            path = file_path
        else
            response = client.get_provision(provision_id)
            body     = response[:TEMPLATE][:PROVISION_BODY]

            tmp  = Tempfile.new("provider_#{provision_id}_tmp")
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

        response = client.update_provision(provision_id, File.read(path))

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
        return if user_inputs.nil? || user_inputs.empty?

        ask_user_inputs(user_inputs)
    end

    def ask_deployment(deployment_confs)
        return if deployment_confs.nil? || deployment_confs.empty?

        puts 'Please select a deployment configuration for this provision:'

        deployment_confs.each_with_index do |conf, index|
            name = conf[:name]
            puts "    #{index}: #{name}"
        end
        puts

        selected = nil

        loop do
            print '    Please type the selection number: '
            input = STDIN.readline.strip

            if input =~ /\A\d+\z/
                index = input.to_i

                if index >= 0 && index < deployment_confs.size
                    selected = deployment_confs[index]
                    break
                end
            end

            puts '    Invalid selection, please try again.'
        end

        puts
        selected
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
                            index  = raw.to_i rescue nil
                            answer = options[index] if index && index >= 0
                            break if answer
                        end

                        puts '    Invalid selection, please try again.'
                    end
                else
                    print header
                    answer = STDIN.readline.strip
                    answer = OpenNebulaHelper.editor_input if answer == '<<EDITOR>>'
                    answer = default if answer.empty?
                end
            when 'number'
                min = match&.dig(:values, :min)
                max = match&.dig(:values, :max)

                begin
                    range_msg = min && max ? " (#{min} to #{max})" : ''
                    print "#{header}Enter a number#{range_msg}: "
                    raw = STDIN.readline.strip
                    raw = default.to_s if raw.empty?

                    if raw =~ /\A-?\d+\z/
                        answer = raw.to_i
                    elsif raw =~ /\A-?\d+\.\d+\z/
                        answer = raw.to_f
                    else
                        puts 'Not a valid number'
                        raise
                    end

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
