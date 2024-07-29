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

class OneSecurityGroupHelper < OpenNebulaHelper::OneHelper
    RECOVER = {
        :name   => "recover",
        :short  => "-r",
        :large  => "--recover" ,
        :description => "If set the commit operation will only operate on "\
            "outdated and error VMs. This is intended for retrying updates of "\
            "VMs or reinitialize the updating process if oned stopped or fail.",
    }

    def self.rname
        "SECURITY_GROUP"
    end

    def self.conf_file
        "onesecgroup.yaml"
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Security Group", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Security Group", :left, :size=>20 do |d|
                d["NAME"]
            end

            column :USER, "Username of the Security Group owner", :left,
                    :size=>15 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Security Group", :left, :size=>15 do |d|
                helper.group_name(d, options)
            end

            column :UPDATED, "Number of VMs with updated rules", :size=>8 do |d|
                if d["UPDATED_VMS"]["ID"].nil?
                    "0"
                else
                    [d["UPDATED_VMS"]["ID"]].flatten.size
                end
            end

            column :OUTDATED, "Number of VMs with outdated rules", :size=>8 do |d|
                if d["OUTDATED_VMS"]["ID"].nil?
                    "0"
                else
                    [d["OUTDATED_VMS"]["ID"]].flatten.size
                end
            end

            column :ERROR, "Number of VMs that failed to update rules", :size=>8 do |d|
                if d["ERROR_VMS"]["ID"].nil?
                    "0"
                else
                    [d["ERROR_VMS"]["ID"]].flatten.size
                end
            end

            default :ID, :USER, :GROUP, :NAME, :UPDATED, :OUTDATED, :ERROR
        end

        table
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::SecurityGroup.new_with_id(id, @client)
        else
            xml=OpenNebula::SecurityGroup.build_xml
            OpenNebula::SecurityGroup.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::SecurityGroupPool.new(@client, user_flag)
    end

    def format_resource(secgroup, options = {})
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(
            str_h1 % "SECURITY GROUP #{secgroup['ID']} INFORMATION")
        puts str % ["ID", secgroup.id.to_s]
        puts str % ["NAME", secgroup.name]
        puts str % ["USER", secgroup['UNAME']]
        puts str % ["GROUP", secgroup['GNAME']]

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if secgroup["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if secgroup["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if secgroup["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e,  mask]
        }

        puts

        CLIHelper.print_header(str_h1 % "VIRTUAL MACHINES", false)

        updated, outdated, error = secgroup.vm_ids

        puts str % ["UPDATED", updated.join(',') ]
        puts str % ["OUTDATED", outdated.join(',') ]
        puts str % ["ERROR", error.join(',') ]

        puts

        CLIHelper.print_header(str_h1 % ["RULES"], false)

        if !secgroup.to_hash['SECURITY_GROUP']['TEMPLATE']['RULE'].nil?
            rule_list = [secgroup.to_hash['SECURITY_GROUP']['TEMPLATE']['RULE']].flatten
        end

        CLIHelper::ShowTable.new(nil, self) do
            column :TYPE, "", :left, :size=>8 do |d|
                d["RULE_TYPE"]
            end

            column :PROTOCOL, "", :left, :size=>8 do |d|
                d["PROTOCOL"]
            end

            column :ICMP_TYPE, "", :left, :size=>9 do |d|
                d["ICMP_TYPE"]
            end

            column :ICMVP6_TYPE, "", :left, :size=>11 do |d|
                d["ICMPV6_TYPE"]
            end

            column :NETWORK, "", :left, :adjust, :size=>35 do |d|
                network = ""
                if(!d["NETWORK_ID"].nil? && d["NETWORK_ID"] != "")
                    network += "VNet " + d["NETWORK_ID"]
                end

                if(!d["SIZE"].nil? && d["SIZE"] != "")
                    if(network != "")
                        network += ": "
                    end

                    if(!d["IP"].nil? && d["IP"] != "")
                        network += "Start: " + d["IP"] + ", "
                    elsif(!d["MAC"] != undefined && d["MAC"] != "")
                        network += "Start: " + d["MAC"] + ", "
                    end

                    network += "Size: " + d["SIZE"]
                end

                if(network == "")
                    network = "Any"
                end

                network += " "
                network
            end

            column :RANGE, "", :left, :adjust, :size=>16 do |d|
                d["RANGE"]
            end
        end.show(rule_list, {})

        while secgroup.has_elements?("/SECURITY_GROUP/TEMPLATE/RULE")
            secgroup.delete_element("/SECURITY_GROUP/TEMPLATE/RULE")
        end

        puts

        CLIHelper.print_header(str_h1 % "TEMPLATE CONTENTS",false)
        puts secgroup.template_str
    end
end
