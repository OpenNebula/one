#!/usr/bin/env ruby
# PCI probe with Virtual Function relationship monitoring
# Outputs JSON with PCI devices and their PF/VF relationships

require 'json'
require 'net/http'

begin
  devices = {}
  pci_devices = Dir.glob('/sys/bus/pci/devices/*')

  pci_devices.each do |dev_path|
    pci_id = File.basename(dev_path)
    next unless pci_id =~ /^[0-9a-f]{4}:[0-9a-f]{2}:[0-9a-f]{2}\.[0-9a-f]$/

    device_info = {}
    device_info['pci_id'] = pci_id

    # vendor
    vendor = File.read(File.join(dev_path, 'vendor')).strip rescue nil
    device = File.read(File.join(dev_path, 'device')).strip rescue nil
    device_info['vendor'] = vendor
    device_info['device'] = device

    # driver
    driver_link = File.readlink(File.join(dev_path, 'driver')) rescue nil
    driver = File.basename(driver_link) if driver_link
    device_info['driver'] = driver

    # numa_node
    numa_node = File.read(File.join(dev_path, 'numa_node')).strip rescue nil
    device_info['numa_node'] = numa_node

    # net interface (if any)
    net_dir = File.join(dev_path, 'net')
    if Dir.exist?(net_dir)
      iface = Dir.entries(net_dir).select { |e| e !~ /^\.\.?$/ }.first
      device_info['interface'] = iface
    end

    # Check if this is a Physical Function (has virtfn* links)
    vf_links = Dir.glob(File.join(dev_path, 'virtfn*'))
    if vf_links.any?
      vf_pci_ids = vf_links.map do |link|
        File.readlink(link).split('/').last
      end
      device_info['type'] = 'PF'
      device_info['virtual_functions'] = vf_pci_ids
    end

    # Check if this is a Virtual Function (has physfn link)
    physfn_link = File.join(dev_path, 'physfn')
    if File.exist?(physfn_link)
      pf_pci_id = File.readlink(physfn_link).split('/').last
      device_info['type'] = 'VF'
      device_info['physical_function'] = pf_pci_id
    end

    # Default type if neither PF nor VF
    device_info['type'] ||= 'Normal'

    devices[pci_id] = device_info
  end

  puts JSON.pretty_generate(devices)
rescue => e
  STDERR.puts "PCI probe error: #{e.message}"
  exit 1
end
