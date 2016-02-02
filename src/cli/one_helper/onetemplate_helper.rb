# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

    def self.get_user_inputs(template)
        user_inputs = template['VMTEMPLATE']['TEMPLATE']['USER_INPUTS']

        return "" if !user_inputs

        answers = ""

        puts "There are some parameters that require user input. Use the string <<EDITOR>> to launch an editor (e.g. for multi-line inputs)"

        user_inputs.each do |key, val|
            input_cfg = val.split('|')

            if input_cfg.length != 3
                STDERR.puts "Malformed user input. It should have 3 parts separated by '|':"
                STDERR.puts "  #{key}: #{val}"
                exit(-1)
            end

            optional, type, description = input_cfg
            optional.strip!
            type.strip!
            description.strip!

            print "  * (#{key}) #{description}: "

            case type
            when 'text', 'text64'
                answer = STDIN.readline.chop

                if answer == "<<EDITOR>>"
                    answer = OpenNebulaHelper.editor_input()
                end

                if type == 'text64'
                    answer = Base64::encode64(answer).strip.delete("\n")
                end
            when 'password'
                answer = OpenNebulaHelper::OneHelper.get_password
            else
                STDERR.puts "user input types can only be text or password:"
                STDERR.puts "  #{key}: #{val}"
                exit(-1)
            end
            answers << "#{key} = \""
            answers << answer.gsub('"', "\\\"") << "\"\n"
        end

        answers
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
