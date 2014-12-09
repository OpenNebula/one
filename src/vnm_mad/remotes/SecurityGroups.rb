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

require 'IPNetmask'

################################################################################
# SecurityGroups and Rules
################################################################################

class CommandsError < StandardError; end

class Commands
    def initialize
        clear!
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
                clear!
                raise CommandsError.new(c), "Command Error: #{c}"
            end
        }

        clear!
        out
    end

    def uniq!
        @commands.uniq!
    end

    def clear!
        @commands = []
    end

    def to_a
        @commands
    end
end

class RuleError < StandardError; end

class Rule
    TYPES = {
        # PROTOCOL, RULE_TYPE, NET, RANGE, ICMP_TYPE
        [        1,         1,   0,     0,         0 ] => :protocol,
        [        1,         1,   0,     1,         0 ] => :portrange,
        [        1,         1,   0,     0,         1 ] => :icmp_type,
        [        1,         1,   1,     0,         0 ] => :net,
        [        1,         1,   1,     1,         0 ] => :net_portrange,
        [        1,         1,   1,     0,         1 ] => :net_icmp_type
    }

    ICMP_TYPES = %w{3 5 11 12 0 4 8 9 10 13 14 17 18}

    ICMP_TYPES_EXPANDED = {
        3  => [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15],
        5  => [0, 1, 2, 3],
        11 => [0, 1],
        12 => [0, 1]
    }

    def initialize(rule)
        @rule = rule
        @commands = Commands.new

        if !valid?
            raise RuleError.new, "Invalid Rule: #{error_message}"
        end
    end

    # Getters
    def protocol
        p = @rule[:protocol].downcase.to_sym rescue nil

        if p == :ipsec
            :esp
        else
            p
        end
    end

    def rule_type
        @rule[:rule_type].downcase.to_sym rescue nil
    end

    def range
        @rule[:range]
    end

    def net
        return nil if @rule[:ip].nil? || @rule[:size].nil?

        r = Range.new(@rule[:ip], @rule[:size].to_i)
        r.get_nets.collect{|n| n.to_s}
    end

    def icmp_type
        @rule[:icmp_type]
    end

    def icmp_type_expand
        if (codes = ICMP_TYPES_EXPANDED[icmp_type.to_i])
            codes.collect{|e| "#{icmp_type}/#{e}"}
        else
            ["#{icmp_type}/0"]
        end
    end

    # Helper

    def valid?
        valid = true
        error_message = []

        if type.nil?
            error_message << "Invalid combination of rule attributes: "
            error_message << type(true).to_s
            valid = false
        end

        if !protocol || ![:all, :tcp, :udp, :icmp, :esp].include?(protocol)
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

        if icmp_type && !ICMP_TYPES.include?(icmp_type)
            error_message << "ICMP Type '#{icmp_type}' not supported. Valid list is '#{ICMP_TYPES.join(',')}'"
        end

        if icmp_type && !(protocol == :icmp)
            error_message << "Protocol '#{protocol}' does not support ICMP TYPES"
            valid = false
        end

        if range && ![:tcp, :udp].include?(protocol)
            error_message << "Protocol '#{protocol}' does not support port ranges"
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

    # Returns the rule type. Rules currently support these (final and relevant)
    # attributes.
    #
    # PROTOCOL (mandatory)
    #   - Specifies the protocol of the rule
    #   - values: ['ALL', 'TCP', 'UDP', 'ICMP', 'IPSEC']
    #
    # RULE_TYPE (mandatory)
    #   - Specifies the direction of application of the rule
    #   - values: ['INBOUND', 'OUTBOUND']
    #
    # RANGE (optional)
    #   - only works for protocols ['TCP', 'UDP']
    #   - uses the iptables multiports syntax
    #
    # ICMP_TYPE (optional)
    #   - Only works for protocol 'ICMP'
    #   - Is either in the form of '<TYPE>' or '<TYPE>/<CODE>', where both
    #     '<TYPE>' and '<CODE>' are integers. This class has a helper method
    #     tgat expands '<TYPE>' into all the '<TYPE>/<CODE>' subtypes.
    #
    # IP and SIZE (optional but must be specified together)
    #   - Can be applied to any protocol
    #   - IP is the first valid IP and SIZE is the number of consecutive IPs
    #
    # Depending on the combination of these attributes we can obtaine 4 rule
    # rule types (some with subtypes):
    #
    # ['PROTOCOL', 'RULE_TYPE'] => Type 1: 'protocol'
    # ['PROTOCOL', 'RULE_TYPE', 'RANGE'] => Type 2A: 'portrange'
    # ['PROTOCOL', 'RULE_TYPE', 'ICMP_TYPE'] => Type 2B: 'icmp_type'
    # ['PROTOCOL', 'RULE_TYPE', 'IP', 'SIZE'] => Type 3: 'net'
    # ['PROTOCOL', 'RULE_TYPE', 'IP', 'SIZE', 'RANGE'] => Type 4A: 'net_portrange'
    # ['PROTOCOL', 'RULE_TYPE', 'IP', 'SIZE', 'ICMP_TYPE'] => Type 4B: 'net_icmp_type'
    #
    # @return [Symbol] The rule type
    def type(only_key = false)
        key = [protocol, rule_type, net, range, icmp_type].collect do |e|
            !!e ? 1 : 0
        end

        only_key ? key : TYPES[key]
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
        end if rules
    end
end

################################################################################
# IPTables Implementation
################################################################################

class SecurityGroupIPTables < SecurityGroup
    GLOBAL_CHAIN = "opennebula"

    def initialize(vm, nic, sg_id, rules)
        super

        @commands = Commands.new

        @vars = self.class.vars(@vm, @nic, @sg_id)

        @chain_in   = @vars[:chain_in]
        @chain_out  = @vars[:chain_out]
        @set_sg_in  = @vars[:set_sg_in]
        @set_sg_out = @vars[:set_sg_out]
    end

    def process_rules
        @rules.each do |rule|
            case rule.type
            when :protocol
                chain = rule.rule_type == :inbound ? @chain_in : @chain_out
                @commands.iptables("-A #{chain} -p #{rule.protocol} -j RETURN")

            when :portrange
                chain = rule.rule_type == :inbound ? @chain_in : @chain_out
                @commands.iptables("-A #{chain} -p #{rule.protocol} -m multiport --dports #{rule.range} -j RETURN")

            when :icmp_type
                chain = rule.rule_type == :inbound ? @chain_in : @chain_out
                @commands.iptables("-A #{chain} -p icmp --icmp-type #{rule.icmp_type} -j RETURN")

            when :net
                if rule.rule_type == :inbound
                    chain = @chain_in
                    set   = "#{@set_sg_in}-#{rule.protocol}-n"
                    dir   = "src"
                else
                    chain = @chain_out
                    set   = "#{@set_sg_out}-#{rule.protocol}-n"
                    dir   = "dst"
                end

                @commands.ipset("create #{set} hash:net")
                @commands.iptables("-A #{chain} -p #{rule.protocol} -m set --match-set #{set} #{dir} -j RETURN")

                rule.net.each do |n|
                    @commands.ipset("add -exist #{set} #{n}")
                end

            when :net_portrange
                if rule.rule_type == :inbound
                    chain = @chain_in
                    set   = @set_sg_in + "-nr"
                    dir = "src,dst"
                else
                    chain = @chain_in
                    set   = @set_sg_in + "-n"
                    dir = "dst,dst"
                end

                @commands.ipset("create #{set} hash:net,port")
                @commands.iptables("-A #{chain} -m set --match-set #{set} #{dir} -j RETURN")

                rule.net.each do |n|
                    rule.range.split(",").each do |r|
                        r.gsub!(":","-")
                        net_range = "#{n},#{rule.protocol}:#{r}"
                        @commands.ipset("add -exist #{set} #{net_range}")
                    end
                end

            when :net_icmp_type
                if rule.rule_type == :inbound
                    chain = @chain_in
                    set   = @set_sg_in + "-nr"
                    dir = "src,dst"
                else
                    chain = @chain_in
                    set   = @set_sg_in + "-n"
                    dir = "dst,dst"
                end

                @commands.ipset("create #{set} hash:net,port")
                @commands.iptables("-A #{chain} -m set --match-set #{set} #{dir} -j RETURN")

                rule.net.each do |n|
                    rule.icmp_type_expand.each do |type_code|
                        net_range = "#{n},icmp:#{type_code}"
                        @commands.ipset("add -exist #{set} #{net_range}")
                    end if rule.icmp_type_expand
                end
            end
        end

        @commands.uniq!
    end

    def run!
        @commands.run!
    end

    ############################################################################
    # Static methods
    ############################################################################

    def self.global_bootstrap
        info = self.info

        if !info[:iptables_s].split("\n").include? "-N #{GLOBAL_CHAIN}"
            commands = Commands.new

            commands.iptables "-N #{GLOBAL_CHAIN}"
            commands.iptables "-A FORWARD -m physdev --physdev-is-bridged -j #{GLOBAL_CHAIN}"
            commands.iptables "-A #{GLOBAL_CHAIN} -j ACCEPT"

            commands.run!
        end
    end

    def self.nic_pre(vm, nic)
        commands = Commands.new

        vars = self.vars(vm, nic)

        chain     = vars[:chain]
        chain_in  = vars[:chain_in]
        chain_out = vars[:chain_out]

        # create chains
        commands.iptables "-N #{chain_in}" # inbound
        commands.iptables "-N #{chain_out}" # outbound

        # Send traffic to the NIC chains
        commands.iptables"-I #{GLOBAL_CHAIN} -m physdev --physdev-out #{nic[:tap]} --physdev-is-bridged -j #{chain_in}"
        commands.iptables"-I #{GLOBAL_CHAIN} -m physdev --physdev-in  #{nic[:tap]} --physdev-is-bridged -j #{chain_out}"

        # Mac-spofing
        if nic[:filter_mac_spoofing] == "YES"
            commands.iptables"-A #{chain_out} -m mac ! --mac-source #{nic[:mac]} -j DROP"
        end

        # IP-spofing
        if nic[:filter_ip_spoofing] == "YES"
            commands.iptables"-A #{chain_out} ! --source #{nic[:ip]} -j DROP"
        end

        # Related, Established
        commands.iptables"-A #{chain_in} -m state --state ESTABLISHED,RELATED -j ACCEPT"
        commands.iptables"-A #{chain_out} -m state --state ESTABLISHED,RELATED -j ACCEPT"

        commands.run!
    end

    def self.nic_post(vm, nic)
        vars      = self.vars(vm, nic)
        chain_in  = vars[:chain_in]
        chain_out = vars[:chain_out]

        commands = Commands.new
        commands.iptables("-A #{chain_in} -j DROP")
        commands.iptables("-A #{chain_out} -j DROP")

        commands.run!
    end

    def self.nic_deactivate(vm, nic)
        vars      = self.vars(vm, nic)
        chain     = vars[:chain]
        chain_in  = vars[:chain_in]
        chain_out = vars[:chain_out]

        info              = self.info
        iptables_forwards = info[:iptables_forwards]
        iptables_s        = info[:iptables_s]
        ipset_list        = info[:ipset_list]

        commands = Commands.new

        iptables_forwards.lines.reverse_each do |line|
            fields = line.split
            if [chain_in, chain_out].include?(fields[1])
                n = fields[0]
                commands.iptables("-D #{GLOBAL_CHAIN} #{n}")
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
    end

    def self.info
        commands = Commands.new

        commands.iptables("-S")
        iptables_s = commands.run!

        if iptables_s.match(/^-N #{GLOBAL_CHAIN}$/)
            commands.iptables("-L #{GLOBAL_CHAIN} --line-numbers")
            iptables_forwards = commands.run!
        else
            iptables_forwards = ""
        end

        commands.ipset("list -name")
        ipset_list = commands.run!

        {
            :iptables_forwards => iptables_forwards,
            :iptables_s => iptables_s,
            :ipset_list => ipset_list
        }
    end


    def self.vars(vm, nic, sg_id = nil)
        vm_id  = vm['ID']
        nic_id = nic[:nic_id]

        vars = {}

        vars[:vm_id]     = vm_id,
        vars[:nic_id]    = nic_id,
        vars[:chain]     = "one-#{vm_id}-#{nic_id}",
        vars[:chain_in]  = "#{vars[:chain]}-i",
        vars[:chain_out] = "#{vars[:chain]}-o"

        if sg_id
            vars[:set_sg_in]  = "#{vars[:chain]}-#{sg_id}-i"
            vars[:set_sg_out] = "#{vars[:chain]}-#{sg_id}-o"
        end

        vars
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
    XPATH_FILTER =  "TEMPLATE/NIC"
    SECURITY_GROUP_CLASS = SecurityGroupIPTables

    def initialize(vm, deploy_id = nil, hypervisor = nil)
        super(vm, XPATH_FILTER, deploy_id, hypervisor)
        @locking = true
        @commands = Commands.new

        get_security_group_rules
    end

    def get_security_group_rules
        rules = {}
        @vm.vm_root.elements.each('TEMPLATE/SECURITY_GROUP_RULE') do |r|
            security_group_rule = {}

            r.elements.each do |e|
                key = e.name.downcase.to_sym
                security_group_rule[key] = e.text
            end

            id = security_group_rule[:security_group_id]
            rules[id] = [] if rules[id].nil?
            rules[id] << security_group_rule
        end
        @security_group_rules = rules
    end

    def activate
        deactivate
        lock

        # Global Bootstrap
        SECURITY_GROUP_CLASS.global_bootstrap

        # Process the rules
        @vm.nics.each do |nic|
            next if nic[:security_groups].nil? \
                && nic[:filter_mac_spoofing] != "YES" \
                && nic[:filter_ip_spoofing]  != "YES"


            SECURITY_GROUP_CLASS.nic_pre(@vm, nic)

            sg_ids = nic[:security_groups].split(",")
            sg_ids.each do |sg_id|
                rules = @security_group_rules[sg_id]
                sg = SECURITY_GROUP_CLASS.new(@vm, nic, sg_id, rules)

                begin
                    sg.process_rules
                    sg.run!
                rescue Exception => e
                    unlock
                    raise OpenNebulaSGError.new(:security_groups, e)
                end
            end

            SECURITY_GROUP_CLASS.nic_post(@vm, nic)
        end

        unlock
    end

    def deactivate
        lock

        begin
            @vm.nics.each do |nic|
                SECURITY_GROUP_CLASS.nic_deactivate(@vm, nic)
            end
        rescue Exception => e
            raise OpenNebulaSGError.new(:deactivate, e)
        ensure
            unlock
        end
    end
end
