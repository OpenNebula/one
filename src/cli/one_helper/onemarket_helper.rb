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

class OneMarketPlaceHelper < OpenNebulaHelper::OneHelper
    DATASTORE = {
        :name   => "marketplace",
        :short  => "-m id|name",
        :large  => "--marketplace id|name" ,
        :description => "Selects the marketplace",
        :format => String,
        :proc   => lambda { |o, options|
            OpenNebulaHelper.rname_to_id(o, "MARKETPLACE")
        }
    }

    def self.rname
        "MARKETPLACE"
    end

    def self.conf_file
        "onemarket.yaml"
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Marketplace", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Marketplace", :left, :size=>13 do |d|
                d["NAME"]
            end

            column :SIZE, "Marketplace total size", :size =>10 do |d|
                OpenNebulaHelper.unit_to_str(d['TOTAL_MB'].to_i, {}, 'M')
            end

            column :AVAIL, "Marketplace free size", :left, :size =>5 do |d|
                if d['TOTAL_MB'].to_i == 0
                    "-"
                else
                    "#{((d['FREE_MB'].to_f/d['TOTAL_MB'].to_f) * 100).round()}%"
                end
            end

            column :MARKETAPPS, "Number of marketplace apps", :size=>6 do |d|
                if d["MARKETPLACEAPPS"]["ID"].nil?
                    "0"
                else
                    d["MARKETPLACEAPPS"]["ID"].size
                end
            end

            column :TYPE, "Marketplace type", :left, :size=>4 do |d|
                type = MarketPlace::MARKETPLACE_TYPES[d["TYPE"].to_i]
                MarketPlace::SHORT_MARKETPLACE_TYPES[type]
            end

            column :MAD, "Marketplace driver", :left, :size=>7 do |d|
                d["MARKET_MAD"]
            end

            default :ID, :NAME, :SIZE, :AVAIL, :MARKETAPPS, :TYPE, :MAD
        end

        table
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::MarketPlace.new_with_id(id, @client)
        else
            xml=OpenNebula::MarketPlace.build_xml
            OpenNebula::MarketPlace.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::MarketPlacePool.new(@client)
    end

    def format_resource(datastore, options = {})
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "MARKETPLACE #{datastore['ID']} INFORMATION")
        puts str % ["ID",    datastore.id.to_s]
        puts str % ["NAME",  datastore.name]
        puts str % ["USER",  datastore['UNAME']]
        puts str % ["GROUP", datastore['GNAME']]
        puts str % ["TYPE",  datastore.type_str]

        puts str % ["MARKET_MAD", datastore['MARKET_MAD']]
        puts

        CLIHelper.print_header(str_h1 % "MARKETPLACE CAPACITY", false)

        puts str % ["TOTAL:", OpenNebulaHelper.unit_to_str(datastore['TOTAL_MB'].to_i,{},'M')]
        puts str % ["FREE:",  OpenNebulaHelper.unit_to_str(datastore['FREE_MB'].to_i, {},'M')]
        puts str % ["USED: ", OpenNebulaHelper.unit_to_str(datastore['USED_MB'].to_i, {},'M')]
        puts

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if datastore["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if datastore["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if datastore["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e,  mask]
        }
        puts

        CLIHelper.print_header(str_h1 % "MARKETPLACE TEMPLATE", false)
        puts datastore.template_str

        puts

        CLIHelper.print_header("%-15s" % "MARKETAPPS")
        datastore.marketapp_ids.each do |id|
            puts "%-15s" % [id]
        end
    end
end
