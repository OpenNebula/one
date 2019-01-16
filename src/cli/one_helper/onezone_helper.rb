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

class OneZoneHelper < OpenNebulaHelper::OneHelper

    SERVER_NAME={
        :name => "server_name",
        :short => "-n server_name",
        :large => "--name",
        :format => String,
        :description => "Zone server name"
    }

    SERVER_ENDPOINT={
        :name => "server_rpc",
        :short => "-r rpc endpoint",
        :large => "--rpc",
        :format => String,
        :description => "Zone server RPC endpoint"
    }

    def show_resource(id, options)
        resource = retrieve_resource(id)

        rc = resource.info_extended
        return -1, rc.message if OpenNebula.is_error?(rc)

        if options[:xml]
            return 0, resource.to_xml(true)
        else
            format_resource(resource, options)
            return 0
        end
    end

    def self.rname
        "ZONE"
    end

    def self.conf_file
        "onezone.yaml"
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :CURRENT, "Active Zone", :size=>1 do |d|
                "*" if helper.client.one_endpoint.strip ==
                       d["TEMPLATE"]['ENDPOINT'].strip
            end

            column :ID, "ONE identifier for the Zone", :size=>5 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Zone", :left, :size=>25 do |d|
                d["NAME"]
            end

            column :ENDPOINT, "Endpoint of the Zone", :left, :size=>45 do |d|
                d["TEMPLATE"]['ENDPOINT']
            end

            default :CURRENT, :ID, :NAME, :ENDPOINT
        end

        table
    end

    def set_zone(zone_id, temporary_zone)
        zone = factory(zone_id)
        rc = zone.info

        if OpenNebula.is_error?(rc)
            return -1, rc.message
        end

        if !zone['TEMPLATE/ENDPOINT']
            return -1, "No Endpoint defined for Zone #{zone_id}"
        end

        if temporary_zone
            puts "Type: export ONE_XMLRPC=#{zone['TEMPLATE/ENDPOINT']}"
        else
            File.open(ENV['HOME']+"/.one/one_endpoint", 'w'){|f|
                f.puts zone['TEMPLATE/ENDPOINT']
            }
            puts "Endpoint changed to \"#{zone['TEMPLATE/ENDPOINT']}\" in " <<
                "#{ENV['HOME']}/.one/one_endpoint"
        end
        return 0
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::Zone.new_with_id(id, @client)
        else
            xml=OpenNebula::Zone.build_xml
            OpenNebula::Zone.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::ZonePool.new(@client)
    end

    def format_resource(zone, options = {})
        str="%-18s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "ZONE #{zone['ID']} INFORMATION")
        puts str % ["ID",   zone.id.to_s]
        puts str % ["NAME", zone.name]
        puts

        zone_hash=zone.to_hash

        if zone.has_elements?("/ZONE/SERVER_POOL/SERVER")

            puts
            CLIHelper.print_header(str_h1 % "ZONE SERVERS",false)

            CLIHelper::ShowTable.new(nil, self) do

                column :"ID", "", :size=>2 do |d|
                    d["ID"] if !d.nil?
                end

                column :"NAME", "", :left, :size=>15 do |d|
                    d["NAME"] if !d.nil?
                end

                column :"ENDPOINT", "", :left, :size=>63 do |d|
                    d["ENDPOINT"] if !d.nil?
                end
            end.show([zone_hash['ZONE']['SERVER_POOL']['SERVER']].flatten, {})

            puts
            CLIHelper.print_header(str_h1 % "HA & FEDERATION SYNC STATUS",false)

            CLIHelper::ShowTable.new(nil, self) do

                column :"ID", "", :size=>2 do |d|
                    d["ID"] if !d.nil?
                end

                column :"NAME", "", :left, :size=>15 do |d|
                    d["NAME"] if !d.nil?
                end

                column :"STATE", "", :left, :size=>10 do |d|
                    d["STATE"] = case d["STATE"]
                        when "0" then "solo"
                        when "1" then "candidate"
                        when "2" then "follower"
                        when "3" then "leader"
                        else "error"
                    end
                    d["STATE"] if !d.nil?
                end

                column :"TERM", "", :left, :size=>10 do |d|
                    d["TERM"] if !d.nil?
                end

                column :"INDEX", "", :left, :size=>10 do |d|
                    d["LOG_INDEX"] if !d.nil?
                end

                column :"COMMIT", "", :left, :size=>10 do |d|
                    d["COMMIT"] if !d.nil?
                end

                column :"VOTE", "", :left, :size=>5 do |d|
                    d["VOTEDFOR"] if !d.nil?
                end

                column :"FED_INDEX", "", :left, :size=>10 do |d|
                    d["FEDLOG_INDEX"] if !d.nil?
                end

            end.show([zone_hash['ZONE']['SERVER_POOL']['SERVER']].flatten, {})
        end

        puts

        CLIHelper.print_header(str_h1 % "ZONE TEMPLATE", false)
        puts zone.template_str
    end
end
