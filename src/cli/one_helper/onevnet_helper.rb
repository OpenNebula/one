# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

class OneVNetHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "VNET"
    end

    def self.conf_file
        "onevnet.yaml"
    end

    def self.type_to_str(id)
        id = id.to_i
        type_str = VirtualNetwork::VN_TYPES[id]
        return VirtualNetwork::SHORT_VN_TYPES[type_str]
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::VirtualNetwork.new_with_id(id, @client)
        else
            xml=OpenNebula::VirtualNetwork.build_xml
            OpenNebula::VirtualNetwork.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::VirtualNetworkPool.new(@client, user_flag)
    end

    def format_resource(vn)
        str_h1="%-80s"
        CLIHelper.print_header(str_h1 %
            ["VIRTUAL NETWORK #{vn.id.to_s} INFORMATION"])

        str="%-10s: %-20s"
        puts str % ["ID: ", vn.id.to_s]
        puts str % ["UID: ", vn["UID"]]
        puts str % ["PUBLIC", OpenNebulaHelper.public_to_str(vn['PUBLIC'])]
        puts
        CLIHelper.print_header(str_h1 % ["VIRTUAL NETWORK TEMPLATE"], false)

        puts vn.template_str(false)

        leases_str = vn.template_like_str('/VNET/LEASES', false)

        if !leases_str.empty?
            puts
            CLIHelper.print_header(str_h1 % ["LEASES INFORMATION"], false)
            puts leases_str
        end
    end

    def format_pool(pool, options, top=false)
        config_file=self.class.table_conf
        table=CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for Virtual Network", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Virtual Network", :left,
                    :size=>15 do |d|
                d["NAME"]
            end

            column :USER, "Username of the Virtual Network owner", :left,
                    :size=>8 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Virtual Network", :left,
                    :size=>8 do |d|
                helper.group_name(d, options)
            end

            column :TYPE, "Type of Virtual Network", :size=>6 do |d|
                OneVNetHelper.type_to_str(d["TYPE"])
            end

            column :SIZE, "Size of the Virtual Network", :size=>6 do |d|
                d["SIZE"]
            end

            column :BRIDGE, "Bridge associated to the Virtual Network",
                    :size=>6 do |d|
                d["BRIDGE"]
            end

            column :PUBLIC, "Whether the Virtual Network is public or not",
                    :size=>3 do |d|
                OpenNebulaHelper.public_to_str(d['PUBLIC'])
            end

            column :LEASES, "Number of this Virtual Network's given leases",
                    :size=>7 do |d|
                d["TOTAL_LEASES"]
            end

            default :ID, :USER, :GROUP, :NAME, :TYPE, :BRIDGE, :PUBLIC, :LEASES
        end

        if top
            table.top(pool, options)
        else
            table.show(pool, options)
        end
    end
end