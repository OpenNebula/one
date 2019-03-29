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
require 'tmpdir'

# Ceph RBD mapper
class RBDMapper < Mapper

    def initialize(disk)
        @ceph_user = disk['CEPH_USER']
    end

    def do_map(one_vm, disk, _directory)
        dsrc = one_vm.disk_source(disk)

        cmd = "#{COMMANDS[:rbd]} #{@ceph_user} map #{dsrc}"

        rc, out, err = Command.execute(cmd, true)

        unless rc.zero?

            OpenNebula.log_error("#{__method__}: #{err}")
            return
        end

        device = out.chomp
        update_partable(device)
        device
    end

    def do_unmap(device, _one_vm, _disk, _directory)
        cmd = "#{COMMANDS[:rbd]} #{@ceph_user} unmap #{device}"

        rc, _out, err = Command.execute(cmd, false)

        return true if rc.zero?

        OpenNebula.log_error("#{__method__}: #{err}")
        nil
    end

end
