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

require 'ipaddr'

module NSXDriver

    # Class Logical Switch
    class NSXRule < NSXDriver::NSXComponent

        # ATTRIBUTES

        # CONSTRUCTOR

        def initialize(nsx_client)
            super(nsx_client)
        end

        def self.new_child(nsx_client)
            case nsx_client
            when NSXDriver::NSXTClient
                NSXDriver::NSXTRule.new(nsx_client)
            when NSXDriver::NSXVClient
                NSXDriver::NSXVRule.new(nsx_client)
            else
                error_msg = "Unknown object type: #{nsx_client}"
                error = NSXDriver::NSXError::UnknownObject.new(error_msg)
                raise error
            end
        end

        def to_nets(ip_start, size)
            nets = Array.new

            begin
                ipaddr = IPAddr.new ip_start
            rescue
                return
            end

            ip_i = ipaddr.to_i

            if ipaddr.ipv4?
                ip_length = 32
            elsif ipaddr.ipv6?
                ip_length = 128
            else
                return
            end

            # Find the largest address block (look for the first 1-bit)
            lblock = 0

            lblock += 1 while (ip_i[lblock] == 0 && lblock < ip_length )

            # Allocate whole blocks till the size fits
            while ( size >= 2**lblock )
                nets << "#{IPAddr.new(ip_i, ipaddr.family).to_s}/#{ip_length-lblock}"

                ip_i += 2**lblock
                size -= 2**lblock

                lblock += 1 while (ip_i[lblock] == 0 && lblock < ip_length )
            end

            # Fit remaining address blocks
            ip_length.downto(0) { |i|
                next if size[i] == 0

                nets << "#{IPAddr.new(ip_i, ipaddr.family).to_s}/#{ip_length-i}"

                ip_i += 2**i
            }

            return nets
        end

        def extract_vnet_data(vnet_id)
            if vnet_id == ''
                return {
                    :nsxid => '',
                    :name => ''
                }
            end
            # Create client to communicate with OpenNebula
            one_client = OpenNebula::Client.new
            # Get the network XML from OpenNebula
            # This is potentially different from the Netowrk Template
            # provided as the API call argument
            one_vnet = OpenNebula::VirtualNetwork.new_with_id(vnet_id, one_client)
            rc = one_vnet.info
            if OpenNebula.is_error?(rc)
                err_msg = rc.message
                raise CreateNetworkError, err_msg
            end
            vnet_data = {
                :nsxid => one_vnet['TEMPLATE/NSX_ID'],
                :name => one_vnet['NAME']
            }
            vnet_data
        end

        def extract_rule_data(xml_rule)
            File.open('/tmp/nsx_rule_xml_rule.debug', 'a'){|f| f.write(xml_rule)}

            sg_id = xml_rule.xpath('SECURITY_GROUP_ID').text
            sg_name = xml_rule.xpath('SECURITY_GROUP_NAME').text
            sg_direction = (xml_rule.xpath('RULE_TYPE').text.upcase) == 'INBOUND' ? 'IN' : 'OUT'
            # Protocol: TCP, UDP, ICMP...
            sg_protocol = xml_rule.xpath('PROTOCOL').text
            if sg_protocol == 'ICMP'
                sg_icmp_type = xml_rule.xpath('ICMP_TYPE').text
            end
            # OpenNebula network ID
            sg_network_id = xml_rule.xpath('NETWORK_ID').text
            vnet_data = extract_vnet_data(sg_network_id)

            # ip / netmask
            sg_ip = xml_rule.xpath('IP').text
            sg_ipsize = xml_rule.xpath('SIZE').text
            sg_subnets = []
            if sg_ip != "" && sg_ipsize != ""
                sg_subnets = to_nets(sg_ip, sg_ipsize.to_i)
            end
            # Ports
            sg_ports = ""
            sg_range_port = xml_rule.xpath('RANGE').text
            if sg_range_port
                if sg_range_port.index(':')
                    sg_port_from = sg_range_port[0..sg_range_port.index(':')-1]
                    sg_port_to = sg_range_port[sg_range_port.index(':')+1,
                                                sg_range_port.length]
                    sg_ports = "#{sg_port_from}-#{sg_port_to}"
                else
                    sg_ports = sg_range_port
                end
            end
            # Create hash with data
            rule_data = {
                :id => sg_id,
                :name => sg_name,
                :direction => sg_direction,
                :protocol => sg_protocol,
                :icmp_type => sg_icmp_type,
                :network_id => sg_network_id,
                :network_name => vnet_data[:name],
                :network_nsxid => vnet_data[:nsxid],
                :subnets => sg_subnets,
                :ports => sg_ports.split(',')
            }
            File.open('/tmp/nsx_rule_data.debug', 'a'){|f| f.write(rule_data)}


            rule_data
        end

        def create_rule_spec(rule, vm_data, nic_data); end

    end

end
