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

require 'json'
require 'tempfile'
require 'yaml'

require 'ods_helper'
require 'cloud/CloudClient'

# OneForm provider command helper
class OneProviderHelper < ODSHelper

    REDACTED_MARK = '__redacted__'
    SECRET_MARK   = '************'
    UPDATE_ATTRS  = [:name, :description, :connection]

    # Configuration file
    def self.conf_file
        'oneprovider.yaml'
    end

    def self.client_class
        OneForm::Client
    end

    def self.template_tag
        :PROVIDER_BODY
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
    def list(client, options)
        params = {}
        params[:include_sensitive] = true if options[:sensitive]
        params[:enabled] = true if options[:enabled]

        response = client.list_providers(params)

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

    # List provider pool continuously
    #
    # @param client  [Service::Client] Petition client
    # @param options [Hash]            CLI options
    def top(client, options)
        options[:delay] ? delay = options[:delay] : delay = 4

        begin
            loop do
                CLIHelper.scr_cls
                CLIHelper.scr_move(0, 0)

                list(client, options)

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
    # @param client      [OneForm::Client] Petition client
    # @param provider_id [Integer] Provider ID
    # @param options     [Hash] CLI options
    def show(client, provider_id, options)
        params = {}
        params[:include_sensitive] = true if options[:sensitive]

        response = client.get_provider(provider_id, params)

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
                    value_text = value.to_s == REDACTED_MARK ? SECRET_MARK : value.to_s
                    puts Kernel.format(str, key.to_s, value_text)
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
                        :user_inputs,
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

    # Create a provider from a driver
    #
    # @param client [OneForm::Client] Petition client
    # @param driver_name [String] Driver name
    # @param file_path [String, nil] Optional JSON input path
    # @return [Integer, Array] CLI result
    def create(client, driver_name, file_path)
        body = self.class.read_json_input(file_path) || {}
        doc  = client.get_driver(driver_name)

        return [doc[:err_code], doc[:message]] if CloudClient.is_error?(doc)

        body[:connection_values] = get_user_values(doc[:connection]) unless body[:connection_values]

        response = client.create_provider(driver_name, body)
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        puts "ID: #{response[:ID]}"

        0
    end

    # Update a provider from a file or editor
    #
    # @param client [OneForm::Client] Petition client
    # @param provider_id [Integer] Provider ID
    # @param file_path [String, nil] Optional JSON input path
    # @return [Integer, Array] CLI result
    def update(client, provider_id, file_path)
        original_connection = nil

        if file_path
            path = file_path
        else
            response = client.get_provider(provider_id, :include_sensitive => true)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

            body = response[:TEMPLATE][:PROVIDER_BODY].select do |key, _|
                UPDATE_ATTRS.include?(key.to_sym)
            end
            original_connection = body[:connection]

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

        body = self.class.read_json_input(path)

        # Do not request a connection update when the editor left it unchanged.
        body.delete(:connection) if !file_path && body[:connection] == original_connection

        response = client.update_provider(provider_id, body)

        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        else
            0
        end
    end

    # Rename a provider
    #
    # @param client [OneForm::Client] Petition client
    # @param provider_id [Integer] Provider ID
    # @param name [String] New name
    # @return [Integer, Array] CLI result
    def rename(client, provider_id, name)
        response = client.update_provider(provider_id, { :name => name })
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        0
    end

    # Change the group of providers
    #
    # @param client [OneForm::Client] Petition client
    # @param ids [Array<Integer>] Provider IDs
    # @param group_id [Integer] New group ID
    # @return [Integer, Array] CLI result
    def chgrp(client, ids, group_id)
        ids.each do |id|
            response = client.chgrp_provider(id, group_id)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)
        end

        0
    end

    # Change the owner and optional group of providers
    #
    # @param client [OneForm::Client] Petition client
    # @param ids [Array<Integer>] Provider IDs
    # @param user_id [Integer] New owner ID
    # @param group_id [Integer, nil] Optional group ID
    # @return [Integer, Array] CLI result
    def chown(client, ids, user_id, group_id = nil)
        ids.each do |id|
            response = client.chown_provider(id, user_id, group_id)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)
        end

        0
    end

    # Change provider permissions
    #
    # @param client [OneForm::Client] Petition client
    # @param ids [Array<Integer>] Provider IDs
    # @param octet [Integer] Permission octet
    # @return [Integer, Array] CLI result
    def chmod(client, ids, octet)
        ids.each do |id|
            response = client.chmod_provider(id, octet)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)
        end

        0
    end

    # Delete providers
    #
    # @param client [OneForm::Client] Petition client
    # @param ids [Array<Integer>] Provider IDs
    # @return [Integer, Array] CLI result
    def delete(client, ids)
        ids.each do |id|
            response = client.delete_provider(id)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)
        end

        0
    end

    def get_user_values(user_inputs)
        super || {}
    end

    # Provider connection strings without defaults must not be empty
    def ask_string_input(header, default, match)
        return super if match&.dig(:type) == 'list'

        loop do
            answer = super
            return answer unless answer.to_s.empty?

            puts '    Input cannot be empty. Please try again.'
        end
    end

    private :format_provider_pool, :get_user_values, :ask_user_inputs, :ask_string_input

end
