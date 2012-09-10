# -------------------------------------------------------------------------- #
# Copyright 2010-2012, C12G Labs S.L.                                        #
#                                                                            #
# Licensed under the C12G Commercial Open-source License (the                #
# "License"); you may not use this file except in compliance                 #
# with the License. You may obtain a copy of the License as part             #
# of the software distribution.                                              #
#                                                                            #
# Unless agreed to in writing, software distributed under the                #
# License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES             #
# OR CONDITIONS OF ANY KIND, either express or implied. See the              #
# License for the specific language governing permissions and                #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

require 'one_helper'

class AppEnvHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "DOCUMENT"
    end

    def self.conf_file
        "appenv.yaml"
    end

private

    def factory(id = nil)
        if id
            OpenNebula::ChefDoc.new_with_id(id, @client)
        else
            xml = OpenNebula::ChefDoc.build_xml
            OpenNebula::ChefDoc.new(xml, @client)
        end
    end

    def factory_pool(filter)
        OpenNebula::ChefDocPool.new(@client)
    end

    def format_resource(node)
        str_h1="%-80s"
        str="%-20s: %-20s"

        CLIHelper.print_header(
            str_h1 % "NODE #{node['ID']} INFORMATION")
        puts str % ["ID", node.id.to_s]
        puts str % ["NAME", node.name]
        puts str % ["USER", node['UNAME']]
        puts str % ["GROUP", node['GNAME']]

        if node.node['templates']
            puts str % ["COMPATIBLE TEMPLATES",
                node.node['templates'].join(', ')]
        end

        if node.node['cookbooks']
            puts str % ["COOKBOOKS", node.node['cookbooks']]
        end

        puts

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if node["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if node["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if node["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e,  mask]
        }
        puts

        CLIHelper.print_header(str_h1 % "DEFAULT VARIABLES",false)

        node.node['defaults'].each do |var|
            puts str % var
        end if node.node['defaults']

        puts

        CLIHelper.print_header(str_h1 % "NODE DEFINITION",false)

        puts JSON.pretty_generate(node.node['node'])

        puts

    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "Node Identifier",
                          :size=>5 do |d|
                d['ID']
            end

            column :NAME, "Name of the node",
                          :size=>16 do |d|
                d['NAME']
            end

            default :ID, :NAME
        end

        table
    end

end
