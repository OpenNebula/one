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

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for Virtual Network", :size=>4 do |d|
                d["ID"]
            end

            column :USER, "Username of the Virtual Network owner", :left,
                    :size=>8 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Virtual Network", :left,
                    :size=>8 do |d|
                helper.group_name(d, options)
            end

            column :NAME, "Name of the Virtual Network", :left,
                    :size=>15 do |d|
                d["NAME"]
            end

            column :CLUSTER, "Name of the Cluster", :left, :size=>8 do |d|
                OpenNebulaHelper.cluster_str(d["CLUSTER"])
            end 

            column :TYPE, "Type of Virtual Network", :size=>6 do |d|
                OneVNetHelper.type_to_str(d["TYPE"])
            end

            column :SIZE, "Size of the Virtual Network", :size=>5 do |d|
                d["SIZE"]
            end

            column :BRIDGE, "Bridge associated to the Virtual Network",
                    :size=>6 do |d|
                d["BRIDGE"]
            end

            column :LEASES, "Number of this Virtual Network's given leases",
                    :size=>6 do |d|
                d["TOTAL_LEASES"]
            end

            default :ID, :USER, :GROUP, :NAME, :TYPE, :BRIDGE, :LEASES
        end

        table
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

        str="%-15s: %-20s"
        puts str % ["ID", vn.id.to_s]
        puts str % ["NAME", vn['NAME']]
        puts str % ["USER", vn['UNAME']]
        puts str % ["GROUP", vn['GNAME']]
        puts str % ["CLUSTER", OpenNebulaHelper.cluster_str(vn['CLUSTER'])]
        puts str % ["TYPE", vn.type_str]
        puts str % ["BRIDGE", vn["BRIDGE"]]
        puts str % ["VLAN", OpenNebulaHelper.boolean_to_str(vn['VLAN'])]
        puts str % ["PHYSICAL DEVICE", vn["PHYDEV"]] if vn["PHYDEV"]
        puts str % ["VLAN ID", vn["VLAN_ID"]] if vn["VLAN_ID"]
        puts str % ["USED LEASES", vn['TOTAL_LEASES']]
        puts

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if vn["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if vn["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if vn["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e,  mask]
        }
        puts

        CLIHelper.print_header(str_h1 % ["VIRTUAL NETWORK TEMPLATE"], false)

        puts vn.template_str(false)

        if vn.type_str == "RANGED"
            puts
            CLIHelper.print_header(str_h1 % ["RANGE"], false)
            puts str % ["IP_START", vn['RANGE/IP_START']]
            puts str % ["IP_END", vn['RANGE/IP_END']]
        end

        lease_types = [ ["LEASES ON HOLD",  'LEASE[USED=1 and VID=-1]'],
                        ["USED LEASES",     'LEASE[USED=1 and VID>-1]'],
                        ["FREE LEASES",     'LEASE[USED=0]'] ]

        lease_types.each { |pair|
            leases_str = vn.template_like_str('/VNET/LEASES', false, pair[1])

            if !leases_str.empty?
                puts
                CLIHelper.print_header(str_h1 % [pair[0]], false)
                puts leases_str
            end
        }
    end
end
