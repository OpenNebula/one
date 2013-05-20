# Based on takeVMScreenshot.pl by William Lam
require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'

VIM = RbVmomi::VIM

opts = Trollop.options do
  banner <<-EOS
Take a screenshot.

Usage:
    screenshot.rb [options] vm filename

A PNG image will be saved to the given filename.

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
vm_name = ARGV[0] or abort("must specify VM name")
output_path = ARGV[1] or abort("must specify output filename")

vim = VIM.connect opts
dc = vim.serviceInstance.find_datacenter(opts[:datacenter])
vm = dc.find_vm vm_name
abort "VM must be running" unless vm.runtime.powerState == 'poweredOn'
remote_path = vm.CreateScreenshot_Task.wait_for_completion
remote_path =~ /^(\/vmfs\/volumes\/[^\/]+)\// or fail
datastore_prefix = $1
datastore_path = $'
datastore = vm.datastore.find { |ds| ds.info.url == datastore_prefix }
datastore.download datastore_path, output_path
