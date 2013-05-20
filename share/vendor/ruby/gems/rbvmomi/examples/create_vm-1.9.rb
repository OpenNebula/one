#!/usr/bin/env ruby
require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'

VIM = RbVmomi::VIM

opts = Trollop.options do
  banner <<-EOS
Create a VM.

Usage:
    create_vm-1.9.rb [options]

VIM connection options:
    EOS

    rbvmomi_connection_opts

    text <<-EOS

VM location options:
    EOS

    rbvmomi_datacenter_opt

    text <<-EOS

Other options:
  EOS
end

Trollop.die("must specify host") unless opts[:host]
vm_name = ARGV[0] or abort "must specify VM name"

vim = VIM.connect opts
dc = vim.serviceInstance.find_datacenter(opts[:datacenter]) or abort "datacenter not found"
vmFolder = dc.vmFolder
hosts = dc.hostFolder.children
rp = hosts.first.resourcePool

vm_cfg = {
  name: vm_name,
  guestId: 'otherGuest',
  files: { vmPathName: '[datastore1]' },
  numCPUs: 1,
  memoryMB: 128,
  deviceChange: [
    {
      operation: :add,
      device: VIM.VirtualLsiLogicController(
        key: 1000,
        busNumber: 0,
        sharedBus: :noSharing,
      )
    }, {
      operation: :add,
      fileOperation: :create,
      device: VIM.VirtualDisk(
        key: 0,
        backing: VIM.VirtualDiskFlatVer2BackingInfo(
          fileName: '[datastore1]',
          diskMode: :persistent,
          thinProvisioned: true,
        ),
        controllerKey: 1000,
        unitNumber: 0,
        capacityInKB: 4000000,
      )
    }, {
      operation: :add,
      device: VIM.VirtualE1000(
        key: 0,
        deviceInfo: {
          label: 'Network Adapter 1',
          summary: 'VM Network',
        },
        backing: VIM.VirtualEthernetCardNetworkBackingInfo(
          deviceName: 'VM Network',
        ),
        addressType: 'generated'
      )
    }
  ],
  extraConfig: [
    {
      key: 'bios.bootOrder',
      value: 'ethernet0'
    }
  ]
}

vmFolder.CreateVM_Task(:config => vm_cfg, :pool => rp).wait_for_completion
