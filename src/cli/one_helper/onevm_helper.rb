# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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
# rubocop:disable Naming/UncommunicativeMethodParamName

if !ONE_LOCATION
    MAD_LOCATION      = '/usr/lib/one/mads'
    VAR_LOCATION      = '/var/lib/one'
else
    MAD_LOCATION      = ONE_LOCATION + '/lib/mads'
    VAR_LOCATION      = ONE_LOCATION + '/var'
end

VMS_LOCATION = VAR_LOCATION + '/vms'

$LOAD_PATH << MAD_LOCATION

require 'one_helper'
require 'optparse/time'

# colored strings
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

# Helper methods for OneVM
class OneVMHelper < OpenNebulaHelper::OneHelper

    MULTIPLE = {
        :name => 'multiple',
        :short => '-m x',
        :large => '--multiple x',
        :format => Integer,
        :description => 'Instance multiple VMs'
    }

    IMAGE = {
        :name => 'image',
        :short => '-i id|name',
        :large => '--image id|name',
        :description => 'Selects the image',
        :format => String,
        :proc => lambda {|o, _options|
            OpenNebulaHelper.rname_to_id(o, 'IMAGE')
        }
    }

    NETWORK = {
        :name => 'network',
        :short => '-n id|name',
        :large => '--network id|name',
        :description => 'Selects the virtual network',
        :format => String,
        :proc => lambda {|o, _options|
            OpenNebulaHelper.rname_to_id(o, 'VNET')
        }
    }

    IP = {
        :name => 'ip',
        :short => '-i ip',
        :large => '--ip ip',
        :format => String,
        :description => 'IP address for the new NIC'
    }

    FILE = {
        :name => 'file',
        :short => '-f file',
        :large => '--file file',
        :description => 'Selects the template file',
        :format => String,
        :proc => lambda {|o, options|
            if File.file?(o)
                options[:file] = o
            else
                STDERR.puts "File `#{options[:file]}` doesn't exist"
                exit(-1)
            end
        }
    }

    HOLD = {
        :name => 'hold',
        :large => '--hold',
        :description => 'Creates the new VM on hold state instead of pending'
    }

    ALL_TEMPLATE = {
        :name => 'all',
        :large => '--all',
        :description => 'Show all template data'
    }

    LIVE = {
        :name => 'live',
        :large => '--live',
        :description => 'Do the action with the VM running'
    }

    HARD = {
        :name => 'hard',
        :large => '--hard',
        :description => 'Does not communicate with the guest OS'
    }

    POFF = {
        :name => 'poweroff',
        :large => '--poff',
        :description => 'Do the migrate by poweringoff the vm'
    }

    POFFHARD = {
        :name => 'poweroff_hard',
        :large => '--poff-hard',
        :description => 'Do the migrate by poweringoff hard the vm'
    }

    ALIAS = {
        :name => 'alias',
        :short => '-a alias',
        :large => '--alias alias',
        :description => 'Attach the NIC as an ALIAS',
        :format => String
    }

    NIC_NAME = {
        :name => 'nic_name',
        :large => '--nic_name name',
        :description => 'Name of the NIC',
        :format => String
    }

    SEARCH = {
        :name => 'search',
        :large => '--search search',
        :description => 'query in KEY=VALUE format',
        :format => String
    }

    def self.rname
        'VM'
    end

    def self.conf_file
        'onevm.yaml'
    end

    def self.state_to_str(id, lcm_id)
        id = id.to_i
        state_str = VirtualMachine::VM_STATE[id]
        short_state_str = VirtualMachine::SHORT_VM_STATES[state_str]

        if short_state_str == 'actv'
            lcm_id = lcm_id.to_i
            lcm_state_str = VirtualMachine::LCM_STATE[lcm_id]
            return VirtualMachine::SHORT_LCM_STATES[lcm_state_str]
        end

        short_state_str
    end

    # Return the IP or several IPs of a VM
    def self.ip_str(vm)
        ips = []

        vm_nics = []

        if !vm['TEMPLATE']['NIC'].nil?
            vm_nics = [vm['TEMPLATE']['NIC']].flatten
        end

        if !vm['TEMPLATE']['PCI'].nil?
            vm_nics = [vm_nics, vm['TEMPLATE']['PCI']].flatten
        end

        vm_nics.each do |nic|
            ['IP', 'EXTERNAL_IP', 'IP6_GLOBAL', 'IP6_ULA', 'IP6', 'VROUTER_IP',
             'VROUTER_IP6_GLOBAL', 'VROUTER_IP6_ULA'].each do |attr|
                if nic.key?(attr)
                    ips.push(nic[attr])
                end
            end
        end

        VirtualMachine::EXTERNAL_IP_ATTRS.each do |attr|
            external_ip = vm['MONITORING'][attr]

            if !external_ip.nil? && !ips.include?(external_ip)
                ips.push(external_ip)
            end
        end

        return '--' if ips.empty?

        ips.join(',')
    end

    def retrieve_snapshot_id(vm_id, id)
        return [0, id.to_i] if id =~ /\A\d+\z/

        vm = retrieve_resource(vm_id)
        vm.info

        ids = vm.retrieve_elements(
            "/VM/TEMPLATE/SNAPSHOT[NAME='#{id}']/SNAPSHOT_ID"
        )

        return [-1, "#{id} not found or duplicated"] \
                if ids.nil? || ids.size > 1

        [0, ids[0].to_i]
    end

    def retrieve_disk_snapshot_id(vm_id, id)
        return [0, id.to_i] if id =~ /\A\d+\z/

        vm = retrieve_resource(vm_id)
        vm.info
        ids = vm.retrieve_elements("/VM/SNAPSHOTS/SNAPSHOT[NAME='#{id}']/ID")

        return [-1, "Snapshot #{id} not found or duplicated"] \
                if ids.nil? || ids.size > 1

        [0, ids[0].to_i]
    end

    def format_pool(options)
        config_file = self.class.table_conf

        # Get cluster names to use later in list
        cluster_pool = OpenNebula::ClusterPool.new(@client)
        rc = cluster_pool.info

        cluster_names = {}
        cluster_names['-1'] = 'default'

        if !OpenNebula.is_error?(rc)
            cluster_pool.each do |c|
                cluster_names[c['ID']] = c['NAME']
            end
        end

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'ONE identifier for Virtual Machine', :size => 6 do |d|
                d['ID']
            end

            column :NAME, 'Name of the Virtual Machine', :left,
                   :size => 15 do |d|
                if d['RESCHED'] == '1'
                    "*#{d['NAME']}"
                else
                    d['NAME']
                end
            end

            column :USER, 'Username of the Virtual Machine owner', :left,
                   :size => 8 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, 'Group of the Virtual Machine', :left,
                   :size => 8 do |d|
                helper.group_name(d, options)
            end

            column :STAT, 'Actual status', :size => 4 do |d, _e|
                OneVMHelper.state_to_str(d['STATE'], d['LCM_STATE'])
            end

            column :CPU, 'CPU asigned to the VM', :size => 4 do |d|
                cpu = d['TEMPLATE']['CPU']
                cpu = '0' if cpu.nil?

                cpu
            end

            column :MEM, 'Memory asigned to the VM', :size => 7 do |d|
                OpenNebulaHelper.unit_to_str(d['TEMPLATE']['MEMORY'].to_i,
                                             options, 'M')
            end

            column :HOST, 'Host where the VM is running',
                   :left, :size => 10 do |d|
                if d['HISTORY_RECORDS'] && d['HISTORY_RECORDS']['HISTORY']
                    state_str = VirtualMachine::VM_STATE[d['STATE'].to_i]
                    if ['ACTIVE', 'SUSPENDED', 'POWEROFF'].include? state_str
                        d['HISTORY_RECORDS']['HISTORY']['HOSTNAME']
                    end
                end
            end

            column :CLUSTER, 'Cluster where the VM is running', :left,
                   :size => 10 do |d|
                if d['HISTORY_RECORDS']['HISTORY']
                    history = [d['HISTORY_RECORDS']['HISTORY']].flatten
                    cluster_id = history.last['CID']
                    cluster = cluster_names[cluster_id]

                    if !cluster
                        cluster_id
                    else
                        cluster
                    end
                else
                    'NONE'
                end
            end

            column :TIME, 'Time since the VM was submitted', :size => 10 do |d|
                stime = d['STIME'].to_i
                etime = d['ETIME'] == '0' ? Time.now.to_i : d['ETIME'].to_i
                dtime = etime - stime
                OpenNebulaHelper.period_to_str(dtime, false)
            end

            column :IP, 'VM IP addresses', :left, :adjust, :size => 15 do |d|
                OneVMHelper.ip_str(d)
            end

            default :ID, :USER, :GROUP, :NAME, :STAT, :CPU, :MEM, :HOST,
                    :TIME
        end
    end

    def schedule_actions(ids, options, action, warning = nil)
        # Verbose by default
        options[:verbose] = true

        message = if options[:schedule].class == Integer
                      "#{action} scheduled at #{Time.at(options[:schedule])}"
                  else
                      "#{action} scheduled after #{options[:schedule]}s from start"
                  end

        tmp_str = OpenNebulaHelper.schedule_action_tmpl(options, action, warning)

        perform_actions(ids, options, message) do |vm|
            rc = vm.sched_action_add(tmp_str)

            if OpenNebula.is_error?(rc)
                STDERR.puts rc.message
                return -1
            end
        end
    end

    # Update schedule action
    #
    # @param vm_id     [Integer] Virtual Machine ID
    # @param action_id [Integer] Sched action ID
    # @param file      [String]  File path with update content
    # @param options
    def update_schedule_action(vm_id, action_id, file, options)
        perform_action(vm_id, options, 'Sched action updated') do |vm|
            rc = vm.info

            if OpenNebula.is_error?(rc)
                STDERR.puts "Error #{rc.message}"
                exit(-1)
            end

            xpath = "TEMPLATE/SCHED_ACTION[ID=#{action_id}]"

            unless vm.retrieve_elements(xpath)
                STDERR.puts "Sched action #{action_id} not found"
                exit(-1)
            end

            # Get user information
            if file
                str = File.read(file)
            else
                str = OpenNebulaHelper.update_template(vm_id, vm, nil, xpath)
            end

            # Delete the current sched action
            vm.delete_element(xpath)

            # Add the modified sched action
            tmp_str = "\nSCHED_ACTION = ["
            tmp_str << str.split("\n").join(',')
            tmp_str << ']'

            rc = vm.sched_action_update(action_id, tmp_str)

            if OpenNebula.is_error?(rc)
                STDERR.puts "Error updating: #{rc.message}"
                exit(-1)
            end
        end
    end

    RECOVER_RETRY_STEPS = {
        :PROLOG_MIGRATE_FAILURE => :migrate,
        :PROLOG_MIGRATE_POWEROFF_FAILURE => :migrate,
        :PROLOG_MIGRATE_SUSPEND_FAILURE => :migrate,
        :PROLOG_MIGRATE_UNKNOWN_FAILURE => :migrate,
        :PROLOG_FAILURE => :prolog,
        :PROLOG_RESUME_FAILURE => :resume,
        :PROLOG_UNDEPLOY_FAILURE => :resume,
        :EPILOG_FAILURE => :epilog,
        :EPILOG_STOP_FAILURE => :stop,
        :EPILOG_UNDEPLOY_FAILURE => :stop
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
        trap('SIGINT') {}

        if !File.readable?(VAR_LOCATION + '/config')
            STDERR.puts "Error reading #{VAR_LOCATION + '/config'}. The TM " \
                        'Debug Interactive Environment must be executed as ' \
                        'oneadmin in the frontend.'
            exit(-1)
        end

        rc = vm.info
        if OpenNebula.is_error?(rc)
            STDERR.puts rc.message
            exit(-1)
        end

        if !RECOVER_RETRY_STEPS.include?(vm.lcm_state_str.to_sym)
            STDERR.puts "Current LCM STATE '#{vm.lcm_state_str}' not " \
                        'compatible with RECOVER RETRY action.'
            exit(-1)
        end

        seq = vm['/VM/HISTORY_RECORDS/HISTORY[last()]/SEQ']

        tm_action = RECOVER_RETRY_STEPS[vm.lcm_state_str.to_sym]

        tm_file = "#{VMS_LOCATION}/#{vm.id}/transfer.#{seq}.#{tm_action}"

        if !File.readable?(tm_file)
            STDERR.puts "Cannot read #{tm_file}"
            exit(-1)
        end

        @tm_action_list = File.read(tm_file)

        puts 'TM Debug Interactive Environment.'.green
        puts
        print_tm_action_list

        @tm = TransferManagerDriver.new(nil)
        i = 0
        @tm_action_list.lines.each do |tm_command|
            i += 1
            success = false

            until success
                puts "Current action (#{i}):".green
                puts tm_command
                puts

                puts <<-EOF.gsub(/^\s+/, '')
                Choose action:
                (r) Run action
                (n) Skip to next action
                (a) Show all actions
                (q) Quit
                EOF

                ans = ''
                until ['n', 'a', 'r', 'q'].include?(ans)
                    printf '> '
                    ans = STDIN.gets.strip.downcase

                    puts

                    case ans
                    when 'n'
                        success = true
                    when 'a'
                        print_tm_action_list
                    when 'q'
                        exit(-1)
                    when 'r'
                        result, = @tm.do_transfer_action(@id, tm_command.split)

                        if result == 'SUCCESS'
                            success = true
                            puts result
                        else
                            puts
                            puts "#{result}. Repeat command.".red
                        end
                        puts
                    end
                end
            end
        end

        puts 'If all the TM actions have been successful and you want to'
        puts 'recover the Virtual Machine to the RUNNING state execute this '
        puts "command $ onevm recover #{vm.id} --success"
    end

    def print_tm_action_list
        puts 'TM Action list:'.green
        i = 0
        @tm_action_list.lines.each do |line|
            i += 1
            puts "(#{i}) #{line}"
        end
        puts
    end

    def get_migration_type(options)
        if options[:poweroff]
            1
        elsif options[:poweroff_hard]
            2
        else
            0
        end
    end

    # Get charters configuration
    #
    #   @return [Array]
    #       - action
    #           - time
    #           - warning
    def charters
        YAML.load_file(self.class.table_conf)[:charters]
    end

    # SSH into a VM
    #
    # @param args    [Array] CLI arguments
    # @param options [Hash]  CLI parameters
    def ssh(args, options)
        perform_action(args[0], options, 'SSH') do |vm|
            rc = vm.info

            if OpenNebula.is_error?(rc)
                STDERR.puts rc.message
                exit(-1)
            end

            if vm.lcm_state_str != 'RUNNING'
                STDERR.puts 'VM is not RUNNING, cannot SSH to it'
                exit(-1)
            end

            # Get user to login
            username = vm.retrieve_xmlelements('//TEMPLATE/CONTEXT/USERNAME')[0]

            if !username.nil?
                login = username.text
            elsif !args[1].nil?
                login = args[1]
            else
                login = 'root'
            end

            # Get CMD to run
            options[:cmd].nil? ? cmd = '' : cmd = options[:cmd]

            # Get NIC to connect
            if options[:nic_id]
                nic = vm.retrieve_xmlelements(
                    "//TEMPLATE/NIC[NIC_ID=\"#{options[:nic_id]}\"]"
                )[0]
            else
                nic = vm.retrieve_xmlelements('//TEMPLATE/NIC[SSH="YES"]')[0]
            end

            nic = vm.retrieve_xmlelements('//TEMPLATE/NIC[1]')[0] if nic.nil?

            if nic.nil?
                STDERR.puts 'No NIC found'
                exit(-1)
            end

            # If there is node port
            if nic['EXTERNAL_PORT_RANGE']
                ip   = vm.to_hash['VM']['HISTORY_RECORDS']['HISTORY']
                ip   = [ip].flatten[-1]['HOSTNAME']
                port = Integer(nic['EXTERNAL_PORT_RANGE'].split(':')[0]) + 21
            else
                ip   = nic['IP']
                port = 22
            end

            options[:ssh_opts].nil? ? opts = '' : opts = options[:ssh_opts]

            if opts.empty?
                exec('ssh', "#{login}@#{ip}", '-p', port.to_s, cmd.to_s)
            else
                exec('ssh', *opts.split, "#{login}@#{ip}", '-p', port.to_s, cmd.to_s)
            end
        end

        # rubocop:disable Style/SpecialGlobalVars
        $?.exitstatus
        # rubocop:enable Style/SpecialGlobalVars
    end

    private

    def factory(id = nil)
        if id
            OpenNebula::VirtualMachine.new_with_id(id, @client)
        else
            xml = OpenNebula::VirtualMachine.build_xml
            OpenNebula::VirtualMachine.new(xml, @client)
        end
    end

    def factory_pool(user_flag = -2)
        OpenNebula::VirtualMachinePool.new(@client, user_flag)
    end

    def format_resource(vm, options = {})
        str_h1 = '%-80s'
        str = '%-20s: %-20s'

        cluster = nil

        vm_hash = vm.to_hash

        if ['ACTIVE', 'SUSPENDED', 'POWEROFF'].include? vm.state_str
            cluster_id = vm['/VM/HISTORY_RECORDS/HISTORY[last()]/CID']
        else
            cluster_id = nil
        end

        if cluster_id
            if cluster_id == '-1'
                cluster = 'default'
            else
                clu = OpenNebula::Cluster.new(
                    OpenNebula::Cluster.build_xml(cluster_id), @client
                )
                rc = clu.info
                if OpenNebula.is_error?(rc)
                    cluster = 'ERROR'
                else
                    cluster = clu['NAME']
                end
            end
        end

        CLIHelper.print_header(
            str_h1 % "VIRTUAL MACHINE #{vm['ID']} INFORMATION"
        )
        puts format(str, 'ID', vm.id.to_s)
        puts format(str, 'NAME', vm.name)
        puts format(str, 'USER', vm['UNAME'])
        puts format(str, 'GROUP', vm['GNAME'])
        puts format(str, 'STATE', vm.state_str)
        puts format(str, 'LCM_STATE', vm.lcm_state_str)
        puts format(str, 'LOCK',
                    OpenNebulaHelper.level_lock_to_str(vm['LOCK/LOCKED']))
        puts format(str, 'RESCHED',
                    OpenNebulaHelper.boolean_to_str(vm['RESCHED']))
        if ['ACTIVE', 'SUSPENDED', 'POWEROFF'].include? vm.state_str
            puts format(str, 'HOST',
                        vm['/VM/HISTORY_RECORDS/HISTORY[last()]/HOSTNAME'])
        end
        puts format(str, 'CLUSTER ID', cluster_id) if cluster_id
        puts format(str, 'CLUSTER', cluster) if cluster
        puts format(str, 'START TIME',
                    OpenNebulaHelper.time_to_str(vm['/VM/STIME']))
        puts format(str, 'END TIME',
                    OpenNebulaHelper.time_to_str(vm['/VM/ETIME']))
        value = vm['DEPLOY_ID']
        puts format(str, 'DEPLOY ID', value == '' ? '-' : value)
        value = vm['TEMPLATE/VROUTER_ID']
        puts format(str, 'VIRTUAL ROUTER ID', value) if value

        puts

        CLIHelper.print_header(str_h1 % 'VIRTUAL MACHINE MONITORING', false)

        vm_monitoring = vm_hash['VM']['MONITORING']

        # Find out if it is a hybrid VM to avoid showing local IPs
        is_hybrid = false
        vm_monitoring.each do |key, _value|
            if VirtualMachine::EXTERNAL_IP_ATTRS.include? key
                is_hybrid = true
            end
        end

        order_attrs = ['CPU', 'MEMORY', 'NETTX', 'NETRX']

        vm_monitoring_sort = []
        order_attrs.each do |key|
            if (val = vm_monitoring.delete(key))
                vm_monitoring_sort << [key, val]
            end
        end

        vm_monitoring_sort.sort_by {|a| a[0] }

        filter_attrs = ['STATE', 'DISK_SIZE', 'SNAPSHOT_SIZE']
        vm_monitoring.each do |key, val|
            if !filter_attrs.include?(key)
                vm_monitoring_sort << [key, val]
            end
        end

        vm_monitoring_sort.each do |k, v|
            if k == 'MEMORY'
                puts format(str, k, OpenNebulaHelper.unit_to_str(v.to_i, {}))
            elsif k =~ /NET.X/
                puts format(str, k,
                            OpenNebulaHelper.unit_to_str(v.to_i / 1024, {}))
            else
                puts format(str, k, v)
            end
        end

        puts

        CLIHelper.print_header(str_h1 % 'PERMISSIONS', false)

        ['OWNER', 'GROUP', 'OTHER'].each do |e|
            mask = '---'
            mask[0] = 'u' if vm["PERMISSIONS/#{e}_U"] == '1'
            mask[1] = 'm' if vm["PERMISSIONS/#{e}_M"] == '1'
            mask[2] = 'a' if vm["PERMISSIONS/#{e}_A"] == '1'

            puts format(str, e, mask)
        end

        vm_disks = []

        if vm.has_elements?('/VM/TEMPLATE/DISK')
            vm_disks = [vm_hash['VM']['TEMPLATE']['DISK']].flatten
        end

        if vm.has_elements?('/VM/TEMPLATE/CONTEXT') \
                && vm['/VM/HISTORY_RECORDS/HISTORY[1]/VM_MAD'] != 'vcenter'
            context_disk = vm_hash['VM']['TEMPLATE']['CONTEXT']

            context_disk['IMAGE']     = 'CONTEXT'
            context_disk['DATASTORE'] = '-'
            context_disk['TYPE']      = '-'
            context_disk['READONLY']  = '-'
            context_disk['SAVE']      = '-'
            context_disk['CLONE']     = '-'
            context_disk['SAVE_AS']   = '-'

            vm_disks.push(context_disk)
        end

        # get monitoring data
        vm_disks.each do |disk|
            disk_id = disk['DISK_ID']
            disk['MONITOR_SIZE'] = \
                vm["MONITORING/DISK_SIZE[ID='#{disk_id}']/SIZE"]
        end

        if !vm_disks.empty?
            puts
            CLIHelper.print_header(str_h1 % 'VM DISKS', false)
            CLIHelper::ShowTable.new(nil, self) do
                column :ID, '', :size => 3 do |d|
                    d['DISK_ID']
                end

                column :DATASTORE, '', :left, :size => 10 do |d|
                    d['DATASTORE']
                end

                column :TARGET, '', :left, :size => 6 do |d|
                    d['TARGET']
                end

                # rubocop:disable Metrics/LineLength
                column :IMAGE, '', :left, :size => 35 do |d|
                    d['IMAGE'] || case d['TYPE'].upcase
                                  when 'FS'
                                      "#{d['FORMAT']} - " <<
                                          OpenNebulaHelper.unit_to_str(d['SIZE'].to_i,
                                                                       {}, 'M')
                                  when 'SWAP'
                                      OpenNebulaHelper.unit_to_str(d['SIZE'].to_i,
                                                                   {}, 'M')

                                  end
                end
                # rubocop:enable Metrics/LineLength

                column :SIZE, '', :left, :size => 9 do |d|
                    if d['SIZE']
                        size = OpenNebulaHelper.unit_to_str(
                            d['SIZE'].to_i,
                            {},
                            'M'
                        )
                    else
                        size = '-'
                    end

                    if d['MONITOR_SIZE']
                        monitor_size = OpenNebulaHelper.unit_to_str(
                            d['MONITOR_SIZE'].to_i,
                            {},
                            'M'
                        )
                    else
                        monitor_size = '-'
                    end

                    "#{monitor_size}/#{size}"
                end

                column :TYPE, '', :left, :size => 4 do |d|
                    d['TYPE'].downcase
                end

                column :"R/O", '', :size => 3 do |d|
                    d['READONLY']
                end

                column :SAVE, '', :size => 4 do |d|
                    d['SAVE'] || 'NO'
                end

                column :CLONE, '', :size => 5 do |d|
                    d['CLONE']
                end

                default :ID, :DATASTORE, :TARGET, :IMAGE, :SIZE, :TYPE,
                        :SAVE
            end.show(vm_disks, {})

            if !options[:all]
                vm.delete_element('/VM/TEMPLATE/DISK') while vm.has_elements?('/VM/TEMPLATE/DISK')
            end
        end

        if vm.has_elements?('/VM/SNAPSHOTS')
            puts
            CLIHelper.print_header(str_h1 % 'VM DISK SNAPSHOTS', false)
            format_snapshots(vm)
        end

        sg_nics = []

        if vm.has_elements?('/VM/TEMPLATE/NIC/SECURITY_GROUPS') ||
           vm.has_elements?('/VM/TEMPLATE/PCI[NIC_ID>-1]/SECURITY_GROUPS')

            sg_nics = [vm_hash['VM']['TEMPLATE']['NIC']]

            sg_pcis = [vm_hash['VM']['TEMPLATE']['PCI']].flatten.compact

            sg_pcis.each do |pci|
                if !pci['NIC_ID'].nil?
                    sg_nics << pci
                end
            end

            sg_nics.flatten!
            sg_nics.compact!
        end

        # This variable holds the extra IP's got from monitoring. Right
        # now it adds GUEST_IP and GUEST_IP_ADDRESSES from vcenter
        # monitoring. If other variables hold IPs just add them to this
        # array. Duplicate IPs are not shown.
        extra_ips = []

        if (val = vm['/VM/MONITORING/GUEST_IP']) && (val && !val.empty?)
            extra_ips << val
        end

        if (val = vm['/VM/MONITORING/GUEST_IP_ADDRESSES']) && (val && !val.empty?)
            extra_ips += val.split(',')
        end

        extra_ips.uniq!

        ['NIC', 'NIC_ALIAS'].each do |type|
            next unless vm.has_elements?("/VM/TEMPLATE/#{type}") ||
                        vm.has_elements?('/VM/TEMPLATE/PCI[NIC_ID>-1]') ||
                        !extra_ips.empty?

            puts
            CLIHelper.print_header(
                str_h1 % "VM #{type == 'NIC' ? 'NICS' : 'ALIAS'}", false
            )

            nic_default = { 'NETWORK' => '-',
                            'IP' => '-',
                            'MAC' => '-',
                            'BRIDGE' => '-' }

            shown_ips = []

            array_id = 0
            vm_nics = [vm_hash['VM']['TEMPLATE'][type]]

            if type == 'NIC'
                vm_pcis = [vm_hash['VM']['TEMPLATE']['PCI']].flatten.compact

                vm_pcis.each do |pci|
                    if !pci['NIC_ID'].nil?
                        vm_nics << pci
                    end
                end
            end

            vm_nics.flatten!
            vm_nics.compact!

            vm_nics.each do |nic|
                next if nic.key?('CLI_DONE')

                ['EXTERNAL_IP', 'IP6_LINK', 'IP6_ULA', 'IP6_GLOBAL', 'IP6'].each do |attr|
                    next unless nic.key?(attr)

                    shown_ips << nic[attr]

                    ipstr = { 'IP' => nic.delete(attr),
                              'CLI_DONE' => true,
                              'DOUBLE_ENTRY' => true }
                    vm_nics.insert(array_id + 1, ipstr)

                    array_id += 1
                end

                ['VROUTER_IP', 'VROUTER_IP6_LINK', 'VROUTER_IP6_ULA',
                 'VROUTER_IP6_GLOBAL'].each do |attr|
                    next unless nic.key?(attr)

                    shown_ips << nic[attr]

                    ipstr = { 'IP' => nic.delete(attr) + ' (VRouter)',
                              'CLI_DONE' => true,
                              'DOUBLE_ENTRY' => true }
                    vm_nics.insert(array_id + 1, ipstr)

                    array_id += 1
                end

                shown_ips << nic['IP'] if nic.key?('IP')
                shown_ips << nic['EXTERNAL_IP'] if nic.key?('EXTERNAL_IP')

                nic.merge!(nic_default) {|_k, v1, _v2| v1 }
                array_id += 1
            end

            extra_ips -= shown_ips

            # Add extra IPs to the VM NICS table
            extra_ips.each do |ip|
                vm_nics << {
                    'NIC_ID' => '-',
                    'IP' => ip,
                    'NETWORK' => 'Additional IP',
                    'BRIDGE' => '-'
                }
            end

            CLIHelper::ShowTable.new(nil, self) do
                column :ID, '', :size => 3 do |d|
                    if d['DOUBLE_ENTRY']
                        ''
                    else
                        d['NIC_ID']
                    end
                end

                column :NETWORK, '', :left, :size => 20 do |d|
                    if d['DOUBLE_ENTRY']
                        ''
                    else
                        d['NETWORK']
                    end
                end

                column :BRIDGE, '', :left, :size => 12 do |d|
                    if d['DOUBLE_ENTRY']
                        ''
                    else
                        d['BRIDGE']
                    end
                end

                column :IP, '', :left, :adjust, :size => 15 do |d|
                    d['IP']
                end

                column :MAC, '', :left, :size => 17 do |d|
                    if d['DOUBLE_ENTRY']
                        ''
                    else
                        d['MAC']
                    end
                end

                if type == 'NIC'
                    column :PCI_ID, '', :left, :size => 8 do |d|
                        if d['DOUBLE_ENTRY']
                            ''
                        else
                            d['PCI_ID']
                        end
                    end
                end
            end.show(vm_nics, {})

            next if options[:all]

            vm.delete_element("/VM/TEMPLATE/#{type}") while vm.has_elements?("/VM/TEMPLATE/#{type}")
        end

        if vm_hash['VM']['TEMPLATE']['NIC']
            nic = [vm_hash['VM']['TEMPLATE']['NIC']]
            nic = nic.flatten
            nic = nic.reject {|v| v['EXTERNAL_PORT_RANGE'].nil? }[0]

            if nic
                ip   = vm_hash['VM']['HISTORY_RECORDS']['HISTORY']
                ip   = [ip].flatten[-1]['HOSTNAME']
                port = Integer(nic['EXTERNAL_PORT_RANGE'].split(':')[0]) + 21

                puts
                CLIHelper.print_header(str_h1 % 'PORT FORWARD', false)

                puts "[#{nic['EXTERNAL_PORT_RANGE']}]:" \
                     "[#{nic['INTERNAL_PORT_RANGE'].split('/')[0]}]"

                puts "SSH on #{ip} at port #{port}"
            end
        end

        if !options[:all]
            vm.delete_element('/VM/TEMPLATE/NIC') while vm.has_elements?('/VM/TEMPLATE/NIC')
        end

        if vm.has_elements?('/VM/TEMPLATE/SECURITY_GROUP_RULE') && !is_hybrid
            puts
            CLIHelper.print_header(str_h1 % 'SECURITY', false)
            puts

            CLIHelper::ShowTable.new(nil, self) do
                column :NIC_ID, '', :size => 6 do |d|
                    d['NIC_ID']
                end

                column :NETWORK, '', :left, :size => 25 do |d|
                    d['NETWORK']
                end

                column :SECURITY_GROUPS, '', :left, :size => 47 do |d|
                    d['SECURITY_GROUPS']
                end
            end.show(sg_nics, {})

            puts

            # rubocop:disable Metrics/LineLength
            CLIHelper.print_header(str_h1 % 'SECURITY GROUP   TYPE     PROTOCOL NETWORK                       RANGE          ', false)

            CLIHelper::ShowTable.new(nil, self) do
                column :ID, '', :size => 4 do |d|
                    d['SECURITY_GROUP_ID']
                end

                column :NAME, '', :left, :size => 11 do |d|
                    d['SECURITY_GROUP_NAME']
                end

                column :" ", '', :left, :size => 8 do |d|
                    d['RULE_TYPE']
                end

                column :"  ", '', :left, :size => 8 do |d|
                    protocol = d['PROTOCOL']

                    if protocol.casecmp('ICMP').zero?
                        d['ICMP_TYPE'].nil? ? icmp = '' : icmp = "-#{d['ICMP_TYPE']}"
                        protocol += icmp
                    end

                    protocol
                end

                column :VNET, '', :size => 4 do |d|
                    d['NETWORK_ID']
                end

                column :START, '', :left, :adjust, :size => 17 do |d|
                    network = ''

                    if !d['IP'].nil? && d['IP'] != ''
                        network = d['IP']
                    elsif !d['MAC'].nil? && d['MAC'] != ''
                        network = d['MAC']
                    end

                    network
                end

                column :SIZE, '', :left, :adjust, :size => 6 do |d|
                    d['SIZE']
                end

                column :"   ", '', :left, :adjust, :size => 15 do |d|
                    d['RANGE']
                end
            end.show(
                [vm_hash['VM']['TEMPLATE']['SECURITY_GROUP_RULE']].flatten, {}
            )
            # rubocop:enable Metrics/LineLength

            if !options[:all]
                while vm.has_elements?('/VM/TEMPLATE/SECURITY_GROUP_RULE')
                    vm.delete_element('/VM/TEMPLATE/SECURITY_GROUP_RULE')
                end
            end
        end

        if vm.has_elements?('/VM/TEMPLATE/SNAPSHOT')
            puts
            CLIHelper.print_header(str_h1 % 'SNAPSHOTS', false)

            CLIHelper::ShowTable.new(nil, self) do
                column :ID, '', :size => 4 do |d|
                    d['SNAPSHOT_ID'] unless d.nil?
                end

                column :TIME, '', :size => 12 do |d|
                    OpenNebulaHelper.time_to_str(d['TIME'], false) unless d.nil?
                end

                column :NAME, '', :left, :size => 46 do |d|
                    d['NAME'] unless d.nil?
                end

                column :HYPERVISOR_ID, '', :left, :size => 15 do |d|
                    d['HYPERVISOR_ID'] unless d.nil?
                end
            end.show([vm_hash['VM']['TEMPLATE']['SNAPSHOT']].flatten, {})

            vm.delete_element('/VM/TEMPLATE/SNAPSHOT')
        end

        if vm.has_elements?('/VM/HISTORY_RECORDS')
            puts

            CLIHelper.print_header(str_h1 % 'VIRTUAL MACHINE HISTORY', false)
            format_history(vm)
        end

        if vm.has_elements?('/VM/TEMPLATE/SCHED_ACTION')
            puts
            CLIHelper.print_header(str_h1 % 'SCHEDULED ACTIONS', false)

            table = OpenNebulaHelper.scheduled_action_table(self)
            table.show([vm_hash['VM']['TEMPLATE']['SCHED_ACTION']].flatten, {})
        end

        if !options[:all]
            vm.delete_element('/VM/TEMPLATE/SCHED_ACTION')
        end

        print_backups(vm, vm_hash)

        if vm.has_elements?('/VM/USER_TEMPLATE')
            puts

            CLIHelper.print_header(str_h1 % 'USER TEMPLATE', false)
            puts vm.template_like_str('USER_TEMPLATE')
        end

        if vm.has_elements?('/VM/TEMPLATE/NUMA_NODE')
            print_numa_nodes([vm.to_hash['VM']['TEMPLATE']['NUMA_NODE']]
                             .flatten)
        end

        if vm.has_elements?('/VM/TEMPLATE/TOPOLOGY')
            print_topology([vm.to_hash['VM']['TEMPLATE']['TOPOLOGY']])
        end

        if !options[:all]
            while vm.has_elements?('/VM/TEMPLATE/NUMA_NODE')
                vm.delete_element('/VM/TEMPLATE/NUMA_NODE')
            end
        end

        if !options[:all]
            while vm.has_elements?('/VM/TEMPLATE/TOPOLOGY')
                vm.delete_element('/VM/TEMPLATE/TOPOLOGY')
            end
        end

        puts
        CLIHelper.print_header(str_h1 % 'VIRTUAL MACHINE TEMPLATE', false)
        puts vm.template_str
    end

    def print_backups(vm, vm_hash)
        if vm.has_elements?('/VM/BACKUPS/BACKUP_CONFIG')
            puts
            CLIHelper.print_header(format('%-80s', 'BACKUP CONFIGURATION'), false)
            puts vm.template_like_str('BACKUPS/BACKUP_CONFIG')
        end

        return unless vm.has_elements?('/VM/BACKUPS/BACKUP_IDS')

        puts
        CLIHelper.print_header(format('%-80s', 'VM BACKUPS'), false)

        ids = [vm_hash['VM']['BACKUPS']['BACKUP_IDS']['ID']].flatten

        puts format('IMAGE IDS: %s', ids.join(','))
    end

    def print_numa_nodes(numa_nodes)
        puts
        CLIHelper.print_header('NUMA NODES', false)
        puts

        # rubocop:disable Metrics/LineLength
        table = CLIHelper::ShowTable.new(nil, self) do
            column :ID, 'Node ID', :size => 4, :left => false do |d|
                d['NODE_ID']
            end

            column :CPUS_IDS, 'Cpus used', :adjust => true, :left => false do |d|
                d['CPUS']
            end

            column :MEMORY, 'Memory used', :size => 10, :left => false do |d|
                OpenNebulaHelper.unit_to_str(d['MEMORY'].to_i, {})
            end

            column :TOTAL_CPUS, 'Total CPUs', :size => 10, :left => false do |d|
                d['TOTAL_CPUS']
            end

            default :ID, :CPUS_IDS, :MEMORY, :TOTAL_CPUS
        end
        # rubocop:enable Metrics/LineLength

        table.show(numa_nodes)
    end

    def print_topology(topology)
        puts
        CLIHelper.print_header('TOPOLOGY', false)
        puts

        table = CLIHelper::ShowTable.new(nil, self) do
            column :CORES, 'Cores', :size => 6, :left => false do |d|
                d['CORES']
            end

            column :SOCKETS, 'Sockets', :size => 8, :left => false do |d|
                d['SOCKETS']
            end

            column :THREADS, 'Threads', :size => 8, :left => false do |d|
                d['THREADS']
            end

            default :CORES, :SOCKETS, :THREADS
        end

        table.show(topology)
    end

    def format_history(vm)
        table = CLIHelper::ShowTable.new(nil, self) do
            column :SEQ, 'Sequence number', :size => 3 do |d|
                d['SEQ']
            end

            column :UID, 'UID of the user that performed the action',
                   :left, :size => 4 do |d|
                if d['UID'] != '-1'
                    d['UID']
                else
                    '-'
                end
            end

            column :REQ, 'Request ID of the action', :left, :size => 5 do |d|
                if d['REQUEST_ID'] != '-1'
                    d['REQUEST_ID']
                else
                    '-'
                end
            end

            column :HOST, 'Host name of the VM container',
                   :left, :size => 12 do |d|
                d['HOSTNAME']
            end

            column :ACTION, 'VM state change action', :left, :size => 10 do |d|
                VirtualMachine.get_history_action d['ACTION']
            end

            column :DS, 'System Datastore', :size => 4 do |d|
                d['DS_ID']
            end

            column :START, 'Time when the state changed', :size => 15 do |d|
                OpenNebulaHelper.time_to_str(d['STIME'])
            end

            column :TIME, 'Total time in this state', :size => 11 do |d|
                stime = d['STIME'].to_i
                etime = d['ETIME'] == '0' ? Time.now.to_i : d['ETIME'].to_i
                dtime = etime - stime
                OpenNebulaHelper.period_to_str(dtime, false)
            end

            column :PROLOG, 'Prolog time for this state', :size => 10 do |d|
                stime = d['PSTIME'].to_i
                if d['PSTIME'] == '0'
                    etime = 0
                else
                    if d['PETIME'] == '0'
                        etime = Time.now.to_i
                    else
                        etime = d['PETIME'].to_i
                    end
                end
                dtime = etime - stime
                OpenNebulaHelper.short_period_to_str(dtime)
            end

            default :SEQ, :UID, :REQ, :HOST, :ACTION, \
                    :DS, :START, :TIME, :PROLOG
        end

        vm_hash = vm.to_hash

        history = [vm_hash['VM']['HISTORY_RECORDS']['HISTORY']].flatten

        table.show(history)
    end

    def format_snapshots(vm)
        table = CLIHelper::ShowTable.new(nil, self) do
            column :AC, 'Is active', :left, :size => 2 do |d|
                if d['ACTIVE'] == 'YES'
                    '=>'
                else
                    ''
                end
            end
            column :ID, 'Snapshot ID', :size => 3 do |d|
                d['ID']
            end

            column :DISK, 'Disk ID', :size => 4 do |d|
                d['DISK_ID']
            end

            column :PARENT, 'Snapshot Parent ID', :size => 6 do |d|
                d['PARENT']
            end

            column :CHILDREN, 'Snapshot Children IDs', :size => 10 do |d|
                d['CHILDREN']
            end

            column :SIZE, '', :left, :size => 12 do |d|
                if d['SIZE']
                    size = OpenNebulaHelper.unit_to_str(
                        d['SIZE'].to_i,
                        {},
                        'M'
                    )
                else
                    size = '-'
                end

                if d['MONITOR_SIZE']
                    monitor_size = OpenNebulaHelper.unit_to_str(
                        d['MONITOR_SIZE'].to_i,
                        {},
                        'M'
                    )
                else
                    monitor_size = '-'
                end

                "#{monitor_size}/#{size}"
            end

            column :NAME, 'Snapshot Name', :left, :size => 32 do |d|
                d['NAME']
            end

            column :DATE, 'Snapshot creation date', :size => 15 do |d|
                OpenNebulaHelper.time_to_str(d['DATE'])
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
                data = snapshot.merge('DISK_ID' => disk_id)
                snapshots << data
            end
        end

        # get monitoring data
        snapshots.each do |snapshot|
            disk_id = snapshot['DISK_ID']
            snap_id = snapshot['ID']
            xpath = "MONITORING/SNAPSHOT_SIZE[ID='#{snap_id}' " \
                    "and DISK_ID='#{disk_id}']/SIZE"
            snapshot['MONITOR_SIZE'] = vm[xpath]
        end

        table.show(snapshots)
    end

end

# rubocop:enable Naming/UncommunicativeMethodParamName
