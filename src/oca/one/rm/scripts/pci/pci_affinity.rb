# PCI affinity/antiaffinity extension for SR-IOV vNICs
# Ensures VFs from the same physical NIC are not assigned to the same VM (antiaffinity)

module PCIAffinity
  # Extracts the physical function (PF) address from a VF address
  # PF bus:device.function is typically derived by masking the last digit
  def self.pf_address(vf_address)
    # Example: 0000:02:00.1 -> PF: 0000:02:00.0
    parts = vf_address.split('.')
    pf_func = '0'
    "#{parts[0]}.#{pf_func}"
  end

  # Checks if VFs violate antiaffinity (different PF addresses)
  # Returns true if all VFs have unique PF addresses
  def self.check_antiaffinity(vf_addresses)
    pf_set = Set.new
    vf_addresses.each do |addr|
      pf = pf_address(addr)
      if pf_set.include?(pf)
        return false
      end
      pf_set.add(pf)
    end
    true
  end
end
