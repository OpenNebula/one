# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

# This module includes provides the abstractions to implement SecurityGroups
module VNMNetwork

    ############################################################################
    # Rule supports these (final and relevant) attributes:
    #
    # PROTOCOL (mandatory)
    #   - Specifies the protocol of the rule
    #   - values: ['ALL', 'TCP', 'UDP', 'ICMP', 'ICMPV6', 'IPSEC']
    #
    # RULE_TYPE (mandatory)
    #   - Specifies the direction of application of the rule
    #   - values: ['INBOUND', 'OUTBOUND']
    #
    # RANGE (optional)
    #   - only works for protocols ['TCP', 'UDP']
    #   - uses the iptables multiports syntax
    #
    # ICMP_TYPE and ICMPV6_TYPE (optional)
    #   - Only works for protocol 'ICMP' (for ICMP_TYPE) or protocol 'ICMPV6' (for
    #     ICMPV6_TYPE)
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
        TYPES = [
            :protocol,      # Type  1: block the whole protocol
            :portrange,     # Type 2a: block a port range within a protocol
            :icmp_type,     # Type 2b: block selected icmp types
            :icmpv6_type,   # Type 2c: block selected icmpv6 types
            :net,           # Type  3: block a whole protocol for a network
            :net_portrange, # Type 4a: block a port range from a network
            :net_icmp_type, # Type 4b: block selected icmp types from a network
            :net_icmpv6_type # Type 4c: block selected icmpv6 types from a network
        ]

        # Initialize a new rule.
        def initialize(rule)
            @rule     = rule
            @protocol = @rule[:protocol].downcase.to_sym
            @protocol = :esp if @protocol == :ipsec

            @rule_type = @rule[:rule_type].downcase.to_sym
            @icmp_type = @rule[:icmp_type]
            @icmpv6_type = @rule[:icmpv6_type]

            @range      = @rule[:range]
            @ip         = @rule[:ip]
            @ip6        = @rule[:ip6]
            @ip6_global = @rule[:ip6_global]
            @ip6_ula    = @rule[:ip6_ula]
            @size       = @rule[:size]
            @type       = set_type
        end

        # Process the rule and generates the associated commands of the rule
        #   @param [Commands] cmd to add the rule commands to
        #   @param [Hash] vars iptables attributes for the rule
        def process(cmds, vars)
            case @type
                when :protocol
                    process_protocol(cmds, vars)

                when :portrange
                    process_portrange(cmds, vars)

                when :icmp_type
                    process_icmp_type(cmds, vars)

                when :icmpv6_type
                    process_icmpv6_type(cmds, vars)

                when :net
                    process_net(cmds, vars)

                when :net_portrange
                    process_net_portrange(cmds, vars)

                when :net_icmp_type
                    process_net_icmp_type(cmds, vars)

                when :net_icmpv6_type
                    process_net_icmpv6_type(cmds, vars)
            end
        end

        # Return the network blocks associated to the rule
        #   @return [Array<String>] each network block in CIDR.
        def net
            nets = []

            if @ip && @size
                nets += VNMNetwork::to_nets(@ip, @size.to_i)
            end

            if @ip6_global && @size
                nets += VNMNetwork::to_nets(@ip6_global, @size.to_i)
            end

            if @ip6_ula && @size
                nets += VNMNetwork::to_nets(@ip6_ula, @size.to_i)
            end

            if @ip6 && @size
                nets += VNMNetwork::to_nets(@ip6, @size.to_i)
            end

            return nets
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

        # Expand the ICMP type with associated codes if any
        #   @return [Array<String>] expanded ICMP types to include all codes
        def icmpv6_type_expand
            if (codes = ICMPv6_TYPES_EXPANDED[@icmpv6_type.to_i])
                codes.collect{|e| "#{@icmpv6_type}/#{e}"}
            else
                ["#{@icmpv6_type}/0"]
            end
        end

        private

        # ICMP Codes for each ICMP type as in:
        # http://www.iana.org/assignments/icmp-parameters/
        # http://www.iana.org/assignments/icmpv6-parameters/
        ICMP_TYPES_EXPANDED = {
            3  => [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15],
            5  => [0, 1, 2, 3],
            9  => [0, 16],
            11 => [0, 1],
            12 => [0, 1, 2]
        }

        ICMPv6_TYPES_EXPANDED = {
            1  => [0, 1, 2, 3, 4, 5, 6, 7],
            3  => [0, 1],
            4  => [0, 1, 2, 3],
            138=> [0, 1, 255],
            139=> [0, 1, 2],
            140=> [0, 1, 2]
        }

        # Depending on the combination of the rule attributes derive the
        # rule type:
        #
        # @protocol + @rule_type => Type 1: 'protocol'
        # @protocol + @rule_type + @range => Type 2A: 'portrange'
        # @protocol + @rule_type + @icmp_type => Type 2B: 'icmp_type'
        # @protocol + @rule_type + @icmpv6_type => Type 2C: 'icmpv6_type'
        # @protocol + @rule_type + @ip + @size => Type 3: 'net'
        # @protocol + @rule_type + @ip + @size + @range => Type 4A: 'net_portrange'
        # @protocol + @rule_type + @ip + @size + @icmp_type => Type 4B: 'net_icmp_type'
        # @protocol + @rule_type + @ip + @size + @icmpv6_type => Type 4C: 'net_icmpv6_type'
        #
        # @return [Symbol] The rule type
        def set_type
            if @ip.nil? && @size.nil?
                return :icmpv6_type if !@icmpv6_type.nil?
                return :icmp_type if !@icmp_type.nil?
                return :portrange if !@range.nil?
                return :protocol
            else
                return :net_icmpv6_type if !@icmpv6_type.nil?
                return :net_icmp_type if !@icmp_type.nil?
                return :net_portrange if !@range.nil?
                return :net
            end
        end

        ########################################################################
        # Dummy process methods for each rule type. These MUST be overriden
        # in derived classes
        #   @param cmds [Commands] commands to implement the rule
        #   @param vars [Hash] with specific rule implementation variables
        ########################################################################
        def process_protocol(cmds, vars)
        end

        def process_portrange(cmds, vars)
        end

        def process_icmp_type(cmds, vars)
        end

        def process_icmpv6_type(cmds, vars)
        end

        def process_net(cmds, vars)
        end

        def process_net_portrange(cmds, vars)
        end

        def process_net_icmp_type(cmds, vars)
        end

        def process_net_icmpv6_type(cmds, vars)
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
            @vars  = {}

            @commands = VNMNetwork::Commands.new

            rules.each do |rule|
                @rules << new_rule(rule)
            end if rules
        end

        # Default factory method for the SecurityGroup class. It MUST be
        # overriden in derived classes
        def new_rule(rule)
            Rule.new(rule)
        end

        # Generates the iptables/ipset commands to implement this security group
        def process_rules
            @rules.each do |rule|
                rule.process(@commands, @vars)
            end

            @commands.uniq!
         end

        # Execute the implementation commands, process_rules MUST be called
        # before this method
        def run!
            @commands.run!
        end
    end

end

end
