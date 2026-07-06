module PCIAffinityManager
  # Checks if a host can host a VM given its NIC affinity/antiaffinity constraints.
  # vm_template: Hash representing the VM template (from OpenNebula)
  # host_allocations: Array of hashes representing allocated NICs on the host (each with PCI_ADDRESS, VM_ID, etc.)
  # Returns true if constraints satisfied, false otherwise.
  def self.can_schedule?(vm_template, host_allocations)
    nics = vm_template['NIC'] || []
    nics.each do |nic|
      next unless nic['PCI_AFFINITY'] && nic['PCI_ADDRESS']
      affinity = nic['PCI_AFFINITY'].downcase
      pci_addr = nic['PCI_ADDRESS']
      case affinity
      when 'antiaffinity'
        # No other NIC on this host should have the same PCI address
        return false if host_allocations.any? { |alloc| alloc['PCI_ADDRESS'] == pci_addr }
      when 'affinity'
        # Must have at least one NIC with same PCI address (optional, can be handled)
        return false unless host_allocations.any? { |alloc| alloc['PCI_ADDRESS'] == pci_addr }
      end
    end
    true
  end

  # Aggregates all allocated NICs on a host from existing VMs
  # vms_on_host: Array of VM objects (each has a template with NIC array)
  def self.collect_allocations(vms_on_host)
    allocations = []
    vms_on_host.each do |vm|
      nics = vm['TEMPLATE']['NIC'] || []
      nics.each do |nic|
        allocations << {
          'PCI_ADDRESS' => nic['PCI_ADDRESS'],
          'VM_ID' => vm['ID'],
          'NETWORK' => nic['NETWORK'],
          'NIC_ID' => nic['NIC_ID']
        }
      end
    end
    allocations
  end
end