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
                        :target_display_name => nic_data[:lp].name,
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

            # Modify default rule spec based on rule_data extracted from vm template
            # SOURCES OR DESTINATIONS: Any | IP Address | Vnet
            networks_array = []

            # Target network: Vnet
            if rule[:network_id] != ''

                networks_array << {
                    :target_id => rule[:network_nsxid],
                    :target_display_name => rule[:network_name],
                    :target_type => "LogicalSwitch",
                    :is_valid => true
                }

            # Target network: Manual network (IP Address)
            elsif rule[:ip] != "" && rule[:size] != ""
                File.open('/tmp/post_rule_spec_rule.debug', 'a') {|f| f.write(rule)}
                networks = to_nets(rule[:ip], rule[:ipsize].to_i)
                File.open('/tmp/post_nets.debug', 'w') {|f| f.write(networks)}
                raise 'Networks are empty due to invalid ip size' if networks.empty?

                networks.each do |network|
                    networks_array << {
                        :target_id => network,
                        :target_display_name => network,
                        :target_type => 'IPAddress',
                        :is_valid => true
                    }
                end
            end

            # (OpenNebula) INBOUND  => Destination (NSX)
            # (OpenNebula) OUTBOUND => Source (NSX)
            unless networks_array.empty?
                rule_spec['sources'] = networks_array if rule[:direction] == 'OUT'
                rule_spec['destinations'] = networks_array if rule[:direction] == 'IN'
            end

            rule_spec
        end

    end

end
