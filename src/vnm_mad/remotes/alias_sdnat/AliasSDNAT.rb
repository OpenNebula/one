# rubocop:disable Naming/FileName
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

require 'vnmmad'

# Alias SDnat Driver
class AliasSDNATDriver < VNMMAD::VNMDriver

    DRIVER = 'alias_sdnat'
    XPATH_FILTER = "TEMPLATE/NIC_ALIAS[VN_MAD='alias_sdnat'] | " \
                   'TEMPLATE/NIC[ALIAS_IDS=*]'

    def initialize(virtual_machine, xpath_filter = nil, deploy_id = nil)
        @locking = true

        xpath_filter ||= XPATH_FILTER
        super(virtual_machine, xpath_filter, deploy_id)
    end

    def iptables(params, stdout = false)
        if stdout
            commands = VNMMAD::VNMNetwork::Commands.new
            commands.add :iptables, params
            commands.run!
        else
            OpenNebula.exec_and_log("#{command(:iptables)} #{params}")
        end
    end

    def nat_add(parent_ip, alias_ip)
        iptables("-t nat -A POSTROUTING -s #{parent_ip} " \
                 "-j SNAT --to-source #{alias_ip}")

        iptables("-t nat -A PREROUTING  -d #{alias_ip} " \
                 "-j DNAT --to-destination #{parent_ip}")
    end

    def nat_drop(parent_ip, alias_ip, strict = false)
        iptables_s = iptables('-t nat -S', true)

        # drop any line related to PRE/POSTROUTING of parent/alias IPs
        iptables_s.each_line do |line|
            line.chomp!

            # matches for various rule parts
            pre1  = line.match(%r{^-A PREROUTING -d #{alias_ip}/}i)
            pre2  = line.match(/--to-destination #{parent_ip}$/i)
            post1 = line.match(%r{^-A POSTROUTING -s #{parent_ip}/}i)
            post2 = line.match(/--to-source #{alias_ip}$/i)

            drop_rule = "-t nat #{line.sub('-A ', '-D ')}"

            if strict && ((pre1 && pre2) || (post1 && post2))
                iptables(drop_rule)
            elsif !strict && (pre1 || pre2 || post1 || post2)
                iptables(drop_rule)
            end

            #            iptables("-t nat #{line.sub('-A ', '-D ')}") if
            #               line =~ /^-A PREROUTING -d #{alias_ip}\//i or
            #               line =~ /--to-destination #{parent_ip}$/i or
            #               line =~ /^-A POSTROUTING -s #{parent_ip}\//i or
            #               line =~ /--to-source #{alias_ip}$/i
        end
    end

    def process_nat(activate = true, attach_nic_alias_id = nil)
        lock

        # create Alias IP <-> NIC IP mapping tables
        nic_parents = {}
        nic_aliases = {}

        process do |nic|
            if nic[:alias_id] && nic[:parent_id] && nic[:ip]
                next if attach_nic_alias_id &&
                        attach_nic_alias_id != nic[:nic_id]

                nic_aliases[nic[:ip]] = nic[:parent_id]
            elsif nic[:alias_ids] && nic[:ip]
                nic_parents[nic[:nic_id]] = nic[:ip]
            else
                STDERR.puts "Problem with NIC #{nic}"
                exit 1
            end
        end

        # cleanup any related mapping rules
        nic_aliases.each do |alias_ip, parent_id|
            parent_ip = nic_parents[parent_id]

            if parent_ip
                strict = !attach_nic_alias_id.nil?

                nat_drop(parent_ip, alias_ip, strict)
            else
                STDERR.puts "Parent NIC/IP with NIC_ID #{parent_id}"
                exit 1
            end
        end

        if activate
            # create mapping rules
            # rubocop:disable Metrics/LineLength
            # iptables -t nat -A POSTROUTING -s 192.168.0.0/24 -j SNAT --to-source 10.0.0.41
            # iptables -t nat -A PREROUTING -d 10.0.0.41 -j DNAT --to-destination 192.168.0.250
            # rubocop:enable Metrics/LineLength
            nic_aliases.each do |alias_ip, parent_id|
                parent_ip = nic_parents[parent_id]

                nat_add(parent_ip, alias_ip) if parent_ip
            end
        end

        unlock
    end

    def activate
        process_nat

        0
    end

    def deactivate
        attach_nic_alias_id = @vm['TEMPLATE/NIC_ALIAS[ATTACH="YES"]/NIC_ID']

        process_nat(false, attach_nic_alias_id)

        0
    end

end
# rubocop:enable Naming/FileName
