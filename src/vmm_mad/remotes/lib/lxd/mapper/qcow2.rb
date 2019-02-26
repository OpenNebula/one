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

require 'mapper'

# Qcow2 mappers backed by qemu-nbd
class Qcow2Mapper < Mapper

    # Max number of block devices. This should be set to the parameter used
    # to load the nbd kernel module (default in kernel is 16)
    NBDS_MAX = 256 # TODO: Read system config file

    def do_map
        @device = nbd_device
        return if device.empty?

        nfs_patch

        return unless nbd('-c', @device)

        update_partable
        xenial_map_patch # TODO: Drop in xenial EOL

        true
    end

    def do_unmap
        xenial_unmap_patch # TODO: Drop in xenial EOL
        nbd('-d', @device)
    end

    private

    # nbd command handler
    def nbd(flags, arg)
        cmd = "#{COMMANDS[:nbd]} #{flags} #{arg}"
        cmd << " #{@disk_src}" if flags == '-c'

        rc, _out, err = Command.execute(cmd, true)

        return true if rc.zero?

        OpenNebula.log_error("#{__method__}: #{err}")
        nil
    end

    # For ubuntu1604, runs kpartx if doesn't detect partition table
    def xenial_map_patch
        show_parts(@device) unless parts_on?
    end

    # After mapping and unmapping a qcow2 disk the next mapped qcow2
    # may collide with the previous one. The use of kpartx before unmapping
    # seems to prevent this behavior on the nbd module used with
    # the kernel versions in ubuntu 16.04
    def xenial_unmap_patch
        hide_parts(@device) if parts_on?
    end

    # Returns the first available nbd device for ulter mapping
    def nbd_device
        sys_parts = lsblk('')
        nbds      = []

        sys_parts.each do |p|
            m = p['name'].match(/nbd(\d+)/)
            next unless m

            nbds << m[1].to_i
        end

        NBDS_MAX.times do |i|
            return "/dev/nbd#{i}" unless nbds.include?(i)
        end

        OpenNebula.log_error("#{__method__}: Cannot find free nbd device")

        ''
    end

    # Required to use if @disk_src comes from an NFS mount
    def nfs_patch
        File.chmod(0o664, @disk_src) if File.symlink?(@vm.sysds_path)
    end

end
