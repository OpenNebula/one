# PCI Address Affinity/Anti-affinity Scheduling Policy
# This policy ensures that VMs with anti-affinity requirements use different physical NICs (based on PCI addresses) for SR-IOV vNICs.

require 'scheduling_policy'

class PciAddressAffinityPolicy < SchedulingPolicy
  # Filter hosts based on PCI address affinity/anti-affinity.
  # VM must have PCI_ADDRESS_AFFINITY or PCI_ADDRESS_ANTIAFFINITY attribute in its template.
  def filter(vm, hosts)
    return hosts unless vm['PCI_ADDRESS_AFFINITY'] || vm['PCI_ADDRESS_ANTIAFFINITY']

    # Determine the list of vNICs with PCI addresses for this VM
    vm_pci_addresses = get_vm_pci_addresses(vm)
    return hosts if vm_pci_addresses.empty?

    affinity_mode = vm['PCI_ADDRESS_AFFINITY'] ? :affinity : :antiaffinity

    hosts.select do |host|
      host_pci_addresses = get_host_taken_pci_addresses(host)
      # For anti-affinity: ensure no overlap of PCI addresses between VM and host
      # For affinity: ensure all VM PCI addresses are already used on host (or available? Typically affinity means same host)
      if affinity_mode == :antiaffinity
        (vm_pci_addresses & host_pci_addresses).empty?
      else
        (vm_pci_addresses - host_pci_addresses).empty?
      end
    end
  end

  private

  def get_vm_pci_addresses(vm)
    # Extract PCI addresses from the VM's NICs (presumably under 'NIC' vector)
    # Each NIC may have a PCI_ADDRESS attribute
    pci_addresses = []
    nic_elements = vm['NIC'] || []
    nic_elements = [nic_elements] unless nic_elements.is_a?(Array)
    nic_elements.each do |nic|
      pci = nic['PCI_ADDRESS']
      pci_addresses << pci if pci
    end
    pci_addresses.uniq
  end

  def get_host_taken_pci_addresses(host)
    # Gather PCI addresses currently in use on the host (from running VMs)
    # This information should be available in host's 'VM_PCI' or similar
    taken = host['VM_PCI'] || []
    taken.map { |pci| pci['ADDRESS'] }.compact.uniq
  end
end
