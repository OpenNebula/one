# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

# This module implements the SecurityGroup abstraction on top of iptables
module SGIPTables

    ############################################################################
    # A Rule implemented with the iptables/ipset Linux kernel facilities
    ############################################################################
    class RuleIPTables < VNMNetwork::Rule
        ########################################################################
        # Implementation of each rule type
        ########################################################################
        private

        # Implements the :protocol rule. Example:
        #   iptables -A one-3-0-i -p tcp -j RETURN
        def process_protocol(cmds, vars)
            chain = @rule_type == :inbound ? vars[:chain_in] : vars[:chain_out]

            if @protocol != :icmpv6
                cmds.add :iptables, "-A #{chain} -p #{@protocol} -j RETURN"
            end

            if @protocol != :icmp
                cmds.add :ip6tables, "-A #{chain} -p #{@protocol} -j RETURN"
            end
        end

        # Implements the :portrange rule. Example:
        #   iptables -A one-3-0-o -p udp -m multiport --dports 80,22 -j RETURN
        def process_portrange(cmds, vars)
            chain = @rule_type == :inbound ? vars[:chain_in] : vars[:chain_out]

            cmds.add :iptables, "-A #{chain} -p #{@protocol} -m multiport" \
                " --dports #{@range} -j RETURN"
            cmds.add :ip6tables, "-A #{chain} -p #{@protocol} -m multiport" \
                " --dports #{@range} -j RETURN"
        end

        # Implements the :icmp_type rule. Example:
        #   iptables -A one-3-0-o -p icmp --icmp-type 8 -j RETURN
        def process_icmp_type(cmds, vars)
            chain = @rule_type == :inbound ? vars[:chain_in] : vars[:chain_out]

            cmds.add :iptables, "-A #{chain} -p icmp --icmp-type #{@icmp_type}"\
                " -j RETURN"
        end

        # Implements the :icmpv6_type rule. Example:
        #   ip6tables -A one-3-0-o -p icmpv6 --icmpv6-type 128 -j RETURN
        def process_icmpv6_type(cmds, vars)
            chain = @rule_type == :inbound ? vars[:chain_in] : vars[:chain_out]

            cmds.add :ip6tables, "-A #{chain} -p icmpv6 --icmpv6-type "\
                "#{@icmpv6_type} -j RETURN"
        end

        # Implements the :net rule. Example:
        #   ipset create one-3-0-1-i-tcp-n-inet hash:net family inet
        #   iptables -A one-3-0-i -p tcp -m set --match-set \
        #       one-3-0-1-i-tcp-n-inet src -j RETURN
        #   ipset add -exist one-3-0-1-i-tcp-n-inet 10.0.0.0/24
        def process_net(cmds, vars)
            the_nets = net()

            return if the_nets.empty?

            sets = []

            the_nets.each do |n|
                if IPAddr.new(n).ipv6?
                    command = :ip6tables
                    family  = "inet6"
                else
                    command = :iptables
                    family  = "inet"
                end

                if @rule_type == :inbound
                    chain = vars[:chain_in]
                    set = "#{vars[:set_sg_in]}-#{@protocol}-n-#{family}"
                    dir = "src"
                else
                    chain = vars[:chain_out]
                    set = "#{vars[:set_sg_out]}-#{@protocol}-n-#{family}"
                    dir = "dst"
                end

                if !sets.include?(set)
                    cmds.add :ipset, "create #{set} hash:net family #{family}"
                    cmds.add command, "-A #{chain} -p #{@protocol} -m set" \
                        " --match-set #{set} #{dir} -j RETURN"

                    sets << set
                end

                cmds.add :ipset, "add -exist #{set} #{n}"
            end
        end

        # Implements the :net_portrange rule. Example:
        #   ipset create one-3-0-1-i-nr-inet hash:net,port family inet
        #   iptables -A one-3-0-i -m set --match-set one-3-0-1-i-nr-inet src,dst
        #        -j RETURN
        #   ipset add -exist one-3-0-1-i-nr-inet 10.0.0.0/24,tcp:80
        def process_net_portrange(cmds, vars)
            the_nets = net()

            return if the_nets.empty?

            sets = []

            the_nets.each do |n|
                if IPAddr.new(n).ipv6?
                    command = :ip6tables
                    family  = "inet6"
                else
                    command = :iptables
                    family  = "inet"
                end

                if @rule_type == :inbound
                    chain = vars[:chain_in]
                    set = "#{vars[:set_sg_in]}-nr-#{family}"
                    dir = "src,dst"
                else
                    chain = vars[:chain_out]
                    set = "#{vars[:set_sg_out]}-nr-#{family}"
                    dir = "dst,dst"
                end

                if !sets.include?(set)
                    maxelem = vars[:nic][:conf][:ipset_maxelem] ?
                        "maxelem #{vars[:nic][:conf][:ipset_maxelem]}" :
                        "maxelem #{CONF[:ipset_maxelem]}"

                    cmds.add :ipset, "create #{set} hash:net,port family #{family} #{maxelem}"
                    cmds.add command, "-A #{chain} -m set --match-set" \
                        " #{set} #{dir} -j RETURN"

                    sets << set
                end

                @range.split(",").each do |r|
                    r.gsub!(":","-")
                    net_range = "#{n},#{@protocol}:#{r}"

                    cmds.add :ipset, "add -exist #{set} #{net_range}"
                end
            end
        end

        # Implements the :net_icmp_type rule. Example:
        #   ipset create one-3-0-1-i-ni hash:net,port family inet
        #   iptables -A one-3-0-i -m set --match-set one-3-0-1-i-ni src,dst
        #       -j RETURN
        #   ipset add -exist one-3-0-1-i-ni 10.0.0.0/24,icmp:8/0
        def process_net_icmp_type(cmds, vars)
            if @rule_type == :inbound
                chain = vars[:chain_in]
                set = "#{vars[:set_sg_in]}-ni"
                dir = "src,dst"
            else
                chain = vars[:chain_out]
                set = "#{vars[:set_sg_out]}-ni"
                dir = "dst,dst"
            end

            cmds.add :ipset, "create #{set} hash:net,port family inet"
            cmds.add :iptables, "-A #{chain} -m set --match-set #{set} #{dir}"\
                " -j RETURN"

            net.each do |n|
                icmp_type_expand.each do |type_code|
                    cmds.add :ipset, "add -exist #{set} #{n},icmp:#{type_code}"
                end
            end
        end

        # Implements the :net_icmpv6_type rule. Example:
        #   ipset create one-3-0-1-i-ni6 hash:net,port family inet6
        #   ip6tables -A one-3-0-i -m set --match-set one-3-0-1-i-ni6 src,dst
        #       -j RETURN
        #   ipset add -exist one-3-0-1-i-ni6 10.0.0.0/24,icmpv6:128/0
        def process_net_icmpv6_type(cmds, vars)
            if @rule_type == :inbound
                chain = vars[:chain_in]
                set = "#{vars[:set_sg_in]}-ni6"
                dir = "src,dst"
            else
                chain = vars[:chain_out]
                set = "#{vars[:set_sg_out]}-ni6"
                dir = "dst,dst"
            end

            cmds.add :ipset, "create #{set} hash:net,port family inet6"
            cmds.add :ip6tables, "-A #{chain} -m set --match-set #{set} #{dir}"\
                " -j RETURN"

            net.each do |n|
                icmpv6_type_expand.each do |type_code|
                    cmds.add :ipset, "add -exist #{set} #{n},icmpv6:#{type_code}"
                end
            end
        end
    end

    ############################################################################
    # This class represents a SecurityGroup implemented with iptables/ipset
    # Kernel facilities.
    ############################################################################
    class SecurityGroupIPTables < VNMNetwork::SecurityGroup
        def initialize(vm, nic, sg_id, rules)
            super

            @vars = SGIPTables.vars(@vm, @nic, @sg_id)
        end

        def new_rule(rule)
            RuleIPTables.new(rule)
        end
    end

    ############################################################################
    # Methods to configure the hypervisor iptables rules. All the rules are
    # added to the GLOBAL_CHAIN chain. By default this chain is "opennebula"
    ############################################################################

    GLOBAL_CHAIN = "opennebula"

    # Get information from the current iptables rules and chains
    #   @return [Hash] with the following keys:
    #     - :iptables_forwards
    #     - :iptables_s
    #     - :ipset_list
    def self.info
        commands = VNMNetwork::Commands.new

        commands.add :iptables, "-S"
        iptables_s = commands.run!

        commands.add :ip6tables, "-S"
        ip6tables_s = commands.run!

        iptables_forwards = ""
        ip6tables_forwards = ""

        if iptables_s.match(/^-N #{GLOBAL_CHAIN}$/)
            commands.add :iptables, "-L #{GLOBAL_CHAIN} --line-numbers"
            iptables_forwards = commands.run!
        end

        if ip6tables_s.match(/^-N #{GLOBAL_CHAIN}$/)
            commands.add :ip6tables, "-L #{GLOBAL_CHAIN} --line-numbers"
            ip6tables_forwards = commands.run!
        end

        commands.add :ipset, "list -name"
        ipset_list = commands.run!

        {
            :iptables_forwards => iptables_forwards,
            :iptables_s => iptables_s,
            :ip6tables_forwards => ip6tables_forwards,
            :ip6tables_s => ip6tables_s,
            :ipset_list => ipset_list
        }
    end

    # Bootstrap the OpenNebula chains and rules. This method:
    #   1.- Creates the GLOBAL_CHAIN chain
    #   2.- Forwards the bridge traffic to the GLOBAL_CHAIN
    #   3.- By default ACCEPT all traffic
    def self.global_bootstrap
        info = SGIPTables.info

        commands = VNMNetwork::Commands.new

        if !info[:iptables_s].split("\n").include?("-N #{GLOBAL_CHAIN}")
            commands.add :iptables, "-N #{GLOBAL_CHAIN}"
            commands.add :iptables, "-A FORWARD -m physdev "\
                "--physdev-is-bridged -j #{GLOBAL_CHAIN}"
            commands.add :iptables, "-A #{GLOBAL_CHAIN} -j ACCEPT"
        end

        if !info[:ip6tables_s].split("\n").include?("-N #{GLOBAL_CHAIN}")
            commands.add :ip6tables, "-N #{GLOBAL_CHAIN}"
            commands.add :ip6tables, "-A FORWARD -m physdev "\
                "--physdev-is-bridged -j #{GLOBAL_CHAIN}"
            commands.add :ip6tables, "-A #{GLOBAL_CHAIN} -j ACCEPT"
        end

        commands.run! if !commands.empty?
    end

    # Returns the base chain and ipset names for the VM
    #   @param vm  [VM] the virtual machine
    #   @param nic [Nic] of the VM
    #   @param sg_id [Fixnum] ID of the SecurityGroup if any
    #
    #   @return [Hash] with the :chain, :chain_in, :chain_out chain names, and
    #   :set_sg_in and :set_seg_out ipset names.
    def self.vars(vm, nic, sg_id = nil)
        vm_id  = vm['ID']
        nic_id = nic[:nic_id]

        vars = {}

        vars[:nic]       = nic
        vars[:vm_id]     = vm_id
        vars[:nic_id]    = nic_id
        vars[:chain]     = "one-#{vm_id}-#{nic_id}"
        vars[:chain_in]  = "#{vars[:chain]}-i"
        vars[:chain_out] = "#{vars[:chain]}-o"

        if sg_id
            vars[:set_sg_in]  = "#{vars[:chain]}-#{sg_id}-i"
            vars[:set_sg_out] = "#{vars[:chain]}-#{sg_id}-o"
        end

        vars
    end

    #  Bootstrap NIC rules for the interface. It creates the :chain_in and
    #  :chain_out and sets up FORWARD rules to these chains for inbound and
    #  outbound traffic.
    #
    #  This method also sets mac_spoofing, and ip_spoofing rules
    #
    #  Example, for VM 3 and NIC 0
    #   iptables -N one-3-0-i
    #   iptables -N one-3-0-o
    #   iptables -I opennebula -m physdev --physdev-out vnet0
    #       --physdev-is-bridged -j one-3-0-i"
    #   iptables -I opennebula -m physdev --physdev-in  vnet0
    #       --physdev-is-bridged -j one-3-0-o"
    #   iptables -A one-3-0-i -m state --state ESTABLISHED,RELATED -j ACCEPT
    #   iptables -A one-3-0-o -m state --state ESTABLISHED,RELATED -j ACCEPT
    #
    #   Mac spoofing (no output traffic from a different MAC)
    #   iptables -A one-3-0-o -m mac ! --mac-source 02:00:00:00:00:01 -j DROP
    #
    #   IP spoofing
    #   iptables -A one-3-0-o ! --source 10.0.0.1 -j DROP
    def self.nic_pre(vm, nic)
        commands = VNMNetwork::Commands.new

        vars = SGIPTables.vars(vm, nic)

        chain     = vars[:chain]
        chain_in  = vars[:chain_in]
        chain_out = vars[:chain_out]

        # create chains
        commands.add :iptables, "-N #{chain_in}"  # inbound
        commands.add :iptables, "-N #{chain_out}" # outbound
        commands.add :ip6tables, "-N #{chain_in}"  # inbound
        commands.add :ip6tables, "-N #{chain_out}" # outbound

        # Send traffic to the NIC chains
        commands.add :iptables, "-I #{GLOBAL_CHAIN} -m physdev "\
            "--physdev-out #{nic[:tap]} --physdev-is-bridged -j #{chain_in}"
        commands.add :iptables, "-I #{GLOBAL_CHAIN} -m physdev "\
            "--physdev-in  #{nic[:tap]} --physdev-is-bridged -j #{chain_out}"

        commands.add :ip6tables, "-I #{GLOBAL_CHAIN} -m physdev "\
            "--physdev-out #{nic[:tap]} --physdev-is-bridged -j #{chain_in}"
        commands.add :ip6tables, "-I #{GLOBAL_CHAIN} -m physdev "\
            "--physdev-in  #{nic[:tap]} --physdev-is-bridged -j #{chain_out}"

        # ICMPv6 Neighbor Discovery Protocol (ARP replacement for IPv6)
        ## Allow routers to send router advertisements
        commands.add :ip6tables, "-A #{chain_in} -p icmpv6 --icmpv6-type 134 "\
            "-j ACCEPT"

        ## Allow neighbor solicitations to reach the host
        commands.add :ip6tables, "-A #{chain_in} -p icmpv6 --icmpv6-type 135 "\
            "-j ACCEPT"

        ## Allow neighbor solicitations replies to reach the host
        commands.add :ip6tables, "-A #{chain_in} -p icmpv6 --icmpv6-type 136 "\
            "-j ACCEPT"

        ## Allow routers to send Redirect messages
        commands.add :ip6tables, "-A #{chain_in} -p icmpv6 --icmpv6-type 137 "\
            "-j ACCEPT"

        ## Allow the host to send a router solicitation
        commands.add :ip6tables, "-A #{chain_out} -p icmpv6 --icmpv6-type 133 "\
            "-j ACCEPT"

        ## Allow the host to send neighbor solicitation requests
        commands.add :ip6tables, "-A #{chain_out} -p icmpv6 --icmpv6-type 135 "\
            "-j ACCEPT"

        ## Allow the host to send neighbor solicitation replies
        commands.add :ip6tables, "-A #{chain_out} -p icmpv6 --icmpv6-type 136 "\
            "-j ACCEPT"

        # Mac-spofing
        if nic[:filter_mac_spoofing] == "YES"
            commands.add :iptables, "-A #{chain_out} -m mac ! "\
                "--mac-source #{nic[:mac]} -j DROP"
            commands.add :ip6tables, "-A #{chain_out} -m mac ! "\
                "--mac-source #{nic[:mac]} -j DROP"
        end

        # IP-spofing
        if nic[:filter_ip_spoofing] == "YES"
            ipv4s = Array.new

            [:ip, :vrouter_ip].each do |key|
                ipv4s << nic[key] if !nic[key].nil? && !nic[key].empty?
            end

            if !ipv4s.empty?
                #bootp
                commands.add :iptables, "-A #{chain_out} -p udp "\
                    "--source 0.0.0.0/32 --sport 68 --destination "\
                    "255.255.255.255/32 --dport 67 -j ACCEPT"

                set = "#{vars[:chain]}-ip-spoofing"

                commands.add :ipset, "create #{set} hash:ip family inet"

                ipv4s.each do |ip|
                    commands.add :ipset, "add -exist #{set} #{ip}"
                end

                commands.add :iptables, "-A #{chain_out} -m set ! "\
                    "--match-set #{set} src -j DROP"
            else # If there are no IPv4 addresses allowed, block all
                commands.add :iptables, "-A #{chain_out} --source 0.0.0.0/0 "\
                    "-j DROP"
            end

            ipv6s = Array.new

            [:ip6, :ip6_global, :ip6_link, :ip6_ula].each do |key|
                ipv6s << nic[key] if !nic[key].nil? && !nic[key].empty?
            end

            if !ipv6s.empty?
                set = "#{vars[:chain]}-ip6-spoofing"

                commands.add :ipset, "create #{set} hash:ip family inet6"

                ipv6s.each do |ip|
                    commands.add :ipset, "add -exist #{set} #{ip}"
                end

                commands.add :ip6tables, "-A #{chain_out} -m set ! "\
                    "--match-set #{set} src -j DROP"
            else # If there are no IPv6 addresses allowed, block all
                commands.add :ip6tables, "-A #{chain_out} --source ::/0 -j DROP"
            end
        end

        # Related, Established
        commands.add :iptables, "-A #{chain_in} -m state"\
            " --state ESTABLISHED,RELATED -j ACCEPT"
        commands.add :iptables, "-A #{chain_out} -m state"\
            " --state ESTABLISHED,RELATED -j ACCEPT"
        commands.add :ip6tables, "-A #{chain_in} -m state"\
            " --state ESTABLISHED,RELATED -j ACCEPT"
        commands.add :ip6tables, "-A #{chain_out} -m state"\
            " --state ESTABLISHED,RELATED -j ACCEPT"

        commands.run!
    end

    # Sets the default policy to DROP for the NIC rules. Example
    #   iptables -A one-3-0-i -j DROP
    #   iptables -A one-3-0-o -j DROP
    def self.nic_post(vm, nic)
        vars      = SGIPTables.vars(vm, nic)
        chain_in  = vars[:chain_in]
        chain_out = vars[:chain_out]

        commands = VNMNetwork::Commands.new

        commands.add :iptables, "-A #{chain_in}  -j DROP"
        commands.add :iptables, "-A #{chain_out} -j DROP"

        commands.add :ip6tables, "-A #{chain_in}  -j DROP"
        commands.add :ip6tables, "-A #{chain_out} -j DROP"

        commands.run!
    end

    # Removes all the rules associated to a VM and NIC
    def self.nic_deactivate(vm, nic)
        vars      = SGIPTables.vars(vm, nic)
        chain     = vars[:chain]
        chain_in  = vars[:chain_in]
        chain_out = vars[:chain_out]

        info = self.info

        iptables_forwards  = info[:iptables_forwards]
        iptables_s         = info[:iptables_s]

        ip6tables_forwards = info[:ip6tables_forwards]
        ip6tables_s        = info[:ip6tables_s]

        ipset_list = info[:ipset_list]

        commands = VNMNetwork::Commands.new

        iptables_forwards.lines.reverse_each do |line|
            fields = line.split
            if [chain_in, chain_out].include?(fields[1])
                n = fields[0]
                commands.add :iptables, "-D #{GLOBAL_CHAIN} #{n}"
            end
        end

        ip6tables_forwards.lines.reverse_each do |line|
            fields = line.split
            if [chain_in, chain_out].include?(fields[1])
                n = fields[0]
                commands.add :ip6tables, "-D #{GLOBAL_CHAIN} #{n}"
            end
        end

        remove_chains = []
        iptables_s.lines.each do |line|
            if line.match(/^-N #{chain}(-|$)/)
                remove_chains << line.split[1]
            end
        end
        remove_chains.each {|c| commands.add :iptables, "-F #{c}" }
        remove_chains.each {|c| commands.add :iptables, "-X #{c}" }

        remove_chains_6 = []
        ip6tables_s.lines.each do |line|
            if line.match(/^-N #{chain}(-|$)/)
                remove_chains_6 << line.split[1]
            end
        end
        remove_chains_6.each {|c| commands.add :ip6tables, "-F #{c}" }
        remove_chains_6.each {|c| commands.add :ip6tables, "-X #{c}" }

        ipset_list.lines.each do |line|
            if line.match(/^#{chain}(-|$)/)
                set = line.strip
                commands.add :ipset, "destroy #{set}"
            end
        end

        commands.run!
    end
end

end
