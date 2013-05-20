#!/usr/bin/env ruby
require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'
require 'rbvmomi/utils/leases'
require 'yaml'

VIM = RbVmomi::VIM
CMDS = ['set_lease_on_leaseless_vms', 'show_expired_vms', 
        'show_soon_expired_vms', 'kill_expired_vms']

opts = Trollop.options do
  banner <<-EOS
Tool for managing leases on VMs where leases are stored in YAML on VM annotations.

Usage:
    lease_tool.rb [options] <cmd>

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

  opt :vm_folder_path, "Path to VM folder to deploy VM into", :type => :string
  opt :force, "Really perform VMs. Used with kill_expired_vms"

  stop_on CMDS
end

Trollop.die("must specify host") unless opts[:host]
cmd = ARGV[0] or Trollop.die("no command given")
Trollop.die("no vm folder path given") unless opts[:vm_folder_path]

vim = VIM.connect opts
dc = vim.serviceInstance.find_datacenter(opts[:datacenter]) or abort "datacenter not found"

root_vm_folder = dc.vmFolder
vm_folder = root_vm_folder.traverse(opts[:vm_folder_path], VIM::Folder)

lease_tool = LeaseTool.new
vms_props_list = (['runtime.powerState'] + lease_tool.vms_props_list).uniq
inventory = vm_folder.inventory_flat('VirtualMachine' => vms_props_list) 
inventory = inventory.select{|obj, props| obj.is_a?(VIM::VirtualMachine)}
case cmd
when 'set_lease_on_leaseless_vms'
  lease_tool.set_lease_on_leaseless_vms(
    inventory.keys, inventory,
    :lease_minutes => 3 * 24 * 60 * 60 # 3 days
  )
when 'show_expired_vms'
  vms = lease_tool.filter_expired_vms inventory.keys, inventory
  vms.each do |vm, time_to_expiration|
    puts "VM '#{inventory[vm]['name']}' is expired"
  end  
when 'kill_expired_vms'
  vms = lease_tool.filter_expired_vms inventory.keys, inventory
  vms.each do |vm, time_to_expiration|
    puts "VM '#{inventory[vm]['name']}' is expired"
    if !opts[:force]
      puts "NOT killing VM '#{inventory[vm]['name']}' because --force not set"
    else
      puts "Killing expired VM '#{inventory[vm]['name']}'"
      # Destroying VMs is very stressful for vCenter, and we aren't in a rush
      # so do one VM at a time
      if inventory[vm]['runtime.powerState'] == 'poweredOn'
        vm.PowerOffVM_Task.wait_for_completion
      end
      vm.Destroy_Task.wait_for_completion
    end
  end  
when 'show_soon_expired_vms'
  vms = lease_tool.filter_expired_vms(
    inventory.keys, inventory, 
    :time_delta => 3.5 * 24 * 60 * 60, # 3.5 days 
  )
  # We could send the user emails here, but for this example, just print the
  # VMs that will expire within the next 3.5 days
  vms.each do |vm, time_to_expiration|
    if time_to_expiration > 0
      hours_to_expiration = time_to_expiration / (60.0 * 60.0) 
      puts "VM '%s' expires in %.2fh" % [inventory[vm]['name'], hours_to_expiration]
    else
      puts "VM '#{inventory[vm]['name']}' is expired"
    end
  end  
else
  abort "invalid command"
end
