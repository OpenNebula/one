# Modified schedule.rb to integrate PCI affinity checks
# ... other scheduling code ...

require 'pci_affinity'

# In the host allocation loop, after selecting a candidate host,
# before finalizing, call PCIAffinity.check_anti_affinity(nics, host)

# Example integration (inside schedule_vm method):
defined
  candidate_hosts = get_candidate_hosts(vm)
  candidate_hosts.each do |host|
    next unless PCIAffinity.check_anti_affinity(vm.nics, host)
    # ... proceed with allocation ...
  end
end
