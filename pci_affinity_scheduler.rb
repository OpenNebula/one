module OpenNebula
  class PCIAffinityScheduler
    def self.filter_hosts(vm_pci_devices, host_pci_capabilities)
      # vm_pci_devices: array of hashes with keys: :address, :type (e.g., 'NIC')
      # host_pci_capabilities: hash mapping host_id to array of available PCI devices (same format)
      valid_hosts = []

      host_pci_capabilities.each do |host_id, host_devices|
        next unless host_devices.length >= vm_pci_devices.length

        # Check antiaffinity: all assigned PCI addresses must be different
        assigned_addresses = []
        failed = false

        vm_pci_devices.each do |req_device|
          # Find a host device that matches the required type and is not already assigned
          available = host_devices.find do |dev|
            dev[:type] == req_device[:type] && !assigned_addresses.include?(dev[:address])
          end

          if available
            assigned_addresses << available[:address]
          else
            failed = true
            break
          end
        end

        valid_hosts << host_id unless failed
      end

      valid_hosts
    end
  end
end
