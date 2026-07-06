# Modified VirtualNetwork class to include PCI affinity setting
class VirtualNetwork
  # ... existing code ...

  # New attribute: PCI_AFFINITY = YES | NO | ANY (default ANY)
  attr_accessor :pci_affinity

  def initialize(xml)
    super(xml)
    @pci_affinity = xml['PCI_AFFINITY'] || 'ANY'
  end

  # Override or add method to get PCI addresses already allocated for a VM's vNICs
  def self.get_allocated_pci_addresses(vm)
    addresses = []
    vm.each_nic do |nic|
      addresses << nic.pci_address if nic.pci_address
    end
    addresses
  end
end
