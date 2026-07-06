#!/usr/bin/env ruby

# PCI monitoring probe with Virtual Function relationship detection
# Outputs PCI device information in OpenNebula attribute format.
# For each PCI device, a line like:
#   PCI = [ ADDRESS="...", CLASS="...", VENDOR="...", DEVICE="...", ... , VIRTUAL_FUNCTION="YES|NO", PHYSICAL_FUNCTION="..." ]

require 'json'

PCI_SYSFS = '/sys/bus/pci/devices'

# Known classes for network devices (simplified)
NET_CLASSES = %w[0200 0201 0202 0203 0204 0205 0206 0207 0280].freeze

def pci_info(dev_id)
  path = File.join(PCI_SYSFS, dev_id)
  return nil unless File.exist?(path)

  info = {}
  info['ADDRESS'] = dev_id

  # Read class
  class_file = File.join(path, 'class')
  if File.exist?(class_file)
    cls = File.read(class_file).strip[2..-1]  # remove '0x'
    info['CLASS'] = cls
  end

  # Read vendor and device
  vendor_file = File.join(path, 'vendor')
  device_file = File.join(path, 'device')
  info['VENDOR'] = File.read(vendor_file).strip[2..-1] if File.exist?(vendor_file)
  info['DEVICE'] = File.read(device_file).strip[2..-1] if File.exist?(device_file)

  # Read subsystem vendor/device (optional)
  svendor_file = File.join(path, 'subsystem_vendor')
  sdevice_file = File.join(path, 'subsystem_device')
  info['SVENDOR'] = File.read(svendor_file).strip[2..-1] if File.exist?(svendor_file)
  info['SDEVICE'] = File.read(sdevice_file).strip[2..-1] if File.exist?(sdevice_file)

  # Read NUMA node
  numa_file = File.join(path, 'numa_node')
  if File.exist?(numa_file)
    node = File.read(numa_file).strip
    info['NUMA_NODE'] = node unless node.empty? || node == '-1'
  end

  # Read driver
  driver_path = File.join(path, 'driver')
  if File.exist?(driver_path)
    driver = File.readlink(driver_path).split('/').last
    info['DRIVER'] = driver
  end

  # Read network interface if present
  net_path = File.join(path, 'net')
  if File.exist?(net_path)
    ifaces = Dir.entries(net_path).select { |f| f != '.' && f != '..' }
    info['INTERFACE'] = ifaces.first unless ifaces.empty?
  end

  # Detect Virtual Function via physfn link
  physfn_path = File.join(path, 'physfn')
  if File.exist?(physfn_path)
    info['VIRTUAL_FUNCTION'] = 'YES'
    pf_addr = File.readlink(physfn_path).split('/').last
    info['PHYSICAL_FUNCTION'] = pf_addr
  else
    info['VIRTUAL_FUNCTION'] = 'NO'
  end

  # Optionally detect if this PF has VFs (by reading sriov_numvfs)
  sriov_file = File.join(path, 'sriov_numvfs')
  if File.exist?(sriov_file)
    numvfs = File.read(sriov_file).strip.to_i
    info['NUM_VFS'] = numvfs.to_s if numvfs > 0
  end

  info
end

def collect_pci_devices
  devices = []
  Dir.foreach(PCI_SYSFS) do |entry|
    next if entry == '.' || entry == '..'
    next unless entry.match?(/\A[0-9a-fA-F]{4}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}\.[0-9a-fA-F]\z/)
    info = pci_info(entry)
    devices << info if info
  end
  devices
end

def format_device(info)
  # Build attribute string
  parts = []
  info.each do |key, value|
    # Escape double quotes in values (unlikely but safe)
    val = value.to_s.gsub('"', '\\"')
    parts << "#{key}=\"#{val}\""
  end
  "PCI = [ #{parts.join(', ')} ]"
end

def main
  devices = collect_pci_devices
  devices.each do |dev|
    puts format_device(dev)
  end
end

main if __FILE__ == $PROGRAM_NAME
