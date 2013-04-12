# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
require 'one_helper/onequota_helper'

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

        puts "Creating default ACL rules from #{GROUP_DEFAULT}" if options[:verbose]

        exit_code , msg = group.create_acls

        puts msg 

        exit_code
    end

    def format_pool(options)
        config_file = self.class.table_conf

        prefix = '/GROUP_POOL/DEFAULT_GROUP_QUOTAS/'
        group_pool = @group_pool

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Group", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Group", :left, :size=>29 do |d|
                d["NAME"]
            end

            column :USERS, "Number of Users in this group", :size=>5 do |d|
                if d["USERS"]["ID"].nil?
                    "0"
                else
                    d["USERS"]["ID"].size
                end
            end

            column :VMS , "Number of VMS", :size=>9 do |d|             
                if d.has_key?('VM_QUOTA') and d['VM_QUOTA'].has_key?('VM')
                    limit = d['VM_QUOTA']['VM']["VMS"]

                    if limit == "-1"
                        limit = group_pool["#{prefix}VM_QUOTA/VM/VMS"]
                        limit = "0" if limit.nil? || limit == ""
                    end

                    "%3d / %3d" % [d['VM_QUOTA']['VM']["VMS_USED"], limit]
                else
                    "-"
                end
            end

            column :MEMORY, "Total memory allocated to user VMs", :size=>17 do |d|
                if d.has_key?('VM_QUOTA') and d['VM_QUOTA'].has_key?('VM')
                    limit = d['VM_QUOTA']['VM']["MEMORY"]

                    if limit == "-1"
                        limit = group_pool["#{prefix}VM_QUOTA/VM/MEMORY"]
                        limit = "0" if limit.nil? || limit == ""
                    end

                    d['VM_QUOTA']['VM']['MEMORY_USED']
                    "%7s / %7s" % [OpenNebulaHelper.unit_to_str(d['VM_QUOTA']['VM']["MEMORY_USED"].to_i,{},"M"),
                    OpenNebulaHelper.unit_to_str(limit.to_i,{},"M")]
                else
                    "-"
                end
            end

            column :CPU, "Total CPU allocated to user VMs", :size=>11 do |d|
                if d.has_key?('VM_QUOTA') and d['VM_QUOTA'].has_key?('VM')
                    limit = d['VM_QUOTA']['VM']["CPU"]

                    if limit == "-1"
                        limit = group_pool["#{prefix}VM_QUOTA/VM/CPU"]
                        limit = "0" if limit.nil? || limit == ""
                    end

                    "%3.1f / %3.0f" % [d['VM_QUOTA']['VM']["CPU_USED"], limit]
                else
                    "-"
                end
            end

            default :ID, :NAME, :USERS, :VMS, :MEMORY, :CPU
        end

        table
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
        @group_pool = OpenNebula::GroupPool.new(@client)
        return @group_pool
    end

    def format_resource(group, options = {})
        system = System.new(@client)

        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "GROUP #{group['ID']} INFORMATION")
        puts str % ["ID",   group.id.to_s]
        puts str % ["NAME", group.name]
        puts

        CLIHelper.print_header(str_h1 % "USERS", false)
        CLIHelper.print_header("%-15s" % ["ID"])
        group.user_ids.each do |uid|
            puts "%-15s" % [uid]
        end

        group_hash = group.to_hash

        default_quotas = nil

        group.each('/GROUP/DEFAULT_GROUP_QUOTAS') { |elem|
            default_quotas = elem
        }

        helper = OneQuotaHelper.new
        helper.format_quota(group_hash['GROUP'], default_quotas)
    end
end
