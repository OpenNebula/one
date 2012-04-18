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

class OneClusterHelper < OpenNebulaHelper::OneHelper

    CLUSTER = {
        :name   => "cluster",
        :short  => "-c id|name",
        :large  => "--cluster id|name" ,
        :description => "Selects the cluster",
        :format => String,
        :proc   => lambda { |o, options|
            ch = OneClusterHelper.new
            rc, cid = ch.to_id(o)
            if rc == 0
                options[:cluster] = cid
            else
                puts cid
                puts "option cluster: Parsing error"
                exit -1
            end
        }
    }
    
    def self.rname
        "CLUSTER"
    end

    def self.conf_file
        "onecluster.yaml"
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Cluster", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Cluster", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :HOSTS, "Number of Hosts", :left, :size=>5 do |d|
                d["HOSTS"]["ID"] ? d["HOSTS"]["ID"].size : 0
            end

            column :VNETS, "Number of Networks", :left, :size=>5 do |d|
                d["VNETS"]["ID"] ? d["VNETS"]["ID"].size : 0
            end

            column :DATASTORES, "Number of Datastores", :left, :size=>10 do |d|
                d["DATASTORES"]["ID"] ? d["DATASTORES"]["ID"].size : 0
            end

            default :ID, :NAME, :HOSTS, :VNETS, :DATASTORES
        end

        table
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::Cluster.new_with_id(id, @client)
        else
            xml=OpenNebula::Cluster.build_xml
            OpenNebula::Cluster.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::ClusterPool.new(@client)
    end

    def format_resource(cluster)
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "CLUSTER #{cluster['ID']} INFORMATION")
        puts str % ["ID",   cluster.id.to_s]
        puts str % ["NAME", cluster.name]
        puts

        CLIHelper.print_header("%-15s" % ["HOSTS"])
        cluster.host_ids.each do |id|
            puts "%-15s" % [id]
        end

        puts
        CLIHelper.print_header("%-15s" % ["VNETS"])
        cluster.vnet_ids.each do |id|
            puts "%-15s" % [id]
        end

        puts
        CLIHelper.print_header("%-15s" % ["DATASTORES"])
        cluster.datastore_ids.each do |id|
            puts "%-15s" % [id]
        end
    end
end
