#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

$LOAD_PATH.unshift File.dirname(__FILE__)

require 'yaml'

# Storage mappers
require 'storageutils'
require 'qcow2'
require 'raw'
require 'rbd'
require 'device'

require_relative '../lib/xmlparser'
require_relative '../lib/opennebula_vm'
require_relative '../../DriverLogger'

# -----------------------------------------------------------------------------
# This class reads and holds configuration attributes for the LXC driver
# -----------------------------------------------------------------------------
class LXCConfiguration < Hash

    DEFAULT_CONFIGURATION = {
        :vnc => {
            :width   => '800',
            :height  => '600',
            :timeout => '300',
            :command => 'sudo lxc-console'
        },
        :datastore_location => '/var/lib/one/datastores',
        :default_lxc_config => '/usr/share/lxc/config/common.conf',
        :mountopts => {
            :bindfs => 'suid',
            :disk   => 'rbind,create=dir,optional',
            :dev_xfs => 'nouuid',
            :rootfs => '',
            :mountpoint => 'media/one-disk.$id'
        }
    }

    # Configuration attributes that are not customizable
    FIXED_CONFIGURATION = {
        :profiles_location  => '/var/tmp/one/etc/vmm/lxc/profiles',
        :id_map => 600100001, # First id for mapping
        :max_map => 65536     # Max id for mapping
    }

    LXCRC = '../../etc/vmm/lxc/lxcrc'

    def initialize
        replace(DEFAULT_CONFIGURATION)

        begin
            merge!(YAML.load_file("#{__dir__}/#{LXCRC}"))
        rescue StandardError => e
            OpenNebula::DriverLogger.log_error e
        end

        merge!(FIXED_CONFIGURATION)

        super
    end

end

# -----------------------------------------------------------------------------
# This class parses and wraps the information in the Driver action data
# -----------------------------------------------------------------------------
class LXCVM < OpenNebulaVM

    CONTAINER_FS_PATH = '/var/lib/lxc-one'

    attr_reader :lxcrc, :bind_folder, :xml

    def initialize(xml)
        # Load Driver configuration
        @lxcrc = LXCConfiguration.new

        super(xml, @lxcrc)

        @bind_folder = "#{CONTAINER_FS_PATH}/#{@vm_id}"
    end

    # Returns a Hash representing the LXC configuration for this OpenNebulaVM
    def to_lxc
        lxc = {}

        # Always include default file with uids mapping
        lxc['lxc.include'] = [@lxcrc[:default_lxc_config]]

        # Add disks
        disks.each do |disk|
            disk.to_lxc.each do |key, val|
                if lxc[key].nil?
                    lxc[key] = [val]
                else
                    lxc[key] << val
                end
            end
        end

        # Add veth nics
        nics.each_with_index do |nic, i|
            lxc["lxc.net.#{i}.type"]      = 'veth'
            lxc["lxc.net.#{i}.link"]      = nic['BRIDGE']
            lxc["lxc.net.#{i}.hwaddr"]    = nic['MAC']
            lxc["lxc.net.#{i}.veth.pair"] = nic['TARGET']
        end

        # Add passthrough nics
        pci_nics.each do |nic|
            i = nic['NIC_ID']

            lxc["lxc.net.#{i}.type"]  = 'phys'
            lxc["lxc.net.#{i}.link"]  = nic_name_by_address(nic['ADDRESS'])
            lxc["lxc.net.#{i}.flags"] = 'up'
        end

        # rubocop:disable Layout/LineLength

        # Add cgroup limitations
        cg_version = get_cgroup_version

        if cg_version != 0
            cg_set = if cg_version == 2
                         CGROUP_NAMES.keys[1]
                     else
                         CGROUP_NAMES.keys[0]
                     end

            pre= "lxc.#{cg_set}."

            lxc["#{pre}cpu.#{CGROUP_NAMES[cg_set][:cpu]}"] = cpu_shares(cg_version)

            nnodes = numa_nodes

            if !nnodes.empty?
                nodes = []
                cores = []

                nnodes.each do |node|
                    nodes << node['MEMORY_NODE_ID']
                    cores << node['CPUS']
                end

                lxc["#{pre}cpuset.#{CGROUP_NAMES[cg_set][:cores]}"] = cores.join(',')
                lxc["#{pre}cpuset.#{CGROUP_NAMES[cg_set][:nodes]}"] = nodes.join(',')
            end

            memory = limits_memory

            lxc["#{pre}memory.#{CGROUP_NAMES[cg_set][:memory_max]}"] = memory
            lxc["#{pre}memory.#{CGROUP_NAMES[cg_set][:memory_low]}"] = "#{(memory.chomp.to_f*0.9).ceil}M"

            lxc["#{pre}memory.#{CGROUP_NAMES[cg_set][:swap]}"] = limits_memory_swap('LXC_SWAP') if swap_limitable?

            # Avoid OOM to kill the process when limit is reached
            lxc["#{pre}memory.#{CGROUP_NAMES[cg_set][:oom]}"] = 1

            # rubocop:enable Layout/LineLength
        end

        # User mapping
        # rubocop:disable Layout/LineLength

        if privileged?
            @lxcrc[:id_map] = 0

            lxc['lxc.include'] << "#{@lxcrc[:profiles_location]}/profile_privileged"
        else
            lxc['lxc.idmap'] = ["u 0 #{@lxcrc[:id_map]} #{@lxcrc[:max_map]}",
                                "g 0 #{@lxcrc[:id_map]} #{@lxcrc[:max_map]}"]

        end

        # rubocop:enable Layout/LineLength

        # Add profiles
        lxc['lxc.include'] |= parse_profiles

        # logging
        # 0 = trace, 1 = debug, 2 = info, 3 = notice, 4 = warn,
        # 5 = error, 6 = critical, 7 = alert, 8 = fatal
        lxc['lxc.log.level'] = 5
        lxc['lxc.log.file']  = "/var/log/lxc/one-#{@vm_id}.log"
        lxc['lxc.console.logfile'] = "/var/log/lxc/one-#{@vm_id}.console"

        # Parse RAW section (lxc values should prevail over raw section values)
        lxc = parse_raw.merge(lxc)

        hash_to_lxc(lxc)
    end

    def disk(id)
        xml = if id == context_id
                  context
              else
                  super(id)
              end

        return if xml['TYPE'].downcase == 'swap'

        disk_args = [xml] + disk_args_common

        case xml['DISK_ID']
        when @rootfs_id
            Disk.new_root(*disk_args)
        when context_id
            Disk.new_context(*disk_args)
        else
            Disk.new_disk(*disk_args)
        end
    end

    # Returns an Array of Disk objects, each one represents an OpenNebula DISK
    def disks
        disks = []

        super.each do |xml|
            lxc_disk = disk(xml['DISK_ID'])
            disks << lxc_disk unless lxc_disk.nil?
        end

        disks << disk(context['DISK_ID']) if has_context?

        disks
    end

    def privileged?
        ['NO', 'false'].each do |val|
            return true if @xml['//USER_TEMPLATE/LXC_UNPRIVILEGED'].casecmp(val).zero?
        end

        false
    end

    def bind_mount_path(guest_path)
        "#{CONTAINER_FS_PATH}/#{@vm_id}/disk.#{@rootfs_id}/#{guest_path}"
    end

    def create_veth_pair(nic)
        veth_peer = "vpeer#{nic['TARGET']}"

        cmds = []
        cmds << "ip link add #{nic['TARGET']} type veth peer name #{veth_peer}"
        cmds << "ip link set #{veth_peer} address #{nic['MAC']}"
        cmds << "ip link set #{nic['TARGET']} up"

        cmds.each do |cmd|
            rc, _o, e = Command.execute("sudo -n #{cmd}", false, 1)
            next unless rc != 0

            error = "Could not create veth pair\n#{e}"
            OpenNebula::DriverLogger.log_error "#{__method__}: #{error}"
            delete_nic(nic['TARGET'])
            return false
        end

        return veth_peer
    end

    def delete_nic(nic_name)
        return true unless nic_exist?(nic_name)

        cmd = "ip link delete #{nic_name}"
        rc, _o, e = Command.execute("sudo -n #{cmd}", false, 1)
        return true if rc.zero?

        OpenNebula::DriverLogger.log_error "#{__method__}: #{e}"
        return false
    end

    def add_bridge_port(nic)
        case nic['BRIDGE_TYPE']
        when 'linux'
            cmd = "ip link set #{nic['TARGET']} master #{nic['BRIDGE']}"
        when 'openvswitch'
            cmd = "ovs-vsctl add-port #{nic['BRIDGE']} #{nic['TARGET']}"
        when 'openvswitch_dpdk'
            cmd = "ovs-vsctl add-port #{bridge} #{nic['TARGET']}"

            dpdk_path = "#{@sysds_path}/#{nic['TARGET']}"
            cmd << " -- set Interface #{nic['TARGET']} type=dpdkvhostuserclient "\
                   "options:vhost-server-path=#{dpdk_path}"
        else
            e = "Unsupported bridge type #{nic['BRIDGE_TYPE']}"
            OpenNebula::DriverLogger.log_error "#{__method__}: #{e}"
            return false
        end

        rc, _o, e = Command.execute("sudo -n #{cmd}", false, 1)
        return true if rc.zero?

        error = "Could not add interface #{nic['TARGET']} to bridge #{nic['BRIDGE']}\n#{e}"
        OpenNebula::DriverLogger.log_error "#{__method__}: #{error}"
        return false
    end

    def del_bridge_port(nic)
        if /ovswitch/ =~ nic['VN_MAD']
            cmd = "ovs-vsctl --if-exists del-port #{nic['BRIDGE']} #{nic['TARGET']}"
        else
            return true unless nic_exist?(nic['TARGET'])

            cmd = "ip link set #{nic['TARGET']} nomaster"
        end

        rc, _o, e = Command.execute("sudo -n #{cmd}", false, 1)
        return true if rc.zero?

        OpenNebula::DriverLogger.log_error "#{__method__}: #{e}"
        return false
    end

    private

    def nic_exist?(nic_name)
        cmd = "ip link show #{nic_name}"
        rc, _o, _e = Command.execute("sudo -n #{cmd}", false, 0)
        return rc.zero?
    end

    def self.veth_peer(nic)
        "vpeer#{nic_host(nic)}"
    end

    def self.nic_host(nic)
        nic['TARGET']
    end

    def self.nic_guest(nic)
        "eth#{nic['NIC_ID']}"
    end

    def disk_args_common
        [@sysds_path, @vm_id, @lxcrc[:mountopts]]
    end

    # Returns the config in LXC style format
    def hash_to_lxc(hash)
        lxc = ''

        hash.each do |key, value|
            # Process duplicate values from array keys
            if value.class == Array
                value.each do |v|
                    lxc << "#{key} = '#{v}'\n"
                end
            else
                lxc << "#{key} = '#{value}'\n"
            end
        end

        lxc
    end

    # Parse configuration in template RAW section
    def parse_raw
        raw_map = {}

        begin
            return raw_map if @xml['//RAW/TYPE'].downcase != 'lxc'

            # only add valid lxc configuration statements
            regex = /^(lxc\.(?:[a-zA-Z0-9]+\.)*[a-zA-Z0-9]+\s*)=(.*)$/

            @xml['//RAW/DATA'].each_line do |l|
                l.strip!

                match = l.match(regex)

                next if match.nil?

                key = match[1].strip
                value = match[2].strip

                # rubocop:disable Style/ConditionalAssignment
                if !raw_map[key].nil?
                    raw_map[key] = value
                else
                    raw_map[key] = Array(raw_map[key]) << value
                end
                # rubocop:enable Style/ConditionalAssignment
            end
        rescue StandardError
        end

        raw_map
    end

    # Parse profiles and return the list of files (profiles) to be included.
    def parse_profiles
        profiles = @xml['//USER_TEMPLATE/LXC_PROFILES']

        return [] if profiles.empty?

        files = []

        profiles.split(',').each do |profile|
            profile.strip!
            path = "#{@lxcrc[:profiles_location]}/#{profile}"

            if File.exist?(path)
                files << path
            else
                STDERR.puts "Cannot find profile: \"#{profile}\"."
            end
        end

        files.uniq
    end

end

# ------------------------------------------------------------------------------
# Class for managing Container Disks
# ------------------------------------------------------------------------------
class Disk

    attr_accessor :id, :vm_id, :sysds_path, :mountpoint

    DISK_TYPE = [:context, :rootfs, :entry]

    class << self

        def new_context(xml, sysds_path, vm_id, mountopts)
            Disk.new(xml, sysds_path, vm_id, mountopts, :context)
        end

        def new_root(xml, sysds_path, vm_id, mountopts)
            Disk.new(xml, sysds_path, vm_id, mountopts, :rootfs)
        end

        def new_disk(xml, sysds_path, vm_id, mountopts)
            Disk.new(xml, sysds_path, vm_id, mountopts, :entry)
        end

    end

    # Mount mapper block device
    def mount(options = {})
        device = @mapper.map(self)

        return false unless device

        return true if Storage.setup_disk(device,
                                          @mountpoint,
                                          @bindpoint,
                                          options)

        # Rollback if failed to setup disk
        @mapper.unmap(device)

        false
    end

    def pass_mount(container_path)
        Storage.bind_mount(@bindpoint, container_path)
    end

    # Umount mapper block device
    # if options[:ignore_err] errors won't force early return
    def umount(options = {})
        device = find_device

        return true if device.empty?

        return false unless clean_live

        rc = Storage.teardown_disk(@mountpoint, @bindpoint)

        return false if !rc && options[:ignore_err] != true

        # unmap image
        @mapper.unmap(device)
    end

    def clean_live
        live_mount = live_mount?

        return true if live_mount.nil?

        Storage.umount(live_mount) if live_mount
    end

    # Generate disk into LXC config format
    def to_lxc
        case @kind
        when :context
            { 'lxc.mount.entry' =>
                "#{@bindpoint} context none ro,rbind,create=dir,optional 0 0" }

        when :rootfs
            ropt = []

            ropt << 'ro' if @read_only
            ropt << @lxcrc_mopts[:rootfs]

            root = { 'lxc.rootfs.path' => @bindpoint }
            root['lxc.rootfs.options'] = opt_sanitize(ropt) unless ropt.empty?

            root

        when :entry
            opts = []

            opts << 'ro' if @read_only
            opts << @lxcrc_mopts[:disk]

            path  = @xml['TARGET']

            point = @lxcrc_mopts[:mountpoint].sub('$id', @id.to_s)
            point = path[1..-1] unless path.empty? || path[0] != '/'

            { 'lxc.mount.entry' =>
                "#{@bindpoint} #{point} none #{opt_sanitize(opts)} 0 0" }
        else
            raise 'invalid disk type'
        end
    end

    def swap?
        @xml['TYPE'] == 'swap'
    end

    def volatile?
        @xml['TYPE'] == 'fs'
    end

    def rootfs?
        @kind == :rootfs
    end

    # Access Disk attributes
    def [](k)
        @xml[k]
    end

    private

    def initialize(xml, sysds_path, vm_id, lxcrc_mopts, kind)
        @xml   = xml
        @vm_id = vm_id
        @id    = @xml['DISK_ID'].to_i

        @kind = kind

        @sysds_path  = sysds_path
        @lxcrc_mopts = lxcrc_mopts

        @read_only = true if @xml['READONLY'].casecmp('yes').zero?

        # rubocop:disable all
        @mapper = if @xml['FORMAT'].downcase == 'qcow2'
            Qcow2Mapper.new
        elsif @xml['DISK_TYPE'].downcase == 'rbd'
            RBDMapper.new(self)
        elsif @xml['DISK_TYPE'].downcase == 'block'
            DeviceMapper.new
        else
            RawMapper.new
        end
        # rubocop:enable all

        datastore = @sysds_path
        datastore = File.readlink(@sysds_path) if File.symlink?(@sysds_path)

        @mountpoint = "#{datastore}/#{@vm_id}/mapper/disk.#{@id}"
        @bindroot   = "#{LXCVM::CONTAINER_FS_PATH}/#{@vm_id}"
        @bindpoint  = "#{@bindroot}/disk.#{@id}"
    end

    def live_mount?
        # /var/lib/one/datastores/0/5/mapper/disk.1 /var/lib/lxc-one/5/disk.0/context
        pattern = %r{^#{@mountpoint} #{@bindroot}/disk\.(\d+)/([^/ ][^ ]*) .*$}

        File.read('/proc/mounts').each_line do |mount|
            next unless mount.match(pattern)

            return mount.split(' ')[1]
        end

        nil
    end

    # Returns a , separated list of options. Removes empty or nil elements
    def opt_sanitize(opts)
        return unless opts.class == Array

        opts.delete_if {|o| o.nil? || o.empty? }
        opts.join(',')
    end

    # Returns the associated linux device for the mountpoint
    def find_device
        sys_parts = Storage.lsblk('')
        device    = ''

        sys_parts.each do |d|
            if d['mountpoint'] == @mountpoint
                device = d['path']
                break
            end

            if d['children']
                d['children'].each do |c|
                    next unless c['mountpoint'] == @mountpoint

                    device = d['path']
                    break
                end
            end

            break unless device.empty?
        end

        OpenNebula::DriverLogger.log("No block device on #{@mountpoint}") if device.empty?

        device
    end

end
