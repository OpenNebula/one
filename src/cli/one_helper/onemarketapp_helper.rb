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

class OneMarketPlaceAppHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "MARKETPLACEAPP"
    end

    def self.conf_file
        "onemarketapp.yaml"
    end

    def self.state_to_str(id)
        id = id.to_i
        state_str = MarketPlaceApp::MARKETPLACEAPP_STATES[id]
        return MarketPlaceApp::SHORT_MARKETPLACEAPP_STATES[state_str]
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the marketplace app", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the marketplace app", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :PUBLISHER, "Publisher of the App", :left, :size=>25 do |d|
                d["PUBLISHER"]
            end

            column :VERSION, "Version of the app", :size=>7 do |d|
                d["VERSION"]
            end

            column :SIZE, "App size", :size =>5 do |d|
                OpenNebulaHelper.unit_to_str(d['SIZE'].to_i, {}, 'M')
            end

            column :STAT, "State of the app", :size=>4 do |d|
                OneMarketPlaceAppHelper.state_to_str(d["STATE"])
            end

            column :DATE, "Publishing date of the app", :size=>8 do |d|
                Time.at(d['DATE'].to_i).strftime("%D")
            end

            column :TYPE, "Marketplace app type", :size=>4 do |d|
                type = MarketPlaceApp::MARKETPLACEAPP_TYPES[d["TYPE"].to_i]
                MarketPlaceApp::SHORT_MARKETPLACEAPP_TYPES[type]
            end

            column :MARKET, "ID of the marketplace", :size=>6 do |d|
                d["MARKETPLACE_ID"]
            end

            default :ID,:NAME,:VERSION,:SIZE,:STAT,:TYPE,:DATE,:MARKET,:PUBLISHER
        end

        table
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::MarketPlaceApp.new_with_id(id, @client)
        else
            xml=OpenNebula::MarketPlaceApp.build_xml
            OpenNebula::MarketPlaceApp.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::MarketPlaceAppPool.new(@client, user_flag)
    end

    def format_resource(app, options = {})
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "MARKETPLACE APP #{app['ID']} INFORMATION")
        puts str % ["ID",    app.id.to_s]
        puts str % ["NAME",  app.name]
        puts str % ["TYPE",  app.type_str]
        puts str % ["USER",  app['UNAME']]
        puts str % ["GROUP", app['GNAME']]
        puts str % ["MARKETPLACE", app['MARKETPLACE']]
        puts str % ["STATE", OneMarketPlaceAppHelper.state_to_str(app["STATE"])]

        puts

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if app["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if app["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if app["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e, mask]
        }
        puts

        CLIHelper.print_header(str_h1 % "DETAILS", false)

        puts str % ["SOURCE", app['SOURCE']]
        puts str % ["CHECKSUM", app['CHECKSUM']]
        puts str % ["PUBLISHER", app['PUBLISHER']]
        puts str % ["PUB. DATE", Time.at(app['DATE'].to_i).strftime("%c") ]
        puts str % ["VERSION", app['VERSION']]
        puts str % ["DESCRIPTION", app['DESCRIPTION']]
        puts str % ["SIZE", OpenNebulaHelper.unit_to_str(app['SIZE'].to_i,{},'M')]
        puts str % ["ORIGIN_ID", app['ORIGIN_ID']]
        puts str % ["FORMAT", app['FORMAT']]

        puts

        CLIHelper.print_header(str_h1 % "IMPORT TEMPLATE", false)

        puts Base64.decode64(app['APPTEMPLATE64'])

        puts

        CLIHelper.print_header(str_h1 % "MARKETPLACE APP TEMPLATE", false)
        puts app.template_str

        puts
    end
end
