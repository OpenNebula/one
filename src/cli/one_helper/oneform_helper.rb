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
class OneFormHelper < OpenNebulaHelper::OneHelper

    # Configuration file
    def self.conf_file
        'oneform.yaml'
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

    def format_driver_pool
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :NAME, 'NAME', :left, :size => 15 do |d|
                File.basename(d[:source])
            end

            column :DEPLOYMENTS, 'DEPLOYMENTS', :left, :expand => true do |d|
                if d[:deployment_confs].nil? || d[:deployment_confs].empty?
                    '--'
                else
                    d[:deployment_confs].map {|conf| conf[:inventory] || '--' }.join(', ')
                end
            end

            column :STATE, 'Group', :left, :size => 10 do |d|
                d[:state]
            end

            default :NAME, :DEPLOYMENTS, :STATE
        end
    end

    # List drivers pool
    #
    # @param client  [OneForm::Client] Petition client
    # @param options [Hash]            CLI options
    def list_driver_pool(client, options)
        response = client.list_drivers

        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        else
            if options[:json]
                [0, JSON.pretty_generate(response)]
            elsif options[:yaml]
                [0, response.to_yaml(:indent => 4)]
            else
                table = format_driver_pool

                table.show(response, options)
                table.describe_columns if options[:describe]

                0
            end
        end
    end

    # List driver pool continiously
    #
    # @param client  [OneForm::Client] Petition client
    # @param options [Hash]            CLI options
    def top_driver_pool(client, options)
        options[:delay] ? delay = options[:delay] : delay = 4

        begin
            loop do
                CLIHelper.scr_cls
                CLIHelper.scr_move(0, 0)

                list_driver_pool(client, options)

                sleep delay
            end
        rescue StandardError => e
            STDERR.puts e.message
            exit(-1)
        end

        0
    end

    # Show driver detailed information
    #
    # @param client           [OneForm::Client] Petition client
    # @param driver_name         [String]          driver name
    # @param options          [Hash]            CLI options
    def format_resource(client, driver_name, options)
        response = client.get_driver(driver_name)

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

                CLIHelper.print_header(
                    str_h1 % "#{File.basename(response[:source]).upcase} ONEFORM DRIVER INFORMATION"
                )

                puts Kernel.format str, 'NAME', response[:name]
                puts Kernel.format str, 'DESCRIPTION', response[:description]
                puts Kernel.format str, 'SYSTEM PATH', response[:source]
                puts Kernel.format str, 'VERSION', response[:version]
                puts Kernel.format str, 'STATE', response[:state]

                puts

                connection_inputs = response[:connection] || {}

                CLIHelper.print_header(str_h1 % 'CONNECTION INPUTS', false)
                CLIHelper::ShowTable.new(nil, self) do
                    column :NAME, '', :left, :size => 25, :adjust => true do |input|
                        input[:name] || '--'
                    end

                    column :TYPE, '', :left, :size => 15 do |input|
                        input[:type] || '--'
                    end

                    column :DEFAULT, '', :left, :size => 30 do |input|
                        if input[:default].is_a?(Hash) || input[:default].is_a?(Array)
                            input[:default].to_json
                        else
                            input[:default] || '--'
                        end
                    end

                    default :NAME, :TYPE, :DEFAULT
                end.show(connection_inputs, {})

                puts

                user_inputs = response[:user_inputs] || {}

                CLIHelper.print_header(str_h1 % 'PROVISIONING INPUTS', false)
                CLIHelper::ShowTable.new(nil, self) do
                    column :NAME, '', :left, :size => 25, :adjust => true do |input|
                        input[:name] || '--'
                    end

                    column :TYPE, '', :left, :size => 15 do |input|
                        input[:type] || '--'
                    end

                    column :DEFAULT, '', :left, :size => 30 do |input|
                        if input[:default].is_a?(Hash) || input[:default].is_a?(Array)
                            input[:default].to_json
                        else
                            input[:default] || '--'
                        end
                    end

                    default :NAME, :TYPE, :DEFAULT
                end.show(user_inputs, {})

                puts

                CLIHelper.print_header(str_h1 % 'DEPLOYMENT CONFIGURATIONS', false)

                configs = response[:deployment_confs] || []

                configs.each do |conf|
                    CLIHelper.print_header(str_h1 % conf[:name], false)

                    puts Kernel.format str, 'DESCRIPTION', conf[:description] || '--'
                    puts Kernel.format str, 'INVENTORY_FILE', conf[:inventory] || '--'

                    puts

                    next unless conf[:user_inputs] && !conf[:user_inputs].empty?

                    CLIHelper.print_header("#{conf[:inventory].upcase} INPUTS", false)
                    CLIHelper::ShowTable.new(nil, self) do
                        column :NAME, '', :left, :size => 25, :adjust => true do |input|
                            input[:name] || '--'
                        end

                        column :TYPE, '', :left, :size => 15 do |input|
                            input[:type] || '--'
                        end

                        column :DEFAULT, '', :left, :size => 30 do |input|
                            if input[:default].is_a?(Hash) || input[:default].is_a?(Array)
                                input[:default].to_json
                            else
                                input[:default] || '--'
                            end
                        end

                        default :NAME, :TYPE, :DEFAULT
                    end.show(conf[:user_inputs], {})

                    puts
                end

                remaining = response.reject do |k, _|
                    [
                        :name,
                        :description,
                        :source,
                        :state,
                        :fireedge,
                        :connection,
                        :user_inputs,
                        :deployment_confs,
                        :version
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

end
