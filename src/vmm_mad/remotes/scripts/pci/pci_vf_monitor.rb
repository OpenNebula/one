# Virtual Function monitoring improvements for PCI probe
# This module provides methods to enrich PCI device data with PF-VF relationships.

module PCIVFMonitor
  # Enriches a list of PCI devices with parent PF address for VFs.
  # @param pci_devices [Array<Hash>] list of device hashes with :address key
  # @return [Array<Hash>] enhanced device list
  def self.enrich_with_pf_relationships(pci_devices)
    pci_devices.map do |device|
      bdf = device[:address]
      if bdf && File.exist?("/sys/bus/pci/devices/#{bdf}/physfn/")
        begin
          pf_bdf = File.readlink("/sys/bus/pci/devices/#{bdf}/physfn").split('/').last
          device[:parent_pf] = pf_bdf
        rescue Errno::EINVAL, Errno::ENOENT
          # physfn may not be a symlink or may not exist
          device[:parent_pf] = nil
        end
      else
        device[:parent_pf] = nil
      end
      device
    end
  end

  # Determines if a device is a Virtual Function
  # @param device [Hash] device hash with :address
  # @return [Boolean]
  def self.virtual_function?(device)
    bdf = device[:address]
    return false unless bdf
    File.exist?("/sys/bus/pci/devices/#{bdf}/physfn/")
  end

  # Determines if a device is a Physical Function (has VFs)
  # @param device [Hash] device hash with :address
  # @return [Boolean]
  def self.physical_function?(device)
    bdf = device[:address]
    return false unless bdf
    dev_path = "/sys/bus/pci/devices/#{bdf}"
    sriov_totalvfs = "#{dev_path}/sriov_totalvfs"
    File.exist?(sriov_totalvfs) && File.read(sriov_totalvfs).strip.to_i > 0
  end
end
