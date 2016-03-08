# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

    def set_zone(zone_id)
      zone = factory(zone_id)
      rc = zone.info

      if OpenNebula.is_error?(rc)
        return -1, rc.message
      end

      if !zone['TEMPLATE/ENDPOINT']
        return -1, "No Endpoint defined for Zone #{zone_id}"
      end

      File.open(ENV['HOME']+"/.one/one_endpoint", 'w'){|f|
         f.puts zone['TEMPLATE/ENDPOINT']
      }

      puts "Endpoint changed to \"#{zone['TEMPLATE/ENDPOINT']}\" in " <<
           "#{ENV['HOME']}/.one/one_endpoint"
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

        CLIHelper.print_header(str_h1 % "ZONE TEMPLATE", false)
        puts zone.template_str
    end
end
