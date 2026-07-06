#!/usr/bin/env ruby
# This module enriches PCI device monitoring with Physical Function (PF) / Virtual Function (VF) relationships.
# It should be integrated into the existing PCI probe in OpenNebula.

require 'json'
require 'fileutils'

module PCIVFMonitor
  SYSFS_PCI_PATH = '/sys/bus/pci/devices'
  NET_CLASS_ID = '0x02'.freeze

  # Parse the existing PCI data array (each element is a hash with :pci_address, :class, etc.)
  # Adds :pf_pci for VFs and optionally an array of VF addresses for PFs.
  def self.enrich_pci_data(pci_devices)
    pci_devices.each do |dev|
      next unless dev[:class] == NET_CLASS_ID
      pci_address = dev[:pci_address]
      pci_path = File.join(SYSFS_PCI_PATH, pci_address)
      next unless Dir.exist?(pci_path)

      # Check if this device is a Virtual Function
      physfn_path = File.join(pci_path, 'physfn')
      if File.symlink?(physfn_path)
        # It's a VF: get PF PCI address from symlink target
        pf_symlink = File.readlink(physfn_path)
        pf_pci = File.basename(pf_symlink)
        dev[:pf_pci] = pf_pci
      else
        # It's a PF (or standalone): check for VFs via sriov_numvfs or numvfs
        sriov_path = File.join(pci_path, 'sriov_numvfs')
        if File.exist?(sriov_path)
          num_vfs = File.read(sriov_path).strip.to_i rescue 0
          if num_vfs > 0
            vfs = []
            # VFs are enumerated as lower addresses with same domain:bus:device.function offsets
            # More robust: read virtfn* symlinks in sysfs
            Dir.glob(File.join(pci_path, 'virtfn*')).sort.each do |vf_link|
              vf_pci = File.basename(File.readlink(vf_link))
              vfs << vf_pci
            end
            dev[:vf_pci_list] = vfs unless vfs.empty?
          end
        end
      end
    end
    pci_devices
  end

  # Convenience method to collect all network devices from sysfs
  def self.collect_all_network_pci
    devices = []
    Dir.foreach(SYSFS_PCI_PATH) do |pci_addr|
      next if pci_addr == '.' || pci_addr == '..'
      pci_path = File.join(SYSFS_PCI_PATH, pci_addr)
      begin
        class_id = File.read(File.join(pci_path, 'class')).strip rescue next
        next unless class_id == NET_CLASS_ID
        devices << {
          pci_address: pci_addr,
          class: class_id
        }
      rescue => e
        # skip inaccessible
      end
    end
    enrich_pci_data(devices)
  end
end

# Example usage (uncomment to test):
# devices = PCIVFMonitor.collect_all_network_pci
# puts JSON.pretty_generate(devices)
