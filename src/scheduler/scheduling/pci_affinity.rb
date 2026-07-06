# PCI Affinity/Anti-Affinity Scheduling Policy
# Enforces anti-affinity: vNICs using same SR-IOV PF must be on different hosts
# Usage: Add 'PCI_ANTI_AFFINITY = "YES"' to NIC in VM template

require 'scheduler_policy'

class PCIAffinity < SchedulerPolicy
  def initialize
    super
    @name = "PCI Affinity/Anti-Affinity"
  end

  # Filter hosts based on PCI anti-affinity
  def filter(vm, hosts)
    # Get VM PCI devices with anti-affinity flag
    pci_devices = vm['TEMPLATE/NIC'].to_a.select do |nic|
      nic['PCI'] && nic['PCI_ANTI_AFFINITY'] == 'YES'
    end.map { |nic| nic['PCI'] }

    return hosts if pci_devices.empty?

    # Get used PCI devices on each host
    hosts.select do |host|
      host_pci_devices = get_used_pci_devices(host)
      # Check if any of the VM's PCI devices conflict with host's used ones
      pci_devices.none? { |pci| host_pci_devices.include?(pci) }
    end
  end

  private

  # Gather all PCI devices currently used by VMs on the host
  def get_used_pci_devices(host)
    host['VMS'].to_a.flat_map do |vm_id|
      vm = OpenNebula::VirtualMachine.new_with_id(vm_id.to_i, @client)
      vm.info
      vm['TEMPLATE/NIC'].to_a.select { |nic| nic['PCI'] }.map { |nic| nic['PCI'] }
    end
  rescue
    []
  end
end

# Register policy
SchedulerPolicy.register(PCIAffinity.new)
