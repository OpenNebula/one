#!/usr/bin/env ruby
# -------------------------------------------------
# Licensed under the Apache License, Version 2.0
# See LICENSE file for details.
# -------------------------------------------------

require 'onedb'
require 'scheduler'

module OpenNebula
  class Scheduler
    # ... existing code ...

    # Adds PCI affinity/antiaffinity scheduling constraints
    def schedule_pci_affinity(vm, hosts)
      pci_anti_affinity = vm['TEMPLATE/NIC/PCI_ANTI_AFFINITY'] || []
      return hosts if pci_anti_affinity.empty?

      # Group PCI addresses by antiaffinity key
      # Example: NIC = [ PCI_ANTI_AFFINITY="group1", PCI="0000:02:00.0" ]
      anti_groups = {}
      vm.each('TEMPLATE/NIC') do |nic|
        key = nic['PCI_ANTI_AFFINITY']
        next if key.nil? || key.empty?
        pci_addr = nic['PCI']
        next if pci_addr.empty?
        anti_groups[key] ||= []
        anti_groups[key] << pci_addr
      end

      return hosts if anti_groups.empty?

      # For each group, ensure that the PCI devices used by the VMs
      # are on different physical NICs (different PCI addresses except VFs)
      # We need to get the PF for each VF if applicable.
      # Simplified: check if any host has two NICs with same PCI address prefix.
      hosts.select do |host|
        host_pci_devices = host['TEMPLATE/PCI_DEVICES'] || []
        host_pci_set = host_pci_devices.map { |d| d['ADDRESS'] }
        valid = true
        anti_groups.each do |_key, addrs|
          # get physical addresses (strip VF)
          phys_addrs = addrs.map { |a| a.sub(/\.[0-9]+$/, '') }
          used = []
          phys_addrs.each do |pa|
            if host_pci_set.any? { |haddr| haddr.start_with?(pa) }
              if used.include?(pa)
                valid = false
                break
              else
                used << pa
              end
            else
              valid = false
              break
            end
          end
          break unless valid
        end
        valid
      end
    end
  end
end
