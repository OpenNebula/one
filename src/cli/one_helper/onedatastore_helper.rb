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
    DATASTORE = {
        :name   => "datastore",
        :short  => "-d id|name",
        :large  => "--datastore id|name" ,
        :description => "Selects the datastore",
        :format => String,
        :proc   => lambda { |o, options|
            ch = OneDatastoreHelper.new
            rc, dsid = ch.to_id(o)
            if rc == 0
                options[:datastore] = dsid
            else
                puts dsid
                puts "option datastore: Parsing error"
                exit -1
            end
        }
    }

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

            column :NAME, "Name of the Datastore", :left, :size=>12 do |d|
                d["NAME"]
            end

            column :CLUSTER, "Name of the Cluster", :left, :size=>8 do |d|
                OpenNebulaHelper.cluster_str(d["CLUSTER"])
            end

            column :IMAGES, "Number of Images", :left, :size=>6 do |d|
                if d["IMAGES"]["ID"].nil?
                    "0"
                else
                    d["IMAGES"]["ID"].size
                end
            end

            column :TYPE, "Datastore driver", :left, :size=>6 do |d|
                d["DS_MAD"]
            end

            column :TM, "Transfer driver", :left, :size=>6 do |d|
                d["TM_MAD"]
            end

            default :ID, :CLUSTER, :NAME, :IMAGES, :TYPE, :TM
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
        puts str % ["CLUSTER",  OpenNebulaHelper.cluster_str(datastore['CLUSTER'])]

        puts str % ["DS_MAD",   datastore['DS_MAD']]
        puts str % ["TM_MAD",   datastore['TM_MAD']]
        puts str % ["BASE PATH",datastore['BASE_PATH']]
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

        CLIHelper.print_header(str_h1 % "DATASTORE TEMPLATE", false)
        puts datastore.template_str

        puts

        CLIHelper.print_header("%-15s" % "IMAGES")
        datastore.img_ids.each do |id|
            puts "%-15s" % [id]
        end
    end
end
