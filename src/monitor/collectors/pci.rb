#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
# -------------------------------------------------------------------------- #

require 'rexml/document'
require 'fileutils'

# ---------------------------------------------------------------------------- #
# PCI Probe: Collects information about PCI devices, including PF/VF           #
# relationships. Uses dpdk-devbind.py if available, and sysfs for PF/VF info.  #
# ---------------------------------------------------------------------------- #

module PCIProbe
  SYSFS_PCI_PATH = '/sys/bus/pci/devices'

  # ------------------------------------------------------------------------- #
  # Run the probe and return XML with PCI device information                  #
  # ------------------------------------------------------------------------- #
  def self.run
    doc = REXML::Document.new
    doc << REXML::XMLDecl.new('1.0', 'UTF-8')
    root = doc.add_element('MONITOR_DATA')

    # Get PCI devices from dpdk-devbind.py if available, else from sysfs
    devices = get_devices

    devices.each do |dev|
      pci_elem = root.add_element('PCI_DEVICE')
      dev.each do |key, value|
        pci_elem.add_element(key).add_text(value.to_s)
      end
    end

    doc
  end

  private

  # ------------------------------------------------------------------------- #
  # Get PCI devices list: try dpdk-devbind.py first, fallback to sysfs        #
  # ------------------------------------------------------------------------- #
  def self.get_devices
    devices = []

    # Attempt to use dpdk-devbind.py
    dpdk_bin = `which dpdk-devbind.py 2>/dev/null`.strip
    unless dpdk_bin.empty?
      begin
        output = `#{dpdk_bin} --status-dev net 2>&1`
        devices = parse_dpdk_output(output) unless output.empty?
      rescue
        devices = []
      end
    end

    # If dpdk-devbind.py fails or not found, fallback to sysfs
    if devices.empty?
      devices = scan_sysfs
    else
      # Enrich with sysfs PF/VF info
      devices = enrich_with_pfv_info(devices)
    end

    devices
  end

  # ------------------------------------------------------------------------- #
  # Parse dpdk-devbind.py output (text format)                                #
  # ------------------------------------------------------------------------- #
  def self.parse_dpdk_output(output)
    devices = []
    current_section = nil

    output.each_line do |line|
      line.strip!

      # Identify section headers (e.g., "Network devices using kernel driver")
      if line =~ /^[A-Za-z].*:$/
        current_section = line
        next
      end

      # Skip empty lines
      next if line.empty?

      # Parse device lines (beginning with PCI address)
      if line =~ /^([0-9a-f]{4}:[0-9a-f]{2}:[0-9a-f]{2}\.[0-9a-f])/i
        pci_addr = $1.downcase

        # Extract fields: after PCI address, we have 'device_name numa_node=N if=... drv=... unused=...'
        # Example: 0000:81:00.2 'MT27710 Family [ConnectX-4 Lx Virtual Function] 1016' numa_node=0 if=enp129s0f0v0 drv=mlx5_core unused=vfio-pci
        rest = line[pci_addr.length..-1].strip

        # Parse device name (in single quotes)
        device_name = ''
        if rest =~ /'([^']+)'/
          device_name = $1
        end

        # Parse remaining key=value pairs
        params = rest.gsub(/'[^']+'/, '').split(' ').map(&:strip).reject(&:empty?)
        dev_info = {
          'PCI_ADDRESS' => pci_addr,
          'DEVICE'      => device_name,
          'CLASS'       => current_section ? current_section.match(/^(\S+)/)[1] : '',
          'DRIVER'      => '',
          'NUMA_NODE'   => '',
          'INTERFACE'   => ''
        }

        params.each do |param|
          key, value = param.split('=', 2)
          case key
          when 'drv'
            dev_info['DRIVER'] = value
          when 'if'
            dev_info['INTERFACE'] = value
          when 'numa_node'
            dev_info['NUMA_NODE'] = value
          end
        end

        devices << dev_info
      end
    end

    devices
  end

  # ------------------------------------------------------------------------- #
  # Scan sysfs for all PCI devices (fallback method)                          #
  # ------------------------------------------------------------------------- #
  def self.scan_sysfs
    devices = []
    return devices unless File.directory?(SYSFS_PCI_PATH)

    Dir.foreach(SYSFS_PCI_PATH) do |entry|
      next if entry == '.' || entry == '..'
      next unless entry =~ /^[0-9a-f]{4}:[0-9a-f]{2}:[0-9a-f]{2}\.[0-9a-f]$/i

      dev_path = File.join(SYSFS_PCI_PATH, entry)
      next unless File.directory?(dev_path)

      dev_info = { 'PCI_ADDRESS' => entry.downcase }

      # Read device name from class/vendor/device (simplified)
      vendor = File.read(File.join(dev_path, 'vendor')).strip rescue ''
      device = File.read(File.join(dev_path, 'device')).strip rescue ''
      dev_info['DEVICE'] = "#{vendor}:#{device}"

      # Class
      class_code = File.read(File.join(dev_path, 'class')).strip rescue ''
      dev_info['CLASS'] = class_code

      # Driver
      driver_link = File.join(dev_path, 'driver')
      if File.symlink?(driver_link)
        dev_info['DRIVER'] = File.basename(File.readlink(driver_link))
      else
        dev_info['DRIVER'] = ''
      end

      # NUMA node
      numa_path = File.join(dev_path, 'numa_node')
      dev_info['NUMA_NODE'] = File.read(numa_path).strip rescue ''

      # Interface (net)
      net_dir = File.join(dev_path, 'net')
      if File.directory?(net_dir)
        iface = Dir.entries(net_dir).find { |e| e != '.' && e != '..' }
        dev_info['INTERFACE'] = iface if iface
      end
      dev_info['INTERFACE'] ||= ''

      devices << dev_info
    end

    devices
  end

  # ------------------------------------------------------------------------- #
  # Enrich device list with PF/VF information from sysfs                      #
  # ------------------------------------------------------------------------- #
  def self.enrich_with_pfv_info(devices)
    device_index = {}

    devices.each do |dev|
      pci_addr = dev['PCI_ADDRESS']
      device_index[pci_addr] = dev
    end

    # First pass: identify VFs and their PF
    devices.each do |dev|
      pci_addr = dev['PCI_ADDRESS']
      sysfs_path = File.join(SYSFS_PCI_PATH, pci_addr)

      # Check if this device is a VF by looking for physfn link
      physfn_path = File.join(sysfs_path, 'physfn')
      if File.symlink?(physfn_path)
        pf_addr = File.basename(File.readlink(physfn_path))
        dev['PF_ADDRESS'] = pf_addr

        # If PF is in our list, add this VF to PF's VFS list
        if device_index.key?(pf_addr)
          device_index[pf_addr]['VFS'] ||= []
          device_index[pf_addr]['VFS'] << pci_addr unless device_index[pf_addr]['VFS'].include?(pci_addr)
        end
      end
    end

    # Second pass: for PFs found via virtfn symlinks (if not already set)
    devices.each do |dev|
      pci_addr = dev['PCI_ADDRESS']
      sysfs_path = File.join(SYSFS_PCI_PATH, pci_addr)

      # Check for virtfn* entries
      virtfn_dir = Dir.glob(File.join(sysfs_path, 'virtfn*'))
      virtfn_dir.each do |vf_link|
        if File.symlink?(vf_link)
          vf_addr = File.basename(File.readlink(vf_link))
          dev['VFS'] ||= []
          dev['VFS'] << vf_addr unless dev['VFS'].include?(vf_addr)

          # If VF is in our list, ensure PF_ADDRESS is set
          if device_index.key?(vf_addr)
            device_index[vf_addr]['PF_ADDRESS'] = pci_addr
          end
        end
      end
    end

    # Convert VFS arrays to comma-separated string for output
    devices.each do |dev|
      if dev['VFS'].is_a?(Array)
        dev['VFS'] = dev['VFS'].join(',')
      end
    end

    devices
  end
end

# ---------------------------------------------------------------------------- #
# Main execution (when run as standalone script)                               #
# ---------------------------------------------------------------------------- #
if __FILE__ == $0
  begin
    doc = PCIProbe.run
    puts doc
  rescue StandardError => e
    puts "<MONITOR_DATA><ERROR>#{e.message}</ERROR></MONITOR_DATA>"
    exit 1
  end
end
