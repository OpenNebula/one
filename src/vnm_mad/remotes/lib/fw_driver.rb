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

    ############################################################################
    # Filter network driver based on simple iptables rules
    ############################################################################
    class FWDriver < VNMDriver
        # Driver name
        DRIVER = "fw"

        # NICs filter. Select NICs with one or more of ICMP, WHITE_PORTS_* or
        # BLACK_PORTS_*
        XPATH_FILTER =  "TEMPLATE/NIC[ICMP|WHITE_PORTS_TCP|WHITE_PORTS_UDP|" <<
                        "BLACK_PORTS_TCP|BLACK_PORTS_UDP]"

        # Creates the driver object. It sets locking to prevent race conditions
        # between concurrent deployments
        def initialize(vm, deploy_id = nil, hypervisor = nil)
            super(vm,XPATH_FILTER,deploy_id,hypervisor)
            @locking = true
        end

        # Function to activate the driver in the VM
        def activate
            lock

            vm_id = @vm['ID']
            
            process do |nic|
                #:white_ports_tcp => iptables_range
                #:white_ports_udp => iptables_range
                #:black_ports_tcp => iptables_range
                #:black_ports_udp => iptables_range
                #:icmp            => 'DROP' or 'NO'

                nic_rules = Array.new

                chain   = "one-#{vm_id}-#{nic[:network_id]}"
                tap     = nic[:tap]

                next if chain_exists?(chain)

                if tap
                    #TCP
                    if range = nic[:white_ports_tcp]
                        nic_rules << filter_established(chain, :tcp, :accept)
                        nic_rules << filter_ports(chain, :tcp, range, :accept)
                        nic_rules << filter_protocol(chain, :tcp, :drop)
                    elsif range = nic[:black_ports_tcp]
                        nic_rules << filter_ports(chain, :tcp, range, :drop)
                    end

                    #UDP
                    if range = nic[:white_ports_udp]
                        nic_rules << filter_established(chain, :udp, :accept)
                        nic_rules << filter_ports(chain, :udp, range, :accept)
                        nic_rules << filter_protocol(chain, :udp, :drop)
                    elsif range = nic[:black_ports_udp]
                        nic_rules << filter_ports(chain, :udp, range, :drop)
                    end

                    #ICMP
                    if nic[:icmp]
                        if %w(no drop).include? nic[:icmp].downcase
                            nic_rules << filter_established(chain, :icmp, :accept)
                            nic_rules << filter_protocol(chain, :icmp, :drop)
                        end
                    end

                    process_chain(chain, tap, nic_rules)
                end
            end

            unlock
        end

        # Method to clean iptables chains
        def deactivate
            lock

            vm_id =  @vm['ID']
            process do |nic|
                chain   = "one-#{vm_id}-#{nic[:network_id]}"
                iptables_out = `#{VNMMAD::COMMANDS[:iptables]} -n -v --line-numbers -L FORWARD`
                if m = iptables_out.match(/.*#{chain}.*/)
                    rule_num = m[0].split(/\s+/)[0]
                    purge_chain(chain, rule_num)
                end
            end

            unlock
        end

        ########################################################################
        # Methods to deal with iptables rules
        ########################################################################
        private

        def purge_chain(chain, rule_num)
            rules = Array.new
            rules << rule("-D FORWARD #{rule_num}")
            rules << rule("-F #{chain}")
            rules << rule("-X #{chain}")
            run_rules rules
        end

        def process_chain(chain, tap, nic_rules)
            rules = Array.new
            if !nic_rules.empty?
                # new chain
                rules << new_chain(chain)
                # move tap traffic to chain
                rules << tap_to_chain(tap, chain)

                rules << nic_rules
            end
            run_rules rules
        end

        def filter_established(chain, protocol, policy)
            policy   = policy.to_s.upcase
            rule "-A #{chain} -p #{protocol} -m state --state ESTABLISHED -j #{policy}"
        end

        def run_rules(rules)
            rules.flatten.each do |rule|
                OpenNebula.exec_and_log(rule)
            end
        end

        def range?(range)
            range.match(/^(?:(?:\d+|\d+:\d+),)*(?:\d+|\d+:\d+)$/)
        end

        def filter_protocol(chain, protocol, policy)
            policy   = policy.to_s.upcase
            rule "-A #{chain} -p #{protocol} -j #{policy}"
        end

        def filter_ports(chain, protocol, range, policy)
            policy   = policy.to_s.upcase
            range.gsub!(/\s+/,"")

            if range? range
               rule "-A #{chain} -p #{protocol} -m multiport --dports #{range} -j #{policy}"
            end
        end

        def tap_to_chain(tap, chain)
            iptables_out = `#{VNMMAD::COMMANDS[:iptables]} -n -v --line-numbers -L FORWARD`

            # Insert the rule on top of the 'opennebula' chain if it exists, so it
            # doesn't conflict with the security groups driver
            index = nil
            iptables_out.lines.each do |line|
                fields = line.split
                if fields.include?("opennebula") && fields.include?("--physdev-is-bridged")
                    index = fields[0]
                    break
                end
            end

            if index
                rule "-I FORWARD #{index} -m physdev --physdev-out #{tap} -j #{chain}"
            else
                rule "-A FORWARD -m physdev --physdev-out #{tap} -j #{chain}"
            end
        end

        def new_chain(chain)
            rule "-N #{chain}"
        end

        def chain_exists?(chain)
            iptables_nl =`#{VNMMAD::COMMANDS[:iptables]} -nL`
            chains = iptables_nl.scan(/(one-.*?) .*references/).flatten
            chains.include? chain
        end

        def rule(rule)
            "#{VNMMAD::COMMANDS[:iptables]} #{rule}"
        end
    end
end