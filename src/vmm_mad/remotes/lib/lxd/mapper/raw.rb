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

#-------------------------------------------------------------------------------
# These classes implements the mapping of raw filesystems & raw disk images
#-------------------------------------------------------------------------------
class FSRawMapper < Mapper

    def do_map(one_vm, disk, _directory)
        dsrc = one_vm.disk_source(disk)
        cmd = "#{COMMANDS[:losetup]} -f --show #{dsrc}"

        rc, out, err = Command.execute(cmd, true)

        return out.chomp unless rc != 0 || out.empty?

        OpenNebula.log_error("#{__method__}: #{err}")
        nil
    end

    def do_unmap(device, _one_vm, _disk, _directory)
        cmd = "#{COMMANDS[:losetup]} -d #{device}"

        rc, _out, err = Command.execute(cmd, true)

        return true if rc.zero?

        OpenNebula.log_error("#{__method__}: #{err}")
        nil
    end

end

class DiskRawMapper < Mapper

    # Maps the whole file using kpartx. The output should be something like:
    #   $ sudo kpartx -av /var/lib/one/datastores/100/0/disk.0
    #   add map loop3p1 (253:0): 0 204800 linear 7:3 2048
    #   add map loop3p2 (253:1): 0 524288 linear 7:3 206848
    #   add map loop3p3 (253:2): 0 1366016 linear 7:3 731136
    # Fisrt line is matched to look for loop device 3, and return "/dev/loop3"
    def do_map(one_vm, disk, directory)
        dsrc = one_vm.disk_source(disk)
        cmd  = "#{COMMANDS[:kpartx]} -s -av #{dsrc}"

        rc, out, err = Command.execute(cmd, true)

        if rc != 0 || out.empty?
            OpenNebula.log_error("#{__method__}: #{err}")
            return
        end

        loopdev = out.lines[0].match(/.*add map loop(\d+)p\d+.*/)

        return nil if !loopdev

        "/dev/loop#{loopdev[1]}"
    end

    # Unmaps all devices and loops with kpartx using the source file
    def do_unmap(device, one_vm, disk, directory)
        dsrc = one_vm.disk_source(disk)
        cmd  = "#{COMMANDS[:kpartx]} -d #{dsrc}"

        rc, _out, err = Command.execute(cmd, true)

        return true if rc.zero?

        OpenNebula.log_error("#{__method__}: #{err}")
        nil
    end

end
