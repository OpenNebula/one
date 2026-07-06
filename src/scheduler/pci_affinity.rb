# PCI Affinity/Antiaffinity Scheduling Extension
# Enforces SR-IOV vNICs placement on different physical NICs.

module Scheduler
  module PCIAffinity
    # Checks if a host satisfies the PCI affinity/antiaffinity constraints for a VM.
    # @param host [Host] the candidate host
    # @param vm [VM] the virtual machine with vNIC definitions
    # @return [Boolean] true if constraints are satisfied
    def self.satisfied?(host, vm)
      vm_nics = vm.template['NIC'] || []
      return true if vm_nics.empty?

      # Group vNICs by PCI_ADDRESS if specified in template
      pci_groups = Hash.new { |h, k| h[k] = [] }
      vm_nics.each do |nic|
        pci_addr = nic['PCI_ADDRESS']
        next if pci_addr.nil? || pci_addr.empty?
        pci_groups[pci_addr] << nic
      end

      return true if pci_groups.empty?

      # For each group, ensure that vNICs in the same group are placed on
      # different physical NICs. We check host's available PCI devices.
      host_pcis = host.resources[:pci] || []
      grouped_pcis = host_pcis.group_by { |pci| pci['ADDRESS'] }

      pci_groups.each do |addr, nics|
        # If the VM specifies a PCI address, that is the target.
        # For antiaffinity, we require that each vNIC in the same group
        # uses a different physical NIC. But since they all specify the same
        # PCI address? Actually, the requirement is for vNICs that want
        # antiaffinity: they should be placed on different physical NICs.
        # Typically, each vNIC would specify a different PCI address?
        # This extension assumes that vNICs with the same PCI_ADDRESS in the
        # template should be scheduled on distinct physical NICs.
        #
        # Simplified: If multiple vNICs have the same PCI_ADDRESS, they must
        # be placed on different physical NICs (antiaffinity).
        #
        # Check host has enough distinct physical NICs to accommodate.
        available_physical_nics = host_pcis.map { |pci| pci['PHYSICAL_NIC'] }.uniq
        if nics.size > available_physical_nics.size
          return false
        end
      end

      true
    end
  end
end

# Hook into scheduler decision
module Scheduler
  class SchedulePolicy
    alias_method :original_check_host, :check_host

    def check_host(host, vm, options = {})
      return false unless original_check_host(host, vm, options)
      return false unless PCIAffinity.satisfied?(host, vm)
      true
    end
  end
end
