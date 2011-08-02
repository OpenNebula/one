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

if ONE_LOCATION
    GROUP_DEFAULT=ONE_LOCATION+"/etc/group.default"
else
    GROUP_DEFAULT="/etc/one/group.default"
end

class OneGroupHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "GROUP"
    end

    def self.conf_file
        "onegroup.yaml"
    end

    def create_resource(options, &block)
        group = factory

        rc = block.call(group)
        if OpenNebula.is_error?(rc)
            return -1, rc.message
        else
            puts "ID: #{group.id.to_s}"
        end

        exit_code = 0

        puts "Creating default ACL rules from #{GROUP_DEFAULT}" if options[:verbose]
        File.open(GROUP_DEFAULT).each_line{ |l|
            next if l.match(/^#/)

            rule = "@#{group.id} #{l}"
            parse = OpenNebula::Acl.parse_rule(rule)
            if OpenNebula.is_error?(parse)
                puts "Error parsing rule #{rule}"
                puts "Error message" << parse.message
                exit_code = -1
                next
            end

            xml = OpenNebula::Acl.build_xml
            acl = OpenNebula::Acl.new(xml, @client)
            rc = acl.allocate(*parse)
            if OpenNebula.is_error?(rc)
                puts "Error creating rule #{rule}"
                puts "Error message" << rc.message
                exit_code = -1
                next
            else
                msg = "ACL_ID: #{acl.id.to_s}"
                msg << " RULE: #{rule.strip}" if options[:verbose]
                puts msg
            end
        }

        exit_code
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::Group.new_with_id(id, @client)
        else
            xml=OpenNebula::Group.build_xml
            OpenNebula::Group.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        #TBD OpenNebula::UserPool.new(@client, user_flag)
        OpenNebula::GroupPool.new(@client)
    end

    def format_resource(group)
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "GROUP #{group['ID']} INFORMATION")
        puts str % ["ID",   group.id.to_s]
        puts str % ["NAME", group.name]
        puts

        CLIHelper.print_header(str_h1 % "USERS", false)
        CLIHelper.print_header("%-15s %-20s" % ["ID","NAME"])
        group.user_ids.each do |uid|
            puts "%-15s %-20s" % [uid, self.uid_to_str(uid.to_s)]
        end
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Group", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Group", :left, :size=>15 do |d|
                d["NAME"]
            end

            default :ID, :NAME
        end

        table
    end
end
