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

require 'one_helper'

# Oneflow Template command helper
class OneFlowTemplateHelper < OpenNebulaHelper::OneHelper

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
        # TODO: config file
        CLIHelper::ShowTable.new(nil, self) do
            column :ID, 'ID', :size => 10 do |d|
                d['ID']
            end

            column :USER, 'Username', :left, :size => 15 do |d|
                d['UNAME']
            end

            column :GROUP, 'Group', :left, :size => 15 do |d|
                d['GNAME']
            end

            column :NAME, 'Name', :left, :size => 37 do |d|
                d['NAME']
            end

            default :ID, :USER, :GROUP, :NAME
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
            else
                documents = JSON.parse(response.body)['DOCUMENT_POOL']
                format_service_template_pool.show(documents['DOCUMENT'])

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
            else
                str    = '%-20s: %-20s'
                str_h1 = '%-80s'

                document = JSON.parse(response.body)['DOCUMENT']
                template = document['TEMPLATE']['BODY']

                CLIHelper.print_header(
                    str_h1 % "SERVICE TEMPLATE #{document['ID']} INFORMATION"
                )

                puts Kernel.format str, 'ID',   document['ID']
                puts Kernel.format str, 'NAME', document['NAME']
                puts Kernel.format str, 'USER', document['UNAME']
                puts Kernel.format str, 'GROUP', document['GNAME']

                puts

                CLIHelper.print_header(str_h1 % 'PERMISSIONS', false)

                %w[OWNER GROUP OTHER].each do |e|
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
        return unless custom_attrs

        puts 'There are some custom attrs which need a value'

        ret = {}
        ret['custom_attrs_values'] = {}

        custom_attrs.each do |key, value|
            split_value = value.split('|')

            if split_value.size < 2
                STDERR.puts 'Custom attribute malformed'
                STDERR.puts 'M/O|description|<optional_value>'
                exit(-1)
            end

            type, desc, initial = split_value

            if %w[M O].include?(type)
                puts "Introduce (#{type}) value for `#{key}` (#{desc}):"
            else
                STDERR.puts "Incorrect type: #{type}"
                STDERR.puts 'only M (mandatory) O (optional) supported'
                exit(-1)
            end

            answer = STDIN.readline.chop

            if answer.empty? && type == 'M'
                while answer.empty?
                    STDERR.puts 'Mandatory value can\'t be empty'
                    answer = STDIN.readline.chop
                end
            elsif answer.empty?
                answer = initial
            end

            ret['custom_attrs_values'][key] = answer
        end

        ret
    end

end
