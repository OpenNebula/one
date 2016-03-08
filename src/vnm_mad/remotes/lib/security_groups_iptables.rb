# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

            cmds.add :iptables, "-A #{chain} -p #{@protocol} -j RETURN"
        end

        # Implements the :portrange rule. Example:
        #   iptables -A one-3-0-o -p udp -m multiport --dports 80,22 -j RETURN
        def process_portrange(cmds, vars)
            chain = @rule_type == :inbound ? vars[:chain_in] : vars[:chain_out]

            cmds.add :iptables, "-A #{chain} -p #{@protocol} -m multiport" \
                " --dports #{@range} -j RETURN"
        end

        # Implements the :icmp_type rule. Example:
        #   iptables -A one-3-0-o -p icmp --icmp-type 8 -j RETURN
        def     process_icmp_type(cmds, vars)
            chain = @rule_type == :inbound ? vars[:chain_in] : vars[:chain_out]

            cmds.add :iptables, "-A #{chain} -p icmp --icmp-type #{@icmp_type}" \
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
                chain = vars[:chain_out]
                set = "#{vars[:set_sg_out]}-#{@protocol}-n"
                dir = "dst"
            end

            cmds.add :ipset, "create #{set} hash:net"
            cmds.add :iptables, "-A #{chain} -p #{@protocol} -m set" \
                " --match-set #{set} #{dir} -j RETURN"

            net.each do |n|
                cmds.add :ipset, "add -exist #{set} #{n}"
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
                chain = vars[:chain_out]
                set = "#{vars[:set_sg_out]}-nr"
                dir = "dst,dst"
            end

            cmds.add :ipset, "create #{set} hash:net,port"
            cmds.add :iptables, "-A #{chain} -m set --match-set" \
                " #{set} #{dir} -j RETURN"

            net.each do |n|
                @range.split(",").each do |r|
                    r.gsub!(":","-")
                    net_range = "#{n},#{@protocol}:#{r}"
                    cmds.add :ipset, "add -exist #{set} #{net_range}"
                end
            end
        end

        # Implements the :net_icmp_type rule. Example:
        #   ipset create one-3-0-1-i-ni hash:net,port
        #   iptables -A one-3-0-i -m set --match-set one-3-0-1-i-nr src,dst -j RETURN
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

            cmds.add :ipset, "create #{set} hash:net,port"
            cmds.add :iptables, "-A #{chain} -m set --match-set #{set} #{dir} -j RETURN"

            net.each do |n|
                icmp_type_expand.each do |type_code|
                    cmds.add :ipset, "add -exist #{set} #{n},icmp:#{type_code}"
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

        iptables_forwards = ""

        if iptables_s.match(/^-N #{GLOBAL_CHAIN}$/)
            commands.add :iptables, "-L #{GLOBAL_CHAIN} --line-numbers"
            iptables_forwards = commands.run!
        end

        commands.add :ipset, "list -name"
        ipset_list = commands.run!

        {
            :iptables_forwards => iptables_forwards,
            :iptables_s => iptables_s,
            :ipset_list => ipset_list
        }
    end

    # Bootstrap the OpenNebula chains and rules. This method:
    #   1.- Creates the GLOBAL_CHAIN chain
    #   2.- Forwards the bridge traffic to the GLOBAL_CHAIN
    #   3.- By default ACCEPT all traffic
    def self.global_bootstrap
        info = SGIPTables.info

        return if info[:iptables_s].split("\n").include? "-N #{GLOBAL_CHAIN}"

        commands = VNMNetwork::Commands.new

        commands.add :iptables, "-N #{GLOBAL_CHAIN}"
        commands.add :iptables, "-A FORWARD -m physdev --physdev-is-bridged -j #{GLOBAL_CHAIN}"
        commands.add :iptables, "-A #{GLOBAL_CHAIN} -j ACCEPT"

        commands.run!
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

    #  Bootstrap NIC rules for the interface. It creates the :chain_in and
    #  :chain_out and sets up FORWARD rules to these chains for inbound and
    #  outbound traffic.
    #
    #  This method also sets mac_spoofing, and ip_spoofing rules
    #
    #  Example, for VM 3 and NIC 0
    #   iptables -N one-3-0-i
    #   iptables -N one-3-0-o
    #   iptables -I opennebula -m physdev --physdev-out vnet0 --physdev-is-bridged -j one-3-0-i"
    #   iptables -I opennebula -m physdev --physdev-in  vnet0 --physdev-is-bridged -j one-3-0-o"
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

        # Send traffic to the NIC chains
        commands.add :iptables, "-I #{GLOBAL_CHAIN} -m physdev --physdev-out #{nic[:tap]} --physdev-is-bridged -j #{chain_in}"
        commands.add :iptables, "-I #{GLOBAL_CHAIN} -m physdev --physdev-in  #{nic[:tap]} --physdev-is-bridged -j #{chain_out}"

        # Mac-spofing
        if nic[:filter_mac_spoofing] == "YES"
            commands.add :iptables, "-A #{chain_out} -m mac ! --mac-source #{nic[:mac]} -j DROP"
        end

        # IP-spofing
        if nic[:filter_ip_spoofing] == "YES"
            commands.add :iptables, "-A #{chain_out} ! --source #{nic[:ip]} -j DROP"
        end

        # Related, Established
        commands.add :iptables, "-A #{chain_in} -m state --state ESTABLISHED,RELATED -j ACCEPT"
        commands.add :iptables, "-A #{chain_out} -m state --state ESTABLISHED,RELATED -j ACCEPT"

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
        commands.add :iptables, "-A #{chain_in} -j DROP"
        commands.add :iptables, "-A #{chain_out} -j DROP"

        commands.run!
    end

    # Removes all the rules associated to a VM and NIC
    def self.nic_deactivate(vm, nic)
        vars      = SGIPTables.vars(vm, nic)
        chain     = vars[:chain]
        chain_in  = vars[:chain_in]
        chain_out = vars[:chain_out]

        info              = self.info
        iptables_forwards = info[:iptables_forwards]
        iptables_s        = info[:iptables_s]
        ipset_list        = info[:ipset_list]

        commands = VNMNetwork::Commands.new

        iptables_forwards.lines.reverse_each do |line|
            fields = line.split
            if [chain_in, chain_out].include?(fields[1])
                n = fields[0]
                commands.add :iptables, "-D #{GLOBAL_CHAIN} #{n}"
            end
        end

        remove_chains = []
        iptables_s.lines.each do |line|
            if line.match(/^-N #{chain}/)
                 remove_chains << line.split[1]
            end
        end
        remove_chains.each {|c| commands.add :iptables, "-F #{c}" }
        remove_chains.each {|c| commands.add :iptables, "-X #{c}" }

        ipset_list.lines.each do |line|
            if line.match(/^#{chain}/)
                set = line.strip
                commands.add :ipset, "destroy #{set}"
            end
        end

        commands.run!
    end
end

end