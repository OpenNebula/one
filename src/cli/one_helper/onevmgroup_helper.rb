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

class OneVMGroupHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "VM_GROUP"
    end

    def self.conf_file
        "onevmgroup.yaml"
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the VM Group", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the VM Group", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :USER, "Username of the VM Group owner", :left,
                    :size=>8 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the VM Group", :left, :size=>8 do |d|
                helper.group_name(d, options)
            end

            column :VMS, "Number of VMs in the VM Group", :left, :size=>4 do |d|
                vms   = 0

                if !d["ROLES"]["ROLE"].nil?
	        	roles = [d["ROLES"]["ROLE"]].flatten
                    roles.each { |r|
                        vms += r["VMS"].split(',').size if !r["VMS"].nil?
                    }
                end

                vms
            end

            column :ROLES, "Roles in the VM Group", :left, :size=>36 do |d|
                begin
                    roles = [d["ROLES"]["ROLE"]].flatten
                    roles_names = ""

                    if !roles.nil?
                        rnames = roles.collect { |i| i["NAME"] }
                        roles_names = rnames.join(", ") if !rnames.empty?
                    end

                    roles_names
                rescue
                    "-"
                end
            end

            default :ID, :USER, :GROUP, :NAME, :VMS, :ROLES
        end

        table
    end

    def retrieve_role_id(vmg_id, id)
        return [0, id.to_i] if id =~ /\A\d+\z/

        puts vmg_id
        vmg = retrieve_resource(vmg_id)
        vmg.info

        ids = vmg.retrieve_elements("ROLES/ROLE[NAME='#{id}']/ID")

        return [-1, "#{id} not found or duplicated"] \
                if ids.nil? || ids.size > 1

        [0, ids[0].to_i]
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::VMGroup.new_with_id(id, @client)
        else
            xml=OpenNebula::VMGroup.build_xml
            OpenNebula::VMGroup.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::VMGroupPool.new(@client, user_flag)
    end

    def format_resource(vmgroup, options = {})
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(
            str_h1 % "VM GROUP #{vmgroup['ID']} INFORMATION")
        puts str % ["ID", vmgroup.id.to_s]
        puts str % ["NAME", vmgroup.name]
        puts str % ["USER", vmgroup['UNAME']]
        puts str % ["GROUP", vmgroup['GNAME']]
        puts str % ["LOCK", OpenNebulaHelper.level_lock_to_str(vmgroup['LOCK/LOCKED'])]

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        puts

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if vmgroup["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if vmgroup["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if vmgroup["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e,  mask]
        }

        puts

        CLIHelper.print_header(str_h1 % "ROLES", false)

        if !vmgroup.to_hash['VM_GROUP']['ROLES']['ROLE'].nil?
            roles = [vmgroup.to_hash['VM_GROUP']['ROLES']['ROLE']].flatten
        end

        CLIHelper::ShowTable.new(nil, self) do
            column :ID, "", :left, :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "", :left, :size=>8 do |d|
                d["NAME"]
            end

            column :POLICY, "", :left, :size=>12 do |d|
                if d["POLICY"].nil?
                    '-'
                else
                    d["POLICY"]
                end
            end

            column :AFFINED_HOSTS, "", :left, :size=>18 do |d|
                if d["HOST_AFFINED"].nil?
                    '-'
                else
                    d["HOST_AFFINED"]
                end
            end

            column :ANTI_AFFINED_HOST, "", :left, :size=>18 do |d|
                if d["HOST_ANTI_AFFINED"].nil?
                    '-'
                else
                    d["HOST_ANTI_AFFINED"]
                end
            end

            column :VIRTUAL_MACHINES, "", :left, :size=>20 do |d|
                d["VMS"]
            end
        end.show(roles, {})

        puts

        CLIHelper.print_header(str_h1 % "TEMPLATE CONTENTS",false)
        puts vmgroup.template_str
    end
end
