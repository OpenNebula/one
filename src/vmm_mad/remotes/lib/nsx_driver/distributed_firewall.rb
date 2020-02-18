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
    class DistributedFirewall < NSXDriver::NSXComponent

        # ATTRIBUTES

        # CONSTRUCTOR
        def initialize(nsx_client)
            super(nsx_client)
            @one_section_name = NSXDriver::NSXConstants::ONE_SECTION_NAME
        end

        def self.new_child(nsx_client)
            case nsx_client
            when NSXDriver::NSXTClient
                NSXDriver::NSXTdfw.new(nsx_client)
            when NSXDriver::NSXVClient
                NSXDriver::NSXVdfw.new(nsx_client)
            else
                error_msg = "Unknown object type: #{nsx_client}"
                error = NSXDriver::NSXError::UnknownObject.new(error_msg)
                raise error
            end
        end

        # Sections
        # Creates OpenNebula section if not exists and returns
        # its section_id. Returns its section_id if OpenNebula
        # section already exists
        def init_section; end

        # Get all sections
        def sections; end

        # Get section by id
        def section_by_id(section_id); end

        # Get section by name
        def section_by_name(section_name); end

        # Create new section
        def create_section(section_name); end

        # Delete section
        def delete_section(section_id); end

        # Rules
        # Get all rules
        def rules; end

        # Get rule by id
        def rules_by_id; end

        # Get rule by name
        def rules_by_name; end

        # Create new rule
        def create_rule; end

        # Update rule
        def update_rule; end

        # Delete rule
        def delete_rule; end

        def extract_nic_data(nic, nsx_client, vm)
            # Network attributes
            nic_id = nic.xpath('NIC_ID').text
            nic_lp = nil
            network_id = nic.xpath('NETWORK_ID').text
            network_vcref = nic.xpath('VCENTER_NET_REF').text
            network_pgtype = nic.xpath('VCENTER_PORTGROUP_TYPE').text
            network_mac = nic.xpath('MAC').text

            # Virtual Machine devices
            vm_devices = vm.item.config.hardware.device
            vm_devices.each do |device|
                next unless vm.is_nic?(device)

                next if device.macAddress != network_mac

                case network_pgtype
                when NSXDriver::NSXConstants::NSXT_LS_TYPE
                    lpid = device.externalId
                    nic_lp = NSXDriver::LogicalPort.new_child(nsx_client, lpid)
                    raise "Logical port id: #{lpid} not found" unless nic_lp
                    # target_id => id
                    # target_display_name => display_name
                    # target_type => resource_type
                when NSXDriver::NSXConstants::NSXV_LS_TYPE
                    device.backing.port.portGroupKey
                else
                    error_msg = "Network type is: #{network_pgtype} \
                                    and should be \
                                    #{NSXDriver::NSXConstants::NSXT_LS_TYPE} \
                                    or #{NSXDriver::NSXConstants::NSXV_LS_TYPE}"
                    error = NSXDriver::NSXError::UnknownObject.new(error_msg)
                    STDERR.puts error_msg
                    raise error
                end
            end

            nic_data = {
                :id => nic_id,
                :network_id => network_id,
                :network_vcref => network_vcref,
                :lp => nic_lp
            }

            nic_data
        end

        # Create OpenNebula fw rules for an instance (given a template)
        def create_opennebula_rules(deploy_id, template)
            template_xml = Nokogiri::XML(template)

            # OpenNebula host
            host_name = template_xml
                        .xpath('//HISTORY_RECORDS/HISTORY[last()]/HOSTNAME')
                        .text
            one_host = VCenterDriver::VIHelper
                       .find_by_name(OpenNebula::HostPool, host_name)
            rc = one_host.info
            if OpenNebula.is_error?(rc)
                err_msg = rc.message
                raise err_msg
            end
            host_id = one_host['ID']

            # OpenNebula VM
            one_vm = VCenterDriver::VIHelper
                     .one_item(OpenNebula::VirtualMachine, deploy_id)

            vm_data = {
                :id => template_xml.xpath('//VM/ID').text,
                :deploy_id => deploy_id
            }

            # vCenter VirtualMachine
            vi_client = VCenterDriver::VIClient.new_from_host(host_id)
            vm = VCenterDriver::VirtualMachine
                 .new_one(vi_client, deploy_id, one_vm)

            # NSX Objects needed
            nsx_rule = NSXDriver::NSXRule.new_child(@nsx_client)
            ls = NSXDriver::LogicalSwitch.new(@nsx_client)

            # Search NSX Nics
            # First try to search only new attached NSX Nics
            nsx_nics = ls.nsx_nics(template_xml, true)
            if nsx_nics.empty?
                # Second try to search any NSX Nics
                nsx_nics = ls.nsx_nics(template_xml, false)
            end
            # If there is no NSX Nics
            return if nsx_nics.empty?

            # Create rules for each NSX Nic
            nsx_nics.each do |nic|
                # Extract NIC data
                nic_data = extract_nic_data(nic, @nsx_client, vm)
                # Get all Security Groups belonging to each NIC.
                sec_groups = nic.xpath('SECURITY_GROUPS').text.split(',')
                sec_groups.each do |sec_group|
                    sg_rules_array = []
                    # Get all rules belonging to this Security Group.
                    xp = "//SECURITY_GROUP_RULE[SECURITY_GROUP_ID=#{sec_group}]"
                    sg_rules = template_xml.xpath(xp)
                    sg_rules.each do |sg_rule|

                        # Create rules spec
                        rule_data = nsx_rule.extract_rule_data(sg_rule)
                        rule_spec = nsx_rule.create_rule_spec(rule_data,
                                                              vm_data,
                                                              nic_data)
                        sg_rules_array.push(rule_spec)
                    end
                    # Create NSX rules
                    sg_rules_array.each do |sg_spec|
                        begin
                            create_rule(sg_spec)
                        rescue StandardError => e
                            STDERR.puts e.message
                            STDERR.puts e.backtrace \
                                if VCenterDriver::CONFIG[:debug_information]
                            clear_opennebula_rules(template, nsx_nics)
                        end
                    end
                end
            end
        end

        # Remove OpenNebula created fw rules for an instance (given a template)
        def clear_opennebula_rules(template)
            template_xml = Nokogiri::XML(template)
            File.open('/tmp/dfw_clear_template.debug', 'w'){|f| f.write(template_xml)}
            # OpenNebula Instance IDs
            vm_id = template_xml.xpath('//VM/ID').text
            vm_deploy_id = template_xml.xpath('//DEPLOY_ID').text

            # Search NSX Nics
            ls = NSXDriver::LogicalSwitch.new(@nsx_client)
            # First try to search only new attached NSX Nics
            nsx_nics = ls.nsx_nics(template_xml, true)
            if nsx_nics.empty?
                # Second try to search any NSX Nics
                nsx_nics = ls.nsx_nics(template_xml, false)
            end

            File.open('/tmp/dfw_clear_nsx_nics.debug', 'w'){|f| f.write(nsx_nics)}

            # If there is no NSX Nics
            return if nsx_nics.empty?

            nsx_nics.each do |nic|
                nic_id = nic.xpath('NIC_ID').text
                # network_id = nic.xpath('NETWORK_ID').text
                sec_groups = nic.xpath('SECURITY_GROUPS').text.split(',')
                sec_groups.each do |sec_group|
                    xp = "//SECURITY_GROUP_RULE[SECURITY_GROUP_ID=#{sec_group}]"
                    sg_rules = template_xml.xpath(xp)
                    File.open('/tmp/dfw_clear_sg_rules.debug', 'a'){|f| f.write(sg_rules)}
                    sg_rules.each do |sg_rule|
                        sg_id = sg_rule.xpath('SECURITY_GROUP_ID').text
                        sg_name = sg_rule.xpath('SECURITY_GROUP_NAME').text
                        rule_name = "#{sg_id}-#{sg_name}-#{vm_id}-#{vm_deploy_id}-#{nic_id}"
                        File.open('/tmp/dfw_clear_rules_name.debug', 'a'){|f| f.write(rule_name)}
                        rules = rules_by_name(rule_name, @one_section_id)
                        File.open('/tmp/dfw_clear_rules.debug', 'a'){|f| f.write(rules)}
                        rules.each do |rule|
                            delete_rule(rule['id'], @one_section_id) if rule
                        end
                    end
                end
            end

        end

    end

end
