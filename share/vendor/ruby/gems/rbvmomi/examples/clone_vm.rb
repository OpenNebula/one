#!/usr/bin/env ruby
require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'

VIM = RbVmomi::VIM

opts = Trollop.options do
  banner <<-EOS
Clone a VM.

Usage:
    clone_vm.rb [options] source_vm dest_vm

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

  opt :linked_clone, "Use a linked clone instead of a full clone"
end

Trollop.die("must specify host") unless opts[:host]
ARGV.size == 2 or abort "must specify VM source name and VM target name"
vm_source = ARGV[0]
vm_target = ARGV[1]

vim = VIM.connect opts
dc = vim.serviceInstance.find_datacenter(opts[:datacenter]) or abort "datacenter not found"
vm = dc.find_vm(vm_source) or abort "VM not found"

if opts[:linked_clone]
  # The API for linked clones is quite strange. We can't create a linked
  # straight from any VM. The disks of the VM for which we can create a
  # linked clone need to be read-only and thus VC demands that the VM we
  # are cloning from uses delta-disks. Only then it will allow us to
  # share the base disk.
  #
  # Thus, this code first create a delta disk on top of the base disk for
  # the to-be-cloned VM, if delta disks aren't used already.
  disks = vm.config.hardware.device.grep(VIM::VirtualDisk)
  disks.select { |x| x.backing.parent == nil }.each do |disk|
    spec = {
      :deviceChange => [
        {
          :operation => :remove,
          :device => disk
        },
        {
          :operation => :add,
          :fileOperation => :create,
          :device => disk.dup.tap { |x|
            x.backing = x.backing.dup
            x.backing.fileName = "[#{disk.backing.datastore.name}]"
            x.backing.parent = disk.backing
          },
        }
      ]
    }
    vm.ReconfigVM_Task(:spec => spec).wait_for_completion
  end

  relocateSpec = VIM.VirtualMachineRelocateSpec(:diskMoveType => :moveChildMostDiskBacking)
else
  relocateSpec = VIM.VirtualMachineRelocateSpec
end

spec = VIM.VirtualMachineCloneSpec(:location => relocateSpec,
                                   :powerOn => false,
                                   :template => false)

vm.CloneVM_Task(:folder => vm.parent, :name => vm_target, :spec => spec).wait_for_completion
