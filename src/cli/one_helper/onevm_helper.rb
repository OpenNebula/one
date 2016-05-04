# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

if !ONE_LOCATION
    MAD_LOCATION      = "/usr/lib/one/mads"
    VAR_LOCATION      = "/var/lib/one"
else
    MAD_LOCATION      = ONE_LOCATION + "/lib/mads"
    VAR_LOCATION      = ONE_LOCATION + "/var"
end

VMS_LOCATION = VAR_LOCATION + "/vms"

$: << MAD_LOCATION

require 'one_helper'
require 'optparse/time'

class String
    def red
        colorize(31)
    end

    def green
        colorize(32)
    end

private

    def colorize(color_code)
        "\e[#{color_code}m#{self}\e[0m"
    end
end

EXTERNAL_IP_ATTRS = [
    'GUEST_IP',
    'AWS_IP_ADDRESS',
    'AZ_IPADDRESS',
    'SL_PRIMARYIPADDRESS'
];


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

    IP={
        :name => "ip",
        :short => "-i ip",
        :large => "--ip ip",
        :format => String,
        :description => "IP address for the new NIC"
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

    # Return the IP or several IPs of a VM
    def self.ip_str(vm)
        ips = []

        vm_nics = []

        if !vm["TEMPLATE"]["NIC"].nil?
            vm_nics = [vm["TEMPLATE"]['NIC']].flatten
        end

        vm_nics.each do |nic|
            ["IP", "IP6_GLOBAL", "IP6_ULA",
             "VROUTER_IP", "VROUTER_IP6_GLOBAL", "VROUTER_IP6_ULA"].each do |attr|
                if nic.has_key?(attr)
                    ips.push(nic[attr])
                end
            end
        end

        VirtualMachine::EXTERNAL_IP_ATTRS.each do |attr|
            external_ip = vm["MONITORING"][attr]

            if !external_ip.nil? && !ips.include?(external_ip)
                ips.push(external_ip)
            end
        end

        if ips.empty?
            return "--"
        else
            return ips.join(",")
        end
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
                cpu = d["MONITORING"]["CPU"]
                cpu = "0" if cpu.nil?

                cpu
            end

            column :UMEM, "Memory used by the VM", :size=>7 do |d|
                OpenNebulaHelper.unit_to_str(d["MONITORING"]["MEMORY"].to_i, options)
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

            column :IP, "VM IP addresses", :left, :donottruncate, :size=>15 do |d|
                OneVMHelper.ip_str(d)
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

    RECOVER_RETRY_STEPS = {
        :PROLOG_MIGRATE_FAILURE          => :migrate,
        :PROLOG_MIGRATE_POWEROFF_FAILURE => :migrate,
        :PROLOG_MIGRATE_SUSPEND_FAILURE  => :migrate,
        :PROLOG_MIGRATE_UNKNOWN_FAILURE  => :migrate,
        :PROLOG_FAILURE                  => :prolog,
        :PROLOG_RESUME_FAILURE           => :resume,
        :PROLOG_UNDEPLOY_FAILURE         => :resume,
        :EPILOG_FAILURE                  => :epilog,
        :EPILOG_STOP_FAILURE             => :stop,
        :EPILOG_UNDEPLOY_FAILURE         => :stop
    }

    def recover_retry_interactive(vm)
        begin
            require 'one_tm'
        rescue LoadError
            STDERR.puts <<-EOT
one_tm library not found. Make sure you execute recover --interactive
in the frontend machine.
            EOT
            exit(-1)
        end

        # Disable CTRL-C in the menu
        trap("SIGINT") { }

        if !File.readable?(VAR_LOCATION+"/config")
            STDERR.puts "Error reading #{VAR_LOCATION+'/config'}. The " <<
                "TM Debug Interactive Environment must be executed as " <<
                "oneadmin in the frontend."
            exit -1
        end

        rc = vm.info
        if OpenNebula.is_error?(rc)
            STDERR.puts rc.message
            exit -1
        end

        if !RECOVER_RETRY_STEPS.include?(vm.lcm_state_str.to_sym)
            STDERR.puts "Current LCM STATE '#{vm.lcm_state_str}' not " <<
                "compatible with RECOVER RETRY action."
            exit -1
        end

        seq = vm['/VM/HISTORY_RECORDS/HISTORY[last()]/SEQ']

        tm_action = RECOVER_RETRY_STEPS[vm.lcm_state_str.to_sym]

        tm_file = "#{VMS_LOCATION}/#{vm.id}/transfer.#{seq}.#{tm_action}"

        if !File.readable?(tm_file)
            STDERR.puts "Cannot read #{tm_file}"
            exit -1
        end

        @tm_action_list = File.read(tm_file)

        puts "TM Debug Interactive Environment.".green
        puts
        print_tm_action_list

        @tm = TransferManagerDriver.new(nil)
        i=0
        @tm_action_list.lines.each do |tm_command|
            i+=1
            success=false

            while !success
                puts "Current action (#{i}):".green
                puts tm_command
                puts

                puts <<-EOF.gsub(/^\s+/,"")
                Choose action:
                (r) Run action
                (n) Skip to next action
                (a) Show all actions
                (q) Quit
                EOF

                ans = ""
                while !%w(n a r q).include?(ans)
                    printf "> "
                    ans = STDIN.gets.strip.downcase

                    puts

                    case ans
                    when "n"
                        success = true
                    when "a"
                        print_tm_action_list
                    when "q"
                        exit -1
                    when "r"
                        result, result_message = @tm.do_transfer_action(@id, tm_command.split)

                        if result == "SUCCESS"
                            success = true
                            puts "#{result}"
                            puts
                        else
                            puts
                            puts "#{result}. Repeat command.".red
                            puts
                        end
                    end
                end
            end
        end

        puts "If all the TM actions have been successful and you want to"
        puts "recover the Virtual Machine to the RUNNING state execute this command:"
        puts "$ onevm recover #{vm.id} --success"
    end

    def print_tm_action_list
        puts "TM Action list:".green
        i=0
        @tm_action_list.lines.each do |line|
            i+=1
            puts "(#{i}) #{line}"
        end
        puts
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
        value=vm['TEMPLATE/VROUTER_ID']
        puts str % ["VIRTUAL ROUTER ID", value] if value

        puts

        CLIHelper.print_header(str_h1 % "VIRTUAL MACHINE MONITORING",false)

        vm_monitoring = vm.to_hash['VM']['MONITORING']

        # Find out if it is a hybrid VM to avoid showing local IPs
        isHybrid=false
        vm_monitoring.each{|key, value|
            if EXTERNAL_IP_ATTRS.include? key
                isHybrid=true
            end
        }

        order_attrs  = %w(CPU MEMORY NETTX NETRX)

        vm_monitoring_sort = []
        order_attrs.each do |key|
            if (val = vm_monitoring.delete(key))
                vm_monitoring_sort << [key, val]
            end
        end

        vm_monitoring_sort.sort{|a,b| a[0]<=>b[0]}

        filter_attrs = %w(STATE DISK_SIZE SNAPSHOT_SIZE)
        vm_monitoring.each do |key, val|
            if !filter_attrs.include?(key)
                vm_monitoring_sort << [key, val]
            end
        end

        vm_monitoring_sort.each do |k,v|
            if k == "MEMORY"
                puts str % [k, OpenNebulaHelper.unit_to_str(v.to_i, {})]
            elsif k  =~ /NET.X/
                puts str % [k, OpenNebulaHelper.unit_to_str(v.to_i/1024, {})]
            else
                puts str % [k, v]
            end
        end

        puts

        CLIHelper.print_header(str_h1 % "PERMISSIONS",false)

        ["OWNER", "GROUP", "OTHER"].each { |e|
            mask = "---"
            mask[0] = "u" if vm["PERMISSIONS/#{e}_U"] == "1"
            mask[1] = "m" if vm["PERMISSIONS/#{e}_M"] == "1"
            mask[2] = "a" if vm["PERMISSIONS/#{e}_A"] == "1"

            puts str % [e,  mask]
        }

        vm_disks = []

        if vm.has_elements?("/VM/TEMPLATE/DISK")
            vm_disks = [vm.to_hash['VM']['TEMPLATE']['DISK']].flatten
        end

        if vm.has_elements?("/VM/TEMPLATE/CONTEXT")
            context_disk = vm.to_hash['VM']['TEMPLATE']['CONTEXT']

            context_disk["IMAGE"]     = "CONTEXT"
            context_disk["DATASTORE"] = "-"
            context_disk["TYPE"]      = "-"
            context_disk["READONLY"]  = "-"
            context_disk["SAVE"]      = "-"
            context_disk["CLONE"]     = "-"
            context_disk["SAVE_AS"]   = "-"

            vm_disks.push(context_disk)
        end

        # get monitoring data
        vm_disks.each do |disk|
            disk_id = disk["DISK_ID"]
            disk["MONITOR_SIZE"] = vm["MONITORING/DISK_SIZE[ID='#{disk_id}']/SIZE"]
        end

        if !vm_disks.empty?
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

                column :SIZE, "", :left, :size=>9 do |d|
                    if d["SIZE"]
                        size = OpenNebulaHelper.unit_to_str(
                                    d['SIZE'].to_i,
                                    {},
                                    "M"
                                )
                    else
                        size = "-"
                    end

                    if d["MONITOR_SIZE"]
                        monitor_size = OpenNebulaHelper.unit_to_str(
                                    d['MONITOR_SIZE'].to_i,
                                    {},
                                    "M"
                                )
                    else
                        monitor_size = "-"
                    end

                    "#{monitor_size}/#{size}"
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

                default :ID, :DATASTORE, :TARGET, :IMAGE, :SIZE, :TYPE,
                    :SAVE
            end.show(vm_disks, {})

            while vm.has_elements?("/VM/TEMPLATE/DISK")
                vm.delete_element("/VM/TEMPLATE/DISK")
            end if !options[:all]
        end

        if vm.has_elements?("/VM/SNAPSHOTS")
            puts
            CLIHelper.print_header(str_h1 % "VM DISK SNAPSHOTS",false)
            format_snapshots(vm)
        end

        sg_nics = []

        if (vm.has_elements?("/VM/TEMPLATE/NIC/SECURITY_GROUPS"))
            sg_nics = [vm.to_hash['VM']['TEMPLATE']['NIC']].flatten

            sg_nics.each do |nic|
                sg = nic["SECURITY_GROUPS"]

                if sg.nil?
                    next
                end
            end
        end

        # This variable holds the extra IP's got from monitoring. Right
        # now it adds GUEST_IP and GUEST_IP_ADDRESSES from vcenter
        # monitoring. If other variables hold IPs just add them to this
        # array. Duplicate IPs are not shown.
        extra_ips = []

        if val=vm["/VM/MONITORING/GUEST_IP"]
            extra_ips << val if val && !val.empty?
        end

        if val=vm["/VM/MONITORING/GUEST_IP_ADDRESSES"]
            extra_ips += val.split(',') if val && !val.empty?
        end

        extra_ips.uniq!

        if vm.has_elements?("/VM/TEMPLATE/NIC") || !extra_ips.empty?
            puts
            CLIHelper.print_header(str_h1 % "VM NICS",false)

            nic_default = {"NETWORK" => "-",
                           "IP" => "-",
                           "MAC"=> "-",
                           "BRIDGE"=>"-"}

            shown_ips = []

            array_id = 0
            vm_nics = [vm.to_hash['VM']['TEMPLATE']['NIC']].flatten.compact
            vm_nics.each {|nic|

                next if nic.has_key?("CLI_DONE")

                ["IP6_LINK", "IP6_ULA", "IP6_GLOBAL"].each do |attr|
                    if nic.has_key?(attr)
                        shown_ips << nic[attr]

                        ipstr = {"IP"           => nic.delete(attr),
                                 "CLI_DONE"     => true,
                                 "DOUBLE_ENTRY" => true}
                        vm_nics.insert(array_id+1,ipstr)

                        array_id += 1
                    end
                end

                ["VROUTER_IP", "VROUTER_IP6_LINK",
                 "VROUTER_IP6_ULA", "VROUTER_IP6_GLOBAL"].each do |attr|
                    if nic.has_key?(attr)
                        shown_ips << nic[attr]

                        ipstr = {"IP"           => nic.delete(attr) + " (VRouter)",
                                 "CLI_DONE"     => true,
                                 "DOUBLE_ENTRY" => true}
                        vm_nics.insert(array_id+1,ipstr)

                        array_id += 1
                    end
                end

                shown_ips << nic["IP"] if nic.has_key?("IP")

                nic.merge!(nic_default) {|k,v1,v2| v1}
                array_id += 1
            }

            extra_ips -= shown_ips

            # Add extra IPs to the VM NICS table
            extra_ips.each do |ip|
                vm_nics << {
                    "NIC_ID"        => "-",
                    "IP"            => ip,
                    "NETWORK"       => "Additional IP",
                    "BRIDGE"        => "-"
                }
            end

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

        while vm.has_elements?("/VM/TEMPLATE/NIC")
            vm.delete_element("/VM/TEMPLATE/NIC")
        end if !options[:all]

        if vm.has_elements?("/VM/TEMPLATE/SECURITY_GROUP_RULE") and !isHybrid
            puts
            CLIHelper.print_header(str_h1 % "SECURITY",false)
            puts

            CLIHelper::ShowTable.new(nil, self) do
                column :NIC_ID, "", :size=>6 do |d|
                    d["NIC_ID"]
                end

                column :NETWORK, "", :left, :size=>25 do |d|
                    d["NETWORK"]
                end

                column :SECURITY_GROUPS, "", :left, :size=>47 do |d|
                    d["SECURITY_GROUPS"]
                end
            end.show(sg_nics,{})

            puts

            CLIHelper.print_header(str_h1 % "SECURITY GROUP   TYPE     PROTOCOL NETWORK                       RANGE          ",false)

            CLIHelper::ShowTable.new(nil, self) do
                column :ID, "", :size=>4 do |d|
                    d["SECURITY_GROUP_ID"]
                end

                column :NAME, "", :left, :size=>11 do |d|
                    d["SECURITY_GROUP_NAME"]
                end

                column :" ", "", :left, :size=>8 do |d|
                    d["RULE_TYPE"]
                end

                column :"  ", "", :left, :size=>8 do |d|
                    protocol = d["PROTOCOL"]

                    if(protocol.upcase == "ICMP")
                        icmp = d["ICMP_TYPE"].nil? ? "" : "-#{d["ICMP_TYPE"]}"
                        protocol += icmp
                    end

                    protocol
                end

                column :VNET, "", :size=>4 do |d|
                    d["NETWORK_ID"]
                end

                column :START, "", :left, :donottruncate, :size=>17 do |d|
                    network = ""

                    if(!d["IP"].nil? && d["IP"] != "")
                        network = d["IP"]
                    elsif(!d["MAC"].nil? && d["MAC"] != "")
                        network = d["MAC"]
                    end

                    network
                end

                column :SIZE, "", :left, :donottruncate, :size=>6 do |d|
                    d["SIZE"]
                end

                column :"   ", "", :left, :donottruncate, :size=>15 do |d|
                    d["RANGE"]
                end

            end.show([vm.to_hash['VM']['TEMPLATE']['SECURITY_GROUP_RULE']].flatten, {})

            while vm.has_elements?("/VM/TEMPLATE/SECURITY_GROUP_RULE")
                vm.delete_element("/VM/TEMPLATE/SECURITY_GROUP_RULE")
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

    def format_snapshots(vm)
        table=CLIHelper::ShowTable.new(nil, self) do
            column :AC , "Is active", :left, :size => 2 do |d|
                if d["ACTIVE"] == "YES"
                    "=>"
                else
                    ""
                end
            end
            column :ID, "Snapshot ID", :size=>3 do |d|
                d["ID"]
            end

            column :DISK, "Disk ID", :size=>4 do |d|
                d["DISK_ID"]
            end

            column :PARENT, "Snapshot Parent ID", :size=>6 do |d|
                d["PARENT"]
            end

            column :CHILDREN, "Snapshot Children IDs", :size=>10 do |d|
                d["CHILDREN"]
            end

            column :SIZE, "", :left, :size=>12 do |d|
                if d["SIZE"]
                    size = OpenNebulaHelper.unit_to_str(
                                d['SIZE'].to_i,
                                {},
                                "M"
                            )
                else
                    size = "-"
                end

                if d["MONITOR_SIZE"]
                    monitor_size = OpenNebulaHelper.unit_to_str(
                                d['MONITOR_SIZE'].to_i,
                                {},
                                "M"
                            )
                else
                    monitor_size = "-"
                end

                "#{monitor_size}/#{size}"
            end

            column :NAME, "Snapshot Name", :left, :size=>32 do |d|
                d["NAME"]
            end

            column :DATE, "Snapshot creation date", :size=>15 do |d|
                OpenNebulaHelper.time_to_str(d["DATE"])
            end

            default :AC, :ID, :DISK, :PARENT, :DATE, :SIZE, :NAME
        end

        # Convert snapshot data to an array
        vm_hash = vm.to_hash
        vm_snapshots = [vm_hash['VM']['SNAPSHOTS']].flatten

        snapshots = []

        vm_snapshots.each do |disk|
            disk_id = disk['DISK_ID']

            sshots = [disk['SNAPSHOT']].flatten
            sshots.each do |snapshot|
                data = snapshot.merge({ 'DISK_ID' => disk_id })
                snapshots << data
            end
        end

        # get monitoring data
        snapshots.each do |snapshot|
            disk_id = snapshot["DISK_ID"]
            snap_id = snapshot["ID"]
            xpath = "MONITORING/SNAPSHOT_SIZE[ID='#{snap_id}' and DISK_ID='#{disk_id}']/SIZE"
            snapshot["MONITOR_SIZE"] = vm[xpath]
        end

        table.show(snapshots)
    end
end
