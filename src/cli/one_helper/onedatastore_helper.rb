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

class OneDatastoreHelper < OpenNebulaHelper::OneHelper
    DATASTORE = {
        :name   => "datastore",
        :short  => "-d id|name",
        :large  => "--datastore id|name" ,
        :description => "Selects the datastore",
        :format => String,
        :proc   => lambda { |o, options|
            OpenNebulaHelper.rname_to_id(o, "DATASTORE")
        }
    }

    FILE_DATASTORE = {
        :name   => "file_datastore",
        :large  => "--file-datastore id|name" ,
        :description => "Selects the file datastore",
        :format => String,
        :proc   => lambda { |o, options|
            OpenNebulaHelper.rname_to_id(o, "DATASTORE")
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

            column :USER, "Username of the Datastore owner", :left,
                    :size=>10 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Datastore", :left,
                    :size=>10 do |d|
                helper.group_name(d, options)
            end

            column :NAME, "Name of the Datastore", :left, :size=>13 do |d|
                d["NAME"]
            end

            column :SIZE, "Datastore total size", :size =>10 do |d|
                shared = d['TEMPLATE']['SHARED']
                if shared != nil && shared.upcase == 'NO'
                    "-"
                else
                    OpenNebulaHelper.unit_to_str(d['TOTAL_MB'].to_i, {}, 'M')
                end
            end

            column :AVAIL, "Datastore free size", :left, :size =>5 do |d|
                if d['TOTAL_MB'].to_i == 0
                    "-"
                else
                    "#{((d['FREE_MB'].to_f/d['TOTAL_MB'].to_f) * 100).round()}%"
                end
            end

            column :CLUSTERS, "Cluster IDs", :left, :size=>12 do |d|
                OpenNebulaHelper.clusters_str(d["CLUSTERS"]["ID"])
            end

            column :IMAGES, "Number of Images", :size=>6 do |d|
                if d["IMAGES"]["ID"].nil?
                    "0"
                else
                    [d["IMAGES"]["ID"]].flatten.size
                end
            end

            column :TYPE, "Datastore type", :left, :size=>4 do |d|
                type = OpenNebula::Datastore::DATASTORE_TYPES[d["TYPE"].to_i]
                OpenNebula::Datastore::SHORT_DATASTORE_TYPES[type]
            end

            column :DS, "Datastore driver", :left, :size=>7 do |d|
                d["DS_MAD"]
            end

            column :TM, "Transfer driver", :left, :size=>7 do |d|
                d["TM_MAD"]
            end

            column :STAT, "State of the Datastore", :left, :size=>3 do |d|
                state = OpenNebula::Datastore::DATASTORE_STATES[d["STATE"].to_i]
                OpenNebula::Datastore::SHORT_DATASTORE_STATES[state]
            end

            default :ID, :USER, :GROUP, :NAME, :SIZE, :AVAIL, :CLUSTERS, :IMAGES,
                    :TYPE, :DS, :TM, :STAT
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
        OpenNebula::DatastorePool.new(@client)
    end

    def format_resource(datastore, options = {})
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "DATASTORE #{datastore['ID']} INFORMATION")
        puts str % ["ID",       datastore.id.to_s]
        puts str % ["NAME",     datastore.name]
        puts str % ["USER",     datastore['UNAME']]
        puts str % ["GROUP",    datastore['GNAME']]
        puts str % ["CLUSTERS",
            OpenNebulaHelper.clusters_str(datastore.retrieve_elements("CLUSTERS/ID"))]

        puts str % ["TYPE",     datastore.type_str]
        puts str % ["DS_MAD",   datastore['DS_MAD']]
        puts str % ["TM_MAD",   datastore['TM_MAD']]
        puts str % ["BASE PATH",datastore['BASE_PATH']]
        puts str % ["DISK_TYPE",Image::DISK_TYPES[datastore['DISK_TYPE'].to_i]]
        puts str % ["STATE",    datastore.state_str]
        puts

        CLIHelper.print_header(str_h1 % "DATASTORE CAPACITY", false)

        shared = datastore['TEMPLATE/SHARED']
        local = shared != nil && shared.upcase == 'NO'
        limit_mb = datastore['TEMPLATE/LIMIT_MB']

        puts str % ["TOTAL:", local ? '-' : OpenNebulaHelper.unit_to_str(datastore['TOTAL_MB'].to_i, {},'M')]
        puts str % ["FREE:",  local ? '-' : OpenNebulaHelper.unit_to_str(datastore['FREE_MB'].to_i, {},'M')]
        puts str % ["USED: ", local ? '-' : OpenNebulaHelper.unit_to_str(datastore['USED_MB'].to_i, {},'M')]
        puts str % ["LIMIT:",  local || limit_mb.nil? ? '-' : OpenNebulaHelper.unit_to_str(limit_mb.to_i, {},'M')]
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
