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

################################################################################
# IP and NETMASK Library
################################################################################

class IP
    include Comparable
    attr_accessor :ip

    def initialize(ip)
        @ip = ip
    end

    def to_s
        @ip
    end

    def to_i
        @ip.split(".").inject(0) {|t,e| (t << 8) + e.to_i }
    end

    def to_hex
        "0x" + to_i.to_s(16).rjust(8, '0')
    end

    def to_bin
        "0b" + to_i.to_s(2).rjust(16, '0')
    end

    def to_hex_groups(p="")
        to_i.to_s(16).rjust(8, '0').scan(/.{2}/).collect{|e| p+e}.join('.')
    end

    def to_bin_groups(p="")
        to_i.to_s(2).rjust(16, '0').scan(/.{8}/).collect{|e| p+e}.join('.')
    end

    def self.from_i(i)
        ip = 3.downto(0).collect {|s| (i >> 8*s) & 0xff }.join('.')
        self.new(ip)
    end

    def &(another_ip)
        IP.from_i(self.to_i & another_ip.to_i)
    end

    def +(size)
        IP.from_i(self.to_i + size)
    end

    def -(e)
        if e.instance_of? Fixnum
            IP.from_i(self.to_i - e)
        else
            e.to_i - self.to_i
        end
    end

    def <=>(another_ip)
        self.to_i <=> another_ip.to_i
    end
end

class Netmask < IP
    def self.from_cidr(cidr)
        self.from_i(0xffffffff ^ 2**(32-cidr)-1)
    end

    def to_cidr
        32 - Math.log((to_i ^ 0xffffffff) + 1, 2).to_i
    end
end

class Net
    attr_accessor :ip, :netmask

    def initialize(ip, netmask = nil)
        if netmask
            @ip, @netmask = ip, netmask
        else
            ip, netmask = ip.split('/')
            @ip         = IP.new(ip)
            @netmask    = Netmask.from_cidr(netmask.to_i) if netmask
        end

        @network_address = network_address
        @last_address    = last_address
    end

    def network_address
        IP.from_i(@ip.to_i & @netmask.to_i)
    end

    def last_address
        IP.from_i(@ip.to_i | (@netmask.to_i ^ 0xffffffff))
    end

    def info
        s = ""
        s << @network_address.to_s.ljust(15)
        s << " /"
        s << @netmask.to_cidr.to_s.rjust(2)
        s << " "
        s << @network_address.to_s.ljust(15)
        s << " "
        s << last_address.to_s.ljust(15)

        s
    end

    def to_s
        "#{@network_address}/#{@netmask.to_cidr}"
    end

    def next_net
        next_ip = IP.from_i(last_address.to_i + 1)
        Net.new(next_ip, @netmask)
    end

    def between?(ip_start, ip_end)
        network_address >= ip_start && last_address <= ip_end
    end
end

class Range
    def initialize(ip_start, size)
        @ip_start = IP.new(ip_start)
        @ip_end   = @ip_start + size
    end

    def get_nets
        self.class.get_nets(@ip_start, @ip_end)
    end

    def largest_subnet
        self.class.largest_subnet(@ip_start, @ip_end)
    end

    def self.get_nets(ip_start, ip_end)
        nets = []

        net_m = largest_subnet(ip_start, ip_end)

        # left scraps
        if ip_start < net_m.network_address
            nets.concat get_nets(ip_start, net_m.network_address - 1)
        end

        nets << net_m

        # right scraps
        if net_m.last_address < ip_end
            nets.concat get_nets(net_m.last_address + 1, ip_end)
        end

        nets
    end

    def self.largest_subnet(ip_start, ip_end)
        size = ip_start - ip_end

        # start with the largest subnet
        if size > 0
            cidr = 32 - Math.log(size, 2).floor
        else
            cidr = 32
        end

        fits = false

        while !fits
            net = Net.new(ip_start, Netmask.from_cidr(cidr))
            net = net.next_net if ip_start > net.network_address

            cidr += 1
            break if cidr > 32

            fits = net.between?(ip_start, ip_end)
        end

        net
    end
end

################################################################################
# SecurityGroups and Rules
################################################################################

class CommandsError < StandardError; end

class Commands
    def initialize
        @commands = []
    end

    def add(cmd)
        if cmd.instance_of?(String)
            @commands << cmd
        else
            @commands.concat(cmd.to_a)
        end
    end

    def method_missing(m, *args, &block)
        if COMMANDS.keys.include?(m)
            @commands << "#{COMMANDS[m]} #{args.join(' ')}"
        else
            super
        end
    end

    def run!
        out = ""

        @commands.each{|c|
            out << `#{c}`

            if !$?.success?
                @commands = []
                raise CommandsError.new(c), "Command Error: #{c}"
            end
        }

        @commands = []
        out
    end

    def to_a
        @commands
    end
end

class RuleError < StandardError; end

class Rule
    def initialize(rule)
        @rule = rule
        @commands = Commands.new

        if !valid?
            raise RuleError.new, "Invalid Rule: #{error_message}"
        end
    end

    # Getters
    def protocol
        @rule[:protocol].downcase.to_sym rescue nil
    end

    def rule_type
        @rule[:rule_type].downcase.to_sym rescue nil
    end

    def range
        @rule[:range] || nil
    end

    def net
        return nil if @rule[:ip].nil? || @rule[:size].nil?

        r = Range.new(@rule[:ip], @rule[:size].to_i)
        r.get_nets.collect{|n| n.to_s}
    end

    # Helper

    def valid?
        valid = true
        error_message = []

        if !protocol || ![:tcp, :udp, :icmp].include?(protocol)
            error_message << "Invalid protocol: #{protocol}"
            valid = false
        end

        if !rule_type || ![:inbound, :outbound].include?(rule_type)
            error_message << "Invalid rule_type: #{rule_type}"
            valid = false
        end

        if range && !range.match(/^(?:(?:\d+|\d+:\d+),)*(?:\d+|\d+:\d+)$/)
            error_message << "Invalid range: #{range}"
            valid = false
        end

        if net && !valid_net?
            error_message << "Invalid net: IP:'#{@rule[:ip]}' SIZE:'#{@rule[:size]}'"
            valid = false
        end

        return [valid, error_message.join("\n")]
    end

    def valid_net?
        @rule[:ip].match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && \
            @rule[:size].match(/^\d+$/)
    end
end

class SecurityGroup
    def initialize(vm, nic, sg_id, rules)
        @vm  = vm
        @nic = nic
        @sg_id = sg_id

        @rules = []
        @invalid_rules = []

        rules.each do |rule|
            @rules << Rule.new(rule)
        end
    end
end

################################################################################
# IPTables Implementation
################################################################################

class SecurityGroupIPTables < SecurityGroup
    # RULE_CLASS = IPTablesRule

    def initialize(vm, nic, sg_id, rules)
        super

        @commands = Commands.new

        chain = "one-sg-#{@sg_id}"

        vm_id  = @vm['ID']
        nic_id = @nic[:nic_id]

        @chain_in     = "one-#{vm_id}-#{nic_id}-i"
        @chain_out    = "one-#{vm_id}-#{nic_id}-o"

        @chain_sg_in  = "one-#{vm_id}-#{nic_id}-#{@sg_id}-i"
        @chain_sg_out = "one-#{vm_id}-#{nic_id}-#{@sg_id}-o"
    end

    def bootstrap
        # SG chains
        @commands.iptables("-N #{@chain_sg_in}")
        @commands.iptables("-N #{@chain_sg_out}")

        # Redirect Traffic
        @commands.iptables("-A #{@chain_in} -j #{@chain_sg_in}")
        @commands.iptables("-A #{@chain_out} -j #{@chain_sg_out}")

        # IPsets
        @commands.ipset("create #{@chain_sg_in}-n hash:net")
        @commands.ipset("create #{@chain_sg_out}-n hash:net")
        @commands.ipset("create #{@chain_sg_in}-nr hash:net,port")
        @commands.ipset("create #{@chain_sg_out}-nr hash:net,port")
    end

    def process_rules
        @rules.each do |rule|
            if !rule.range && !rule.net
                # T1 - protocol
                if rule.rule_type == :inbound
                    chain = @chain_sg_in
                else
                    chain = @chain_sg_out
                end

                @commands.iptables("-A #{chain} -p #{rule.protocol} -j ACCEPT")

            elsif rule.range && !rule.net
                # T2 - port range
                if rule.rule_type == :inbound
                    chain = @chain_sg_in
                else
                    chain = @chain_sg_out
                end
                @commands.iptables("-A #{chain} -p #{rule.protocol} -m multiport --dports #{rule.range} -j ACCEPT")

            elsif !rule.range && rule.net
                # T3 - net
                if rule.rule_type == :inbound
                    chain = @chain_sg_in
                    dir = "src"
                else
                    chain = @chain_sg_out
                    dir = "dst"
                end

                set = "#{chain}-n"

                @commands.iptables("-A #{chain} -p #{rule.protocol} -m set --match-set #{set} #{dir} -j ACCEPT")

                rule.net.each do |n|
                    @commands.ipset("add -exist #{set} #{n}")
                end

            elsif rule.range && rule.net
                # T4 - net && port range
                if rule.rule_type == :inbound
                    chain = @chain_sg_in
                    dir = "src,dst"
                else
                    chain = @chain_sg_out
                    dir = "dst,dst"
                end

                set = "#{chain}-nr"

                @commands.iptables("-A #{chain} -m set --match-set #{set} #{dir} -j ACCEPT")

                rule.net.each do |n|
                    rule.range.split(",").each do |r|
                        r.gsub!(":","-")
                        net_range = "#{n},#{rule.protocol}:#{r}"
                        @commands.ipset("add -exist #{set} #{net_range}")
                    end
                end
            end
        end
    end

    def run!
        @commands.run!
    end
end

################################################################################
# OpenNebula Firewall with Security Groups Based on IPTables (KVM and Xen)
################################################################################

class OpenNebulaSGError < StandardError
    attr_reader :stage, :error
    def initialize(stage, error = nil)
        @stage = stage
        @error = error
    end
end

class OpenNebulaSG < OpenNebulaNetwork
    DRIVER = "sg"
    XPATH_FILTER =  "TEMPLATE/NIC[SECURITY_GROUPS]"
    SECURITY_GROUP_CLASS = SecurityGroupIPTables

    def initialize(vm, deploy_id = nil, hypervisor = nil)
        super(vm, XPATH_FILTER, deploy_id, hypervisor)
        @locking = true
    end

    def activate
        deactivate

        lock

        vm_id = @vm['ID']

        security_group_rules = {}

        @vm.vm_root.elements.each('TEMPLATE/SECURITY_GROUP_RULE') do |r|
            security_group_rule = {}

            r.elements.each do |e|
                key = e.name.downcase.to_sym
                security_group_rule[key] = e.text
            end

            id = security_group_rule[:security_group_id]

            security_group_rules[id] = [] if security_group_rules[id].nil?

            security_group_rules[id] << security_group_rule
        end

        @vm.nics.each do |nic|
            commands = Commands.new

            nic_id = nic[:nic_id]

            chain     = "one-#{vm_id}-#{nic_id}"
            chain_in  = "#{chain}-i"
            chain_out = "#{chain}-o"

            # create nic chains
            commands.iptables("-N #{chain_in}") # inbound
            commands.iptables("-N #{chain_out}") # outbound

            # Send traffic to the NIC chains
            commands.iptables("-A FORWARD -m physdev --physdev-out vnet0 --physdev-is-bridged -j #{chain_in}")
            commands.iptables("-A FORWARD -m physdev --physdev-in  vnet0 --physdev-is-bridged -j #{chain_out}")

            # Related, Established
            commands.iptables("-A #{chain_in} -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT")
            commands.iptables("-A #{chain_out} -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT")

            begin
                commands.run!
            rescue Exception => e
                raise OpenNebulaSGError.new(:bootstrap, e)
            end

            sg_ids = nic[:security_groups].split(",")

            sg_ids.each do |sg_id|
                rules = security_group_rules[sg_id]

                sg = SECURITY_GROUP_CLASS.new(@vm, nic, sg_id, rules)

                sg.bootstrap
                sg.process_rules

                begin
                    sg.run!
                rescue Exception => e
                    raise OpenNebulaSGError.new(:security_groups, e)
                end
            end

            commands.iptables("-A #{chain_in} -j DROP") # inbound
            commands.iptables("-A #{chain_out} -j DROP") # outbound

            commands.run!
        end

        unlock
    end

    def deactivate
        lock

        vm_id = @vm['ID']

        @vm.nics.each do |nic|
            commands = Commands.new

            nic_id = nic[:nic_id]

            chain     = "one-#{vm_id}-#{nic_id}"
            chain_in  = "#{chain}-i"
            chain_out = "#{chain}-o"

            # remove everything
            begin
                commands.iptables("-L FORWARD --line-numbers")
                iptables_forwards = commands.run!

                commands.iptables("-S")
                iptables_s = commands.run!

                commands.ipset("list -name")
                ipset_list = commands.run!

                iptables_forwards.lines.reverse.each do |line|
                    fields = line.split
                    if [chain_in, chain_out].include?(fields[1])
                        n = fields[0]
                        commands.iptables("-D FORWARD #{n}")
                    end
                end

                remove_chains = []
                iptables_s.lines.each do |line|
                    if line.match(/^-N #{chain}/)
                         remove_chains << line.split[1]
                    end
                end
                remove_chains.each {|c| commands.iptables("-F #{c}") }
                remove_chains.each {|c| commands.iptables("-X #{c}") }

                ipset_list.lines.each do |line|
                    if line.match(/^#{chain}/)
                        set = line.strip
                        commands.ipset("destroy #{set}")
                    end
                end

                commands.run!
            rescue Exception => e
                raise OpenNebulaSGError.new(:deactivate, e)
            end
        end

        unlock
    end
end
