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

end
