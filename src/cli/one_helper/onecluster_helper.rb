# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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
            OpenNebulaHelper.rname_to_id(o, "CLUSTER")
        }
    }

    def self.rname
        "CLUSTER"
    end

    def self.conf_file
        "onecluster.yaml"
    end

    def element_size(ehash, ename)
        ids = ehash[ename]["ID"]

        if ids.nil?
            return 0
        elsif ids.class == String
            return 1
        else
            return ids.size
        end
    end


    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Cluster", :size=>5 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Cluster", :left, :size=>25 do |d|
                d["NAME"]
            end

            column :HOSTS, "Number of Hosts", :size=>5 do |d|
                @ext.element_size(d,"HOSTS")
            end

            column :VNETS, "Number of Networks", :size=>5 do |d|
                @ext.element_size(d,"VNETS")
            end

            column :DATASTORES, "Number of Datastores", :size=>10 do |d|
                @ext.element_size(d,"DATASTORES")
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

    def format_resource(cluster, options = {})
        str="%-18s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "CLUSTER #{cluster['ID']} INFORMATION")
        puts str % ["ID",   cluster.id.to_s]
        puts str % ["NAME", cluster.name]
        puts

        CLIHelper.print_header(str_h1 % "CLUSTER TEMPLATE", false)
        puts cluster.template_str

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
