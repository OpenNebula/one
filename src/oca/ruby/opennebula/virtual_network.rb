# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

require 'opennebula/pool_element'

module OpenNebula
    class VirtualNetwork < PoolElement
        # ... (existing code)

        # Validates OVS VLAN configuration for conflicts.
        # If a VLAN tag is also present in the trunk list, a warning is issued.
        # This prevents misconfigurations where a port's native VLAN (tag) 
        # is also listed as a trunked VLAN.
        #
        # @param template [String] XML template of the virtual network
        # @return [Array] Array of warning messages (empty if no conflicts)
        def self.check_ovs_vlan_conflict(template)
            warnings = []

            begin
                xml = XMLElement.parse_xml(template)
            rescue => e
                return ["Failed to parse template: #{e.message}"]
            end

            # Extract the VLAN configuration from the template
            vlan = xml.root.at_xpath('VLAN')
            return warnings unless vlan && vlan.text == 'YES'

            # Only check for OVS bridges (driver = ovswitch)
            bridge = xml.root.at_xpath('BRIDGE')
            return warnings unless bridge

            # Get the VLAN ID from the VN_MAD or directly from the template
            vn_mad = xml.root.at_xpath('VN_MAD')
            return warnings unless vn_mad && vn_mad.text.strip.downcase == 'ovswitch'

            # Extract tag and trunks
            tag_elem = xml.root.at_xpath('VLAN_ID')
            return warnings unless tag_elem
            tag = tag_elem.text.to_i

            trunks_elem = xml.root.at_xpath('TRUNK_VLAN_ID')
            return warnings unless trunks_elem

            trunks = trunks_elem.text.split(',').map(&:strip).map(&:to_i)

            if trunks.include?(tag)
                warnings << "Warning: OVS VLAN tag #{tag} is also listed in trunks (#{trunks.join(',')}). " \
                            "This configuration is valid in Open vSwitch but is likely a misconfiguration. " \
                            "The port will be configured with native VLAN #{tag} and also trunk it."
            end

            warnings
        end

        # Override the create method to include OVS VLAN conflict check
        def create(template)
            warnings = self.class.check_ovs_vlan_conflict(template)
            warnings.each { |w| OpenNebula::Log.warn(w) }
            super(template)
        end

        # Override the update method to include OVS VLAN conflict check
        def update(template)
            warnings = self.class.check_ovs_vlan_conflict(template)
            warnings.each { |w| OpenNebula::Log.warn(w) }
            super(template)
        end

        # ... (rest of the class)
    end
end
