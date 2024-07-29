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

# Oneflow Template command helper
class OneFlowTemplateHelper < OpenNebulaHelper::OneHelper

    # Configuration file
    def self.conf_file
        'oneflowtemplate.yaml'
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

    # Get service template pool
    def format_service_template_pool
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

            column :NAME, 'Name', :left, :expand => true do |d|
                d['NAME']
            end

            column :REGTIME,
                   'Registration time of the Service Template',
                   :size => 15 do |d|
                d.extend(CLIHelper::HashWithSearch)
                d = d.dsearch('TEMPLATE/BODY')

                OpenNebulaHelper.time_to_str(d['registration_time'])
            end

            default :ID, :USER, :GROUP, :NAME, :REGTIME
        end
    end

    # List service template pool
    #
    # @param client  [Service::Client] Petition client
    # @param options [Hash]            CLI options
    def list_service_template_pool(client, options)
        response = client.get(RESOURCE_PATH)

        if CloudClient.is_error?(response)
            [response.code.to_i, response.to_s]
        else
            if options[:json]
                [0, response.body]
            elsif options[:yaml]
                [0, JSON.parse(response.body).to_yaml(:indent => 4)]
            else
                table = format_service_template_pool
                documents = JSON.parse(response.body)['DOCUMENT_POOL']

                table.show(documents['DOCUMENT'], options)
                table.describe_columns if options[:describe]

                0
            end
        end
    end

    # List service template pool continiously
    #
    # @param client  [Service::Client] Petition client
    # @param options [Hash]            CLI options
    def top_service_template_pool(client, options)
        # TODO: make default delay configurable
        options[:delay] ? delay = options[:delay] : delay = 4

        begin
            loop do
                CLIHelper.scr_cls
                CLIHelper.scr_move(0, 0)

                list_service_template_pool(client, options)

                sleep delay
            end
        rescue StandardError => e
            STDERR.puts e.message
            exit(-1)
        end

        0
    end

    # Show service template detailed information
    #
    # @param client           [Service::Client] Petition client
    # @param service_template [Integer]         Service template ID
    # @param options          [Hash]            CLI options
    def format_resource(client, service_template, options)
        response = client.get("#{RESOURCE_PATH}/#{service_template}")

        if CloudClient.is_error?(response)
            [response.code.to_i, response.to_s]
        else
            if options[:json]
                [0, response.body]
            elsif options[:yaml]
                [0, JSON.parse(response.body).to_yaml(:indent => 4)]
            else
                str    = '%-20s: %-20s'
                str_h1 = '%-80s'

                document = JSON.parse(response.body)['DOCUMENT']
                template = document['TEMPLATE']['BODY']
                reg_time = OpenNebulaHelper.time_to_str(
                    template['registration_time']
                )

                CLIHelper.print_header(
                    str_h1 % "SERVICE TEMPLATE #{document['ID']} INFORMATION"
                )

                puts Kernel.format str, 'ID',   document['ID']
                puts Kernel.format str, 'NAME', document['NAME']
                puts Kernel.format str, 'USER', document['UNAME']
                puts Kernel.format str, 'GROUP', document['GNAME']
                puts Kernel.format str, 'REGISTRATION TIME', reg_time

                puts

                CLIHelper.print_header(str_h1 % 'PERMISSIONS', false)

                ['OWNER', 'GROUP', 'OTHER'].each do |e|
                    mask = '---'
                    permissions_hash = document['PERMISSIONS']
                    mask[0] = 'u' if permissions_hash["#{e}_U"] == '1'
                    mask[1] = 'm' if permissions_hash["#{e}_M"] == '1'
                    mask[2] = 'a' if permissions_hash["#{e}_A"] == '1'

                    puts Kernel.format str, e, mask
                end

                puts

                CLIHelper.print_header(str_h1 % 'TEMPLATE CONTENTS', false)
                puts JSON.pretty_generate(template)

                0
            end
        end
    end

    # Get custom attributes values from user
    #
    # @param custom_attrs [Hash] Custom attributes from template
    #
    # @return [Hash] Custom attributes values
    def custom_attrs(custom_attrs)
        # rubocop:disable Layout/LineLength
        return if custom_attrs.nil? || custom_attrs.empty?

        ret = {}
        ret['custom_attrs_values'] = OpenNebulaHelper.parse_user_inputs(custom_attrs)

        # rubocop:enable Layout/LineLength
        ret
    end

    # Get custom role attributes values from user
    #
    # @param role [Hash] Service role with custom attributes
    #
    # @return [Hash] Role with custom attributes values
    def custom_role_attrs(roles)
        return if roles.nil? || roles.empty?

        ret = {}
        role_with_custom_attrs = false

        roles.each do |role|
            next unless role.key?('custom_attrs')

            ####################################################################
            # Display Role Information
            ####################################################################
            header = "> Please insert the user inputs for the role \"#{role['name']}\""
            puts header

            role.merge!(custom_attrs(role['custom_attrs']))
            role_with_custom_attrs = true
        end

        ret['roles'] = roles if role_with_custom_attrs

        ret
    end

    def networks(vnets)
        return unless vnets

        ret = {}
        ret['networks_values'] = parse_networks(vnets)

        ret
    end

    def parse_networks(vnets, get_defaults = false)
        unless get_defaults
            puts 'There are some networks that require user input. ' \
                 'Use the string <<EDITOR>> to launch an editor ' \
                 '(e.g. for multi-line inputs)'
        end

        answers = []

        vnets.each do |key, val|
            input_cfg = val.split('|', -1)

            if input_cfg.length != 5
                STDERR.puts 'Malformed user input. It should have 5'\
                            "parts separated by '|':"
                STDERR.puts "  #{key}: #{val}"
                exit(-1)
            end

            vnet                                  = {}
            mandatory, _, description, _, initial = input_cfg

            if initial && !initial.empty?
                type, resource_id, extra = initial.split(':', -1)
            end

            if (!type || !resource_id) && (initial && !initial.empty?)
                STDERR.puts 'Wrong type for user input default value:'
                STDERR.puts "  #{key}: #{val}"
                exit(-1)
            end

            vnet[key] = {}

            if get_defaults
                vnet[key][type]    = resource_id
                vnet[key]['extra'] = extra

                answers << vnet unless mandatory == 'M'
                next
            end

            puts "  * (#{key}) #{description}"

            ####################################################################
            # Ask for type
            ####################################################################
            header  = '    '
            header += 'TYPE Existing(1), Create(2), Reserve(3). '
            header += 'Press enter for default. ' if type && !type.empty?

            print header

            answer = STDIN.readline.chop

            if type && !type.empty? && ![1, 2, 3].include?(answer.to_i)
                type_a = type
            else
                until [1, 2, 3].include?(answer.to_i)
                    print header
                    answer = STDIN.readline.chop
                end
            end

            case answer.to_i
            when 1
                type_a = 'id'
            when 2
                type_a = 'template_id'
            when 3
                type_a = 'reserve_from'
            end

            ####################################################################
            # Ask for resource id
            ####################################################################
            header = '    '

            if type_a == 'template_id'
                header += 'VN Template ID. '
            else
                header += 'VN ID. '
            end

            if resource_id && !resource_id.empty?
                header += "Press enter for default (#{resource_id}). "
            end

            print header

            resource_id_a = STDIN.readline.chop

            if resource_id && !resource_id.empty?
                resource_id_a = resource_id
            else
                while resource_id_a.empty?
                    print header
                    resource_id_a = STDIN.readline.chop
                end
            end

            ####################################################################
            # Asks for extra
            ####################################################################
            if type_a != 'id'
                header  = '    '
                header += 'EXTRA (Type EMPTY for leaving empty). '

                if extra && !extra.empty?
                    header += " Press enter for default (#{extra}). "
                end

                print header

                extra_a = STDIN.readline.chop

                if extra_a.empty?
                    vnet[key]['extra'] = extra
                else
                    vnet[key]['extra'] = extra_a
                end
            end

            vnet[key][type_a] = resource_id_a

            answers << vnet
        end

        answers
    end

    def factory(id = nil)
        if id
            OpenNebula::ServiceTemplate.new_with_id(id, @client)
        else
            xml = OpenNebula::ServiceTemplate.build_xml
            OpenNebula::ServiceTemplate.new(xml, @client)
        end
    end

end
