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
require 'one_helper/onetemplate_helper'
require 'base64'

class OneVNTemplateHelper < OneTemplateHelper
    VN_NAME={
        :name  => "name",
        :large => "--name name",
        :format => String,
        :description =>  <<-EOT.strip
Name of the new VN TEMPLATE. When instantiating
                               multiple VNs you can use the \"%i\" wildcard to produce
                               different names such as vm-0, vm-1...
EOT
    }

    MULTIPLE={
        :name  => "multiple",
        :short => "-m x",
        :large => "--multiple x",
        :format => Integer,
        :description => "Instance multiple VNs"
    }

    EXTENDED={
        :name => "extended",
        :large => "--extended",
        :description => "Process the template and included extended "+
                        "information"
    }

    def self.rname
        "VNTEMPLATE"
    end

    def self.conf_file
        "onevntemplate.yaml"
    end

    INT_EXP = /^-?\d+$/
    FLOAT_EXP = /^-?\d+(\.\d+)?$/

    private

    def factory(id=nil)
        if id
            OpenNebula::VNTemplate.new_with_id(id, @client)
        else
            xml=OpenNebula::VNTemplate.build_xml
            OpenNebula::VNTemplate.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::VNTemplatePool.new(@client, user_flag)
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
