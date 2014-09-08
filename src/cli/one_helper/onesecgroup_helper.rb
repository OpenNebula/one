# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

            column :NAME, "Name of the Security Group", :left, :size=>27 do |d|
                d["NAME"]
            end

            column :USER, "Username of the Security Group owner", :left,
                    :size=>15 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Security Group", :left, :size=>15 do |d|
                helper.group_name(d, options)
            end

            default :ID, :USER, :GROUP, :NAME
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

        CLIHelper.print_header(str_h1 % "TEMPLATE CONTENTS",false)
        puts secgroup.template_str
    end
end
