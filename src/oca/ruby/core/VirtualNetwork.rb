# VirtualNetwork.rb - Core VirtualNetwork class with OVS VLAN conflict check

class VirtualNetwork
  # ... existing code ...

  # Create a new virtual network
  def create(template)
    # ... existing create logic ...
    check_ovs_vlan_conflict(template)
    # ... rest of create ...
  end

  # Update an existing virtual network
  def update(template)
    # ... existing update logic ...
    check_ovs_vlan_conflict(template)
    # ... rest of update ...
  end

  private

  # Check for conflicting OVS VLAN tag and trunks configuration
  # Logs a warning if the VLAN tag is also listed in the trunks
  def check_ovs_vlan_conflict(template)
    driver = template['VNM_MAD'] || template[:vnm_mad]
    return unless driver && driver.downcase == 'ovswitch'

    vlan_id = template['VLAN_ID'] || template[:vlan_id]
    trunks_raw = template['VLAN_TRUNKS'] || template[:vlan_trunks]
    return unless vlan_id && trunks_raw

    # Parse trunks: assume comma-separated list of integers
    trunks = trunks_raw.to_s.split(',').map(&:strip).select { |t| t =~ /^\d+$/ }.map(&:to_i)
    vlan = vlan_id.to_i

    if trunks.include?(vlan)
      warn "[Warning] Virtual network VLAN tag #{vlan} is also configured as a trunk. This configuration is ambiguous in Open vSwitch. Consider removing #{vlan} from the trunks list."
    end
  end
end
