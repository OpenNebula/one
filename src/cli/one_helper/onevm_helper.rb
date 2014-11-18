# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
require 'optparse/time'

class OneVMHelper < OpenNebulaHelper::OneHelper
    MULTIPLE={
        :name  => "multiple",
        :short => "-m x",
        :large => "--multiple x",
        :format => Integer,
        :description => "Instance multiple VMs"
    }

    IMAGE = {
        :name   => "image",
        :short  => "-i id|name",
        :large  => "--image id|name" ,
        :description => "Selects the image",
        :format => String,
        :proc   => lambda { |o, options|
            OpenNebulaHelper.rname_to_id(o, "IMAGE")
        }
    }

    NETWORK = {
        :name   => "network",
        :short  => "-n id|name",
        :large  => "--network id|name" ,
        :description => "Selects the virtual network",
        :format => String,
        :proc   => lambda { |o, options|
            OpenNebulaHelper.rname_to_id(o, "VNET")
        }
    }

    FILE = {
        :name   => "file",
        :short  => "-f file",
        :large  => "--file file" ,
        :description => "Selects the template file",
        :format => String,
        :proc   => lambda { |o, options|
            if File.file?(o)
                options[:file] = o
            else
                exit -1
            end
        }
    }

    HOLD = {
        :name  => "hold",
        :large => "--hold",
        :description => "Creates the new VM on hold state instead of pending"
    }

    SCHEDULE = {
        :name       => "schedule",
        :large      => "--schedule TIME",
        :description => "Schedules this action to be executed after" \
        "the given time. For example: onevm resume 0 --schedule \"09/23 14:15\"",
        :format     => Time
    }

    ALL_TEMPLATE = {
        :name       => "all",
        :large      => "--all",
        :description => "Show all template data"
    }

    LIVE = {
        :name        => "live",
        :large       => "--live",
        :description => "Do the action with the VM running"
    }

    HARD = {
        :name       => "hard",
        :large      => "--hard",
        :description=> "Does not communicate with the guest OS"
    }

    RECREATE = {
        :name       => "recreate",
        :large      => "--recreate",
        :description=> "Resubmits a fresh VM"
    }

    def self.rname
        "VM"
    end

    def self.conf_file
        "onevm.yaml"
    end

    def self.state_to_str(id, lcm_id)
        id = id.to_i
        state_str = VirtualMachine::VM_STATE[id]
        short_state_str = VirtualMachine::SHORT_VM_STATES[state_str]

        if short_state_str=="actv"
            lcm_id = lcm_id.to_i
            lcm_state_str = VirtualMachine::LCM_STATE[lcm_id]
            return VirtualMachine::SHORT_LCM_STATES[lcm_state_str]
        end

        return short_state_str
    end

    def format_pool(options)
        config_file = self.class.table_conf

        # Get cluster names to use later in list
        cluster_pool = OpenNebula::ClusterPool.new(@client)
        rc = cluster_pool.info

        cluster_names = {}
        cluster_names["-1"] = "default"

        if !OpenNebula.is_error?(rc)
            cluster_pool.each do |c|
                cluster_names[c["ID"]] = c["NAME"]
            end
        end

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for Virtual Machine", :size=>6 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Virtual Machine", :left,
                    :size=>15 do |d|
                if d["RESCHED"] == "1"
                    "*#{d["NAME"]}"
                else
                    d["NAME"]
                end
            end

            column :USER, "Username of the Virtual Machine owner", :left,
                    :size=>8 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Virtual Machine", :left,
                    :size=>8 do |d|
                helper.group_name(d, options)
            end

            column :STAT, "Actual status", :size=>4 do |d,e|
                OneVMHelper.state_to_str(d["STATE"], d["LCM_STATE"])
            end

            column :UCPU, "CPU percentage used by the VM", :size=>4 do |d|
                d["CPU"]
            end

            column :UMEM, "Memory used by the VM", :size=>7 do |d|
                OpenNebulaHelper.unit_to_str(d["MEMORY"].to_i, options)
            end

            column :HOST, "Host where the VM is running", :left, :size=>10 do |d|
                if d['HISTORY_RECORDS'] && d['HISTORY_RECORDS']['HISTORY']
                    state_str = VirtualMachine::VM_STATE[d['STATE'].to_i]
                    if %w{ACTIVE SUSPENDED POWEROFF}.include? state_str
                        d['HISTORY_RECORDS']['HISTORY']['HOSTNAME']
                    end
                end
            end

            column :CLUSTER, "Cluster where the VM is running", :left,
                    :size=> 10 do |d|
                if d["HISTORY_RECORDS"]["HISTORY"]
                    history = [d["HISTORY_RECORDS"]["HISTORY"]].flatten
                    cluster_id = history.last["CID"]
                    cluster = cluster_names[cluster_id]

                    if !cluster
                        cluster_id
                    else
                        cluster
                    end
                else
                    "NONE"
                end
            end

            column :TIME, "Time since the VM was submitted", :size=>10 do |d|
                stime = d["STIME"].to_i
                etime = d["ETIME"]=="0" ? Time.now.to_i : d["ETIME"].to_i
                dtime = etime-stime
                OpenNebulaHelper.period_to_str(dtime, false)
            end

            default :ID, :USER, :GROUP, :NAME, :STAT, :UCPU, :UMEM, :HOST,
                :TIME
        end

        table
    end


    def schedule_actions(ids,options,action)
        # Verbose by default
        options[:verbose] = true

        perform_actions(
            ids, options,
            "#{action} scheduled at #{options[:schedule]}") do |vm|

            rc = vm.info

            if OpenNebula.is_error?(rc)
                puts rc.message
                exit -1
            end

            ids = vm.retrieve_elements('USER_TEMPLATE/SCHED_ACTION/ID')

            id = 0
            if (!ids.nil? && !ids.empty?)
                ids.map! {|e| e.to_i }
                id = ids.max + 1
            end

            tmp_str = vm.user_template_str

            tmp_str << "\nSCHED_ACTION = [ID = #{id}, ACTION = #{action}, TIME = #{options[:schedule].to_i}]"

            vm.update(tmp_str)
        end
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

    def format_resource(vm, options = {})
        str_h1="%-80s"
        str="%-20s: %-20s"

        cluster = nil

        if %w{ACTIVE SUSPENDED POWEROFF}.include? vm.state_str
            cluster_id = vm['/VM/HISTORY_RECORDS/HISTORY[last()]/CID']
        else
            cluster_id = nil
        end

        if cluster_id
            if cluster_id == "-1"
                cluster = "default"
            else
                clu = OpenNebula::Cluster.new(OpenNebula::Cluster.build_xml(cluster_id), @client)
                rc = clu.info
                if OpenNebula.is_error?(rc)
                    cluster = "ERROR"
                else
                    cluster = clu["NAME"]
                end
            end
        end

        CLIHelper.print_header(
            str_h1 % "VIRTUAL MACHINE #{vm['ID']} INFORMATION")
        puts str % ["ID", vm.id.to_s]
        puts str % ["NAME", vm.name]
        puts str % ["USER", vm['UNAME']]
        puts str % ["GROUP", vm['GNAME']]
        puts str % ["STATE", vm.state_str]
        puts str % ["LCM_STATE", vm.lcm_state_str]
        puts str % ["RESCHED", OpenNebulaHelper.boolean_to_str(vm['RESCHED'])]
        puts str % ["HOST",
            vm['/VM/HISTORY_RECORDS/HISTORY[last()]/HOSTNAME']] if
                %w{ACTIVE SUSPENDED POWEROFF}.include? vm.state_str
        puts str % ["CLUSTER ID", cluster_id ] if cluster_id
        puts str % ["CLUSTER", cluster ] if cluster
        puts str % ["START TIME",
            OpenNebulaHelper.time_to_str(vm['/VM/STIME'])]
        puts str % ["END TIME",
            OpenNebulaHelper.time_to_str(vm['/VM/ETIME'])]
        value=vm['DEPLOY_ID']
        puts str % ["DEPLOY ID", value=="" ? "-" : value]

        puts

        CLIHelper.print_header(str_h1 % "VIRTUAL MACHINE MONITORING",false)
        poll_attrs = {
            "USED MEMORY" => "MEMORY",
            "USED CPU" => "CPU",
            "NET_TX" => "NET_TX",
            "NET_RX" => "NET_RX"
        }

        poll_attrs.each { |k,v|
            if k == "USED CPU"
                puts str % [k,vm[v]]
            elsif k == "USED MEMORY"
                puts str % [k, OpenNebulaHelper.unit_to_str(vm[v].to_i, {})]
            else
                puts str % [k, OpenNebulaHelper.unit_to_str(vm[v].to_i/1024, {})]
            end
        }
        puts

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if vm["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if vm["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if vm["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e,  mask]
        }

        if vm.has_elements?("/VM/TEMPLATE/DISK")
            puts
            CLIHelper.print_header(str_h1 % "VM DISKS",false)
            CLIHelper::ShowTable.new(nil, self) do
                column :ID, "", :size=>3 do |d|
                    d["DISK_ID"]
                end

                column :DATASTORE, "", :left, :size=>10 do |d|
                    d["DATASTORE"]
                end

                column :TARGET, "", :left, :size=>6 do |d|
                    d["TARGET"]
                end

                column :IMAGE, "", :left, :size=>35 do |d|
                    if d["IMAGE"]
                        d["IMAGE"]
                    else
                        case d["TYPE"].upcase
                        when "FS"
                            "#{d["FORMAT"]} - "<<
                            OpenNebulaHelper.unit_to_str(d["SIZE"].to_i,
                                                         {}, "M")
                        when "SWAP"
                            OpenNebulaHelper.unit_to_str(d["SIZE"].to_i,
                                                         {}, "M")

                        end
                    end
                end

                column :TYPE, "", :left, :size=>4 do |d|
                    d["TYPE"].downcase
                end

                column :"R/O", "", :size=>3 do |d|
                    d["READONLY"]
                end

                column :"SAVE", "", :size=>4 do |d|
                    d["SAVE"] || "NO"
                end

                column :"CLONE", "", :size=>5 do |d|
                    d["CLONE"]
                end

                column :"SAVE_AS", "", :size=>7 do |d|
                    d["SAVE_AS"] || "-"
                end


                default :ID, :TARGET, :IMAGE, :TYPE,
                    :SAVE, :SAVE_AS
            end.show([vm.to_hash['VM']['TEMPLATE']['DISK']].flatten, {})

            while vm.has_elements?("/VM/TEMPLATE/DISK")
                vm.delete_element("/VM/TEMPLATE/DISK")
            end if !options[:all]
        end

        if vm.has_elements?("/VM/USER_TEMPLATE/HYPERVISOR")
            vm_information = vm.to_hash['VM']
            hybridvisor    = vm_information['USER_TEMPLATE']['HYPERVISOR'].to_s
            isHybrid       = %w{vcenter ec2 azure softlayer}.include? hybridvisor

            if isHybrid
                vm_tmplt = vm_information['TEMPLATE']
                nic =   {"NETWORK" => "-",
                           "IP" => "-",
                           "MAC"=> "-",
                           "VLAN"=>"no",
                           "BRIDGE"=>"-"}

                case hybridvisor
                    when "vcenter"
                        nic["IP"] = vm_tmplt['GUEST_IP'] if vm_tmplt['GUEST_IP']
                    when "ec2"
                        nic["IP"] = vm_tmplt['IP_ADDRESS'] if vm_tmplt['IP_ADDRESS']
                    when "azure"
                        nic["IP"]P = vm_tmplt['IPADDRESS'] if vm_tmplt['IPADDRESS']
                    when "softlayer"
                        nic["IP"] = vm_tmplt['PRIMARYIPADDRESS'] if vm_tmplt['PRIMARYIPADDRESS']
                    else
                        isHybrid = false
                end

                vm_nics = [nic]
            end
        end

        if vm.has_elements?("/VM/TEMPLATE/NIC") || vm_nics
            puts
            CLIHelper.print_header(str_h1 % "VM NICS",false)

            vm_nics = [vm.to_hash['VM']['TEMPLATE']['NIC']].flatten if !vm_nics

            nic_default = {"NETWORK" => "-",
                           "IP" => "-",
                           "MAC"=> "-",
                           "VLAN"=>"no",
                           "BRIDGE"=>"-"}

            array_id = 0

            vm_nics.each {|nic|

                next if nic.has_key?("CLI_DONE")

                if nic.has_key?("IP6_LINK")
                    ip6_link = {"IP"           => nic.delete("IP6_LINK"),
                                "CLI_DONE"     => true,
                                "DOUBLE_ENTRY" => true}
                    vm_nics.insert(array_id+1,ip6_link)

                    array_id += 1
                end

                if nic.has_key?("IP6_ULA")
                    ip6_link = {"IP"           => nic.delete("IP6_ULA"),
                                "CLI_DONE"     => true,
                                "DOUBLE_ENTRY" => true}
                    vm_nics.insert(array_id+1,ip6_link)

                    array_id += 1
                end

                if nic.has_key?("IP6_GLOBAL")
                    ip6_link = {"IP"           => nic.delete("IP6_GLOBAL"),
                                "CLI_DONE"     => true,
                                "DOUBLE_ENTRY" => true}
                    vm_nics.insert(array_id+1,ip6_link)

                    array_id += 1
                end

                nic.merge!(nic_default) {|k,v1,v2| v1}
                array_id += 1
            }

            CLIHelper::ShowTable.new(nil, self) do
                column :ID, "", :size=>3 do |d|
                    if d["DOUBLE_ENTRY"]
                        ""
                    else
                        d["NIC_ID"]
                    end
                end

                column :NETWORK, "", :left, :size=>20 do |d|
                    if d["DOUBLE_ENTRY"]
                        ""
                    else
                        d["NETWORK"]
                    end
                end

                column :VLAN, "", :size=>4 do |d|
                    if d["DOUBLE_ENTRY"]
                        ""
                    else
                        d["VLAN"].downcase
                    end
                end

                column :BRIDGE, "", :left, :size=>12 do |d|
                    if d["DOUBLE_ENTRY"]
                        ""
                    else
                        d["BRIDGE"]
                    end
                end

                column :IP, "",:left, :donottruncate, :size=>15 do |d|
                    d["IP"]
                end

                column :MAC, "", :left, :size=>17 do |d|
                    if d["DOUBLE_ENTRY"]
                        ""
                    else
                        d["MAC"]
                    end
                end

            end.show(vm_nics,{})

            while vm.has_elements?("/VM/TEMPLATE/NIC")
                vm.delete_element("/VM/TEMPLATE/NIC")
            end if !options[:all]
        end

        if vm.has_elements?("/VM/TEMPLATE/SNAPSHOT")
            puts
            CLIHelper.print_header(str_h1 % "SNAPSHOTS",false)

            CLIHelper::ShowTable.new(nil, self) do

                column :"ID", "", :size=>4 do |d|
                    d["SNAPSHOT_ID"] if !d.nil?
                end

                column :"TIME", "", :size=>12 do |d|
                    OpenNebulaHelper.time_to_str(d["TIME"], false) if !d.nil?
                end

                column :"NAME", "", :left, :size=>46 do |d|
                    d["NAME"] if !d.nil?
                end

                column :"HYPERVISOR_ID", "", :left, :size=>15 do |d|
                    d["HYPERVISOR_ID"] if !d.nil?
                end

            end.show([vm.to_hash['VM']['TEMPLATE']['SNAPSHOT']].flatten, {})

            vm.delete_element("/VM/TEMPLATE/SNAPSHOT")
        end

        if vm.has_elements?("/VM/HISTORY_RECORDS")
            puts

            CLIHelper.print_header(str_h1 % "VIRTUAL MACHINE HISTORY",false)
            format_history(vm)
        end

        if vm.has_elements?("/VM/USER_TEMPLATE/SCHED_ACTION")
            puts
            CLIHelper.print_header(str_h1 % "SCHEDULED ACTIONS",false)

            CLIHelper::ShowTable.new(nil, self) do

                column :"ID", "", :size=>2 do |d|
                    d["ID"] if !d.nil?
                end

                column :"ACTION", "", :left, :size=>15 do |d|
                    d["ACTION"] if !d.nil?
                end

                column :"SCHEDULED", "", :size=>12 do |d|
                    OpenNebulaHelper.time_to_str(d["TIME"], false) if !d.nil?
                end

                column :"DONE", "", :size=>12 do |d|
                    OpenNebulaHelper.time_to_str(d["DONE"], false) if !d.nil?
                end

                column :"MESSAGE", "", :left, :donottruncate, :size=>35 do |d|
                    d["MESSAGE"] if !d.nil?
                end
            end.show([vm.to_hash['VM']['USER_TEMPLATE']['SCHED_ACTION']].flatten, {})
        end

        if vm.has_elements?("/VM/USER_TEMPLATE")
            puts

            if !options[:all]
                vm.delete_element("/VM/USER_TEMPLATE/SCHED_ACTION")
            end

            CLIHelper.print_header(str_h1 % "USER TEMPLATE",false)
            puts vm.template_like_str('USER_TEMPLATE')
        end

        puts
        CLIHelper.print_header(str_h1 % "VIRTUAL MACHINE TEMPLATE",false)
        puts vm.template_str
    end

    def format_history(vm)
        table=CLIHelper::ShowTable.new(nil, self) do
            column :SEQ, "Sequence number", :size=>3 do |d|
                d["SEQ"]
            end

            column :HOST, "Host name of the VM container", :left, :size=>15 do |d|
                d["HOSTNAME"]
            end

            column :"ACTION", "VM state change action", :left, :size=>16 do |d|
                VirtualMachine.get_history_action d["ACTION"]
            end

            column :REASON, "VM state change reason", :left, :size=>4 do |d|
                VirtualMachine.get_reason d["REASON"]
            end

            column :DS, "System Datastore", :size=>4 do |d|
                d["DS_ID"]
            end

            column :START, "Time when the state changed", :size=>15 do |d|
                OpenNebulaHelper.time_to_str(d['STIME'])
            end

            column :TIME, "Total time in this state", :size=>11 do |d|
                stime = d["STIME"].to_i
                etime = d["ETIME"]=="0" ? Time.now.to_i : d["ETIME"].to_i
                dtime = etime-stime
                OpenNebulaHelper.period_to_str(dtime, false)
            end

            column :PROLOG, "Prolog time for this state", :size=>10 do |d|
                stime = d["PSTIME"].to_i
                if d["PSTIME"]=="0"
                    etime=0
                else
                    etime = d["PETIME"]=="0" ? Time.now.to_i: d["PETIME"].to_i
                end
                dtime = etime-stime
                OpenNebulaHelper.short_period_to_str(dtime)
            end

            default :SEQ, :HOST, :ACTION, :DS, :START, :TIME, :PROLOG
        end

        vm_hash=vm.to_hash

        history=[vm_hash['VM']['HISTORY_RECORDS']['HISTORY']].flatten

        table.show(history)
    end
end
