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
# Implements the mapping of raw filesystems
#-------------------------------------------------------------------------------
class FSRawMapper < Mapper

    def do_map
        losetup('-f --show', @disk_src)
    end

    def do_unmap(device)
        losetup('-d', device)
    end

    private

    def losetup(flags, arg)
        cmd = "#{COMMANDS[:losetup]} #{flags} #{arg}"

        rc, out, err = Command.execute(cmd, false)

        return out.chomp if rc.zero?

        OpenNebula.log_error("#{__method__}: #{err}")
        nil
    end

end

#-------------------------------------------------------------------------------
# Implements the mapping of multiple partition raw disk images
#-------------------------------------------------------------------------------
class DiskRawMapper < Mapper

    # Maps the whole file using kpartx. The output should be something like:
    #   $ sudo kpartx -av /var/lib/one/datastores/100/0/disk.0
    #   add map loop3p1 (253:0): 0 204800 linear 7:3 2048
    #   add map loop3p2 (253:1): 0 524288 linear 7:3 206848
    #   add map loop3p3 (253:2): 0 1366016 linear 7:3 731136
    # First line is matched to look for loop device 3, and return "/dev/loop3"
    def do_map
        parts = show_parts(@disk_src)

        loopdev = parts.lines[0].match(/.*add map loop(\d+)p\d+.*/)
        return unless loopdev

        "/dev/loop#{loopdev[1]}"
    end

    # Unmaps all devices and loops with kpartx using the source file
    def do_unmap(_disksource)
        hide_parts(@disk_src)
    end

end
