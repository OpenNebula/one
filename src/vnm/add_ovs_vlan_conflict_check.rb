# OVS VLAN conflict checker
# Include this module into VirtualNetwork class to validate
# that VLAN tag is not among trunks.

module OVSVlanConflictCheck
  def self.included(base)
    base.class_eval do
      alias_method :create_without_ovs_check, :create
      def create(*args)
        create_without_ovs_check(*args)
        check_ovs_vlan_conflict if @vn_mad == 'ovswitch'
      end

      alias_method :update_without_ovs_check, :update
      def update(*args)
        update_without_ovs_check(*args)
        check_ovs_vlan_conflict if @vn_mad == 'ovswitch'
      end

      private

      def check_ovs_vlan_conflict
        tag = self['TEMPLATE/VLAN_ID']
        trunks = self['TEMPLATE/TRUNKS']
        return if trunks.nil? || tag.nil?
        trunk_list = trunks.split(',').map(&:strip).map(&:to_i)
        if trunk_list.include?(tag.to_i)
          raise "OVS VLAN configuration conflict: tag #{tag} is also in trunks #{trunks}"
        end
      end
    end
  end
end

# To use:
# VirtualNetwork.include(OVSVlanConflictCheck)
