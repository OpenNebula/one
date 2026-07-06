# Helper module for PCI scheduling affinity/antiaffinity
module SchedPCIHelper
  # Determine if a given PCI device (pci_addr) conflicts with existing allocations
  # based on the requested affinity policy.
  # policy: 'YES' for affinity (use same PCI address), 'NO' for antiaffinity (different)
  # pci_addr: the PCI address string (e.g., '0000:00:1f.6')
  # allocated_addresses: array of PCI addresses already assigned to the VM's vNICs
  # Returns true if the device is allowed, false otherwise
  def self.check_affinity(policy, pci_addr, allocated_addresses)
    return true if allocated_addresses.empty?
    if policy == 'YES'
      # Affinity: must match one of the allocated addresses
      allocated_addresses.include?(pci_addr)
    elsif policy == 'NO'
      # Antiaffinity: must NOT match any allocated address
      !allocated_addresses.include?(pci_addr)
    else
      # No policy or 'ANY' – always allowed
      true
    end
  end
end
