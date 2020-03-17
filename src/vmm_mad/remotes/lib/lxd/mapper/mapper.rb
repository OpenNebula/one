#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'fileutils'
require 'json'

require 'opennebula_vm'
require 'command'

# Mappers class provides an interface to map devices into the host filesystem
# This class uses an array of partitions as output by lsblk in JSON:
#  [
#    {
#     "name"   : "loop1p3",
#     "path"   : "/dev/mapper/loop1p3",
#     "type"   : "part",
#     "fstype" : "..",
#     "label"  : null,
#     "uuid"   : null,
#     "fsavail": "...M",
#     "fsuse%" : "..%",
#     "mountpoint":"/boot"
#     },
#     {
#      ....
#      children : [
#      ]
#     }
# ]
class Mapper

    #---------------------------------------------------------------------------
    # Class constants
    #   - COMMANDS list of commands executed by the driver. This list can
    #   be tunned to specific paths. It contians the list of commands executed
    #   as root
    #---------------------------------------------------------------------------
    COMMANDS = {
        :lsblk      => 'sudo lsblk',
        :losetup    => 'sudo losetup',
        :mount      => 'sudo mount',
        :umount     => 'sudo umount',
        :kpartx     => 'sudo kpartx',
        :nbd        => 'sudo -u root -g oneadmin qemu-nbd',
        :su_mkdir   => 'sudo mkdir -p',
        :mkdir      => 'mkdir -p',
        :catfstab   => 'sudo catfstab',
        :cat        => 'cat',
        :file       => 'file -L -s',
        :blkid      => 'sudo blkid',
        :e2fsck     => 'sudo e2fsck',
        :resize2fs  => 'sudo resize2fs',
        :xfs_growfs => 'sudo xfs_growfs',
        :rbd        => 'sudo rbd-nbd --id',
        :xfs_admin  => 'sudo xfs_admin',
        :tune2fs    => 'sudo tune2fs',
        :mkfs       => '/sbin/mkfs'
    }

    #---------------------------------------------------------------------------
    # Interface to be implemented by specific mapper modules
    #---------------------------------------------------------------------------

    # Maps the disk to host devices
    # @param onevm [OpenNebulaVM] with the VM description
    # @param disk [XMLElement] with the disk data
    # @param directory [String] where the disk has to be mounted
    # @return [String] Name of the mapped device, empty in case of error.
    #
    # Errors should be log using OpenNebula driver functions
    def do_map(_one_vm, _disk, _directory)
        OpenNebula.log_error("map function not implemented for #{self.class}")
        ""
    end

    # Unmaps a previously mapped partition
    # @param device [String] where the disk is mapped
    # @param disk [XMLElement] with the disk data
    # @param directory [String] where the disk has to be mounted
    #
    # @return nil
    def do_unmap(_device, _one_vm, _disk, _directory)
        OpenNebula.log_error("unmap function not implemented for #{self.class}")
        ""
    end

    #---------------------------------------------------------------------------
    # Mapper Interface 'map' & 'unmap' methods
    #---------------------------------------------------------------------------

    # Maps a disk to a given directory
    # @param onevm [OpenNebulaVM] with the VM description
    # @param disk [XMLElement] with the disk data
    # @param directory [String] Path to the directory where the disk has to be
    # mounted. Example: /var/lib/one/datastores/100/3/mapper/disk.2
    #
    # @return true on success
    def map(one_vm, disk, directory)
        return true if mount_on?(directory)

        device = do_map(one_vm, disk, directory)

        OpenNebula.log_info "Mapping disk at #{directory} using device #{device}"

        return false unless device

        if one_vm.volatile?(disk)
            return false unless mkfs(device, one_vm.lxdrc[:filesystem])
        end

        partitions = lsblk(device)

        return false unless partitions

        #-----------------------------------------------------------------------
        # Mount disk images with partitions
        #-----------------------------------------------------------------------

        return mount(partitions, directory) if partitions[0]['type'] == 'part'

        #-----------------------------------------------------------------------
        # Resize partitions if needed and mount single filesystem disk images
        #-----------------------------------------------------------------------
        type = partitions[0]['type']

        return mount_dev(device, directory) unless %w[loop disk].include?(type)

        fstype = get_fstype(device)

        reset_fs_uuid(fstype, device)

        mount_resize_fs(device, directory, fstype, disk)
    end

    # Unmaps a disk from a given directory
    # @param disk [XMLElement] with the disk data
    # @param directory [String] Path to the directory where the disk has to be
    # mounted. Example: /var/lib/one/datastores/100/3/mapper/disk.2
    #
    # @return true on success
    def unmap(one_vm, disk, directory)
        OpenNebula.log_info "Unmapping disk at #{directory}"

        sys_parts = lsblk('')

        return false unless sys_parts

        partitions = []
        device = ''

        real_path = directory

        is_rootfs = real_path =~ %r{.*/rootfs}
        is_shared_ds = File.symlink?(one_vm.sysds_path)

        real_path = File.realpath(directory) if !is_rootfs && is_shared_ds

        sys_parts.each do |d|
            if d['mountpoint'] == real_path
                partitions = [d]
                device     = d['path']
                break
            end

            if d['children']
                d['children'].each do |c|
                    next unless c['mountpoint'] == real_path

                    partitions = d['children']
                    device     = d['path']
                    break
                end
            end

            break unless partitions.empty?
        end

        partitions.delete_if {|p| !p['mountpoint'] }

        partitions.sort! do |a, b|
            b['mountpoint'].length <=> a['mountpoint'].length
        end

        if device.empty?
            OpenNebula.log_error("Cannot detect block device from #{directory}")
            return false
        end

        return false unless umount(partitions)

        return false unless do_unmap(device, one_vm, disk, real_path)

        true
    end

    private

    #---------------------------------------------------------------------------
    # Methods to mount/umount partitions
    #---------------------------------------------------------------------------

    # Umounts partitions
    # @param partitions [Array] with partition device names
    def umount(partitions)
        partitions.each do |p|
            next unless p['mountpoint']

            return nil unless umount_dev(p['path'])
        end
    end

    # Mounts partitions
    # @param partitions [Array] with partition device names
    # @param path [String] to directory to mount the disk partitions
    def mount(partitions, path)
        # TODO: Unmap device if mount fails
        # Single partition
        # ----------------
        return  mount_dev(partitions[0]['path'], path) if partitions.size == 1

        # Multiple partitions
        # -------------------
        fstab = find_fstab(partitions, path)

        if !fstab
            # TODO: Unmap the device
            return false
        end

        parse_fstab(partitions, path, fstab)
    end

    # --------------------------------------------------------------------------
    # Functions to mount/umount devices
    # --------------------------------------------------------------------------

    # Mount the given device. It creates the directory if need. NOTE: The rootfs
    # dir is created as root as it is typically under lxd/storage-pools and it
    # is managed by LXD
    # @param dev [String] device name
    # @param path [String] to mount the device
    #
    # @return true on success
    def mount_dev(dev, path)
        OpenNebula.log_info "Mounting #{dev} at #{path}"

        mkdir_safe(path)

        rc, _out, err = Command.execute("#{COMMANDS[:mount]} #{dev} #{path}", true)

        if rc != 0
            OpenNebula.log_error("mount_dev: #{err}")
            return false
        end

        true
    end

    def umount_dev(dev)
        OpenNebula.log_info "Umounting disk mapped at #{dev}"

        rc, _o, e = Command.execute("#{COMMANDS[:umount]} #{dev}", true)

        return true if rc.zero? || e.include?('not mounted')

        OpenNebula.log_error("umount_dev: #{e}")
        nil
    end

    #---------------------------------------------------------------------------
    # Mapper helper functions
    #---------------------------------------------------------------------------
    # Get the partitions on the system or device
    # @param device [String] to get the partitions from. Use and empty string
    # for host partitions
    # @return [Hash] with partitions
    def lsblk(device)
        partitions = {}

        rc, o, e = Command.execute("#{COMMANDS[:lsblk]} -OJ #{device}", false)

        if rc != 0 || o.empty?
            OpenNebula.log_error("lsblk: #{e}")
            return partitions
        end

        begin
            partitions = JSON.parse(o)['blockdevices']

            if !device.empty?
                partitions = partitions[0]

                if partitions['children']
                    partitions = partitions['children']
                else
                    partitions = [partitions]
                end

                partitions.delete_if do |p|
                  p['fstype'].casecmp('swap').zero? if p['fstype']
                end
            end
        rescue StandardError
            OpenNebula.log_error("lsblk: error parsing lsblk -OJ #{device}")
            return {}
        end

        # Fix for lsblk paths for version < 2.33
        partitions.each do |p|
            lsblk_path(p)

            p['children'].each {|q| lsblk_path(q) } if p['children']
        end

        partitions
    end

    #  Adds path to the partition Hash. This is needed for lsblk version < 2.33
    def lsblk_path(p)
        return unless !p['path'] && p['name']

        if File.exist?("/dev/#{p['name']}")
            p['path'] = "/dev/#{p['name']}"
        elsif File.exist?("/dev/mapper/#{p['name']}")
            p['path'] = "/dev/mapper/#{p['name']}"
        end
    end

    # Returns true if device has mapped partitions
    def parts_on?(device)
        partitions = lsblk(device)
        return true if partitions[0]['type'] == 'part'

        false
    end

    # Extracts the partiton table from a device
    def show_parts(device)
        action_parts(device, '-s -av')
    end

    # Hides the partiton table from a device
    def hide_parts(device)
        action_parts(device, '-d')
    end

    # Runs kpartx vs a device with required flags as arguments
    def action_parts(device, action)
        cmd = "#{COMMANDS[:kpartx]} #{action} #{device}"
        rc, _out, err = Command.execute(cmd, false)

        return true if rc.zero?

        OpenNebula.log_error("#{__method__}: #{err}")
        false
    end

    def mount_on?(path)
        _rc, out, _err = Command.execute("#{COMMANDS[:lsblk]} -J", false)

        if out.include?(path)
            OpenNebula.log_error("#{__method__}: Mount detected in #{path}")
            return true
        end
        false
    end

    def mkdir_safe(path)
        if path =~ %r{.*/rootfs}
            cmd = COMMANDS[:su_mkdir]
        else
            cmd = COMMANDS[:mkdir]
        end

        rc, _out, err = Command.execute("#{cmd} #{path}", false)

        return true if rc.zero?

        OpenNebula.log_error("#{__method__}: #{err}")
        false
    end

    # Look for fstab and mount rootfs in path. First partition with
    # a /etc/fstab file is used as rootfs and it is kept mounted
    def find_fstab(partitions, path)
        fstab = ''
        partitions.each do |p|
            OpenNebula.log("Looking for fstab on #{p['path']}")

            rc = mount_dev(p['path'], path)
            next unless rc

            bin = COMMANDS[:catfstab]
            bin = COMMANDS[:cat] unless path.include?('containers/one-')

            cmd = "#{bin} #{path}/etc/fstab"

            _rc, fstab, _e = Command.execute(cmd, false)

            if fstab.empty?
                return false unless umount_dev(p['path'])

                next
            end

            OpenNebula.log("Found fstab on #{p['path']}")
            break
        end

        return fstab unless fstab.empty?

        OpenNebula.log_error('No fstab file found')

        false
    end

    # Parse fstab contents & mount partitions
    def parse_fstab(partitions, path, fstab)
        fstab.each_line do |l|
            next if l.strip.chomp.empty?
            next if l =~ /\s*#/

            fs, mount_point, _type, _opts, _dump, _pass = l.split

            if l =~ /^\s*LABEL=/ # disk by LABEL
                value = fs.split('=').last.strip.chomp
                key   = 'label'
            elsif l =~ /^\s*UUID=/ # disk by UUID
                value = fs.split('=').last.strip.chomp
                key   = 'uuid'
            else # disk by device - NOT SUPPORTED or other FS
                next
            end

            next if %w[/ swap].include?(mount_point)

            partitions.each do |p|
                next if p[key] != value

                return false unless mount_dev(p['path'], path + mount_point)

                break
            end
        end

        true
    end

    # This function mounts and resizes a FS if needed
    # @param fs_type [String]
    # @param size, osize [Integer] disk size and original size
    # @return true if success
    def mount_resize_fs(device, directory, fs_type, disk)
        size  = disk['SIZE'].to_i if disk['SIZE']
        osize = disk['ORIGINAL_SIZE'].to_i if disk['ORIGINAL_SIZE']

        # TODO: osize is always < size after 1st resize during deployment
        return mount_dev(device, directory) unless size > osize

        OpenNebula.log_info "Resizing filesystem #{fs_type} on #{device}"

        case fs_type
        when /xfs/
            rc = mount_dev(device, directory)
            return false unless rc

            Command.execute("#{COMMANDS[:xfs_growfs]} -d #{directory}", false)
        when /ext/
            err = "#{__method__}: failed to resize #{device}\n"

            cmd = "#{COMMANDS[:e2fsck]} -f -y #{device}"
            _rc, o, e = Command.execute(cmd, false)

            if o.empty?
                OpenNebula.log_error("#{err}#{e}")
            else
                cmd = "#{COMMANDS[:resize2fs]} #{device}"
                rc, _o, e = Command.execute(cmd, false)

                if rc != 0
                    OpenNebula.log_error("#{err}#{e}")
                    return false
                end
            end

            rc = mount_dev(device, directory)
        else
            OpenNebula.log_info 'Skipped filesystem resize'

            rc = mount_dev(device, directory)
        end

        rc
    end

    # Generate a new UUID for the FS
    #  @param fs_type [String]
    #  @param device  [String]
    #  @return true if the UUID was updated (or it was not needed to update)
    def reset_fs_uuid(fs_type, device)
        case fs_type
        when /xfs/
            cmd = "#{COMMANDS[:xfs_admin]} -U generate #{device}"
        when /ext/
            cmd = "#{COMMANDS[:e2fsck]} -f -y #{device}"
            _rc, o, e = Command.execute(cmd, false)

            OpenNebula.log e if o.empty?

            cmd = "#{COMMANDS[:tune2fs]} -U random #{device}"
        else
            return true
        end

        rc, o, e = Command.execute(cmd, false)
        return true if rc.zero?

        OpenNebula.log_error "#{__method__}: error changing UUID: #{o}\n#{e}\n"
        false
    end

    def get_fstype(device)
        cmd = "#{COMMANDS[:blkid]} -o export #{device}"
        _rc, o, _e = Command.execute(cmd, false)

        fstype = ''

        o.each_line do |l|
            next unless (m = l.match(/TYPE=(.*)/))

            fstype = m[1]
            break
        end

        fstype
    end

    # Ensures the update of the partition table
    def update_partable(dev)
        cmd = "#{COMMANDS[:mount]} --fake #{dev} /mnt"
        Command.execute(cmd, false)
    end

    # Formats a block device
    def mkfs(device, format)
        cmd = "#{COMMANDS[:mkfs]}.#{format} #{device}"
        rc, o, e = Command.execute(cmd, false)

        return true if rc.zero?

        OpenNebula.log_error "Failed to format #{device}\n#{o}\n#{e}"
        false
    end

end
