#!/usr/bin/env ruby

# Probe to collect PCI device information including PF-VF relationships
# This probe reads from /sys/bus/pci/devices/ and outputs JSON

require 'json'

PCI_SYSFS = '/sys/bus/pci/devices'

pci_devices = []

Dir.glob("#{PCI_SYSFS}/*").each do |dev_path|
  dev_name = File.basename(dev_path)
  next unless dev_name =~ /^[0-9a-f]{4}:[0-9a-f]{2}:[0-9a-f]{2}\.[0-9a-f]$/  # Valid PCI address format

  # Basic device info
  vendor_file = "#{dev_path}/vendor"
  device_file = "#{dev_path}/device"
  class_file = "#{dev_path}/class"
  numa_node_file = "#{dev_path}/numa_node"
  if_name_file = "#{dev_path}/net"  # directory containing net interfaces

  next unless File.exist?(vendor_file) && File.exist?(device_file)

  vendor = File.read(vendor_file).strip.sub(/^0x/, '').to_i(16)
  device = File.read(device_file).strip.sub(/^0x/, '').to_i(16)
  pci_class = File.exist?(class_file) ? File.read(class_file).strip.sub(/^0x/, '').to_i(16) : nil
  numa_node = File.exist?(numa_node_file) ? File.read(numa_node_file).strip.to_i : -1

  # Get interface names
  interfaces = []
  if Dir.exist?(if_name_file)
    Dir.entries(if_name_file).each do |iface|
      next if iface == '.' || iface == '..'
      interfaces << iface
    end
  end

  # Determine if PF or VF
  physfn = nil
  vfs = []
  physfn_link = "#{dev_path}/physfn"
  if File.exist?(physfn_link)
    # This is a VF
    physfn = File.readlink(physfn_link).split('/').last
  else
    # Check for VFs
    Dir.glob("#{dev_path}/virtfn*").each do |virtfn_path|
      vf_name = File.readlink(virtfn_path).split('/').last
      vfs << vf_name
    end
  end

  device_info = {
    'address' => dev_name,
    'vendor' => vendor,
    'device' => device,
    'class' => pci_class,
    'numa_node' => numa_node,
    'interfaces' => interfaces,
    'physfn' => physfn,
    'virtfns' => vfs
  }

  pci_devices << device_info
end

puts JSON.generate(pci_devices)
