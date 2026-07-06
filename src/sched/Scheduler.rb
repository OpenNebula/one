# Modified scheduling logic to apply PCI affinity/antiaffinity
# In the scheduling process for assigning PCI devices to vNICs

# Inside the method that matches NIC requests to PCI devices
# For each NIC, we have a requested PCI_AFFINITY (from the VirtualNetwork template)
# and we need to filter the available PCI devices accordingly

def assign_pci_devices(vm, host)
  # ... existing code to get host PCI devices ...
  allocated_pci_addresses = VirtualNetwork.get_allocated_pci_addresses(vm)

  vm.each_nic do |nic|
    next unless nic.pci_device_id  # only SR-IOV vNICs

    policy = nic.pci_affinity || 'ANY'
    available_devices = host.pci_devices.select do |dev|
      dev.available? && SchedPCIHelper.check_affinity(policy, dev.address, allocated_pci_addresses)
    end

    # If no device matches policy, mark as unschedulable
    if available_devices.empty?
      vm.unschedulable_reason = "No PCI device available for NIC #{nic.id} with affinity policy #{policy}"
      break
    end

    # Assign the first available device (simple strategy)
    assigned_dev = available_devices.first
    nic.pci_address = assigned_dev.address
    assigned_dev.allocate
    allocated_pci_addresses << assigned_dev.address
  end
end
