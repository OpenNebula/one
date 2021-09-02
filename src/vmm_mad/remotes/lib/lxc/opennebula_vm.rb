#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                #
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
        :default_lxc_config => '/usr/share/lxc/config/common.conf'
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

        # Add cgroup limitations
        # rubocop:disable Layout/LineLength
        lxc['lxc.cgroup.cpu.shares']            = cpu_shares
        lxc['lxc.cgroup.memory.limit_in_bytes'] = memmory_limit_in_bytes
        lxc['lxc.cgroup.memory.oom_control']    = 1 # Avoid OOM to kill the process when limit is reached
        # rubocop:enable Layout/LineLength

        # User mapping
        # rubocop:disable Layout/LineLength
        lxc['lxc.idmap'] = ["u 0 #{@lxcrc[:id_map]} #{@lxcrc[:max_map]}",
                            "g 0 #{@lxcrc[:id_map]} #{@lxcrc[:max_map]}"]
        # rubocop:enable Layout/LineLength

        # Add profiles
        lxc['lxc.include'] |= parse_profiles

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

            if xml['DISK_ID'] == @rootfs_id
                adisks << Disk.new_root(xml, @sysds_path, @vm_id)
            else
                adisks << Disk.new_disk(xml, @sysds_path, @vm_id)
            end
        end

        context_xml = @xml.element('//TEMPLATE/CONTEXT')

        if context_xml
            adisks << Disk.new_context(context_xml, @sysds_path, @vm_id)
        end

        adisks
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

                if !raw_map[key].nil?
                    raw_map[key] = value
                else
                    raw_map[key] = Array(raw_map[key]) << value
                end
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

    class << self

        def new_context(xml, sysds_path, vm_id)
            Disk.new(xml, sysds_path, vm_id, false, true)
        end

        def new_root(xml, sysds_path, vm_id)
            Disk.new(xml, sysds_path, vm_id, true, false)
        end

        def new_disk(xml, sysds_path, vm_id)
            Disk.new(xml, sysds_path, vm_id, false, false)
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
        return { 'lxc.rootfs.path' => @bindpoint } if @is_rootfs

        if @is_context
            path = 'context'
            opts = 'none rbind,ro,create=dir,optional 0 0'
        else
            # TODO: Adjustable guest mountpoint
            path = "media/one-disk.#{@id}"
            opts = 'none rbind,create=dir,optional 0 0'
        end

        { 'lxc.mount.entry' => "#{@bindpoint} #{path} #{opts}" }
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

    def initialize(xml, sysds_path, vm_id, is_rootfs, is_context)
        @xml   = xml
        @vm_id = vm_id
        @id    = @xml['DISK_ID'].to_i

        @sysds_path = sysds_path

        @is_rootfs  = is_rootfs
        @is_context = is_context

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
