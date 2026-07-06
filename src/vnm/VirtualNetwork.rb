# ... existing code ...

class VirtualNetwork
  # ... existing code ...

  # Validates OVS VLAN configuration: tag must not be included in trunks
  # Returns true if valid, logs warning if conflicting, false if invalid (if fail on conflict)
  def check_ovs_vlan_conflict
    return true unless @vnet_info
    vlan_template = @vnet_info['VLAN_TEMPLATE'] || {}
    vlan_id = vlan_template['VLAN_ID']
    ovs_trunks = vlan_template['OVS_TRUNKS']
    
    # Only check if both VLAN_ID and OVS_TRUNKS are present
    return true if vlan_id.nil? || ovs_trunks.nil? || ovs_trunks.empty?
    
    # Parse OVS_TRUNKS: could be a string like "69,70,71" or an array
    if ovs_trunks.is_a?(String)
      trunks = ovs_trunks.split(',').map(&:strip).map(&:to_i)
    elsif ovs_trunks.is_a?(Array)
      trunks = ovs_trunks.map(&:to_i)
    else
      return true
    end
    
    if trunks.include?(vlan_id.to_i)
      err_msg = "OVS VLAN conflict: VLAN tag #{vlan_id} is also present in OVS trunks (#{trunks.join(',')}). This configuration is allowed but nonsensical."
      OpenNebula.log_warn(err_msg)
      # Optionally fail: return false and set error
      # return false
      return true # just warn
    end
    true
  end

  # ... in the create or update method, call check_ovs_vlan_conflict
  # For example, in def create: check_ovs_vlan_conflict before proceeding
  # def create
  #   return false unless check_ovs_vlan_conflict
  #   # ... rest of create
  # end

  # Similarly in update
  # def update
  #   return false unless check_ovs_vlan_conflict
  #   # ... rest of update
  # end

  # ... existing code ...
end
