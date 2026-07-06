# Modified PCI allocation to support antiaffinity
# Existing code omitted, only showing the addition

require 'pci_affinity'

# Inside allocate method, after selecting candidate PCI devices
# Filter candidates to ensure antiaffinity if requested
def allocate_pci(candidates, vm_pci_requests)
  # ... existing candidate selection ...
  
  # Check antiaffinity constraint
  if vm_pci_requests.any? { |req| req[:antiaffinity] == 'YES' }
    candidates = candidates.select do |host_candidates|
      vf_addresses = host_candidates.map { |dev| dev[:address] }
      PCIAffinity.check_antiaffinity(vf_addresses)
    end
  end
  
  # ... rest of allocation ...
end
