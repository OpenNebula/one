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
module NSXDriver

    # Class Logical Switch
    class NSXVRule < NSXRule

        # ATTRIBUTES

        # CONSTRUCTOR

        def initialize(nsx_client)
            super(nsx_client)
            @base_url = NSXConstants::NSXV_RULE_BASE
        end

        # Adapt port from ["22, 443"] to '22, 443'
        # Adapt port from ["22", "443"] to '22, 443'
        def parse_ports(rule_ports)
            unless rule_ports.empty?
                rule_ports = rule_ports.join(',')
            end
            rule_ports
        end

        def create_rule_spec(rule, vm_data, nic_data)
            rule_name = "#{rule[:id]}-#{rule[:name]}-#{vm_data[:id]}-#{vm_data[:deploy_id]}-#{nic_data[:id]}"

            builder = Nokogiri::XML::Builder.new(:encoding => 'UTF-8') do |xml|
                xml.rule('disabled' => 'false', 'logged' => 'false') {
                    xml.name rule_name
                    xml.action 'allow'
                    xml.appliedToList {
                        xml.appliedTo {
                            xml.name nic_data[:name]
                            xml.value nic_data[:lp]
                            xml.type 'Vnic'
                            xml.isValid 'true'
                        }
                    }
                    xml.sectionId @one_section_id

                    ###### SOURCES / DESTINATIONS: Any | IP Address | Vnet #####

                    unless rule[:network_id].empty? && rule[:subnets].empty?

                        if rule[:direction] == 'IN'
                            xml.sources('excluded' => 'false') {
                                if !rule[:network_id].empty?
                                    xml.source {
                                        xml.name rule[:network_name]
                                        xml.value rule[:network_nsxid]
                                        xml.type 'VirtualWire'
                                        xml.isValid 'true'
                                    }
                                elsif !rule[:subnets].empty?
                                    rule[:subnets].each do |subnet|
                                        xml.source {
                                            ip_version = IPAddr.new(subnet).ipv4? ? 'Ipv4Address' : 'Ipv6Address'
                                            xml.value subnet
                                            xml.type ip_version
                                            xml.isValid 'true'
                                        }
                                    end
                                end
                            }
                        else
                            xml.destinations('excluded' => 'false') {
                                # Target network: Vnet
                                if !rule[:network_id].empty?
                                    xml.destination {
                                        xml.name nic_data[:network_name]
                                        xml.value rule[:network_nsxid]
                                        xml.type 'VirtualWire'
                                        xml.isValid 'true'
                                    }
                                # Target network: Manual network (IP Address)
                                elsif !rule[:subnets].empty?
                                    rule[:subnets].each do |subnet|
                                        xml.destination {
                                            ip_version = IPAddr.new(subnet).ipv4? ? 'Ipv4Address' : 'Ipv6Address'
                                            xml.value subnet
                                            xml.type ip_version
                                            xml.isValid 'true'
                                        }
                                    end
                                end
                            }
                        end

                    end

                    ##### SERVICES #####
                    unless rule[:protocol].empty?
                        xml.services {
                            case rule[:protocol]
                            when 'TCP'
                                xml.service {
                                    xml.isValid 'true'
                                    xml.protocol '6'
                                    xml.protocolName 'TCP'
                                    xml.sourcePort parse_ports(rule[:ports]) \
                                        if rule[:direction] == 'IN'
                                    xml.destinationPort parse_ports(rule[:ports]) \
                                        if rule[:direction] == 'OUT'
                                }
                            when 'UDP'
                                xml.service {
                                    xml.isValid 'true'
                                    xml.protocol '17'
                                    xml.protocolName 'UDP'
                                    xml.sourcePort parse_ports(rule[:ports]) \
                                        if rule[:direction] == 'IN'
                                    xml.destinationPort parse_ports(rule[:ports]) \
                                        if rule[:direction] == 'OUT'
                                }
                            when 'ICMP'
                                xml.service {
                                    xml.isValid 'true'
                                    xml.protocol '1'
                                    xml.protocolName 'ICMP'
                                }
                            when 'ICMPv6'
                                xml.service {
                                    xml.isValid 'true'
                                    xml.protocol '58'
                                    xml.protocolName 'IPV6ICMP'
                                }
                            when 'IPSEC'
                                ports = NSXConstants::NSX_RULE_IPSEC_PORTS
                                xml.service {
                                    xml.isValid 'true'
                                    xml.protocol '50'
                                    xml.protocolName 'ESP'
                                }
                                xml.service {
                                    xml.isValid 'true'
                                    xml.protocol '51'
                                    xml.protocolName 'AH'
                                }
                                xml.service {
                                    xml.isValid 'true'
                                    xml.protocol '17'
                                    xml.protocolName 'UDP'
                                    xml.sourcePort parse_ports(ports) \
                                        if rule[:direction] == 'IN'
                                    xml.destinationPort parse_ports(ports) \
                                        if rule[:direction] == 'OUT'
                                }
                            end
                        }

                    end

                    xml.direction rule[:direction].downcase
                    xml.packetType 'any'
                } # end xml.rule
            end
            builder.to_xml
        end

    end

end
