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

class OneVMHelper < OpenNebulaHelper::OneHelper
    TABLE_CONF_FILE="#{OpenNebulaHelper::TABLE_CONF_PATH}/onevm.yaml"

    def create_resource(template_file, options)
        template=File.read(template_file)
        super(template, options)
    end

    def self.rname
        "VM"
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::VirtualMachine.new_with_id(id, @client)
        else
            xml=OpenNebula::VirtualMachine.build_xml
            OpenNebula::VirtualMachine.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::VirtualMachinePool.new(@client, user_flag)
    end

    def format_resource(vm)
        str_h1="%-80s"
        str="%-20s: %-20s"

        CLIHelper.print_header(str_h1 % "VIRTUAL MACHINE #{vm['ID']} INFORMATION")
        puts str % ["ID", vm.id.to_s]
        puts str % ["NAME", vm.name]
        puts str % ["STATE", vm.state_str]
        puts str % ["LCM_STATE", vm.lcm_state_str]
        puts str % ["START TIME", OpenNebulaHelper.time_to_str(vm['STIME'])]
        puts str % ["END TIME", OpenNebulaHelper.time_to_str(vm['ETIME'])]
        value=vm['DEPLOY_ID']
        puts str % ["DEPLOY ID:", value=="" ? "-" : value]
        puts

        CLIHelper.print_header(str_h1 % "VIRTUAL MACHINE MONITORING",false)
        poll_attrs = {
            "USED MEMORY" => "MEMORY",
            "USED CPU" => "CPU",
            "NET_TX" => "NET_TX",
            "NET_RX" => "NET_RX"
        }
        poll_attrs.each { |k,v| puts str % [k,vm[v]] }
        puts

        CLIHelper.print_header(str_h1 % "VIRTUAL MACHINE TEMPLATE",false)
        puts vm.template_str
    end

    def format_pool(pool, options, top=false)
        table=CLIHelper::ShowTable.new(TABLE_CONF_FILE, self) do
            column :ID, "ONE identifier for Virtual Machine", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Virtual Machine", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :USER, "Username of the Virtual Machine owner", :left, :size=>8 do |d|
                helper.uid_to_str(d["UID"], options)
            end

            column :GROUP, "Group of the Virtual Machine", :left, :size=>8 do |d|
                helper.uid_to_str(d["GID"], options)
            end

            column :STAT, "Actual status", :size=>4 do |d,e|
                d.status
            end

            column :CPU, "CPU percentage used by the VM", :size=>3 do |d|
                d["CPU"]
            end

            column :MEM, "Memory used by the VM", :size=>7 do |d|
                OpenNebulaHelper.unit_to_str(d["MEMORY"].to_i, options)
            end

            column :HOSTNAME, "Host where the VM is running", :size=>15 do |d|
                d["HISTORY/HOSTNAME"]
            end

            column :TIME, "Time since the VM was submitted", :size=>11 do |d|
                stime = Time.at(d["STIME"].to_i)
                etime = d["ETIME"]=="0" ? Time.now : Time.at(d["ETIME"].to_i)
                dtime = Time.at(etime-stime).getgm
                "%02d %02d:%02d:%02d" % [dtime.yday-1, dtime.hour, dtime.min, dtime.sec]
            end

            default :ID, :USER, :GROUP, :NAME, :STAT, :CPU, :MEM, :HOSTNAME, :TIME
        end

        if top
            table.top(pool, options)
        else
            table.show(pool, options)
        end
    end
end