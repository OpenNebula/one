# PCI monitoring probe with Virtual Function relationship information
# Author: OpenNebula Team
# Description: Enriches PCI monitoring data with PF/VF hierarchy

require 'json'
require 'open3'

# Function to extract PCI device info from sysfs
def get_pci_devices
  devices = []
  pci_path = '/sys/bus/pci/devices'
  Dir.foreach(pci_path) do |entry|
    next if entry == '.' || entry == '..'
    dev_path = File.join(pci_path, entry)
    dev_info = {}
    dev_info['address'] = entry
    dev_info['class'] = read_sysfs(File.join(dev_path, 'class'))
    dev_info['vendor'] = read_sysfs(File.join(dev_path, 'vendor'))
    dev_info['device'] = read_sysfs(File.join(dev_path, 'device'))
    dev_info['numa_node'] = read_sysfs(File.join(dev_path, 'numa_node'))
    dev_info['iommu_group'] = read_sysfs(File.join(dev_path, 'iommu_group'))
    # Check if it's a Virtual Function
    if File.exist?(File.join(dev_path, 'physfn'))
      physfn_link = File.readlink(File.join(dev_path, 'physfn'))
      dev_info['physical_function'] = physfn_link.split('/').last
    end
    # Collect virtual functions if it's a Physical Function
    if File.directory?(File.join(dev_path, 'virtfn'))
      vf_list = Dir.glob(File.join(dev_path, 'virtfn', '*')).map do |vf|
        File.readlink(vf).split('/').last
      end
      dev_info['virtual_functions'] = vf_list unless vf_list.empty?
    end
    # Determine network interface name if present
    net_path = File.join(dev_path, 'net')
    if File.directory?(net_path)
      ifaces = Dir.entries(net_path).reject { |e| e == '.' || e == '..' }
      dev_info['interface'] = ifaces.first unless ifaces.empty?
    end
    devices << dev_info
  end
  devices
end

# Helper to read sysfs files safely
def read_sysfs(path)
  return '' unless File.exist?(path)
  File.read(path).strip
rescue => e
  ''
end

# Main execution
begin
  devices = get_pci_devices
  puts devices.to_json
rescue => e
  STDERR.puts "Error in PCI monitoring: #{e.message}"
  exit 1
end
