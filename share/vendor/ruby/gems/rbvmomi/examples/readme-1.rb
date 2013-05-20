require 'rbvmomi'
require 'rbvmomi/trollop'

opts = Trollop.options do
  banner <<-EOS
Example 1 from the README: Power on a VM.

Usage:
    readme-1.rb [options] VM name

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

vim = RbVmomi::VIM.connect opts
dc = vim.serviceInstance.find_datacenter(opts[:datacenter]) or fail "datacenter not found"
vm = dc.find_vm(vm_name) or fail "VM not found"
vm.PowerOnVM_Task.wait_for_completion
