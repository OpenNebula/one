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

class OneVirtualRouterHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "VROUTER"
    end

    def self.conf_file
        "onevrouter.yaml"
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
            column :ID, "ONE identifier for the Virtual Router", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Virtual Router", :left, :size=>27 do |d|
                d["NAME"]
            end

            column :USER, "Username of the Virtual Router owner", :left,
                    :size=>15 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Virtual Router", :left, :size=>15 do |d|
                helper.group_name(d, options)
            end

            default :ID, :USER, :GROUP, :NAME
        end

        table
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::VirtualRouter.new_with_id(id, @client)
        else
            xml=OpenNebula::VirtualRouter.build_xml
            OpenNebula::VirtualRouter.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::VirtualRouterPool.new(@client, user_flag)
    end

    def format_resource(obj, options = {})
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(
            str_h1 % "VIRTUAL ROUTER #{obj['ID']} INFORMATION")
        puts str % ["ID", obj.id.to_s]
        puts str % ["NAME", obj.name]
        puts str % ["USER", obj['UNAME']]
        puts str % ["GROUP", obj['GNAME']]
        puts

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if obj["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if obj["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if obj["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e,  mask]
        }

        if obj.has_elements?("/VROUTER/TEMPLATE/NIC")
            puts
            CLIHelper.print_header(str_h1 % "VIRTUAL ROUTER NICS",false)

            nic_default = {"NETWORK" => "-",
                           "IP" => "-"}

            shown_ips = []

            array_id = 0
            vm_nics = [obj.to_hash['VROUTER']['TEMPLATE']['NIC']].flatten.compact
            vm_nics.each {|nic|

                next if nic.has_key?("CLI_DONE")

                if nic.has_key?("IP6_LINK")
                    shown_ips << nic["IP6_LINK"]

                    ip6_link = {"IP"           => nic.delete("IP6_LINK"),
                                "CLI_DONE"     => true,
                                "DOUBLE_ENTRY" => true}
                    vm_nics.insert(array_id+1,ip6_link)

                    array_id += 1
                end

                if nic.has_key?("IP6_ULA")
                    shown_ips << nic["IP6_ULA"]

                    ip6_link = {"IP"           => nic.delete("IP6_ULA"),
                                "CLI_DONE"     => true,
                                "DOUBLE_ENTRY" => true}
                    vm_nics.insert(array_id+1,ip6_link)

                    array_id += 1
                end

                if nic.has_key?("IP6_GLOBAL")
                    shown_ips << nic["IP6_GLOBAL"]

                    ip6_link = {"IP"           => nic.delete("IP6_GLOBAL"),
                                "CLI_DONE"     => true,
                                "DOUBLE_ENTRY" => true}
                    vm_nics.insert(array_id+1,ip6_link)

                    array_id += 1
                end

                shown_ips << nic["IP"] if nic.has_key?("IP")

                nic.merge!(nic_default) {|k,v1,v2| v1}
                array_id += 1
            }

            CLIHelper::ShowTable.new(nil, self) do
                column :NETWORK, "", :left, :size=>20 do |d|
                    if d["DOUBLE_ENTRY"]
                        ""
                    else
                        d["NETWORK"]
                    end
                end

                column :IP, "",:left, :donottruncate, :size=>15 do |d|
                    d["IP"]
                end
            end.show(vm_nics,{})
        end

        while obj.has_elements?("/VROUTER/TEMPLATE/NIC")
            obj.delete_element("/VROUTER/TEMPLATE/NIC")
        end

        puts

        CLIHelper.print_header(str_h1 % "TEMPLATE CONTENTS",false)
        puts obj.template_str

        puts

        CLIHelper.print_header("%-15s" % "VIRTUAL MACHINES")
        obj.vm_ids.each do |id|
            puts "%-15s" % [id]
        end
    end
end
