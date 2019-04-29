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

# Block device mapping for qcow2 disks, backed by nbd kernel module
class Qcow2Mapper < Mapper

    def do_map(one_vm, disk, _directory)
        device = nbd_device

        return if device.empty?

        dsrc = one_vm.disk_source(disk)
        File.chmod(0o664, dsrc) if File.symlink?(one_vm.sysds_path)

        map = "#{COMMANDS[:nbd]} -c #{device} #{dsrc}"
        rc, _out, err = Command.execute(map, true)

        unless rc.zero?
            OpenNebula.log_error("#{__method__}: #{err}")
            return
        end

        update_partable(device)
        show_parts(device) unless parts_on?(device)

        device
    end

    def do_unmap(device, _one_vm, _disk, _directory)
        # After mapping and unmapping a qcow2 disk the next mapped qcow2
        # may collide with the previous one. The use of kpartx
        # before unmapping seems to prevent this behavior on the nbd module
        # used with the kernel versions in ubuntu 16.04

        hide_parts(device)
        cmd = "#{COMMANDS[:nbd]} -d #{device}"

        rc, _out, err = Command.execute(cmd, false)

        return true if rc.zero?

        OpenNebula.log_error("#{__method__}: #{err}")
        nil
    end

    private

    # Detects Max number of block devices
    def nbds_max
        File.read('/sys/module/nbd/parameters/nbds_max').chomp.to_i
    rescue => e
        OpenNebula.log_error("Cannot load kernel module parameter\n#{e}")
        0
    end

    # Returns the first non-used nbd device
    def nbd_device
        sys_parts = lsblk('')
        nbds      = []

        sys_parts.each do |p|
            m = p['name'].match(/nbd(\d+)/)
            next unless m

            nbds << m[1].to_i
        end

        nbds_max.times do |i| # if nbds_max returns 0 block is skipped
            return "/dev/nbd#{i}" unless nbds.include?(i)
        end

        OpenNebula.log_error("#{__method__}: Cannot find free nbd device")

        ''
    end

end
