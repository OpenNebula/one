# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

class OneDatastoreHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "DATASTORE"
    end

    def self.conf_file
        "onedatastore.yaml"
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Datastore", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Datastore", :left, :size=>15 do |d|
                d["NAME"]
            end

            default :ID, :NAME
        end

        table
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::Datastore.new_with_id(id, @client)
        else
            xml=OpenNebula::Datastore.build_xml
            OpenNebula::Datastore.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        #TBD OpenNebula::UserPool.new(@client, user_flag)
        OpenNebula::DatastorePool.new(@client)
    end

    def format_resource(datastore)
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "DATASTORE #{datastore['ID']} INFORMATION")
        puts str % ["ID",       datastore.id.to_s]
        puts str % ["NAME",     datastore.name]
        puts str % ["USER",     datastore['UNAME']]
        puts str % ["GROUP",    datastore['GNAME']]

        puts str % ["TYPE",     datastore['TYPE']]
        puts str % ["BASE PATH",datastore['BASE_PATH']]
        puts

        CLIHelper.print_header(str_h1 % "IMAGES", false)
        CLIHelper.print_header("%-15s" % ["ID"])
        datastore.img_ids.each do |id|
            puts "%-15s" % [id]
        end

        puts
        CLIHelper.print_header(str_h1 % "DATASTORE TEMPLATE",false)
        puts datastore.template_str
    end
end
