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

    def type
        @rule[:type].downcase.to_sym rescue nil
    end

    def range
        @rule[:range] || nil
    end


    def net
        nets = [@rule[:net]].flatten.compact
        nets.empty? ? nil : nets
    end

    # Helper

    def valid?
        valid = true
        error_message = []

        if !protocol || ![:tcp, :udp, :icmp].include?(protocol)
            error_message << "Invalid protocol: #{protocol}"
            valid = false
        end

        if !type || ![:inbound, :outbound].include?(type)
            error_message << "Invalid type: #{type}"
            valid = false
        end

        if range && !range.match(/^(?:(?:\d+|\d+:\d+),)*(?:\d+|\d+:\d+)$/)
            error_message << "Invalid range: #{range}"
            valid = false
        end

        if net && !valid_net?
            error_message << "Invalid net: #{net}"
            valid = false
        end

        return [valid, error_message.join("\n")]
    end

    def valid_net?
        valid = true

        net.each do |n|
            if !n.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/)
                valid = false
                break
            end
        end

        valid
    end
end

class SecurityGroup
    def initialize(vm, nic, sg)
        @vm  = vm
        @nic = nic
        @sg  = sg[:security_group]

        @rules = []
        @invalid_rules = []

        [@sg[:rule]].flatten.compact.each do |rule|
            @rules << Rule.new(rule)
        end
    end
end

################################################################################
# IPTables Implementation
################################################################################

class SecurityGroupIPTables < SecurityGroup
    # RULE_CLASS = IPTablesRule

    def initialize(vm, nic, sg)
        super(vm, nic, sg)
        @commands = Commands.new

        sg_id = @sg[:security_group_id]
        chain = "one-sg-#{sg_id}"

        vm_id  = @vm['ID']
        nic_id = @nic[:nic_id]

        @chain_in     = "one-#{vm_id}-#{nic_id}-i"
        @chain_out    = "one-#{vm_id}-#{nic_id}-o"

        @chain_sg_in  = "one-#{vm_id}-#{nic_id}-#{sg_id}-i"
        @chain_sg_out = "one-#{vm_id}-#{nic_id}-#{sg_id}-o"
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
                if rule.type == :inbound
                    chain = @chain_sg_in
                else
                    chain = @chain_sg_out
                end

                @commands.iptables("-A #{chain} -p #{rule.protocol} -j ACCEPT")

            elsif rule.range && !rule.net
                # T2 - port range
                if rule.type == :inbound
                    chain = @chain_sg_in
                else
                    chain = @chain_sg_out
                end
                @commands.iptables("-A #{chain} -p #{rule.protocol} -m multiport --dports #{rule.range} -j ACCEPT")

            elsif !rule.range && rule.net
                # T3 - net
                if rule.type == :inbound
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
                if rule.type == :inbound
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
    DRIVER = "fw"
    XPATH_FILTER =  "TEMPLATE/NIC[SECURITY_GROUP_POOL/SECURITY_GROUP)]"
    SECURITY_GROUP_CLASS = SecurityGroupIPTables

    def initialize(vm, deploy_id = nil, hypervisor = nil)
        super(vm, XPATH_FILTER, deploy_id, hypervisor)
        @locking = true
    end

    def activate
        deactivate

        lock

        vm_id = @vm['ID']

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

            # Flatten nic[:security_group_pool]
            # it can be a Hash or an Array of Hashes for more than one
            security_groups = [nic[:security_group_pool]].flatten.compact

            security_groups.each do |sg|
                sg = SECURITY_GROUP_CLASS.new(@vm, nic, sg)

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
