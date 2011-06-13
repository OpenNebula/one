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

class OneImageHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "IMAGE"
    end

    def self.conf_file
        "oneimage.yaml"
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::Image.new_with_id(id, @client)
        else
            xml=OpenNebula::Image.build_xml
            OpenNebula::Image.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::ImagePool.new(@client, user_flag)
    end

    def format_resource(image)
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "IMAGE #{image['ID']} INFORMATION")
        puts str % ["ID", image.id.to_s]
        puts str % ["NAME", image.name]
        puts str % ["TYPE", image.type_str]            
        puts str % ["REGISTER TIME", OpenNebulaHelper.time_to_str(image['REGTIME'])]
        puts str % ["PUBLIC", OpenNebulaHelper.public_to_str(image['PUBLIC'])]
        puts str % ["PERSISTENT", OneImageHelper.persistent_to_str(image["PERSISTENT"])]
        puts str % ["SOURCE", image['SOURCE']]    
        puts str % ["STATE", image.short_state_str]
        puts str % ["RUNNING_VMS", image['RUNNING_VMS']]            
        puts

        CLIHelper.print_header(str_h1 % "IMAGE TEMPLATE",false)
        puts image.template_str
    end

    def format_pool(pool, options, top=false)
        config_file=self.class.table_conf
        table=CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Image", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Image", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :USER, "Username of the Virtual Machine owner", :left, :size=>8 do |d|
                helper.uid_to_str(d["UID"], options)
            end

            column :GROUP, "Group of the Virtual Machine", :left, :size=>8 do |d|
                helper.gid_to_str(d["GID"], options)
            end

            column :TYPE, "Type of the Image", :size=>4 do |d,e|
                d.short_type_str
            end

            column :REGTIME, "Registration time of the Image", :size=>20 do |d|
                OpenNebulaHelper.time_to_str(d["REGTIME"])
            end

            column :PUBLIC, "Whether the Image is public or not", :size=>3 do |d|
                OpenNebulaHelper.public_to_str(d["PUBLIC"])
            end

            column :PERSISTENT, "Whether the Image is persistent or not", :size=>3 do |d|
                OneImageHelper.persistent_to_str(d["PERSISTENT"])
            end

            column :STAT, "State of the Image", :size=>4 do |d|
                d.short_state_str
            end

            column :RVMS, "Number of VMs currently running from this Image", :size=>5 do |d|
                d['RUNNING_VMS']
            end

            default :ID, :USER, :GROUP, :NAME, :TYPE, :REGTIME, :PUBLIC, :PERSISTENT , :STAT, :RVMS
        end

        if top
            table.top(pool, options)
        else
            table.show(pool, options)
        end
    end
    
    private
    
    def self.persistent_to_str(str)
        str.to_i==1 ? "Yes" : "No"
    end
end