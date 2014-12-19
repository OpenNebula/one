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

class OneVdcHelper < OpenNebulaHelper::OneHelper

    def self.rname
        "VDC"
    end

    def self.conf_file
        "onevdc.yaml"
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the VDC", :size=>5 do |d|
                d["ID"]
            end

            column :NAME, "Name of the VDC", :left, :size=>25 do |d|
                d["NAME"]
            end

            default :ID, :NAME
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
        puts

        CLIHelper.print_header(str_h1 % "VDC TEMPLATE", false)
        puts vdc.template_str
    end
end
