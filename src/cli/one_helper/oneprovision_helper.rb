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

# OneForm provision command helper
class OneProvisionHelper < ODSHelper

    UPDATE_ATTRS = [:name, :description]

    # Configuration file
    def self.conf_file
        'oneprovision.yaml'
    end

    def self.client_class
        OneForm::Client
    end

    def self.template_tag
        :PROVISION_BODY
    end

    # Build the provision pool table
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

    # List provision pool
    #
    # @param client  [Service::Client] Petition client
    # @param options [Hash]            CLI options
    def list(client, options)
        params = {}
        params[:include_sensitive] = true if options[:sensitive]
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

    # List provision pool continuously
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

    # Show provision detailed information
    #
    # @param client       [OneForm::Client] Petition client
    # @param provision_id [Integer] Provision ID
    # @param options      [Hash] CLI options
    def show(client, provision_id, options)
        params = {}
        params[:include_sensitive] = true if options[:sensitive]
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

                if body[:error]
                    error = body[:error]
                    time  = OpenNebulaHelper.time_to_str(error[:timestamp])

                    puts "#{CLIHelper::ANSI_RED}ERROR#{CLIHelper::ANSI_RESET}: " \
                         "#{error[:message]} (#{time})"
                    puts
                end

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

                    column :UUID, '', :left, :size => 50 do |d|
                        d[:uuid]
                    end

                    default :ID, :NAME, :UUID
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
                        :error,
                        :tags,
                        :historic,
                        :one_objects,
                        :active_job
                    ].include?(k)
                end

                if remaining.any?
                    puts
                    CLIHelper.print_header('USER TEMPLATE', false)
                    puts JSON.pretty_generate(remaining)
                end

                0
            end
        end
    end

    # Show the Terraform state of a provision
    #
    # @param client [OneForm::Client] Petition client
    # @param provision_id [Integer] Provision ID
    # @param options [Hash] CLI options, including :decode
    # @return [Integer, Array] CLI result
    def tfstate(client, provision_id, options)
        response = client.get_provision_tfstate(provision_id, options[:decode] || false)

        render_data(response, options)
    end

    # Show the active jobs of a provision
    #
    # @param client [OneForm::Client] Petition client
    # @param provision_id [Integer] Provision ID
    # @param options [Hash] CLI options
    # @return [Integer, Array] CLI result
    def jobs(client, provision_id, options)
        unless options[:watch]
            return render_jobs(client.get_provision_jobs(provision_id), options, provision_id, true)
        end

        loop do
            CLIHelper.scr_cls
            CLIHelper.scr_move(0, 0)

            result = render_jobs(client.get_provision_jobs(provision_id), options, provision_id)

            return result if result.is_a?(Array) && !result[0].zero?

            puts result[1] if result.is_a?(Array)

            sleep 4
        end
    rescue StandardError => e
        STDERR.puts e.message
        exit(-1)
    end

    def render_jobs(response, options, provision_id, detailed = false)
        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        elsif options[:json]
            [0, JSON.pretty_generate(response)]
        elsif options[:yaml]
            [0, response.to_yaml(:indent => 4)]
        elsif detailed
            active_job = response.first
            return 0 unless active_job

            str    = '%-20s: %-20s'
            str_h1 = '%-80s'

            CLIHelper.print_header(
                str_h1 % "ACTIVE PROVISION #{provision_id} JOB INFORMATION"
            )

            puts Kernel.format(str, 'ID', active_job[:id] || 'N/A')
            puts Kernel.format(str, 'ATTEMPT', active_job[:attempt] || 'N/A')
            puts Kernel.format(str, 'STEP', active_job[:step] || 'N/A')
            puts Kernel.format(str, 'STATUS', active_job[:status] || 'N/A')
            puts Kernel.format(str, 'EXTERNAL USER', active_job[:external_user] || 'N/A')

            created_at = active_job[:created_at]
            created_at = OpenNebulaHelper.time_to_str(created_at) if created_at
            puts Kernel.format(str, 'CREATED AT', created_at || 'N/A')

            cancellation = active_job[:cancellation]
            if cancellation
                puts
                CLIHelper.print_header(str_h1 % 'CANCELLATION', false)

                puts Kernel.format(
                    str, 'REQUESTED BY', cancellation[:requested_by] || 'N/A'
                )

                requested_at = cancellation[:requested_at]
                requested_at = OpenNebulaHelper.time_to_str(requested_at) if requested_at
                puts Kernel.format(str, 'REQUESTED AT', requested_at || 'N/A')
                puts Kernel.format(str, 'STATUS', cancellation[:status] || 'N/A')

                cancelled_at = cancellation[:cancelled_at]
                cancelled_at = OpenNebulaHelper.time_to_str(cancelled_at) if cancelled_at
                puts Kernel.format(str, 'CANCELLED AT', cancelled_at || 'N/A')
            end

            if active_job[:args] && !active_job[:args].empty?
                puts
                CLIHelper.print_header(str_h1 % 'ARGUMENTS', false)
                puts JSON.pretty_generate(active_job[:args])
            end

            command = active_job[:command]
            if command
                puts
                CLIHelper.print_header(str_h1 % 'COMMAND', false)

                puts Kernel.format(str, 'ID', command[:id] || 'N/A')
                puts Kernel.format(str, 'STATUS', command[:status] || 'N/A')
                puts Kernel.format(str, 'OPERATION', command[:operation] || 'N/A')

                argv = Array(command[:argv]).join(' ')
                puts Kernel.format(str, 'COMMAND', argv.empty? ? 'N/A' : argv)
                puts Kernel.format(str, 'EXIT CODE', command[:exit_code] || 'N/A')
            end

            0
        else
            CLIHelper::ShowTable.new(nil, self) do
                column :JOB, 'Lifecycle step', :left, :size => 20, :expand => true do |job|
                    job[:step].to_s
                end

                column :STATUS, 'Job status', :left, :size => 12 do |job|
                    job[:status].to_s.upcase
                end

                column :COMMAND, 'Command operation', :left, :size => 20 do |job|
                    job.dig(:command, :operation) if job[:command]
                end

                column :REQUESTED_BY, 'External user', :left, :size => 15 do |job|
                    job[:external_user]
                end

                default :JOB, :STATUS, :COMMAND, :REQUESTED_BY
            end.show(response, {})

            0
        end
    end

    # Cancel the active operation of a provision
    #
    # @param client [OneForm::Client] Petition client
    # @param ids [Array<Integer>] Provision IDs
    # @return [Integer, Array] CLI result
    def cancel(client, ids)
        ids.each do |id|
            response = client.cancel_provision(id)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)
        end

        0
    end

    # Create a provision from a driver
    #
    # @param client [OneForm::Client] Petition client
    # @param driver_name [String] Driver name
    # @param file_path [String, nil] Optional JSON input path
    # @param options [Hash] Creation options, including :provider_id and :deployment_type
    # @return [Integer, Array] CLI result
    def create(client, driver_name, file_path, options = {})
        provider_id     = options[:provider_id]
        deployment_type = options[:deployment]
        doc = client.get_driver(driver_name)
        return [doc[:err_code], doc[:message]] if CloudClient.is_error?(doc)

        deployments = doc[:deployment_confs]
        deployment = if deployment_type
                         deployments.find {|conf| conf[:inventory] == deployment_type }
                     elsif deployments.size == 1
                         deployments.first
                     else
                         ask_deployment(deployments)
                     end

        unless deployment
            return [-1, "Deployment type '#{deployment_type}' not found"] if deployment_type

            return [-1, 'No deployment types available']
        end

        body = self.class.read_json_input(file_path) || {}

        unless body[:user_inputs_values]
            dinputs = client.get_driver_inputs(driver_name, deployment[:inventory])
            return [dinputs[:err_code], dinputs[:message]] if CloudClient.is_error?(dinputs)

            body[:user_inputs_values] = get_user_values(dinputs)
        end

        response = client.create_provision(driver_name, deployment[:inventory], provider_id, body)
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        provision_id = response[:ID]
        puts "ID: #{provision_id}"

        if options[:wait] && provision_id
            puts '---'
            logs(client, provision_id, :follow => true, :all => true)
        end

        0
    end

    # Update a provision from a file or editor
    #
    # @param client [OneForm::Client] Petition client
    # @param provision_id [Integer] Provision ID
    # @param file_path [String, nil] Optional JSON input path
    # @return [Integer, Array] CLI result
    def update(client, provision_id, file_path)
        if file_path
            path = file_path
        else
            response = client.get_provision(provision_id)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

            body = response[:TEMPLATE][:PROVISION_BODY].select do |key, _|
                UPDATE_ATTRS.include?(key.to_sym)
            end

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

        body     = self.class.read_json_input(path)
        response = client.update_provision(provision_id, body)

        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        else
            0
        end
    end

    # Rename a provision
    #
    # @param client [OneForm::Client] Petition client
    # @param provision_id [Integer] Provision ID
    # @param name [String] New name
    # @return [Integer, Array] CLI result
    def rename(client, provision_id, name)
        response = client.update_provision(provision_id, { 'name' => name })
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        0
    end

    # Change the group of provisions
    #
    # @param client [OneForm::Client] Petition client
    # @param ids [Array<Integer>] Provision IDs
    # @param group_id [Integer] New group ID
    # @return [Integer, Array] CLI result
    def chgrp(client, ids, group_id)
        ids.each do |id|
            response = client.chgrp_provision(id, group_id)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)
        end

        0
    end

    # Change the owner and optional group of provisions
    #
    # @param client [OneForm::Client] Petition client
    # @param ids [Array<Integer>] Provision IDs
    # @param user_id [Integer] New owner ID
    # @param group_id [Integer, nil] Optional group ID
    # @return [Integer, Array] CLI result
    def chown(client, ids, user_id, group_id = nil)
        ids.each do |id|
            response = client.chown_provision(id, user_id, group_id)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)
        end

        0
    end

    # Change provision permissions
    #
    # @param client [OneForm::Client] Petition client
    # @param ids [Array<Integer>] Provision IDs
    # @param octet [Integer] Permission octet
    # @return [Integer, Array] CLI result
    def chmod(client, ids, octet)
        ids.each do |id|
            response = client.chmod_provision(id, octet)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)
        end

        0
    end

    # Recover failed provisions
    #
    # @param client [OneForm::Client] Petition client
    # @param ids [Array<Integer>] Provision IDs
    # @param force [Boolean] Force recovery
    # @return [Integer, Array] CLI result
    def recover(client, ids, force = false)
        ids.each do |id|
            response = client.recover_provision(id, force)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)
        end

        0
    end

    # Add hosts to a provision
    #
    # @param client [OneForm::Client] Petition client
    # @param provision_id [Integer] Provision ID
    # @param amount [Integer, nil] Number of hosts
    # @param hosts [Array<String>, nil] On-prem host addresses
    # @return [Integer, Array] CLI result
    def add_host(client, provision_id, amount = nil, hosts = nil)
        response = client.add_provision_hosts(
            provision_id, :amount => hosts ? nil : (amount || 1), :hosts => hosts
        )
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        0
    end

    # Remove hosts from a provision
    #
    # @param client [OneForm::Client] Petition client
    # @param provision_id [Integer] Provision ID
    # @param host_ids [Array<Integer>] OpenNebula host IDs
    # @return [Integer, Array] CLI result
    def del_hosts(client, provision_id, host_ids)
        response = client.delete_provision_hosts(provision_id, host_ids)
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        0
    end

    # Add public IPs to a provision
    #
    # @param client [OneForm::Client] Petition client
    # @param provision_id [Integer] Provision ID
    # @param amount [Integer] Number of IPs
    # @return [Integer, Array] CLI result
    def add_ip(client, provision_id, amount = 1)
        response = client.add_ip_provision(provision_id, amount)
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        0
    end

    # Remove a public IP address range from a provision
    #
    # @param client [OneForm::Client] Petition client
    # @param provision_id [Integer] Provision ID
    # @param ar_id [Integer] Address range ID
    # @return [Integer, Array] CLI result
    def del_ip(client, provision_id, ar_id)
        response = client.remove_ip_provision(provision_id, ar_id)
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        0
    end

    # Delete provisions
    #
    # @param client [OneForm::Client] Petition client
    # @param ids [Array<Integer>] Provision IDs
    # @param force [Boolean] Force deletion
    # @param from_db [Boolean] Delete only provision documents
    # @return [Integer, Array] CLI result
    def delete(client, ids, force = false, from_db = false)
        ids.each do |id|
            response = client.delete_provision(id, force, from_db)
            return [response[:err_code], response[:message]] if CloudClient.is_error?(response)
        end

        0
    end

    # Show or follow provision logs
    #
    # @param client [OneForm::Client] Petition client
    # @param provision_id [Integer] Provision ID
    # @param options [Hash] Log options
    # @return [Integer, Array] CLI result
    def logs(client, provision_id, options = {})
        all_logs = options[:all] || false
        follow   = options[:follow] || false

        response = client.get_provision_logs(provision_id, all_logs, :follow => follow)
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        Array(response&.dig(:lines)).each do |entry|
            level = entry[:level] || entry['level'] || 'info'
            text  = entry[:text]  || entry['text']  || ''

            if $stdout.tty? && level == 'error'
                puts "#{CLIHelper::ANSI_RED}#{text}#{CLIHelper::ANSI_RESET}"
            elsif $stdout.tty? && level == 'warn'
                puts "#{CLIHelper::ANSI_YELLOW}#{text}#{CLIHelper::ANSI_RESET}"
            else
                puts text
            end
        end

        0
    end

    def render_data(response, options)
        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        elsif options[:yaml]
            [0, response.to_yaml(:indent => 4)]
        else
            [0, JSON.pretty_generate(response)]
        end
    end

    def get_user_values(user_inputs)
        super || {}
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

    private :format_provision_pool, :render_jobs, :render_data,
            :get_user_values, :ask_deployment, :ask_user_inputs

end
