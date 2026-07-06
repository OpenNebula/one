require_relative 'ovs_vlan_validator'

class VirtualNetwork
  # Existing code...

  # Override create and update to validate OVS VLAN configuration
  alias_method :original_create, :create
  def create
    validate_ovs_vlan_configuration
    original_create
  end

  alias_method :original_update, :update
  def update
    validate_ovs_vlan_configuration
    original_update
  end

  private

  def validate_ovs_vlan_configuration
    return unless self.vn_mad == 'ovswitch'

    tag = self.vlan_id.to_i rescue nil
    trunks_raw = self.trunks
    trunks = if trunks_raw.is_a?(String)
               trunks_raw.split(',').map(&:strip).reject(&:empty?).map(&:to_i)
             elsif trunks_raw.is_a?(Array)
               trunks_raw.map(&:to_i)
             else
               []
             end

    OVScope::OVSVlanValidator.validate(tag: tag, trunks: trunks)
  end
end
