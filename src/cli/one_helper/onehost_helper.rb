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
require 'one_helper/onevm_helper'

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

            column :NAME, "Name of the Host", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :CLUSTER, "Name of the Cluster", :left, :size=>9 do |d|
                OpenNebulaHelper.cluster_str(d["CLUSTER"])
            end

            column :RVM, "Number of Virtual Machines running", :size=>3 do |d|
                d["HOST_SHARE"]["RUNNING_VMS"]
            end

            column :TCPU, "Total CPU percentage", :size=>4 do |d|
                d["HOST_SHARE"]["MAX_CPU"]
            end

            column :FCPU, "Free CPU percentage", :size=>4 do |d|
                d["HOST_SHARE"]["MAX_CPU"].to_i-
                    d["HOST_SHARE"]["USED_CPU"].to_i
            end

            column :ACPU, "Available cpu percentage (not reserved by VMs)",
                    :size=>4 do |d|
                max_cpu=d["HOST_SHARE"]["MAX_CPU"].to_i
                max_cpu=100 if max_cpu==0
                max_cpu-d["HOST_SHARE"]["CPU_USAGE"].to_i
            end

            column :TMEM, "Total Memory", :size=>7 do |d|
                OpenNebulaHelper.unit_to_str(
                    d["HOST_SHARE"]["MAX_MEM"].to_i,
                    options)
            end

            column :FMEM, "Free Memory", :size=>7 do |d|
                OpenNebulaHelper.unit_to_str(
                    d["HOST_SHARE"]["FREE_MEM"].to_i,
                    options)
            end

            column :AMEM, "Available Memory (not reserved by VMs)",
                    :size=>7 do |d|
                acpu=d["HOST_SHARE"]["MAX_MEM"].to_i-
                    d["HOST_SHARE"]["MEM_USAGE"].to_i
                OpenNebulaHelper.unit_to_str(acpu,options)
            end

            column :REAL_CPU, "Real CPU", :size=>18 do |d|
                max_cpu  = d["HOST_SHARE"]["MAX_CPU"].to_i

                if max_cpu != 0
                    used_cpu = d["HOST_SHARE"]["USED_CPU"].to_i
                    ratio    = (used_cpu*100) / max_cpu
                    "#{used_cpu} / #{max_cpu} (#{ratio}%)"
                else
                    '-'
                end
            end

            column :ALLOCATED_CPU, "Allocated CPU)", :size=>18 do |d|
                max_cpu  = d["HOST_SHARE"]["MAX_CPU"].to_i
                cpu_usage = d["HOST_SHARE"]["CPU_USAGE"].to_i

                if max_cpu == 0 && cpu_usage == 0
                    '-'
                else
                    cpu_usage = d["HOST_SHARE"]["CPU_USAGE"].to_i

                    if max_cpu != 0
                        ratio    = (cpu_usage*100) / max_cpu
                        "#{cpu_usage} / #{max_cpu} (#{ratio}%)"
                    else
                        "#{cpu_usage} / -"
                    end                    
                end
            end

            column :REAL_MEM, "Real MEM", :size=>18 do |d|
                max_mem  = d["HOST_SHARE"]["MAX_MEM"].to_i

                if max_mem != 0
                    used_mem = d["HOST_SHARE"]["USED_MEM"].to_i
                    ratio    = (used_mem*100) / max_mem
                    "#{OpenNebulaHelper.unit_to_str(used_mem,options)} / #{OpenNebulaHelper.unit_to_str(max_mem,options)} (#{ratio}%)"
                else
                    '-'
                end
            end

            column :ALLOCATED_MEM, "Allocated MEM", :size=>18 do |d|
                max_mem  = d["HOST_SHARE"]["MAX_MEM"].to_i
                mem_usage = d["HOST_SHARE"]["MEM_USAGE"].to_i

                if max_mem == 0 && mem_usage == 0
                    '-'
                else
                    if max_mem != 0
                        ratio    = (mem_usage*100) / max_mem
                        "#{OpenNebulaHelper.unit_to_str(mem_usage,options)} / #{OpenNebulaHelper.unit_to_str(max_mem,options)} (#{ratio}%)"
                    else
                        "#{OpenNebulaHelper.unit_to_str(mem_usage,options)} / -"
                    end
                end
            end

            column :STAT, "Host status", :left, :size=>6 do |d|
                OneHostHelper.state_to_str(d["STATE"])
            end

            default :ID, :NAME, :CLUSTER, :RVM, :ALLOCATED_CPU, :ALLOCATED_MEM, :STAT
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

    def format_resource(host, options = {})
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
        puts str % ["LAST MONITORING TIME", OpenNebulaHelper.time_to_str(host['LAST_MON_TIME'])]
        puts

        CLIHelper.print_header(str_h1 % "HOST SHARES", false)

        puts str % ["TOTAL MEM", OpenNebulaHelper.unit_to_str(host['HOST_SHARE/MAX_MEM'].to_i, {})]
        puts str % ["USED MEM (REAL)", OpenNebulaHelper.unit_to_str(host['HOST_SHARE/USED_MEM'].to_i, {})]
        puts str % ["USED MEM (ALLOCATED)", OpenNebulaHelper.unit_to_str(host['HOST_SHARE/MEM_USAGE'].to_i, {})]
        puts str % ["TOTAL CPU", host['HOST_SHARE/MAX_CPU']]
        puts str % ["USED CPU (REAL)", host['HOST_SHARE/USED_CPU']]
        puts str % ["USED CPU (ALLOCATED)", host['HOST_SHARE/CPU_USAGE']]
        puts str % ["RUNNING VMS", host['HOST_SHARE/RUNNING_VMS']]
        puts

        CLIHelper.print_header(str_h1 % "MONITORING INFORMATION", false)

        puts host.template_str

        puts
        CLIHelper.print_header("VIRTUAL MACHINES", false)
        puts

        onevm_helper=OneVMHelper.new
        onevm_helper.client=@client
        onevm_helper.list_pool({:filter=>["HOST=#{host.name}"]}, false)
    end
end
