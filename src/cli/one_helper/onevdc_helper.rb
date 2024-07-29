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

class OneVdcHelper < OpenNebulaHelper::OneHelper

    def self.rname
        "VDC"
    end

    def self.conf_file
        "onevdc.yaml"
    end

    def id_list_size(list, resource)
        case list
        when NilClass
            return 0
        when Array
            return list.size
        when Hash
            return list["#{resource}_ID"] == Vdc::ALL_RESOURCES ? 'ALL' : 1
        end
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the VDC", :size=>5 do |d|
                d["ID"]
            end

            column :NAME, "Name of the VDC", :left, :size=>30 do |d|
                d["NAME"]
            end

            column :GROUPS, "Number of Groups", :size=>6 do |d|
                ids = d["GROUPS"]["ID"]
                case ids
                when String
                    1
                when Array
                    ids.size
                when NilClass
                    0
                end
            end

            column :CLUSTERS, "Number of Clusters", :size=>8 do |d|
                @ext.id_list_size(d["CLUSTERS"]["CLUSTER"], "CLUSTER") rescue "-"
            end

            column :HOSTS, "Number of Hosts", :size=>5 do |d|
                @ext.id_list_size(d["HOSTS"]["HOST"], "HOST") rescue "-"
            end

            column :VNETS, "Number of Networks", :size=>5 do |d|
                @ext.id_list_size(d["VNETS"]["VNET"], "VNET") rescue "-"
            end

            column :DATASTORES, "Number of Datastores", :size=>10 do |d|
                @ext.id_list_size(d["DATASTORES"]["DATASTORE"], "DATASTORE") rescue "-"
            end

            default :ID, :NAME, :GROUPS, :CLUSTERS, :HOSTS, :VNETS, :DATASTORES
        end

        table
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::Vdc.new_with_id(id, @client)
        else
            xml=OpenNebula::Vdc.build_xml
            OpenNebula::Vdc.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::VdcPool.new(@client)
    end

    def format_resource(vdc, options = {})
        str="%-18s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "VDC #{vdc['ID']} INFORMATION")
        puts str % ["ID",   vdc.id.to_s]
        puts str % ["NAME", vdc.name]

        vdc_hash = vdc.to_hash

        groups = vdc_hash['VDC']['GROUPS']['ID']
        if(groups != nil)
            puts

            CLIHelper::ShowTable.new(nil, self) do
                column :"GROUPS", "", :right, :size=>7 do |d|
                    d
                end
            end.show([groups].flatten, {})
        end

        ['CLUSTER', 'HOST', 'DATASTORE', 'VNET'].each do |resource|
            res_array = vdc_hash['VDC']["#{resource}S"][resource]
            if(res_array != nil)
                puts
                CLIHelper.print_header(str_h1 % "#{resource}S", false)

                CLIHelper::ShowTable.new(nil, self) do
                    column :"ZONE", "", :right, :size=>7 do |d|
                        d['ZONE_ID']
                    end

                    column :"#{resource}", "", :right, :size=>9 do |d|
                        d["#{resource}_ID"] == Vdc::ALL_RESOURCES ? 'ALL' : d["#{resource}_ID"]
                    end
                end.show([res_array].flatten, {})
            end
        end

        puts
        CLIHelper.print_header(str_h1 % "VDC TEMPLATE", false)
        puts vdc.template_str
    end
end
