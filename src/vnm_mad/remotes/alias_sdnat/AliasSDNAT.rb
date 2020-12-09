# rubocop:disable Naming/FileName
# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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
require 'opennebula'
require 'oneprovision'
require 'ssh_stream'

# Alias SDnat Driver
class AliasSDNATDriver < VNMMAD::VNMDriver

    # Driver name
    DRIVER = 'alias_sdnat'

    # Filter to look for NICs managed by this diver
    XPATH_FILTER = "TEMPLATE/NIC_ALIAS[VN_MAD='alias_sdnat'] | " \
                   'TEMPLATE/NIC[ALIAS_IDS=*]'

    def initialize(vm, hostname, deploy_id = nil)
        super(vm, XPATH_FILTER, deploy_id)

        @locking = true
        @ssh     = SshStreamCommand.new(hostname, nil)
        @mapping = {}

        client = OpenNebula::Client.new
        host_id = @vm['/VM/HISTORY_RECORDS/HISTORY/HID']
        @host   = OpenNebula::Host.new_with_id(host_id, client)

        rc = @host.info(true)

        raise rc if OpenNebula.is_error?(rc)

        unless @host.has_elements?('TEMPLATE/PROVISION_ID')
            OpenNebula.log_error("No PROVISION_ID for host #{host_id}")
            exit 1
        end

        provision_id = @host['TEMPLATE/PROVISION_ID']
        provision = OneProvision::Provision.new_with_id(provision_id, client)
        provision.info

        @provider = provision.provider
    end

    def self.from_base64(vm64, hostname, deploy_id = nil)
        vm_xml = Base64.decode64(vm64)

        new(vm_xml, hostname, deploy_id)
    end

    #  Activate NAT rules on hypervisor
    def activate
        process_nat

        0
    end

    #  Clean NAT rules on hypervisor
    def deactivate
        attach_nic_alias_id = @vm['TEMPLATE/NIC_ALIAS[ATTACH="YES"]/NIC_ID']

        process_nat(false, attach_nic_alias_id)

        0
    end

    # @return [Bool] True if error, False otherwise
    def assign
        @mapping = {}

        provider = AliasSDNATDriver.provider(@provider, @host)

        return true if provider.nil?

        mapped = []

        rc = @vm.each_nic do |nic|
            next if !nic[:alias_id] || !nic[:parent_id] || !nic[:ip]

            map = provider.assign(nic[:ip])

            break false if map.empty?

            mapped << nic[:ip]

            @mapping.merge!(map)
        end

        mapped.each {|ip| provider.unassign(ip) } unless rc # rollback

        !rc
    end

    # Creates provider based on host template and unassign all nic IP aliases
    def unassign
        provider = AliasSDNATDriver.provider(@provider, @host)

        return if provider.nil?

        @vm.each_nic do |nic|
            next if !nic[:alias_id] || !nic[:parent_id] || !nic[:ip]

            provider.unassign(nic[:ip])
        end
    end

    # Factory method to create a VNM provider for the host provision
    #   @param host [OpenNebula::Host]
    #   @return [AWSProvider, PacketProvider, nil] nil
    def self.provider(provider, host)
        case provider.body['provider']
        when 'aws'
            require 'ec2_vnm'
            AWSProvider.new(provider, host)
        when 'packet'
            require 'packet_vnm'
            PacketProvider.new(provider, host)
        else
            nil
        end
    rescue StandardError => e
        OpenNebula.log_error(
            "Error creating provider #{provider.body['provider']}:#{e.message}"
        )
        nil
    end

    private

    # Run iptables command with given params on @ssh stream
    #   @param params [String]
    #   @return [String] command stdout
    def iptables(params)
        commands = VNMMAD::VNMNetwork::Commands.new
        commands.add :iptables, params
        commands.run_remote(@ssh)
    end

    # Defines iptables SNAT for IP pair
    #   @param parent_ip [String]
    #   @param alias_ip [String]
    def nat_add(parent_ip, alias_ip)
        iptables("-t nat -A POSTROUTING -s #{parent_ip} " \
                 "-j SNAT --to-source #{alias_ip}")

        iptables("-t nat -A PREROUTING  -d #{alias_ip} " \
                 "-j DNAT --to-destination #{parent_ip}")
    end

    # Cleans iptables SNAT for ip pair
    #   @param parent_ip [String]
    #   @param alias_ip [String]
    #   @param strict [Bool]
    def nat_drop(parent_ip, alias_ip, strict = false)
        iptables_s = iptables('-t nat -S')

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

    # Replace IP using mapping created by provider
    # For AWS: @mapping = { <elastic_ip> => <secondary_priv_ip>,  }
    #   @param ip [String]
    #   @return ip [String]
    def replace_ip(ip)
        @mapping[ip] || ip
    end

    # Creates iptables SNAT rules for all nic aliases
    def process_nat(activate = true, attach_nic_alias_id = nil)
        lock

        # create Alias IP <-> NIC IP mapping tables
        nic_parents = {}
        nic_aliases = {}

        process do |nic|
            if nic[:alias_id] && nic[:parent_id] && nic[:ip]
                next if attach_nic_alias_id &&
                        attach_nic_alias_id != nic[:nic_id]

                nic_aliases[replace_ip(nic[:ip])] = nic[:parent_id]
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
            # rubocop:disable Layout/LineLength
            # iptables -t nat -A POSTROUTING -s 192.168.0.0/24 -j SNAT --to-source 10.0.0.41
            # iptables -t nat -A PREROUTING -d 10.0.0.41 -j DNAT --to-destination 192.168.0.250
            # rubocop:enable Layout/LineLength
            nic_aliases.each do |alias_ip, parent_id|
                parent_ip = nic_parents[parent_id]

                nat_add(parent_ip, alias_ip) if parent_ip
            end
        end

        unlock
    end

end
# rubocop:enable Naming/FileName
