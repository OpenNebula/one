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

class OpenNebulaFirewall < OpenNebulaNetwork
    DRIVER = "fw"

    XPATH_FILTER =  OpenNebulaNetwork::FW_ATTRS

    def initialize(vm, deploy_id = nil, hypervisor = nil)
        super(vm,XPATH_FILTER,deploy_id,hypervisor)
        @locking = true
    end

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

    def deactivate
        lock

        vm_id =  @vm['ID']
        process do |nic|
            chain   = "one-#{vm_id}-#{nic[:network_id]}"
            iptables_out = `#{COMMANDS[:iptables]} -n -v --line-numbers -L FORWARD`
            if m = iptables_out.match(/.*#{chain}.*/)
                rule_num = m[0].split(/\s+/)[0]
                purge_chain(chain, rule_num)
            end
        end

        unlock
    end

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
        rule "-A FORWARD -m physdev --physdev-out #{tap} -j #{chain}"
    end

    def new_chain(chain)
        rule "-N #{chain}"
    end

    def chain_exists?(chain)
        iptables_nl =`#{COMMANDS[:iptables]} -nL`
        chains = iptables_nl.scan(/(one-.*?) .*references/).flatten
        chains.include? chain
    end

    def rule(rule)
        "#{COMMANDS[:iptables]} #{rule}"
    end
end
