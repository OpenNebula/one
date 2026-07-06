#!/usr/bin/env ruby

require 'json'
require 'fileutils'

SYSFS_PCI = '/sys/bus/pci/devices'

def get_pci_devices
  devices = []
  Dir.glob("#{SYSFS_PCI}/*").each do |dev_path|
    next unless File.directory?(dev_path)
    pci_addr = File.basename(dev_path)

    # Basic info
    device = {
      'PCI_ADDRESS' => pci_addr,
      'CLASS' => read_first_line("#{dev_path}/class"),
      'VENDOR' => read_first_line("#{dev_path}/vendor"),
      'DEVICE' => read_first_line("#{dev_path}/device"),
      'NUMA_NODE' => read_first_line("#{dev_path}/numa_node"),
      'DRIVER' => read_first_line("#{dev_path}/driver")&.split('/')&.last,
      'IFACE' => get_iface(dev_path),
    }

    # Determine PF/VF relationship
    physfn_path = "#{dev_path}/physfn"
    if File.exist?(physfn_path)
      device['PHYSFN'] = File.basename(File.readlink(physfn_path))
      device['ROLE'] = 'VF'
    else
      # Check for VFs
      vf_dirs = Dir.glob("#{dev_path}/virtfn*").sort
      unless vf_dirs.empty?
        device['VIRTFNS'] = vf_dirs.map { |vf| File.basename(File.readlink(vf)) }
        device['ROLE'] = 'PF'
      else
        device['ROLE'] = 'NIC' # default role, can be refined later
      end
    end

    devices << device
  end
  devices
end

def read_first_line(path)
  File.read(path).strip rescue nil
end

def get_iface(dev_path)
  net_path = "#{dev_path}/net"
  if File.directory?(net_path)
    ifaces = Dir.entries(net_path) - ['.', '..']
    return ifaces.first unless ifaces.empty?
  end
  nil
end

# Main execution
devices = get_pci_devices
output = { 'PCI' => devices }
puts output.to_json
