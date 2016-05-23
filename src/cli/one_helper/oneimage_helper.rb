# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

class OneImageHelper < OpenNebulaHelper::OneHelper
    TEMPLATE_OPTIONS=[
        {
            :name => "name",
            :large => "--name name",
            :format => String,
            :description => "Name of the new image"
        },
        {
            :name => "description",
            :large => "--description description",
            :format => String,
            :description => "Description for the new Image"
        },
        {
            :name => "type",
            :large => "--type type",
            :format => String,
            :description => "Type of the new Image: #{Image::IMAGE_TYPES.join(", ")}",
            :proc => lambda do |o, options|
                type=o.strip.upcase

                if Image::IMAGE_TYPES.include? type
                    [0, type]
                else
                    [-1, "Type should be: #{Image::IMAGE_TYPES.join(", ")}"]
                end
            end
        },
        {
            :name => "persistent",
            :large => "--persistent",
            :description => "Tells if the image will be persistent"
        },
        {
            :name => "prefix",
            :large => "--prefix prefix",
            :description => "Device prefix for the disk (eg. hd, sd, xvd\n"<<
                            " "*31<<"or vd)",
            :format => String,
            :proc => lambda do |o, options|
                prefix=o.strip.downcase
                if %w{hd sd xvd vd}.include? prefix
                    [0, prefix]
                else
                    [-1, "The prefix must be hd, sd, xvd or vd"]
                end
            end
        },
        {
            :name => "target",
            :large => "--target target",
            :description => "Device the disk will be attached to",
            :format => String
        },
        {
            :name => "path",
            :large => "--path path",
            :description => "Path of the image file",
            :format => String,
            :proc => lambda do |o, options|
                if o.match(/^https?:\/\//)
                    next [0, o]
                elsif o[0,1]=='/'
                    path=o
                else
                    path=Dir.pwd+"/"+o
                end

                if File.readable?(path)
                    [0, path]
                else
                    [-1, "File '#{path}' does not exist or is not readable."]
                end
            end
        },
        {
            :name => "driver",
            :large => "--driver driver",
            :description => "Driver to use image (raw, qcow2, tap:aio:...)",
            :format => String
        },
        {
            :name => "disk_type",
            :large => "--disk_type disk_type",
            :description => "Type of the image \n"<<
                            " "*31<<"for KVM: BLOCK, CDROM, RBD or FILE \n"<<
                            " "*31<<"for vCenter: THIN, TICHK, ZEOREDTHICK " <<
                                     "(for others, check the documentation) ",
            :format => String
        },
        {
            :name => "adapter_type",
            :large => "--adapter_type adapter_type",
            :description => "Controller that will handle this image in " <<
                            "vCenter (lsiLogic, ide, busLogic). For other "<<
                            "values check the documentation",
            :format => String
        },
        {
            :name => "source",
            :large => "--source source",
            :description =>
                "Source to be used. Useful for not file-based\n"<<
                " "*31<<"images",
            :format => String
        },
        {
            :name => "size",
            :large => "--size size",
            :description => "Size in MB. Used for DATABLOCK type or SOURCE based images.",
            :format => String,
            :proc => lambda do |o, options|

                m=o.strip.match(/^(\d+(?:\.\d+)?)(m|mb|g|gb)?$/i)

                if !m
                    [-1, 'Size value malformed']
                else
                    multiplier=case m[2]
                    when /(g|gb)/i
                        1024
                    else
                        1
                    end

                    value=m[1].to_f*multiplier

                    [0, value.floor]
                end
            end
        },
        OpenNebulaHelper::DRY
    ]

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

            column :USER, "Username of the Image owner", :left,
                    :size=>10 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Image", :left,
                    :size=>10 do |d|
                helper.group_name(d, options)
            end

            column :NAME, "Name of the Image", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :DATASTORE, "Name of the Datastore", :left, :size=>10 do |d|
                d["DATASTORE"]
            end

            column :TYPE, "Type of the Image", :left, :size=>4 do |d,e|
                OneImageHelper.type_to_str(d["TYPE"])
            end

            column :REGTIME, "Registration time of the Image",
                    :size=>15 do |d|
                OpenNebulaHelper.time_to_str(d["REGTIME"])
            end

            column :PERSISTENT, "Whether the Image is persistent or not",
                    :size=>3 do |d|
                OpenNebulaHelper.boolean_to_str(d["PERSISTENT"])
            end

            column :STAT, "State of the Image", :left, :size=>4 do |d|
                OneImageHelper.state_to_str(d["STATE"])
            end

            column :RVMS, "Number of VMs currently running from this Image",
                    :size=>4 do |d|
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

    def format_resource(image, options = {})
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
        puts str % ["SIZE",  OpenNebulaHelper.unit_to_str(image['SIZE'].to_i,{},"M")]
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

        if image.has_elements?("/IMAGE/SNAPSHOTS")
            puts
            CLIHelper.print_header(str_h1 % "IMAGE SNAPSHOTS",false)
            format_snapshots(image)
        end

        puts

        CLIHelper.print_header(str_h1 % "IMAGE TEMPLATE",false)
        puts image.template_str

        puts
        CLIHelper.print_header("VIRTUAL MACHINES", false)
        puts

        vms=image.retrieve_elements("VMS/ID")

        if vms
            vms.map!{|e| e.to_i }
            onevm_helper=OneVMHelper.new
            onevm_helper.client=@client
            onevm_helper.list_pool({:ids=>vms}, false)
        end
    end

    def format_snapshots(image)
        table=CLIHelper::ShowTable.new(nil, self) do
            column :AC , "Is active", :left, :size => 2 do |d|
                if d["ACTIVE"] == "YES"
                    "=>"
                else
                    ""
                end
            end
            column :ID, "Snapshot ID", :size=>3 do |d|
                d["ID"]
            end

            column :PARENT, "Snapshot Parent ID", :size=>6 do |d|
                d["PARENT"]
            end

            column :CHILDREN, "Snapshot Children IDs", :size=>10 do |d|
                d["CHILDREN"]
            end

            column :SIZE, "", :left, :size=>8 do |d|
                if d["SIZE"]
                    OpenNebulaHelper.unit_to_str(
                                d['SIZE'].to_i,
                                {},
                                "M"
                            )
                else
                    "-"
                end
            end

            column :NAME, "Snapshot Name", :left, :size=>37 do |d|
                d["NAME"]
            end

            column :DATE, "Snapshot creation date", :size=>15 do |d|
                OpenNebulaHelper.time_to_str(d["DATE"])
            end

            default :AC, :ID, :PARENT, :DATE, :SIZE, :NAME
        end

        # Convert snapshot data to an array
        image_hash = image.to_hash
        image_snapshots = [image_hash['IMAGE']['SNAPSHOTS']].flatten.first
        table.show(image_snapshots)
    end

    def self.create_image_variables(options, name)
        if Array===name
            names=name
        else
            names=[name]
        end

        t=''
        names.each do |n|
            if options[n]
                t<<"#{n.to_s.upcase}=\"#{options[n]}\"\n"
            end
        end

        t
    end

    def self.create_image_template(options)
        template_options=TEMPLATE_OPTIONS.map do |o|
            o[:name].to_sym
        end

        template=create_image_variables(
            options, template_options-[:persistent, :dry, :prefix])

        template<<"PERSISTENT=YES\n" if options[:persistent]
        if options[:prefix]
            template<<"DEV_PREFIX=\"#{options[:prefix]}\"\n"
        end

        [0, template]
    end
end
