#!/usr/bin/env ruby
require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'

VIM = RbVmomi::VIM
CMDS = %w(mount unmount)

opts = Trollop.options do
  banner <<-EOS
Mount/Unmount an NFS datastore from a cluster or single host system.

Usage:
    nfs_datastore.rb [options] resource mount nfs-hostname:/remote/path [name]
    nfs_datastore.rb [options] resource unmount nfs-hostname:/remote/path [name]

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

Trollop.die("must specify host") unless opts[:host]

cr_path = ARGV[0] or Trollop.die("no system name given")
cmd = ARGV[1] or Trollop.die("no command given")
abort "invalid command" unless CMDS.member? cmd
nfs_spec = ARGV[2] or Trollop.die("no nfs path given")
remoteHost, remotePath = nfs_spec.split(":")
localPath = ARGV[3] || remoteHost
mode = "readOnly" #hardcoded.

vim = VIM.connect opts
dc = vim.serviceInstance.find_datacenter(opts[:datacenter]) or abort "datacenter not found"
cr = dc.find_compute_resource(cr_path) || dc.hostFolder.children.find(cr_path).first
abort "compute resource not found" unless cr

case cr
when VIM::ClusterComputeResource
  hosts = cr.host
when VIM::ComputeResource
  hosts = [cr]
else
  abort "invalid resource"
end

hosts.each do |host|
  hds = host.configManager.datastoreSystem

  ds = hds.datastore.select {|ds|
    ds.info.respond_to?(:nas) and
    ds.info.name == localPath and
    ds.info.nas.remoteHost == remoteHost and
    ds.info.nas.remotePath == remotePath
  }.first

  case cmd
  when 'mount'
    if ds
      puts "already mounted on #{host.name} as #{ds.name}"
    else
      ds =
        hds.CreateNasDatastore(:spec => VIM.HostNasVolumeSpec(:remoteHost => remoteHost,
                                                              :remotePath => remotePath,
                                                              :localPath  => localPath,
                                                              :accessMode => mode))
      puts "mounted on #{host.name} as #{ds.name}"
    end
  when 'unmount'
    if ds
      hds.RemoveDatastore(:datastore => ds)
      puts "unmounted from #{host.name}"
    else
      puts "not mounted on #{host.name}"
    end
  else
    abort "invalid command"
  end
end
