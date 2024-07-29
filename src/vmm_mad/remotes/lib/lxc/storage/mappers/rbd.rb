#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'command'
require 'storageutils'

# ------------------------------------------------------------------------------
# Ceph RBD mapper it uses rbd-nbd to map a rbd image to a nbd (Network Block
# Device) device.
# ------------------------------------------------------------------------------
class RBDMapper

    COMMANDS = {
        :rbd => 'sudo -n rbd-nbd'
    }

    def initialize(disk)
        @map_cmd   = "#{COMMANDS[:rbd]} --id #{disk['CEPH_USER']} map"
        @unmap_cmd = "#{COMMANDS[:rbd]} --id #{disk['CEPH_USER']} unmap"
    end

    # @return[String, nil] map device or nil in case of error
    def map(disk)
        dsrc = source(disk)

        return unless dsrc

        rc, out, err = Command.execute("#{@map_cmd} #{dsrc}", true, 1)

        unless rc.zero?
            OpenNebula.log_error("#{__method__}: #{err}")
            return
        end

        out.chomp
    end

    # @return [Bool] true if command succeed
    def unmap(device)
        Command.execute_rc_log("#{@unmap_cmd} #{device}", false)
    end

    private

    # Creates the rbd name. Name structure define in tm/ceph
    #   - no-persistent (clone) "${SRC_PATH}-${VM_ID}-${DISK_ID}"
    #   - persistent (ln) "${SRC_PATH}
    #   - volatile (mkimage) "${POOL_NAME}/one-sys-${VMID}-${DISK_ID}"
    def source(disk)
        src = disk['SOURCE']

        if disk['CLONE'].upcase == 'YES'
            src = "#{src}-#{disk.vm_id}-#{disk.id}"
        elsif disk.volatile?
            src = "#{disk['POOL_NAME']}/one-sys-#{disk.vm_id}-#{disk.id}"
        end

        src
    rescue StandardError
        OpenNebula.log_error("#{__method__}: Cannot set disk source")
        nil
    end

end
