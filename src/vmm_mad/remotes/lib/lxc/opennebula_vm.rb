#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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
require_relative '../../scripts_common'

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
            OpenNebula.log_error e
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

    attr_reader :lxcrc, :bind_folder

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

        # Add nics
        get_nics.each_with_index do |nic, i|
            lxc["lxc.net.#{i}.type"]      = 'veth'
            lxc["lxc.net.#{i}.link"]      = nic['BRIDGE']
            lxc["lxc.net.#{i}.hwaddr"]    = nic['MAC']
            lxc["lxc.net.#{i}.veth.pair"] = "one-#{@vm_id}-#{nic['NIC_ID']}"
        end

        # rubocop:disable Layout/LineLength

        # Add cgroup limitations
        cg_version = get_cgroup_version

        if cg_version != 0
            # rubocop:disable Style/ConditionalAssignment
            cg_set = if cg_version == 2
                         CGROUP_NAMES.keys[1]
                     else
                         CGROUP_NAMES.keys[0]
                     end
            # rubocop:enable Style/ConditionalAssignment

            pre= "lxc.#{cg_set}."

            lxc["#{pre}cpu.#{CGROUP_NAMES[cg_set][:cpu]}"] = cpu_shares(cg_version)

            numa_nodes = get_numa_nodes

            if !numa_nodes.empty?
                nodes = []
                cores = []

                numa_nodes.each do |node|
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
        lxc['lxc.log.file'] = "/var/log/lxc/one-#{@vm_id}.log"

        # Parse RAW section (lxc values should prevail over raw section values)
        lxc = parse_raw.merge(lxc)

        hash_to_lxc(lxc)
    end

    # Returns an Array of Disk objects, each one represents an OpenNebula DISK
    def disks
        adisks = []

        return adisks if @rootfs_id.nil?

        @xml.elements('//TEMPLATE/DISK').each do |xml|
            next if xml['TYPE'].downcase == 'swap'

            # rubocop:disable Style/ConditionalAssignment
            if xml['DISK_ID'] == @rootfs_id
                adisks << Disk.new_root(xml, @sysds_path, @vm_id,
                                        @lxcrc[:mountopts])
            else
                adisks << Disk.new_disk(xml, @sysds_path, @vm_id,
                                        @lxcrc[:mountopts])
            end
            # rubocop:enable Style/ConditionalAssignment
        end

        context_xml = @xml.element('//TEMPLATE/CONTEXT')

        if context_xml
            adisks << Disk.new_context(context_xml, @sysds_path, @vm_id,
                                       @lxcrc[:mountopts])
        end

        adisks
    end

    def privileged?
        ['NO', 'false'].each do |val|
            return true if @xml['/VM/USER_TEMPLATE/LXC_UNPRIVILEGED'].casecmp(val).zero?
        end

        false
    end

    private

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
        profiles = @xml['/VM/USER_TEMPLATE/LXC_PROFILES']

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

    attr_accessor :id, :vm_id, :sysds_path

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

    # Umount mapper block device
    # if options[:ignore_err] errors won't force early return
    def umount(options = {})
        device = find_device

        return true if device.empty?

        rc = Storage.teardown_disk(@mountpoint, @bindpoint)

        return false if !rc && options[:ignore_err] != true

        # unmap image
        @mapper.unmap(device)
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
        @bindpoint = "#{LXCVM::CONTAINER_FS_PATH}/#{@vm_id}/disk.#{@id}"
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

        OpenNebula.log("No block device on #{@mountpoint}") if device.empty?

        device
    end

end
