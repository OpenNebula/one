# PCI Affinity and Antiaffinity Scheduling Extension
# Allows definition of SR-IOV vNICs affinity/antiaffinity by PCI address

module PCIAffinity
  # Parse VM template for PCI affinity/antiaffinity constraints
  def self.parse_pci_affinity(one_vm)
    template = one_vm['TEMPLATE']
    constraints = { affinity: [], antiaffinity: [] }

    # Look for PCI_GROUPS attribute in the template
    pci_groups = template['PCI_GROUPS']
    return constraints unless pci_groups

    groups = pci_groups.is_a?(Array) ? pci_groups : [pci_groups]
    groups.each_with_index do |group, idx|
      pci_ids = group['PCI_ADDRESSES']
      next unless pci_ids
      addresses = pci_ids.is_a?(Array) ? pci_ids : [pci_ids]
      type = group['AFFINITY_TYPE'] || 'antiaffinity'  # default antiaffinity

      case type.downcase
      when 'affinity'
        constraints[:affinity] << addresses
      when 'antiaffinity'
        constraints[:antiaffinity] << addresses
      else
        OpenNebula.log_error("Unknown AFFINITY_TYPE '#{type}' in PCI_GROUP #{idx}")
      end
    end
    constraints
  end

  # Check if a set of PCI assignments satisfies the constraints
  def self.check_affinity_constraints(assignments, constraints)
    # assignments: hash mapping VM ID to array of PCI addresses assigned
    # constraints: as returned by parse_pci_affinity
    return true if constraints[:affinity].empty? && constraints[:antiaffinity].empty?

    # For each VM, check its assigned PCI addresses
    assignments.each do |vm_id, pci_addrs|
      assigned_set = pci_addrs.to_set

      # Check antiaffinity: within each antiaffinity group, no two addresses should be assigned to the same VM
      constraints[:antiaffinity].each do |group|
        group_set = group.to_set
        intersection = assigned_set & group_set
        return false if intersection.size > 1
      end

      # Check affinity: within each affinity group, if one address is assigned, all must be assigned
      constraints[:affinity].each do |group|
        group_set = group.to_set
        overlap = assigned_set & group_set
        if overlap.any?
          # All addresses in the group must be assigned to this VM
          return false unless group_set.subset?(assigned_set)
        end
      end
    end

    true
  end

  # Select a host based on PCI constraints (simplified)
  def self.select_host_with_pci_constraints(hosts, vm, pci_constraints)
    # For each host, check available PCI devices and if constraints can be met
    hosts.each do |host|
      available_pci = host.available_pci_devices  # assuming method exists
      # Check if we can allocate enough devices to satisfy constraints
      next unless satisfy_pci_demand(vm, available_pci, pci_constraints)
      return host
    end
    nil
  end

  def self.satisfy_pci_demand(vm, available_pci, constraints)
    # Simplified: check if available_pci contains at least all required groups
    required_addresses = []
    constraints[:affinity].each { |g| required_addresses.concat(g) }
    constraints[:antiaffinity].each { |g| required_addresses.concat(g) }
    # Also check VM's PCI device requirements (from template)
    vm_pci_req = vm.pci_device_requirements  # hypothetical
    required_addresses.concat(vm_pci_req)

    required_set = required_addresses.to_set
    available_set = available_pci.to_set
    required_set.subset?(available_set)
  end
end

# Integration into scheduling loop (example)
# In the scheduling policy, after selecting candidate hosts:
#   pci_constraints = PCIAffinity.parse_pci_affinity(vm)
#   host = PCIAffinity.select_host_with_pci_constraints(hosts, vm, pci_constraints)
