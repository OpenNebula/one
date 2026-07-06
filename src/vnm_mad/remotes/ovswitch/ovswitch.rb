# OpenNebula OVS Driver
# ... (existing code)

module VNMad
  class OVSDriver
    # ... existing methods

    # Validate OVS VLAN configuration
    def validate_vlan_config(net_attrs)
      tag = net_attrs[:tag]
      trunks = net_attrs[:trunks]
      if tag && trunks && trunks.include?(tag)
        raise "Conflicting VLAN configuration: tag #{tag} is also in trunks list"
      end
    end

    def create_vnet(vm_net, vnet_id, bridge, options = {})
      # Validate before proceeding
      validate_vlan_config(vm_net)
      # ... rest of create code
    end

    def update_vnet(vm_net, vnet_id, bridge, options = {})
      # Validate before proceeding
      validate_vlan_config(vm_net)
      # ... rest of update code
    end
  end
end
