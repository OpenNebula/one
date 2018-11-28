#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

class Qcow2Mapper <  Mapper
    # Max number of block devices. This should be set to the parameter used
    # to load the nbd kernel module (default in kernel is 16)
    NBDS_MAX = 256

    def do_map(one_vm, disk, directory)
        device = nbd_device

        return nil if device.empty?

        dsrc = disk_source(one_vm, disk)
        cmd  = "#{COMMANDS[:nbd]} -c #{device} #{dsrc}"

        rc, out, err = Command.execute(cmd, true)

        loop do
            sleep 0.5

            nbd_parts = lsblk(device)

            break if nbd_parts && nbd_parts[0] && nbd_parts[0]['fstype']
        end

        if rc != 0 
            OpenNebula.log_error("do_map: #{err}")
            return nil
        end

        device
    end

    def do_unmap(device, one_vm, disk, directory)
        cmd = "#{COMMANDS[:nbd]} -d #{device}"

        rc, out, err = Command.execute(cmd, true)

        if rc != 0
            OpenNebula.log_error("do_unmap: #{err}")
        end
    end

    private

    def nbd_device()
        sys_parts = lsblk('')
        device_id = -1
        nbds      = []

        sys_parts.each { |p|
            m = p['name'].match(/nbd(\d+)/)
            next if !m

            nbds << m[1].to_i
        }

        NBDS_MAX.times { |i|
            return "/dev/nbd#{i}" unless nbds.include?(i)
        }

        OpenNebula.log_error("nbd_device: Cannot find free nbd device")

        ''
    end
end
