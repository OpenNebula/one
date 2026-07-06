#!/usr/bin/env ruby
# This script collects PCI device information with Physical/Virtual Function relationships.
# It is intended for OpenNebula monitoring.

require 'json'

def get_pci_devices
  devices = []
  Dir.glob('/sys/bus/pci/devices/*/').each do |dev_path|
    begin
      pci_addr = File.basename(dev_path)
      next unless File.directory?(dev_path)
      
      vendor = File.read(File.join(dev_path, 'vendor')).strip rescue 'unknown'
      device = File.read(File.join(dev_path, 'device')).strip rescue 'unknown'
      pci_class = File.read(File.join(dev_path, 'class')).strip rescue ''
      
      is_vf = File.exist?(File.join(dev_path, 'physfn'))
      pf_addr = nil
      vf_list = []
      
      if is_vf
        pf_path = File.readlink(File.join(dev_path, 'physfn'))
        pf_addr = File.basename(pf_path) if pf_path
      else
        Dir.glob(File.join(dev_path, 'virtfn*')).sort.each do |vf_link|
          vf_target = File.readlink(vf_link)
          vf_list << File.basename(vf_target) rescue nil
        end
      end
      
      device_info = {
        'PCI_ADDR' => pci_addr,
        'VENDOR' => vendor,
        'DEVICE' => device,
        'CLASS' => pci_class,
        'IS_VF' => is_vf,
        'PF_ADDR' => pf_addr
      }
      device_info['VF_LIST'] = vf_list unless vf_list.empty?
      
      devices << device_info
    rescue => e
      # Skip unreadable devices
    end
  end
  devices
end

# Main
devices = get_pci_devices
puts JSON.pretty_generate(devices)
