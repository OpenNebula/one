require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'

VIM = RbVmomi::VIM
CMDS = %w(on off reset suspend destroy)

opts = Trollop.options do
  banner <<-EOS
Perform VM power operations.

Usage:
    power.rb [options] cmd VM

Commands: #{CMDS * ' '}

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

  stop_on CMDS
end

cmd = ARGV[0] or Trollop.die("no command given")
vm_name = ARGV[1] or Trollop.die("no VM name given")
Trollop.die("must specify host") unless opts[:host]

vim = VIM.connect opts

dc = vim.serviceInstance.content.rootFolder.traverse(opts[:datacenter], VIM::Datacenter) or abort "datacenter not found"
vm = dc.vmFolder.traverse(vm_name, VIM::VirtualMachine) or abort "VM not found"

case cmd
when 'on'
  vm.PowerOnVM_Task.wait_for_completion
when 'off'
  vm.PowerOffVM_Task.wait_for_completion
when 'reset'
  vm.ResetVM_Task.wait_for_completion
when 'suspend'
  vm.SuspendVM_Task.wait_for_completion
when 'destroy'
  vm.Destroy_Task.wait_for_completion
else
  abort "invalid command"
end
