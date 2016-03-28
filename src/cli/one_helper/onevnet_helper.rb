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
require 'one_helper/onevm_helper'

class OneVNetHelper < OpenNebulaHelper::OneHelper
    AR = {
        :name => "address_range",
        :short => "-a ar_id",
        :large => "--address_range ar_id",
        :format => Integer,
        :description => "ID of the address range"
    }

    SHOW_AR = {
        :name => "show_ar",
        :large => "--show-ar",
        :description => "Show also AR templates"
    }

    MAC = {
        :name => "mac",
        :short => "-m mac",
        :large => "--mac mac",
        :format => String,
        :description => "First MAC address in : notation"
    }

    IP = {
        :name => "ip",
        :short => "-i ip",
        :large => "--ip ip",
        :format => String,
        :description => "First IP address in . notation"
    }

    SIZE = {
        :name => "size",
        :short => "-s size",
        :large => "--size size",
        :format => String,
        :description => "Number of addresses"
    }

    IP6_GLOBAL = {
        :name => "ip6_global",
        :short => "-g ip6_pref",
        :large => "--ip6_global ip6_pref",
        :format => String,
        :description => "IP6 global prefix"
    }

    IP6_ULA = {
        :name => "ip6_ula",
        :short => "-u ip6_pref",
        :large => "--ip6_ula ip6_pref",
        :format => String,
        :description => "IP6 ula prefix"
    }

    NAME = {
        :name => "name",
        :short => "-n reservation name",
        :large => "--name reservation name",
        :format => String,
        :description => "Name of the address reservation"
    }

#    R_SIZE = {
#        :name => "rsize",
#        :short => "-s reservation size",
#        :large => "--size reservation size",
#        :format => String,
#        :description => "Number of addresses to reserve"
#    }

    GATEWAY = [
        :name       => "gateway",
        :large      => "--gateway ip",
        :format     => String,
        :description=> "IP of the gateway"
    ]

    NETMASK = [
        :name       => "netmask",
        :large      => "--netmask mask",
        :format     => String,
        :description=> "Netmask in dot notation"
    ]

    VN_MAD = [
        :name       => "vn_mad",
        :large      => "--vn_mad mad",
        :format     => String,
        :description=> "Use this driver for the network"
    ]

    VLAN_ID = [
        :name       => "vlanid",
        :large      => "--vlanid id",
        :format     => String,
        :description=> "VLAN ID assigned"
    ]

    ADDAR_OPTIONS = [
        SIZE, MAC, IP, IP6_GLOBAL, IP6_ULA, GATEWAY, NETMASK, VN_MAD, VLAN_ID ]

    def self.rname
        "VNET"
    end

    def self.conf_file
        "onevnet.yaml"
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for Virtual Network", :size=>4 do |d|
                d["ID"]
            end

            column :USER, "Username of the Virtual Network owner", :left,
                    :size=>15 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Virtual Network", :left,
                    :size=>12 do |d|
                helper.group_name(d, options)
            end

            column :NAME, "Name of the Virtual Network", :left,
                    :size=>19 do |d|
                d["NAME"]
            end

            column :CLUSTERS, "Cluster IDs", :left, :size=>10 do |d|
                OpenNebulaHelper.clusters_str(d["CLUSTERS"]["ID"])
            end

            column :BRIDGE, "Bridge associated to the Virtual Network", :left,
                    :size=>8 do |d|
                d["BRIDGE"]
            end

            column :LEASES, "Number of this Virtual Network's given leases",
                    :size=>6 do |d|
                d["USED_LEASES"]
            end

            default :ID, :USER, :GROUP, :NAME, :CLUSTERS, :BRIDGE, :LEASES
        end

        table
    end

    def show_ar(vn, ar_id)
        CLIHelper.print_header("%-80s" % ["TEMPLATE FOR AR #{ar_id}"], false)

        begin
            template = vn.template_like_str("AR_POOL/AR[AR_ID=#{ar_id}]")
        rescue
            STDERR.puts "Can not get template for AR #{ar_id}"
            return
        end

        puts template
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

    def format_resource(vn, options = {})
        vn_hash = vn.to_hash

        str_h1="%-80s"
        CLIHelper.print_header(str_h1 %
            ["VIRTUAL NETWORK #{vn.id.to_s} INFORMATION"])

        str="%-15s: %-20s"
        puts str % ["ID", vn.id.to_s]
        puts str % ["NAME", vn['NAME']]
        puts str % ["USER", vn['UNAME']]
        puts str % ["GROUP", vn['GNAME']]
        puts str % ["CLUSTERS",
            OpenNebulaHelper.clusters_str(vn.retrieve_elements("CLUSTERS/ID"))]
        puts str % ["BRIDGE", vn["BRIDGE"]]
        puts str % ["VN_MAD", vn['VN_MAD']] if !vn['VN_MAD'].empty?
        puts str % ["PHYSICAL DEVICE", vn["PHYDEV"]] if !vn["PHYDEV"].empty?
        puts str % ["VLAN ID", vn["VLAN_ID"]] if !vn["VLAN_ID"].empty?
        puts str % ["USED LEASES", vn['USED_LEASES']]
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

        puts

        CLIHelper.print_header(str_h1 % ["ADDRESS RANGE POOL"], false)

        arlist = []

        if !vn_hash['VNET']['AR_POOL']['AR'].nil?
            arlist = [vn_hash['VNET']['AR_POOL']['AR']].flatten
        end

        arlist.each do |ar|

            CLIHelper.print_header("%-80s" % "AR #{ar["AR_ID"]}")

            str="%-15s: %-20s"
            puts str % ["SIZE", ar["SIZE"]]
            puts str % ["LEASES", ar["USED_LEASES"]]
            puts str % ["VN_MAD", ar["VN_MAD"]] if ar["VN_MAD"]
            puts

            format = "%-10s %34s %34s"
            CLIHelper.print_header(format % ["RANGE", "FIRST", "LAST"], false)

            puts format % ["MAC", ar["MAC"], ar["MAC_END"]]

            if !ar["IP"].nil?
                puts format % ["IP", ar["IP"], ar["IP_END"]]
            end

            if !ar["IP6_GLOBAL"].nil?
                puts format % ["IP6_GLOBAL", ar["IP6_GLOBAL"], ar["IP6_GLOBAL_END"]]
            end

            if !ar["IP6_ULA"].nil?
                puts format % ["IP6_ULA", ar["IP6_ULA"], ar["IP6_ULA_END"]]
            end

            puts
        end

        puts
        CLIHelper.print_header(str_h1 % ["LEASES"], false)

        ar_list = []

        if !vn_hash['VNET']['AR_POOL']['AR'].nil?
            lease_list = [vn_hash['VNET']['AR_POOL']['AR']].flatten
            leases     = Array.new

            lease_list.each do |ar|
                id = ar['AR_ID']
                ar_list << id

                if ar['LEASES'] && !ar['LEASES']['LEASE'].nil?
                    lease = [ar['LEASES']['LEASE']].flatten
                    lease.each do |l|
                        l['AR_ID'] = id
                    end
                    leases << lease
                end
            end

            leases.flatten!
        end

        CLIHelper::ShowTable.new(nil, self) do
            column :AR, "", :left, :size=>3 do |d|
                d['AR_ID']
            end

            column :OWNER, "", :left, :size=>15 do |d|
                if d['VM']
                    "V:#{d['VM']}"
                elsif d['VNET']
                    "N:#{d['VNET']}"
                elsif d['VROUTER']
                    "R:#{d['VROUTER']}"
                end
            end

            column :MAC, "", :size=>17 do |d|
                    d["MAC"]
            end

            column :IP, "", :size=>15 do |d|
                    d["IP"]||"-"
            end

            column :IP6_GLOBAL, "", :donottruncate, :size=>26 do |d|
                    d["IP6_GLOBAL"]||"-"
            end
        end.show(leases, {})

        puts

        CLIHelper.print_header("%-15s" % "VIRTUAL ROUTERS")
        vn.vrouter_ids.each do |id|
            puts "%-15s" % [id]
        end

        if options[:show_ar]
            ar_list.each do |ar_id|
                puts
                show_ar(vn, ar_id)
            end
        end
    end
end
