# OpenNebulaNetwork.rb - Network configuration helper
# Add validation for OVS VLAN tag and trunk conflict

class OpenNebulaNetwork
  # ... existing code ...

  # Validates that the VLAN tag is not also included in the trunks list for OVS bridges.
  # Raises an error if conflict is detected.
  # @param network [Hash] network configuration hash with keys :vlan_id, :ovs_trunks, etc.
  def self.validate_ovs_vlan_config(network)
    vlan_id = network[:vlan_id]
    trunks = network[:ovs_trunks]

    return if vlan_id.nil? || trunks.nil? || trunks.empty?

    trunks_array = trunks.is_a?(Array) ? trunks : trunks.split(',').map(&:strip).map(&:to_i)

    if trunks_array.include?(vlan_id.to_i)
      raise "VLAN tag #{vlan_id} is also included in trunks #{trunks} - this configuration is invalid and may cause unexpected behavior."
    end
  rescue => e
    OpenNebula.log_error("OVS VLAN validation failed: #{e.message}")
    raise e
  end
end

# Hook into VNet creation/update methods (example for OVS driver)
# In the appropriate driver (e.g., OpenNebulaNetworkVLAN), call:
#   OpenNebulaNetwork.validate_ovs_vlan_config(network_config)
