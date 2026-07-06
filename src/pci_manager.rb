# -------------------------------------------------
# PCI Manager with affinity support
# -------------------------------------------------
require 'nokogiri'

module OpenNebula
  class PCIManager
    # Returns the physical function address for a given PCI address
    # For SR-IOV, VFs are like 0000:02:00.1, PF is 0000:02:00.0
    def self.get_pf_address(vf_address)
      # Strip the last digit of function number
      if vf_address =~ /^(.*\.[0-9]+)\.([0-9])$/
        base = $1
        "#{base}.0"
      else
        vf_address
      end
    end

    # Checks if two PCI addresses belong to the same physical NIC
    def self.same_physical_nic?(addr1, addr2)
      pf1 = get_pf_address(addr1)
      pf2 = get_pf_address(addr2)
      pf1 == pf2
    end

    # Returns a list of PCI addresses that are on the same physical NIC
    # as the given address from a pool
    def self.devices_on_same_physical(pci_addr, pool)
      pool.select { |dev| same_physical_nic?(dev[:address], pci_addr) }
    end
  end
end
