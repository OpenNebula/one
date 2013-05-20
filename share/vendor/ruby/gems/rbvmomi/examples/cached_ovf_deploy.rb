#!/usr/bin/env ruby
require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'
require 'rbvmomi/utils/deploy'
require 'rbvmomi/utils/admission_control'
require 'yaml'

VIM = RbVmomi::VIM

opts = Trollop.options do
  banner <<-EOS
Deploy an OVF to a cluster, using a cached template if available.

Usage:
    cached_ovf_deploy.rb [options] <vmname> <ovfurl>

VIM connection options:
    EOS

    rbvmomi_connection_opts

    text <<-EOS

VM location options:
    EOS

    rbvmomi_datacenter_opt
    rbvmomi_datastore_opt

    text <<-EOS

Other options:
  EOS

  opt :template_name, "Name to give to the (cached) template", :type => :string
  opt :template_path, "Path where templates are stored", :default => 'templates', :type => :string
  opt :computer_path, "Path to the cluster to deploy into", :type => :string
  opt :network, "Name of the network to attach template to", :type => :string
  opt :vm_folder_path, "Path to VM folder to deploy VM into", :type => :string
  opt :lease, "Lease in days", :type => :int, :default => 3
end

Trollop.die("must specify host") unless opts[:host]
Trollop.die("no cluster path given") unless opts[:computer_path]
template_folder_path = opts[:template_path]
template_name = opts[:template_name] or Trollop.die("no template name given")
vm_name = ARGV[0] or Trollop.die("no VM name given")
ovf_url = ARGV[1] or Trollop.die("No OVF URL given")

vim = VIM.connect opts
dc = vim.serviceInstance.find_datacenter(opts[:datacenter]) or abort "datacenter not found"

root_vm_folder = dc.vmFolder
vm_folder = root_vm_folder
if opts[:vm_folder_path]
  vm_folder = root_vm_folder.traverse(opts[:vm_folder_path], VIM::Folder)
end
template_folder = root_vm_folder.traverse!(template_folder_path, VIM::Folder)

scheduler = AdmissionControlledResourceScheduler.new(
  vim,
  :datacenter => dc,
  :computer_names => [opts[:computer_path]],
  :vm_folder => vm_folder,
  :rp_path => '/',
  :datastore_paths => [opts[:datastore]],
  :max_vms_per_pod => nil, # No limits
  :min_ds_free => nil, # No limits
)
scheduler.make_placement_decision

datastore = scheduler.datastore
computer = scheduler.pick_computer
# XXX: Do this properly
if opts[:network]
  network = computer.network.find{|x| x.name == opts[:network]}
else
  network = computer.network[0]
end

lease_tool = LeaseTool.new
lease = opts[:lease] * 24 * 60 * 60
deployer = CachedOvfDeployer.new(
  vim, network, computer, template_folder, vm_folder, datastore
)
template = deployer.lookup_template template_name

if !template
  puts "#{Time.now}: Uploading/Preparing OVF template ..."
  
  template = deployer.upload_ovf_as_template(
    ovf_url, template_name,
    :run_without_interruptions => true,
    :config => lease_tool.set_lease_in_vm_config({}, lease)
  )
end

puts "#{Time.now}: Cloning template ..."
config = {
  :numCPUs => opts[:cpus],
  :memoryMB => opts[:memory],
}
config = lease_tool.set_lease_in_vm_config(config, lease)
vm = deployer.linked_clone template, vm_name, config

puts "#{Time.now}: Powering On VM ..."
# XXX: Add a retrying version?
vm.PowerOnVM_Task.wait_for_completion

puts "#{Time.now}: Waiting for VM to be up ..."
ip = nil
while !(ip = vm.guest_ip)
  sleep 5
end

puts "#{Time.now}: VM got IP: #{ip}"

puts "#{Time.now}: Done"

