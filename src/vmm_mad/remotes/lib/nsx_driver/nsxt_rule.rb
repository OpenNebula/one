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
    class NSXTRule < NSXDriver::NSXRule

        # ATTRIBUTES

        # CONSTRUCTOR

        def initialize(nsx_client)
            super(nsx_client)
            @base_url = NSXDriver::NSXConstants::NSXT_RULE_BASE
        end

        def create_rule_spec(rule, vm_data, nic_data)
            # default spec
            # Allow any-any to any port applied on the virtual machine logical port
            rule_spec = {
                :display_name => "#{rule[:id]}-#{rule[:name]}-#{vm_data[:id]}-#{vm_data[:deploy_id]}-#{nic_data[:id]}",
                :destinations_excluded => false,
                :sources => [],
                :destinations => [],
                :services => [],
                :applied_tos => [
                    {
                        :target_id => nic_data[:lp].id,
                        :target_display_name => nic_data[:name],
                        :target_type => nic_data[:lp].type,
                        :is_valid => true
                    }
                ],
                :ip_protocol => 'IPV4_IPV6',
                :logged => false,
                :action => 'ALLOW',
                :sources_excluded => false,
                :disabled => false,
                :direction => rule[:direction]
            }

            rule_protocol_template = {
                'TCP' => [
                    {
                        :service => {
                            :l4_protocol => 'TCP',
                            :source_ports => [],
                            :destination_ports => [],
                            :resource_type => 'L4PortSetNSService'
                        }
                    }
                ],
                'UDP' => [
                    {
                        :service => {
                            :l4_protocol => 'UDP',
                            :source_ports => [],
                            :destination_ports => [],
                            :resource_type => 'L4PortSetNSService'
                        }
                    }
                ],
                'ICMP' => [
                    {
                        :service => {
                            :protocol => 'ICMPv4',
                            :resource_type => 'ICMPTypeNSService'
                        }
                    }
                ],
                'ICMPv6' => [
                    {
                        :service => {
                            :protocol => 'ICMPv6',
                            :resource_type => 'ICMPTypeNSService'
                        }
                    }
                ],
                'IPSEC' => [
                    {
                        :service => {
                            :l4_protocol => 'UDP',
                            :source_ports => [],
                            :destination_ports => [],
                            :resource_type => 'L4PortSetNSService'
                        }
                    },
                    {
                        :service => {
                            :protocol_number => 50,
                            :resource_type => 'IPProtocolNSService'
                        }
                    },
                    {
                        :service => {
                            :protocol_number => 51,
                            :resource_type => 'IPProtocolNSService'
                        }
                    }
                ],
                'ALL' => [
                    {
                        :service => {
                            :source_ports => [],
                            :destination_ports => []
                        }
                    }
                ]
            }

            # Modify default rule spec based on rule_data extracted
            # from vm template

            ###### SOURCES / DESTINATIONS: Any | IP Address | Vnet #####
            src_or_dst = []

            # Target network: Vnet
            if !rule[:network_id].empty?

                src_or_dst << {
                    :target_id => rule[:network_nsxid],
                    :target_display_name => rule[:network_name],
                    :target_type => 'LogicalSwitch',
                    :is_valid => true
                }

            # Target network: Manual network (IP Address)
            elsif !rule[:subnets].empty?
                rule[:subnets].each do |subnet|
                    src_or_dst << {
                        :target_id => subnet,
                        :target_display_name => subnet,
                        :target_type => 'IPAddress',
                        :is_valid => true
                    }
                end
            end

            # (OpenNebula) INBOUND  => Destination (NSX)
            # (OpenNebula) OUTBOUND => Source (NSX)
            unless src_or_dst.empty?
                rule_spec[:sources] = src_or_dst \
                    if rule[:direction] == 'IN'
                rule_spec[:destinations] = src_or_dst \
                    if rule[:direction] == 'OUT'
            end

            ##### SERVICES #####
            services = []
            service = rule_protocol_template[rule[:protocol]]

            case rule[:protocol]
            when 'TCP'
                service[0][:service][:source_ports] = rule[:ports] \
                    if rule[:direction] == 'IN'
                service[0][:service][:destination_ports] = rule[:ports] \
                    if rule[:direction] == 'OUT'
            when 'UDP'
                service[0][:service][:source_ports] = rule[:ports] \
                    if rule[:direction] == 'IN'
                service[0][:service][:destination_ports] = rule[:ports] \
                    if rule[:direction] == 'OUT'
            # when 'ICMP'
            # when 'ICMPv6'
            when 'IPSEC'
                service[0][:service][:source_ports] = NSXDriver::NSXConstants::NSX_RULE_IPSEC_PORTS if rule[:direction] == 'IN'
                service[0][:service][:destination_ports] = NSXDriver::NSXConstants::NSX_RULE_IPSEC_PORTS if rule[:direction] == 'OUT'
            when 'ALL'
                service[0][:service][:source_ports] = rule[:ports] \
                    if rule[:direction] == 'IN'
                service[0][:service][:destination_ports] = rule[:ports] \
                    if rule[:direction] == 'OUT'
            end

            if rule[:protocol] != 'ALL' && !service.empty?
                service.each do |s|
                    services << s
                end
                rule_spec[:services] = services
            end

            rule_spec
        end

    end

end
