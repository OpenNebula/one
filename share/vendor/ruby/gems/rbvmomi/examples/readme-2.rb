require 'rbvmomi'
require 'rbvmomi/trollop'

opts = Trollop.options do
  banner <<-EOS
Example 2 from the README: Power on a VM the hard way.

Usage:
    readme-2.rb [options] VM name

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
rootFolder = vim.serviceInstance.content.rootFolder
dc = rootFolder.childEntity.grep(RbVmomi::VIM::Datacenter).find { |x| x.name == opts[:datacenter] } or fail "datacenter not found"
vm = dc.vmFolder.childEntity.grep(RbVmomi::VIM::VirtualMachine).find { |x| x.name == vm_name } or fail "VM not found"
task = vm.PowerOnVM_Task
filter = vim.propertyCollector.CreateFilter(
  :spec => {
    :propSet => [{ :type => 'Task', :all => false, :pathSet => ['info.state']}],
    :objectSet => [{ :obj => task }]
  },
  :partialUpdates => false
)
ver = ''
while true
  result = vim.propertyCollector.WaitForUpdates(:version => ver)
  ver = result.version
  break if ['success', 'error'].member? task.info.state
end
filter.DestroyPropertyFilter
raise task.info.error if task.info.state == 'error'
