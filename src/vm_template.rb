# -------------------------------------------------
# VM Template extension for PCI affinity
# -------------------------------------------------
module OpenNebula
  class VirtualMachine
    # Parses NIC elements for PCI antiaffinity keys
    # Returns hash { key => [pci_addresses] }
    def pci_anti_affinity_groups
      groups = {}
      self.each('TEMPLATE/NIC') do |nic|
        key = nic['PCI_ANTI_AFFINITY']
        next if key.nil? || key.empty?
        pci = nic['PCI']
        next if pci.nil? || pci.empty?
        groups[key] ||= []
        groups[key] << pci
      end
      groups
    end
  end
end
