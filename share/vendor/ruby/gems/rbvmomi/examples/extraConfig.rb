require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'

VIM = RbVmomi::VIM
CMDS = %w(list set)

opts = Trollop.options do
  banner <<-EOS
View and modify VM extraConfig options.

Usage:
    extraConfig.rb [options] VM list
    extraConfig.rb [options] VM set key=value [key=value...]

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
when 'list'
  vm.config.extraConfig.each { |x| puts "#{x.key}: #{x.value}" }
when 'set'
  extraConfig = ARGV[2..-1].map { |x| x.split("=", 2) }.map { |k,v| { :key => k, :value => v } }
  vm.ReconfigVM_Task(:spec => VIM.VirtualMachineConfigSpec(:extraConfig => extraConfig)).wait_for_completion
end
