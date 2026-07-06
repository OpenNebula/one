#!/usr/bin/env ruby
# PCI probe improvements for VF monitoring
# This script reads PCI devices from sysfs and outputs monitoring data
# including Virtual Function (VF) to Physical Function (PF) relationships.

require 'json'

# Get PCI devices from sysfs
devices = Dir.glob('/sys/bus/pci/devices/*')
results = []

devices.each do |dev|
  path = dev
  begin
    vendor = File.read(File.join(path, 'vendor')).strip
    device = File.read(File.join(path, 'device')).strip
    class_code = File.read(File.join(path, 'class')).strip
    # Check if it's a network device (class 0x02xxxx)
    next unless class_code.start_with?('0x02')
    address = File.basename(path)
    numanode = File.read(File.join(path, 'numa_node')).strip.to_i rescue -1
    driver = File.read(File.join(path, 'driver')).strip rescue ''
    # Check for physfn symlink (if VF)
    physfn_path = File.join(path, 'physfn')
    pf_address = nil
    if File.exist?(physfn_path)
      pf_address = File.basename(File.readlink(physfn_path))
    end
    # For PF, count VFs
    vf_count = 0
    if pf_address.nil?
      # Check for virtfn links
      virtfns = Dir.glob(File.join(path, 'virtfn*')).sort
      vf_count = virtfns.size
    end
    results << {
      address: address,
      vendor: vendor,
      device: device,
      class: class_code,
      numa_node: numanode,
      driver: driver,
      pf_address: pf_address,
      vf_count: vf_count
    }
  rescue => e
    # skip errors
  end
end

# Output monitoring data in key=value format
results.each do |dev|
  puts "PCI_DEVICE=#{dev[:address]}"
  puts "PCI_VENDOR=#{dev[:vendor]}"
  puts "PCI_DEVICE_ID=#{dev[:device]}"
  puts "PCI_CLASS=#{dev[:class]}"
  puts "PCI_NUMA_NODE=#{dev[:numa_node]}"
  puts "PCI_DRIVER=#{dev[:driver]}"
  if dev[:pf_address]
    puts "PCI_PF_ADDRESS=#{dev[:pf_address]}"
  end
  if dev[:vf_count] > 0
    puts "PCI_VF_COUNT=#{dev[:vf_count]}"
  end
  puts "---" unless dev == results.last
end
