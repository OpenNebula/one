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

class OneImageHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "IMAGE"
    end

    def self.conf_file
        "oneimage.yaml"
    end

    def self.state_to_str(id)
        id = id.to_i
        state_str = Image::IMAGE_STATES[id]
        return Image::SHORT_IMAGE_STATES[state_str]
    end

    def self.type_to_str(id)
        id = id.to_i
        type_str = Image::IMAGE_TYPES[id]
        return Image::SHORT_IMAGE_TYPES[type_str]
    end
    
    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Image", :size=>4 do |d|
                d["ID"]
            end

            column :USER, "Username of the Virtual Machine owner", :left,
                    :size=>8 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Virtual Machine", :left,
                    :size=>8 do |d|
                helper.group_name(d, options)
            end

            column :NAME, "Name of the Image", :left, :size=>12 do |d|
                d["NAME"]
            end

            column :DATASTORE, "Name of the Image", :left, :size=>10 do |d|
                d["DATASTORE"]
            end

            column :TYPE, "Type of the Image", :size=>4 do |d,e|
                OneImageHelper.type_to_str(d["TYPE"])
            end

            column :REGTIME, "Registration time of the Image",
                    :size=>20 do |d|
                OpenNebulaHelper.time_to_str(d["REGTIME"])
            end
            
            column :PERSISTENT, "Whether the Image is persistent or not",
                    :size=>3 do |d|
                OpenNebulaHelper.boolean_to_str(d["PERSISTENT"])
            end

            column :STAT, "State of the Image", :size=>4 do |d|
                OneImageHelper.state_to_str(d["STATE"])
            end

            column :RVMS, "Number of VMs currently running from this Image",
                    :size=>5 do |d|
                d['RUNNING_VMS']
            end

            column :SIZE, "Size of the image",
                    :size=>7 do |d|
                OpenNebulaHelper.unit_to_str(d['SIZE'].to_i,options,"M")
            end

            default :ID, :USER, :GROUP, :NAME, :DATASTORE, :SIZE, :TYPE,
                :PERSISTENT , :STAT, :RVMS
        end

        table
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
        puts str % ["ID",   image.id.to_s]
        puts str % ["NAME", image.name]
        puts str % ["USER", image['UNAME']]
        puts str % ["GROUP",image['GNAME']]
        puts str % ["DATASTORE",image['DATASTORE']]
        puts str % ["TYPE", image.type_str]
        puts str % ["REGISTER TIME",
            OpenNebulaHelper.time_to_str(image['REGTIME'])]
        puts str % ["PERSISTENT",
            OpenNebulaHelper.boolean_to_str(image["PERSISTENT"])]
        puts str % ["SOURCE",image['SOURCE']]
        puts str % ["PATH",image['PATH']] if image['PATH'] && !image['PATH'].empty?
        puts str % ["FSTYPE",image['FSTYPE']] if image['FSTYPE'] && !image['FSTYPE'].empty?
        puts str % ["SIZE",  image['SIZE']]
        puts str % ["STATE", image.short_state_str]
        puts str % ["RUNNING_VMS", image['RUNNING_VMS']]
        puts

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if image["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if image["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if image["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e,  mask]
        }
        puts

        CLIHelper.print_header(str_h1 % "IMAGE TEMPLATE",false)
        puts image.template_str
    end
end
