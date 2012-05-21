# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

class OneHostHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "HOST"
    end

    def self.conf_file
        "onehost.yaml"
    end

    def self.state_to_str(id)
        id        = id.to_i
        state_str = Host::HOST_STATES[id]
        
        return Host::SHORT_HOST_STATES[state_str]
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for Host", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Host", :left, :size=>12 do |d|
                d["NAME"]
            end

            column :CLUSTER, "Name of the Cluster", :left, :size=>8 do |d|
                OpenNebulaHelper.cluster_str(d["CLUSTER"])
            end

            column :RVM, "Number of Virtual Machines running", :size=>6 do |d|
                d["HOST_SHARE"]["RUNNING_VMS"]
            end

            column :TCPU, "Total CPU percentage", :size=>6 do |d|
                d["HOST_SHARE"]["MAX_CPU"]
            end

            column :FCPU, "Free CPU percentage", :size=>6 do |d|
                d["HOST_SHARE"]["MAX_CPU"].to_i-
                    d["HOST_SHARE"]["USED_CPU"].to_i
            end

            column :ACPU, "Available cpu percentage (not reserved by VMs)",
                    :size=>6 do |d|
                max_cpu=d["HOST_SHARE"]["MAX_CPU"].to_i
                max_cpu=100 if max_cpu==0
                max_cpu-d["HOST_SHARE"]["CPU_USAGE"].to_i
            end

            column :TMEM, "Total Memory", :size=>6 do |d|
                OpenNebulaHelper.unit_to_str(
                    d["HOST_SHARE"]["MAX_MEM"].to_i,
                    options)
            end

            column :FMEM, "Free Memory", :size=>6 do |d|
                OpenNebulaHelper.unit_to_str(
                    d["HOST_SHARE"]["FREE_MEM"].to_i,
                    options)
            end

            column :AMEM, "Available Memory (not reserved by VMs)",
                    :size=>6 do |d|
                acpu=d["HOST_SHARE"]["MAX_MEM"].to_i-
                    d["HOST_SHARE"]["MEM_USAGE"].to_i
                OpenNebulaHelper.unit_to_str(acpu,options)
            end

            column :STAT, "Host status", :size=>7 do |d|
                OneHostHelper.state_to_str(d["STATE"])
            end

            default :ID, :NAME, :CLUSTER, :RVM, :TCPU, :FCPU, :ACPU, :TMEM, :FMEM,
                :AMEM, :STAT
        end

        table
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::Host.new_with_id(id, @client)
        else
            xml=OpenNebula::Host.build_xml
            OpenNebula::Host.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        #TBD OpenNebula::HostPool.new(@client, user_flag)
        OpenNebula::HostPool.new(@client)
    end

    def format_resource(host)
        str    = "%-22s: %-20s"
        str_h1 = "%-80s"

        CLIHelper.print_header(
            str_h1 % "HOST #{host.id.to_s} INFORMATION", true)

        puts str % ["ID", host.id.to_s]
        puts str % ["NAME", host.name]
        puts str % ["CLUSTER", OpenNebulaHelper.cluster_str(host['CLUSTER'])]
        puts str % ["STATE", host.state_str]
        puts str % ["IM_MAD", host['IM_MAD']]
        puts str % ["VM_MAD", host['VM_MAD']]
        puts str % ["VN_MAD", host['VN_MAD']]
        puts str % ["LAST MONITORING TIME", host['LAST_MON_TIME']]
        puts

        CLIHelper.print_header(str_h1 % "HOST SHARES", false)

        puts str % ["MAX MEM", host['HOST_SHARE/MAX_MEM']]
        puts str % ["USED MEM (REAL)", host['HOST_SHARE/USED_MEM']]
        puts str % ["USED MEM (ALLOCATED)", host['HOST_SHARE/MEM_USAGE']]
        puts str % ["MAX CPU", host['HOST_SHARE/MAX_CPU']]
        puts str % ["USED CPU (REAL)", host['HOST_SHARE/USED_CPU']]
        puts str % ["USED CPU (ALLOCATED)", host['HOST_SHARE/CPU_USAGE']]
        puts str % ["MAX DISK", host['HOST_SHARE/MAX_DISK']]
        puts str % ["USED DISK (REAL)", host['HOST_SHARE/USED_DISK']]
        puts str % ["USED DISK (ALLOCATED)", host['HOST_SHARE/DISK_USAGE']]
        puts str % ["RUNNING VMS", host['HOST_SHARE/RUNNING_VMS']]
        puts

        CLIHelper.print_header(str_h1 % "MONITORING INFORMATION", false)

        puts host.template_str
    end
end
