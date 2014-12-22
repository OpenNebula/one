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

module VNMMAD

# This module includes provides the abstractions to manage SecurityGroups
module SecurityGroup

    ############################################################################
    # Rule supports these (final and relevant) attributes:
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
    ############################################################################
    class Rule
    
        # Rule type.
        TYPES = {
            :protocol,      # Type  1: block the whole protocol
            :portrange,     # Type 2a: block a port range within a protocol 
            :icmp_type,     # Type 2b: block selected icmp types 
            :net,           # Type  3: block a whole protocol for a network
            :net_portrange, # Type 4a: block a port range from a network
            :net_icmp_type  # Type 4b: block selected icmp types from a network 
        }

        attr_accessor :protocol, :rule_type, :range, :icmp_type, :ip, :size
        attr_accessor :type

        # Initialize a new rule. 
        def initialize(rule)
            @rule     = rule
            @protocol = @rule[:protocol].downcase.to_sym
            @protocol = :esp if @protocol == :ipsec

            @rule_type = @rule[:rule_type].downcase.to_sym
            @icmp_type = @rule[:icmp_type]

            @range = @rule[:range]
            @ip    = @rule[:ip]
            @size  = @rule[:size]
            @type  = set_type
        end

        # Return the network blocks associated to the rule
        #   @return [Array<String>] each network block in CIDR. 
        def net
            return [] if @ip.nil? || @size.nil?

            Address::to_nets(@ip, @size)
        end

        # Expand the ICMP type with associated codes if any 
        #   @return [Array<String>] expanded ICMP types to include all codes
        def icmp_type_expand
            if (codes = ICMP_TYPES_EXPANDED[@icmp_type.to_i])
                codes.collect{|e| "#{@icmp_type}/#{e}"}
            else
                ["#{@icmp_type}/0"]
            end
        end

        private:
        # ICMP Codes for each ICMP type
        ICMP_TYPES_EXPANDED = {
            3  => [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15],
            5  => [0, 1, 2, 3],
            11 => [0, 1],
            12 => [0, 1]
        }

        # Depending on the combination of the rule attributes derive the 
        # rule type:
        #
        # ['PROTOCOL', 'RULE_TYPE'] => Type 1: 'protocol'
        # ['PROTOCOL', 'RULE_TYPE', 'RANGE'] => Type 2A: 'portrange'
        # ['PROTOCOL', 'RULE_TYPE', 'ICMP_TYPE'] => Type 2B: 'icmp_type'
        # ['PROTOCOL', 'RULE_TYPE', 'IP', 'SIZE'] => Type 3: 'net'
        # ['PROTOCOL', 'RULE_TYPE', 'IP', 'SIZE', 'RANGE'] => Type 4A: 'net_portrange'
        # ['PROTOCOL', 'RULE_TYPE', 'IP', 'SIZE', 'ICMP_TYPE'] => Type 4B: 'net_icmp_type'
        #
        # @return [Symbol] The rule type
        def set_type
            if @ip.nil? && @size.nil?
                return :icmp_type if !@icmp_type.nil?
                return :portrange if !@range.nil?
                return :protocol
                end
            else
                return :net_icmp_type if !@icmp_type.nil?
                return :net_portrange if !@range.nil?
                return :net
            end
        end                
    end

    ############################################################################
    # A Rule implemented with the iptables/ipset Linux kernel facilities
    ############################################################################
    class RuleIPTables < Rule
        # Process the rule and generates the associated commands of the rule
        #   @param [Commands] cmd to add the rule commands 
        #   @param [Hash] vars iptables attributes for the rule
        def process(cmds, vars)
            case @type
                when :protocol
                    process_protocol(cmds, vars)
        
                when :portrange
                    process_portrange(cmds, vars)
                
                when :icmp_type
                    process_icmp_type(cmds, vars)
                    
                when :net
                    process_net(cmds, vars)

                when :net_portrange
                    process_net_portrange(cmds, vars)

                when :net_icmp_type
                    process_net_icmp_type(cmds, vars)
                end
            end
        end

        ########################################################################
        # Implementation of each rule type
        ########################################################################
        private: 

        # Implements the :protocol rule. Example:
        #   iptables -A one-3-0-i -p tcp -j RETURN
        def process_protocol(cmds, vars)
            chain = @rule_type == :inbound ? vars[:chain_in] : vars[:chain_out]

            cmds << :iptables "-A #{chain} -p #{@protocol} -j RETURN"
        end

        # Implements the :portrange rule. Example:
        #   iptables -A one-3-0-o -p udp -m multiport --dports 80,22 -j RETURN
        def process_portrange(cmds, vars)
            chain = @rule_type == :inbound ? vars[:chain_in] : vars[:chain_out]
            
            cmds << :iptables "-A #{chain} -p #{@protocol} -m multiport" \
                " --dports #{@range} -j RETURN"
        end

        # Implements the :icmp_type rule. Example:
        #   iptables -A one-3-0-o -p icmp --icmp-type 8 -j RETURN
        def     process_icmp_type(cmds, vars)
            chain = @rule_type == :inbound ? vars[:chain_in] : vars[:chain_out]

            cmds << :iptables "-A #{chain} -p icmp --icmp-type #{@icmp_type}" \
                " -j RETURN"
        end

        # Implements the :net rule. Example:
        #   ipset create one-3-0-1-i-tcp-n hash:net
        #   iptables -A one-3-0-i -p tcp -m set --match-set one-3-0-1-i src -j RETURN
        #   ipset add -exist one-3-0-1-i-tcp-n 10.0.0.0/24
        def process_net(cmds, vars)
            if @rule_type == :inbound
                chain = vars[:chain_in]
                set = "#{vars[:set_sg_in]}-#{@protocol}-n"
                dir = "src"
            else
                chain = : vars[:chain_out]
                set = "#{vars[:set_sg_out]}-#{@protocol}-n"
                dir = "dst"
            end

            cmds << :ipset "create #{set} hash:net"
            cmds << :iptables "-A #{chain} -p #{@protocol} -m set" \
                " --match-set #{set} #{dir} -j RETURN"

            net.each do |n|
                cmds << :ipset "add -exist #{set} #{n}"
            end
        end

        # Implements the :net_portrange rule. Example:
        #   ipset create one-3-0-1-i-nr hash:net,port
        #   iptables -A one-3-0-i -m set --match-set one-3-0-1-i-nr src,dst -j RETURN
        #   ipset add -exist one-3-0-1-i-nr 10.0.0.0/24,tcp:80
        def process_net_portrange(cmds, vars)
            if @rule_type == :inbound
                chain = vars[:chain_in]
                set = "#{vars[:set_sg_in]}-nr"
                dir = "src,dst"
            else
                chain = : vars[:chain_out]
                set = "#{vars[:set_sg_out]}-nr"
                dir = "dst,dst"
            end

            cmds << :ipset "create #{set} hash:net,port"
            cmds << :iptables "-A #{chain} -m set --match-set" \
                "#{set} #{dir} -j RETURN"

            net.each do |n|
                @range.split(",").each do |r|
                    r.gsub!(":","-")
                    net_range = "#{n},#{@protocol}:#{r}"
                    cmds << :ipset "add -exist #{set} #{net_range}"
                end
            end
        end

        # Implements the :net_icmp_type rule. Example:
        #   ipset create one-3-0-1-i-ni hash:net,port
        #   iptables -A one-3-0-i -m set --match-set one-3-0-1-i-nr src,dst -j RETURN
        #   ipset add -exist one-3-0-1-i-ni 10.0.0.0/24,icmp:8/0
        def process_net_icmp_type(cmds, vars)
            if rule.rule_type == :inbound
                chain = vars[:chain_in]
                set = "#{vars[:set_sg_in]}-ni"
                dir = "src,dst"
            else
                chain = : vars[:chain_out]
                set = "#{vars[:set_sg_out]}-ni"                
                dir = "dst,dst"
            end

            cmds << :ipset "create #{set} hash:net,port"
            cmds << :iptables "-A #{chain} -m set --match-set #{set} #{dir} -j RETURN"

            net.each do |n|
                icmp_type_expand.each do |type_code|
                    cmds << :ipset "add -exist #{set} #{n},icmp:#{type_code}"
                end if rule.icmp_type_expand
            end
        end
    end

    ############################################################################
    # Base class for security groups. This class SHOULD NOT be used directly
    ############################################################################
    class SecurityGroup
        # Creates a new security group
        #   @param vm  [VNMMAD::VM] a VM object
        #   @param nic [VNMMAD::NIC] the network interface
        #   @param sg_id [Fixnum] the security group ID
        #   @param rules [Array<Hash>] to be applied to the NIC
        def initialize(vm, nic, sg_id, rules)
            @vm    = vm
            @nic   = nic
            @sg_id = sg_id

            @rules = []
            @invalid_rules = []

            rules.each do |rule|
                @rules << new_rule(rule)
            end if rules
        end

        # Default factory method for the SecurityGroup class. It MUST be
        # overriden in derived classes
        def new_rule(rule)
            Rule.new(rule)
        end
    end

    ############################################################################
    # This class represents a SecurityGroup implemented with iptables/ipset
    # Kernel facilities.
    ############################################################################
    class SecurityGroupIPTables < SecurityGroup
        
        # All iptable rules will be added to this chain.
        GLOBAL_CHAIN = "opennebula"

        # Creates a new security group
        #   @param vm  [VNMMAD::VM] a VM object
        #   @param nic [VNMMAD::NIC] the network interface
        #   @param sg_id [Fixnum] the security group ID
        #   @param rules [Array<Hash>] to be applied to the NIC
        def initialize(vm, nic, sg_id, rules)
            super

            @commands = Commands.new

            @vars = SecurityGroupIPTables.vars(@vm, @nic, @sg_id)

            @chain_in   = vars[:chain_in]
            @chain_out  = vars[:chain_out]
            @set_sg_in  = vars[:set_sg_in]
            @set_sg_out = vars[:set_sg_out]
        end

        def process_rules
            @rules.each do |rule|
                rule.process(@commands, @vars)
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

end