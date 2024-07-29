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

require 'one_helper'

# Oneflow command helper
class OneFlowHelper < OpenNebulaHelper::OneHelper

    # Configuration file
    def self.conf_file
        'oneflow.yaml'
    end

    # Get client to make request
    #
    # @options [Hash] CLI options
    def client(options)
        Service::Client.new(
            :username => options[:username],
            :password => options[:password],
            :url => options[:server],
            :user_agent => USER_AGENT
        )
    end

    # Get service pool table
    def format_service_pool
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'ID', :size => 10 do |d|
                d['ID']
            end

            column :USER, 'Username', :left, :size => 15 do |d|
                d['UNAME']
            end

            column :GROUP, 'Group', :left, :size => 15 do |d|
                d['GNAME']
            end

            column :NAME, 'Name', :expand => true, :left => true do |d|
                d['NAME']
            end

            column :STARTTIME, 'Start time of the Service', :size => 15 do |d|
                d.extend(CLIHelper::HashWithSearch)
                d = d.dsearch('TEMPLATE/BODY')

                OpenNebulaHelper.time_to_str(d['start_time'])
            end

            column :STAT, 'State', :size => 11, :left => true do |d|
                Service.state_str(d['TEMPLATE']['BODY']['state'])
            end

            default :ID, :USER, :GROUP, :NAME, :STARTTIME, :STAT
        end
    end

    # List service pool
    #
    # @param client  [Service::Client] Petition client
    # @param options [Hash]            CLI options
    def list_service_pool(client, options)
        response = client.get(RESOURCE_PATH)

        if CloudClient.is_error?(response)
            [response.code.to_i, response.to_s]
        elsif options[:yaml]
            [0, JSON.parse(response.body).to_yaml(:indent => 4)]
        else
            array_list = JSON.parse(response.body)
            array_list = array_list['DOCUMENT_POOL']['DOCUMENT']

            array_list = [] if array_list.nil?

            unless options.key? :done
                # remove from list flows in DONE state
                array_list.reject! do |value|
                    value['TEMPLATE']['BODY']['state'] == 5
                end
            end

            if options[:json]
                if array_list.empty?
                    0
                else
                    [0, JSON.pretty_generate(array_list)]
                end
            elsif options[:yaml]
                [0, array_list.to_yaml(:indent => 4)]
            else
                table = format_service_pool

                table.show(array_list, options)
                table.describe_columns if options[:describe]

                0
            end
        end
    end

    # List service pool continiously
    #
    # @param client  [Service::Client] Petition client
    # @param options [Hash]            CLI options
    def top_service_pool(client, options)
        # TODO: make default delay configurable
        options[:delay] ? delay = options[:delay] : delay = 4

        begin
            loop do
                CLIHelper.scr_cls
                CLIHelper.scr_move(0, 0)

                list_service_pool(client, options)

                sleep delay
            end
        rescue StandardError => e
            STDERR.puts e.message
            exit(-1)
        end

        0
    end

    # Show service detailed information
    #
    # @param client  [Service::Client] Petition client
    # @param service [Integer]         Service ID
    # @param options [Hash]            CLI options
    def format_resource(client, service, options)
        response = client.get("#{RESOURCE_PATH}/#{service}")

        if CloudClient.is_error?(response)
            [response.code.to_i, response.to_s]
        else
            if options[:json]
                [0, response.body]
            elsif options[:yaml]
                [0, JSON.parse(response.body).to_yaml(:indent => 4)]
            else
                str_h1   = '%-80s'
                document = JSON.parse(response.body)['DOCUMENT']
                template = document['TEMPLATE']['BODY']

                CLIHelper.print_header(
                    str_h1 % "SERVICE #{document['ID']} INFORMATION"
                )

                print_service_info(document)

                print_roles_info(template['roles'])

                return 0 unless template['log']

                CLIHelper.print_header(str_h1 % 'LOG MESSAGES', false)

                template['log'].each do |log|
                    t = Time.at(log['timestamp']).strftime('%m/%d/%y %H:%M')
                    puts "#{t} [#{log['severity']}] #{log['message']}"
                end

                0
            end
        end
    end

    # Get policy adjust information in str format
    #
    # @param policy [Hash] Policy information
    def self.adjust_str(policy)
        policy['adjust'].to_i >= 0 ? sign = '+' : sign = '-'
        adjust = policy['adjust'].to_i.abs

        case policy['type']
        when 'CARDINALITY'
            "= #{adjust}"
        when 'PERCENTAGE_CHANGE'
            st = "#{sign} #{adjust} %"

            if policy['min_adjust_step']
                st << " (#{policy['min_adjust_step']})"
            end

            st
        else
            "#{sign} #{adjust}"
        end
    end

    private

    # Get nodes pool table
    def format_node_pool
        # TODO: config file
        CLIHelper::ShowTable.new(nil, self) do
            column :VM_ID,
                   'ONE identifier for Virtual Machine',
                   :size => 6 do |d|
                st = ''

                if d['scale_up']
                    st << '\u2191 '
                elsif d['disposed']
                    st << '\u2193 '
                end

                if d['vm_info'].nil?
                    st << d['deploy_id'].to_s
                else
                    st << d['vm_info']['VM']['ID']
                end

                st
            end

            column :NAME,
                   'Name of the Virtual Machine',
                   :left,
                   :size => 24 do |d|
                if !d['vm_info'].nil?
                    if d['vm_info']['VM']['RESCHED'] == '1'
                        "*#{d['NAME']}"
                    else
                        d['vm_info']['VM']['NAME']
                    end
                else
                    ''
                end
            end

            column :USER,
                   'Username of the Virtual Machine owner',
                   :left,
                   :size => 15 do |d|
                if !d['vm_info'].nil?
                    d['vm_info']['VM']['UNAME']
                else
                    ''
                end
            end

            column :GROUP,
                   'Group of the Virtual Machine',
                   :left,
                   :size => 15 do |d|
                if !d['vm_info'].nil?
                    d['vm_info']['VM']['GNAME']
                else
                    ''
                end
            end

            default :VM_ID, :NAME, :USER, :GROUP
        end
    end

    # Print service information
    #
    # @param document [Hash] Service document information
    def print_service_info(document)
        str        = '%-20s: %-20s'
        str_h1     = '%-80s'
        template   = document['TEMPLATE']['BODY']
        start_time = OpenNebulaHelper.time_to_str(template['start_time'])

        puts Kernel.format(str, 'ID', document['ID'])
        puts Kernel.format(str, 'NAME', document['NAME'])
        puts Kernel.format(str, 'USER', document['UNAME'])
        puts Kernel.format(str, 'GROUP', document['GNAME'])

        puts Kernel.format(str, 'STRATEGY', template['deployment'])
        puts Kernel.format(str,
                           'SERVICE STATE',
                           Service.state_str(template['state']))
        puts Kernel.format(str, 'START TIME', start_time)

        if template['shutdown_action']
            puts Kernel.format(str, 'SHUTDOWN', template['shutdown_action'])
        end

        puts

        CLIHelper.print_header(str_h1 % 'PERMISSIONS', false)

        ['OWNER', 'GROUP', 'OTHER'].each do |e|
            mask = '---'
            permissions_hash = document['PERMISSIONS']
            mask[0] = 'u' if permissions_hash["#{e}_U"] == '1'
            mask[1] = 'm' if permissions_hash["#{e}_M"] == '1'
            mask[2] = 'a' if permissions_hash["#{e}_A"] == '1'

            puts Kernel.format(str, e, mask)
        end

        puts
    end

    # Print service roles information
    #
    # @param roles [Array] Service roles information
    def print_roles_info(roles)
        str = '%-20s: %-20s'

        roles.each do |role|
            CLIHelper.print_header("ROLE #{role['name']}", false)

            puts Kernel.format(str,
                               'ROLE STATE',
                               Role.state_str(role['state']))

            if role['parents']
                puts Kernel.format(str,
                                   'PARENTS',
                                   role['parents'].join(', '))
            end

            puts Kernel.format(str, 'VM TEMPLATE', role['vm_template'])
            puts Kernel.format(str, 'CARDINALITY', role['cardinality'])

            if role['min_vms']
                puts Kernel.format(str, 'MIN VMS', role['min_vms'])
            end

            if role['max_vms']
                puts Kernel.format(str, 'MAX VMS', role['max_vms'])
            end

            if role['coolddown']
                puts Kernel.format(str, 'COOLDOWN', "#{role['cooldown']}s")
            end

            if role['shutdown_action']
                puts Kernel.format(str, 'SHUTDOWN', role['shutdown_action'])
            end

            if role['elasticity_policies'] &&
               !role['elasticity_policies'].empty?
                print_elasticity_info(role)
            end

            if role['scheduled_policies'] &&
               !role['scheduled_policies'].empty?
                print_scheduled_info(role)
            end

            puts
            CLIHelper.print_header('NODES INFORMATION', false)

            format_node_pool.show(role['nodes'])
            puts
        end
    end

    # Print role elasticity info
    #
    # @param role [OpenNebula::Role] Role information
    def print_elasticity_info(role)
        puts
        CLIHelper.print_header('ROLE ELASTICITY', false)

        CLIHelper::ShowTable.new(nil, self) do
            column :ADJUST, '', :left, :size => 12 do |d|
                OneFlowHelper.adjust_str(d)
            end

            column :EXPRESSION, '', :left, :size => 48 do |d|
                if !d['expression_evaluated'].nil?
                    d['expression_evaluated']
                else
                    d['expression']
                end
            end

            column :EVALS, '', :right, :size => 5 do |d|
                if d['period_number']
                    "#{d['true_evals'].to_i}/"\
                    "#{d['period_number']}"
                else
                    '-'
                end
            end

            column :PERIOD, '', :size => 6 do |d|
                d['period'] ? "#{d['period']}s" : '-'
            end

            column :COOL, '', :size => 5 do |d|
                d['cooldown'] ? "#{d['cooldown']}s" : '-'
            end

            default :ADJUST, :EXPRESSION, :EVALS, :PERIOD, :COOL
        end.show([role['elasticity_policies']].flatten, {})
    end

    # Print role schedule info
    #
    # @param role [OpenNebula::Role] Role information
    def print_scheduled_info(role)
        puts
        CLIHelper.print_header('ROLE ELASTICITY SCHEDULE', false)

        CLIHelper::ShowTable.new(nil, self) do
            column :ADJUST, '', :left, :size => 12 do |d|
                OneFlowHelper.adjust_str(d)
            end

            column :TIME, '', :left, :size => 67 do |d|
                if d['start_time']
                    if !d['start_time'].match(/^\d+$/)
                        Time.parse(d['start_time']).to_s
                    else
                        d['start_time']
                    end
                else
                    d['recurrence']
                end
            end

            default :ADJUST, :TIME
        end.show([role['scheduled_policies']].flatten, {})
    end

end
