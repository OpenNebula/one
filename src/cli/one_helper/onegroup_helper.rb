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

        puts "Creating default ACL rules: #{GROUP_DEFAULT_ACLS}" if options[:verbose]

        exit_code , msg = group.create_default_acls

        if OpenNebula.is_error?(exit_code)
            return -1, exit_code.message
        end

        exit_code.to_i
    end

    def create_complete_resource(group_hash)
        group = factory
        rc = group.create(group_hash)

        if OpenNebula.is_error?(rc)
            return -1, rc.message
        end

        puts "ID: #{group.id}"
        return 0
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            def pool_default_quotas(path)
                @data.dsearch('/GROUP_POOL/DEFAULT_GROUP_QUOTAS/'+path)
            end

            def quotas
                if !defined?(@quotas)
                    quotas = @data.dsearch('GROUP_POOL/QUOTAS')
                    @quotas = Hash.new

                    if (!quotas.nil?)
                        quotas = [quotas].flatten

                        quotas.each do |q|
                            @quotas[q['ID']] = q
                        end
                    end
                end
                @quotas
            end

            column :ID, "ONE identifier for the Group", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Group", :left, :size=>29 do |d|
                d["NAME"]
            end

            column :USERS, "Number of Users in this group", :size=>5 do |d|
                ids = d["USERS"]["ID"]

                case ids
                when String
                    "1"
                when Array
                    ids.size
                else
                    "0"
                end
            end

            column :VMS , "Number of VMS", :size=>9 do |d|
                begin
                    q = quotas[d['ID']]

                    if q['VM_QUOTA']['VM'].nil? && d["ID"].to_i != 0
                        q['VM_QUOTA']['VM'] = {
                            "VMS"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "VMS_USED"              => "0",
                            "CPU"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "CPU_USED"              => "0",
                            "MEMORY"                => OneQuotaHelper::LIMIT_DEFAULT,
                            "MEMORY_USED"           => "0",
                            "RUNNING_VMS"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_VMS_USED"      => "0",
                            "RUNNING_CPU"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_CPU_USED"      => "0",
                            "RUNNING_MEMORY"        => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_MEMORY_USED"   => "0",
                            "SYSTEM_DISK_SIZE"      => OneQuotaHelper::LIMIT_DEFAULT,
                            "SYSTEM_DISK_SIZE_USED" => "0"
                        }

                        quotas[d['ID']] = q
                    end

                    limit = q['VM_QUOTA']['VM']["VMS"]

                    if limit == OneQuotaHelper::LIMIT_DEFAULT
                        limit = pool_default_quotas("VM_QUOTA/VM/VMS")
                        limit = OneQuotaHelper::LIMIT_UNLIMITED if limit.nil? || limit == ""
                    end

                    if limit == OneQuotaHelper::LIMIT_UNLIMITED
                        "%3d /   -" % [q['VM_QUOTA']['VM']["VMS_USED"]]
                    else
                        "%3d / %3d" % [q['VM_QUOTA']['VM']["VMS_USED"], limit]
                    end

                rescue NoMethodError
                    "-"
                end
            end

            column :MEMORY, "Total memory allocated to user VMs", :size=>17 do |d|
                begin
                    q = quotas[d['ID']]

                    if q['VM_QUOTA']['VM'].nil? && d["ID"].to_i != 0
                        q['VM_QUOTA']['VM'] = {
                            "VMS"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "VMS_USED"              => "0",
                            "CPU"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "CPU_USED"              => "0",
                            "MEMORY"                => OneQuotaHelper::LIMIT_DEFAULT,
                            "MEMORY_USED"           => "0",
                            "RUNNING_VMS"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_VMS_USED"      => "0",
                            "RUNNING_CPU"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_CPU_USED"      => "0",
                            "RUNNING_MEMORY"        => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_MEMORY_USED"   => "0",
                            "SYSTEM_DISK_SIZE"      => OneQuotaHelper::LIMIT_DEFAULT,
                            "SYSTEM_DISK_SIZE_USED" => "0"
                        }

                        quotas[d['ID']] = q
                    end

                    limit = q['VM_QUOTA']['VM']["MEMORY"]

                    if limit == OneQuotaHelper::LIMIT_DEFAULT
                        limit = pool_default_quotas("VM_QUOTA/VM/MEMORY")
                        limit = OneQuotaHelper::LIMIT_UNLIMITED if limit.nil? || limit == ""
                    end

                    if limit == OneQuotaHelper::LIMIT_UNLIMITED
                        "%7s /       -" % [
                            OpenNebulaHelper.unit_to_str(q['VM_QUOTA']['VM']["MEMORY_USED"].to_i,{},"M")]
                    else
                        "%7s / %7s" % [
                            OpenNebulaHelper.unit_to_str(q['VM_QUOTA']['VM']["MEMORY_USED"].to_i,{},"M"),
                            OpenNebulaHelper.unit_to_str(limit.to_i,{},"M")]
                    end

                rescue NoMethodError
                    "-"
                end
            end

            column :CPU, "Total CPU allocated to user VMs", :size=>11 do |d|
                begin
                    q = quotas[d['ID']]

                    if q['VM_QUOTA']['VM'].nil? && d["ID"].to_i != 0
                        q['VM_QUOTA']['VM'] = {
                            "VMS"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "VMS_USED"              => "0",
                            "CPU"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "CPU_USED"              => "0",
                            "MEMORY"                => OneQuotaHelper::LIMIT_DEFAULT,
                            "MEMORY_USED"           => "0",
                            "RUNNING_VMS"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_VMS_USED"      => "0",
                            "RUNNING_CPU"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_CPU_USED"      => "0",
                            "RUNNING_MEMORY"        => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_MEMORY_USED"   => "0",
                            "SYSTEM_DISK_SIZE"      => OneQuotaHelper::LIMIT_DEFAULT,
                            "SYSTEM_DISK_SIZE_USED" => "0"
                        }

                        quotas[d['ID']] = q
                    end

                    limit = q['VM_QUOTA']['VM']["CPU"]

                    if limit == OneQuotaHelper::LIMIT_DEFAULT
                        limit = pool_default_quotas("VM_QUOTA/VM/CPU")
                        limit = OneQuotaHelper::LIMIT_UNLIMITED if limit.nil? || limit == ""
                    end

                    if limit == OneQuotaHelper::LIMIT_UNLIMITED
                        "%3.1f /    -" % [q['VM_QUOTA']['VM']["CPU_USED"]]
                    else
                        "%3.1f / %3.1f" % [q['VM_QUOTA']['VM']["CPU_USED"], limit]
                    end

                rescue NoMethodError
                    "-"
                end
            end

            default :ID, :NAME, :USERS, :VMS, :MEMORY, :CPU
        end

        table
    end

    # Parses a OpenNebula template string and turns it into a Hash
    # @param [String] tmpl_str template
    # @return [Hash, Zona::Error] Hash or Error
    def parse_template(tmpl_str)
        name_reg     =/[\w\d_-]+/
        variable_reg =/\s*(#{name_reg})\s*=\s*/
        single_variable_reg =/^#{variable_reg}([^\[]+?)(#.*)?$/

        tmpl                      = Hash.new
        tmpl['user']              = Hash.new

        tmpl_str.scan(single_variable_reg) do | m |
            key   = m[0].strip.downcase
            value = m[1].strip.gsub("\"","")
            case key
                when "admin_user_name"
                    tmpl['user']['name']=value
                when "admin_user_password"
                    tmpl['user']['password']=value
                when "admin_user_auth_driver"
                    tmpl['user']['auth_driver']=value
                else
                    tmpl[key] = value
            end
        end

        return tmpl
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

        CLIHelper.print_header(str_h1 % "GROUP TEMPLATE",false)
        puts group.template_str
        puts

        admin_ids = group.admin_ids

        CLIHelper::ShowTable.new(nil, self) do
            column :"USER ID", "", :right, :size=>7 do |d|
                d
            end

            column :"ADMIN", "", :left, :size=>5 do |d|
                if (group.admin_ids.include?(d))
                    "*"
                else
                    ""
                end
            end
        end.show(group.user_ids, {})

        group_hash = group.to_hash

        default_quotas = nil

        group.each('/GROUP/DEFAULT_GROUP_QUOTAS') { |elem|
            default_quotas = elem
        }

        helper = OneQuotaHelper.new(@client)
        helper.format_quota(group_hash['GROUP'], default_quotas, group.id)
    end
end
