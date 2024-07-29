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
module NSXDriver

    module NSXRule

        # Module NSXVRule
        module NSXVRule

            def nsxv_rule_spec(rule, vm_data, nic_data)
                rule_name = "#{rule[:id]}-#{rule[:name]}-#{vm_data[:id]}"
                rule_name << "-#{vm_data[:deploy_id]}-#{nic_data[:id]}"

                # rubocop:disable Layout/LineLength
                builder = Nokogiri::XML::Builder.new(:encoding => 'UTF-8') do |xml|
                    # rubocop:enable Layout/LineLength
                    xml.rule('disabled' => 'false', 'logged' => 'false') do
                        xml.name rule_name
                        xml.action 'allow'
                        xml.appliedToList do
                            xml.appliedTo do
                                xml.name nic_data[:name]
                                xml.value nic_data[:lp]
                                xml.type 'Vnic'
                                xml.isValid 'true'
                            end
                        end
                        xml.sectionId @one_section_id

                        # SOURCES / DESTINATIONS: Any | IP Address | Vnet

                        unless rule[:network_id].empty? && rule[:subnets].empty?

                            if rule[:direction] == 'IN'
                                xml.sources('excluded' => 'false') do
                                    if !rule[:network_id].empty?
                                        xml.source do
                                            xml.name rule[:network_name]
                                            xml.value rule[:network_nsxid]
                                            xml.type 'VirtualWire'
                                            xml.isValid 'true'
                                        end
                                    elsif !rule[:subnets].empty?
                                        rule[:subnets].each do |subnet|
                                            xml.source do
                                                # rubocop:disable Layout/LineLength
                                                ip_version = IPAddr.new(subnet).ipv4? ? 'Ipv4Address' : 'Ipv6Address'
                                                # rubocop:enable Layout/LineLength
                                                xml.value subnet
                                                xml.type ip_version
                                                xml.isValid 'true'
                                            end
                                        end
                                    end
                                end
                            else
                                xml.destinations('excluded' => 'false') do
                                    # Target network: Vnet
                                    if !rule[:network_id].empty?
                                        xml.destination do
                                            xml.name nic_data[:network_name]
                                            xml.value rule[:network_nsxid]
                                            xml.type 'VirtualWire'
                                            xml.isValid 'true'
                                        end
                                    # Target network: Manual network(IP Address)
                                    elsif !rule[:subnets].empty?
                                        rule[:subnets].each do |subnet|
                                            xml.destination do
                                                # rubocop:disable Layout/LineLength
                                                ip_version = IPAddr.new(subnet).ipv4? ? 'Ipv4Address' : 'Ipv6Address'
                                                # rubocop:enable Layout/LineLength
                                                xml.value subnet
                                                xml.type ip_version
                                                xml.isValid 'true'
                                            end
                                        end
                                    end
                                end
                            end
                        end

                        ##### SERVICES #####
                        unless rule[:protocol].empty?
                            xml.services do
                                case rule[:protocol]
                                when 'TCP'
                                    xml.service do
                                        xml.isValid 'true'
                                        xml.protocol '6'
                                        xml.protocolName 'TCP'
                                        # rubocop:disable Layout/LineLength
                                        xml.sourcePort parse_ports(rule[:ports]) \
                                            if rule[:direction] == 'IN'
                                        xml.destinationPort parse_ports(rule[:ports]) \
                                            if rule[:direction] == 'OUT'
                                        # rubocop:enable Layout/LineLength
                                    end
                                when 'UDP'
                                    xml.service do
                                        xml.isValid 'true'
                                        xml.protocol '17'
                                        xml.protocolName 'UDP'
                                        # rubocop:disable Layout/LineLength
                                        xml.sourcePort parse_ports(rule[:ports]) \
                                            if rule[:direction] == 'IN'
                                        xml.destinationPort parse_ports(rule[:ports]) \
                                            if rule[:direction] == 'OUT'
                                        # rubocop:enable Layout/LineLength
                                    end
                                when 'ICMP'
                                    xml.service do
                                        xml.isValid 'true'
                                        xml.protocol '1'
                                        xml.protocolName 'ICMP'
                                    end
                                when 'ICMPv6'
                                    xml.service do
                                        xml.isValid 'true'
                                        xml.protocol '58'
                                        xml.protocolName 'IPV6ICMP'
                                    end
                                when 'IPSEC'
                                    ports = NSXConstants::NSX_RULE_IPSEC_PORTS
                                    xml.service do
                                        xml.isValid 'true'
                                        xml.protocol '50'
                                        xml.protocolName 'ESP'
                                    end
                                    xml.service do
                                        xml.isValid 'true'
                                        xml.protocol '51'
                                        xml.protocolName 'AH'
                                    end
                                    xml.service do
                                        xml.isValid 'true'
                                        xml.protocol '17'
                                        xml.protocolName 'UDP'
                                        xml.sourcePort parse_ports(ports) \
                                            if rule[:direction] == 'IN'
                                        xml.destinationPort parse_ports(ports) \
                                            if rule[:direction] == 'OUT'
                                    end
                                end
                            end
                        end

                        xml.direction rule[:direction].downcase
                        xml.packetType 'any'
                    end
                end
                builder.to_xml
            end

        end

    end

end
