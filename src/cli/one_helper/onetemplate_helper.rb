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
require 'base64'

class OneTemplateHelper < OpenNebulaHelper::OneHelper
    VM_NAME={
        :name  => "name",
        :large => "--name name",
        :format => String,
        :description =>  <<-EOT.strip
Name of the new VM or TEMPLATE. When instantiating
                               multiple VMs you can use the \"%i\" wildcard to produce
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

    USERDATA={
        :name  => "userdata",
        :large => "--userdata userdata",
        :format => String,
        :description => "Integrate userdata into the EC2 section"
    }

    EXTENDED={
        :name => "extended",
        :large => "--extended",
        :description => "Process the template and included extended "+
                        "information, such as the SIZE for each DISK"
    }

    RECURSIVE={
        :name => "recursive",
        :short => "-R",
        :large => "--recursive",
        :description => "Applies the action to the template plus any "+
        "image defined in DISK"
    }

    PERSISTENT={
        :name => "persistent",
        :large => "--persistent",
        :description => "Creates a private persistent copy of the template "+
        "plus any image defined in DISK, and instantiates that copy"
    }

    def self.rname
        "VMTEMPLATE"
    end

    def self.conf_file
        "onetemplate.yaml"
    end


    def show_resource(id, options)
        resource = retrieve_resource(id)

        if !options[:extended].nil?
            rc = resource.info(options[:extended])
        else
            rc = resource.info
        end

        return -1, rc.message if OpenNebula.is_error?(rc)

        if options[:xml]
            return 0, resource.to_xml(true)
        elsif options[:json]
            # If body is set, the resource contains a JSON inside
            if options[:body]
                return 0, check_resource_xsd(resource)
            else
                return 0, ::JSON.pretty_generate(
                    check_resource_xsd(resource)
                )
            end
        elsif options[:yaml]
            return 0, check_resource_xsd(resource).to_yaml(:indent => 4)
        else
            format_resource(resource, options)
            return 0
        end
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Template", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Template", :left, :size=>27 do |d|
                d["NAME"]
            end

            column :USER, "Username of the Template owner", :left,
                    :size=>15 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Template", :left, :size=>15 do |d|
                helper.group_name(d, options)
            end

            column :REGTIME, "Registration time of the Template",
                    :size=>15 do |d|
                OpenNebulaHelper.time_to_str(d["REGTIME"])
            end

            default :ID, :USER, :GROUP, :NAME, :REGTIME
        end

        table
    end

    INT_EXP = /^-?\d+$/
    FLOAT_EXP = /^-?\d+(\.\d+)?$/

    def self.get_user_inputs(template, keys = [])
        user_inputs = template['VMTEMPLATE']['TEMPLATE']['USER_INPUTS']

        return '' unless user_inputs

        answers = OpenNebulaHelper.parse_user_inputs(user_inputs, keys)
        answers_s = ''
        answers.each do |key, val|
            next unless val

            # Do not replace values that are equal to the ones already in the
            # template. Useful for cpu, mem, vcpu
            if key != template['VMTEMPLATE']['TEMPLATE'][key]
                answers_s << "#{key} = \""
                answers_s << val.gsub('"', "\\\"") << "\"\n"
            end
        end

        answers_s
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

    def format_resource(template, options = {})
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(
            str_h1 % "TEMPLATE #{template['ID']} INFORMATION")
        puts str % ["ID", template.id.to_s]
        puts str % ["NAME", template.name]
        puts str % ["USER", template['UNAME']]
        puts str % ["GROUP", template['GNAME']]
        puts str % ["LOCK", OpenNebulaHelper.level_lock_to_str(template['LOCK/LOCKED'])]
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
