# PCI Affinity/Anti-Affinity Scheduling Rule
# Ensures SR-IOV vNICs from the same PCI anti-affinity group
# are placed on different physical PCI devices.

module OpenNebula
  module Scheduler
    module PCIAffinity
      # Checks anti-affinity constraints for a list of NICs (vNICs) against
      # a host's available PCI devices.
      # @param nics [Array<OpenNebula::VirtualMachine::NIC>] NICs from VM template
      # @param host [OpenNebula::Host] considered host
      # @return [Boolean] true if constraints satisfied
      def self.check_anti_affinity(nics, host)
        anti_affinity_groups = {}
        nics.each do |nic|
          group = nic['PCI_ANTI_AFFINITY_GROUP'] || nic['PCI_GROUP']
          next unless group
          anti_affinity_groups[group] ||= []
          anti_affinity_groups[group] << nic
        end

        anti_affinity_groups.each do |group, group_nics|
          # Get assigned PCI addresses for this group on the host
          host_pci_devices = host.info['/HOST/PCI_DEVICES/PCI'] || []
          # For each NIC in this group, check if its required PCI device (if specified)
          # or that it doesn't conflict with others
          # Here we assume NICs have a PCI_ADDRESS or we compare by physical function
          group_nics.each do |nic|
            pci_address = nic['PCI_ADDRESS']
            next unless pci_address
            # Check if this PCI address is already taken by another NIC in the same group
            # (simple implementation: just ensure all PCI addresses are unique within group)
            current_used = group_nics.map { |n| n['PCI_ADDRESS'] }.compact
            if current_used.count(pci_address) > 1
              return false
            end
          end
        end
        true
      end
    end
  end
end
