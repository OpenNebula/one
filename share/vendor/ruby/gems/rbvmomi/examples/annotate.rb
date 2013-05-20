require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'

VIM = RbVmomi::VIM
CMDS = %w(get set)

opts = Trollop.options do
  banner <<-EOS
Annotate a VM.

Usage:
    annotate.rb [options] VM get
    annotate.rb [options] VM set annotation

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

vm_name = ARGV[0] or Trollop.die("no VM name given")
cmd = ARGV[1] or Trollop.die("no command given")
abort "invalid command" unless CMDS.member? cmd
Trollop.die("must specify host") unless opts[:host]

vim = VIM.connect opts

dc = vim.serviceInstance.find_datacenter(opts[:datacenter]) or abort "datacenter not found"
vm = dc.find_vm(vm_name) or abort "VM not found"

case cmd
when 'get'
  puts vm.config.annotation
when 'set'
  value = ARGV[2] or Trollop.die("no annotation given")
  vm.ReconfigVM_Task(:spec => VIM.VirtualMachineConfigSpec(:annotation => value)).wait_for_completion
end
