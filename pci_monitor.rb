#!/usr/bin/env ruby
# Enhanced PCI probe to capture PF-VF relationships
# This script extends the existing pci probe to include information
# about Physical Function (PF) and Virtual Function (VF) relationships.
# It reads from sysfs and outputs JSON.

require 'json'

def get_pci_devices
  pci_devs = {}
  Dir.glob('/sys/bus/pci/devices/*').each do |dev_path|
    pci_addr = File.basename(dev_path)
    next unless File.exist?(File.join(dev_path, 'class'))
    dev_class = File.read(File.join(dev_path, 'class')).strip.to_i(16)
    # Network controller class is 0x02xxxx, Ethernet is 0x020000
    next unless (dev_class & 0xff0000) == 0x020000 || (dev_class & 0xff0000) == 0x028000

    # Determine if it's a VF
    physfn_path = File.join(dev_path, 'physfn')
    is_vf = File.exist?(physfn_path)
    pf_address = nil
    if is_vf
      pf_address = File.basename(File.readlink(physfn_path))
    end

    # Get interface name if any
    ifname = nil
    Dir.glob(File.join(dev_path, 'net', '*')).each do |net_dev|
      ifname = File.basename(net_dev)
    end

    # Get driver
    driver = nil
    driver_link = File.join(dev_path, 'driver')
    if File.symlink?(driver_link)
      driver = File.basename(File.readlink(driver_link))
    end

    # Get NUMA node
    numa = -1
    numa_path = File.join(dev_path, 'numa_node')
    if File.exist?(numa_path)
      numa = File.read(numa_path).strip.to_i
    end

    # Get vendor and device IDs
    vendor = nil
    device = nil
    vendor_path = File.join(dev_path, 'vendor')
    device_path = File.join(dev_path, 'device')
    if File.exist?(vendor_path)
      vendor = File.read(vendor_path).strip
    end
    if File.exist?(device_path)
      device = File.read(device_path).strip
    end

    # Build entry
    entry = {
      'PCI_ADDRESS' => pci_addr,
      'CLASS' => dev_class.to_s(16),
      'VENDOR' => vendor,
      'DEVICE' => device,
      'NUMA_NODE' => numa,
      'DRIVER' => driver,
      'INTERFACE' => ifname,
      'IS_VF' => is_vf
    }
    if is_vf
      entry['PF_ADDRESS'] = pf_address
    else
      # For PF, list VFs
      vf_list = []
      Dir.glob(File.join(dev_path, 'virtfn*')).each do |vf_link|
        vf_addr = File.basename(File.readlink(vf_link))
        vf_list << vf_addr
      end
      entry['VF_LIST'] = vf_list unless vf_list.empty?
    end
    pci_devs[pci_addr] = entry
  end
  pci_devs
end

# Output as JSON array of devices
devices = get_pci_devices
puts JSON.pretty_generate(devices.values)
