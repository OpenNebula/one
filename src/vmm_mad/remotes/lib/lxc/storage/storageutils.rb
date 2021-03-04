#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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
$LOAD_PATH.unshift File.dirname('../lib/')

require 'json'
require 'fileutils'

require 'command'

# Interface to Linux storage management commands
module Storage

    PRE = 'sudo -n '

    COMMANDS ={
        :mount  => "#{PRE}mount",
        :umount => "#{PRE}umount",
        :lsblk      => 'lsblk',
        :mkdir      => 'mkdir -p',
        :su_mkdir   => "#{PRE}mkdir -p",
        :cat        => 'cat',
        :file       => 'file -L -s',
        :blkid      => "#{PRE}blkid",
        :e2fsck     => "#{PRE}e2fsck",
        :resize2fs  => "#{PRE}resize2fs",
        :xfs_growfs => "#{PRE}xfs_growfs",
        :bind       => "#{PRE} bindfs" # TODO, allow customize offset
    }

    def self.setup_disk(device, mountpoint, bindpoint, options)
        begin
            # Get device filesystem (e.g ext4, xfs, ...)
            device_fs = device_fs(device)

            # Resize device if extX like filesystem is used
            if device_fs.match?(/^ext([2-4])$/)
                resize_ext(device)
            end

            # Mount device in mapper folder <sys_ds_folder>/<vm_id>/mapper/disk.id
            return false unless mount(device, mountpoint)

            # Resize device if xfs like filesystem is used
            if device_fs == 'xfs'
                resize_xfs(mountpoint)
            end

            # Bind @mountpoint into to the public accesible folder (@bindpoint)
            return true if bind(mountpoint, bindpoint, options)
        rescue StandardError
        end

        umount(bindpoint)
        umount(mountpoint)

        false
    end

    def self.teardown_disk(mountpoint, bindpoint)
        # unbind fs
        return false unless umount(bindpoint)

        # unmount fs
        umount(mountpoint)
    end

    # Get the partitions on the system or device
    # @param device [String] to get the partitions from. Use and empty string
    # for host partitions
    # @return [Hash] with partitions
    def self.lsblk(device)
        partitions = {}

        rc, o, e = Command.execute("#{COMMANDS[:lsblk]} -OJ #{device}", false)

        if rc != 0 || o.empty?
            STDERR.puts("lsblk: #{e}")
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
            STDERR.puts("lsblk: error parsing lsblk -OJ #{device}")
            return {}
        end

        # Fix for lsblk paths for version < 2.33
        partitions.each do |p|
            lsblk_path(p)

            p['children'].each {|q| lsblk_path(q) } if p['children']
        end

        partitions
    end

    class << self

        private

        # Mount device in directory
        def mount(device, directory, _options = {})
            FileUtils.mkdir_p(directory)
            cmd = "#{COMMANDS[:mount]} #{device} #{directory}"

            Command.execute_rc_log(cmd)
        end

        # bind src directory into target
        # options:
        #   - :id_map (Integer): will apply the corresponding offset to UID/GID
        def bind(src, target, options = {})
            cmd_opts = ''

            FileUtils.mkdir_p(target)

            # Add offset options
            if !options[:id_map].nil?
                cmd_opts = "--uid-offset=#{options[:id_map]} "\
                        "--gid-offset=#{options[:id_map]}"
            end

            # Bindfs
            cmd = "#{COMMANDS[:bind]} #{cmd_opts} #{src} #{target}"
            Command.execute_rc_log(cmd)
        end

        # Umount mountpoint
        def umount(mountpoint, _options = {})
            cmd = "#{COMMANDS[:umount]} #{mountpoint}"

            return false unless Command.execute_rc_log(cmd)

            # clean mountpoint
            FileUtils.rm_rf(mountpoint)

            true
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

        # Return the FSTYPE of a device or an empty string if not defined
        def device_fs(device)
            rc, o, = Command.execute_log("#{COMMANDS[:lsblk]} -o NAME,FSTYPE")

            return '' unless rc

            # Get filesystem type if defined
            o.match(/#{device.gsub('/dev/', '')}.*/)[0]
             .split[1]
             .strip rescue ''
        end

        # Resize an extX like device
        def resize_ext(device)
            Command.execute_rc_log("#{COMMANDS[:e2fsck]} -y -f #{device}")
            Command.execute_rc_log("#{COMMANDS[:resize2fs]} #{device}")
        end

        # Resize an xfs like device
        def resize_xfs(fs)
            Command.execute_rc_log("#{COMMANDS[:xfs_growfs]} #{fs}")
        end

    end

end
