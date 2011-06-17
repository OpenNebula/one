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

class OneTemplateHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "TEMPLATE"
    end

    def self.conf_file
        "onetemplate.yaml"
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

        CLIHelper.print_header(str_h1 % "TEMPLATE #{template['ID']} INFORMATION")
        puts str % ["ID", template.id.to_s]
        puts str % ["NAME", template.name]
        puts str % ["REGISTER TIME", OpenNebulaHelper.time_to_str(template['REGTIME'])]
        puts str % ["PUBLIC", OpenNebulaHelper.public_to_str(template['PUBLIC'])]         
        puts

        CLIHelper.print_header(str_h1 % "TEMPLATE CONTENTS",false)
        puts template.template_str
    end

    def format_pool(pool, options, top=false)
        config_file=self.class.table_conf
        table=CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Template", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Template", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :USER, "Username of the Template owner", :left, :size=>8 do |d|
                helper.uid_to_str(d["UID"], options)
            end

            column :GROUP, "Group of the Template", :left, :size=>8 do |d|
                helper.gid_to_str(d["GID"], options)
            end

            column :REGTIME, "Registration time of the Template", :size=>20 do |d|
                OpenNebulaHelper.time_to_str(d["REGTIME"])
            end

            column :PUBLIC, "Whether the Template is public or not", :size=>3 do |d|
                OpenNebulaHelper.public_to_str(d["PUBLIC"])
            end

            default :ID, :USER, :GROUP, :NAME, :REGTIME, :PUBLIC
        end

        if top
            table.top(pool, options)
        else
            table.show(pool, options)
        end
    end
end