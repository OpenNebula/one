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

class OneTemplateHelper < OpenNebulaHelper::OneHelper
    VM_NAME={
        :name  => "vm_name",
        :short => "-n vm_name",
        :large => "--name vm_name",
        :format => String,
        :description =>  <<-EOT
Name of the new Virtual Machine. When instantiating
                               multiple VMs you can use the\"%i\" wildcard to produce
                               different names such as vm-0, vm-1...
EOT
    }

    MULTIPLE={
        :name  => "multiple",
        :short => "-m x",
        :large => "--multiple x",
        :format => Integer,
        :description => "Instance multiple VMs"
    }

    def self.rname
        "VMTEMPLATE"
    end

    def self.conf_file
        "onetemplate.yaml"
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Template", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Template", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :USER, "Username of the Template owner", :left,
                    :size=>8 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Template", :left, :size=>8 do |d|
                helper.group_name(d, options)
            end

            column :REGTIME, "Registration time of the Template",
                    :size=>20 do |d|
                OpenNebulaHelper.time_to_str(d["REGTIME"])
            end

            default :ID, :USER, :GROUP, :NAME, :REGTIME
        end

        table
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::Template.new_with_id(id, @client)
        else
            xml=OpenNebula::Template.build_xml
            OpenNebula::Template.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::TemplatePool.new(@client, user_flag)
    end

    def format_resource(template)
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(
            str_h1 % "TEMPLATE #{template['ID']} INFORMATION")
        puts str % ["ID", template.id.to_s]
        puts str % ["NAME", template.name]
        puts str % ["USER", template['UNAME']]
        puts str % ["GROUP", template['GNAME']]
        puts str % ["REGISTER TIME",
            OpenNebulaHelper.time_to_str(template['REGTIME'])]
        puts

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if template["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if template["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if template["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e,  mask]
        }
        puts

        CLIHelper.print_header(str_h1 % "TEMPLATE CONTENTS",false)
        puts template.template_str
    end
end
