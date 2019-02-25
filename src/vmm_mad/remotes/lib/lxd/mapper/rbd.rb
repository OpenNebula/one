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

# Ceph RBD mapper backed by rbd-nbd
class RBDMapper < Mapper

    def initialize(one_vm, disk, directory)
        super
        @ceph_user = disk['CEPH_USER']
    end

    def do_map
        @device = rbd('map', @disk_src)

        update_partable

        true
    end

    def do_unmap
        rbd('unmap', @device)
    end

    private

    def rbd(action, arg)
        cmd = "#{COMMANDS[:rbd]} #{@ceph_user} #{action} #{arg}"

        rc, out, err = Command.execute(cmd, true)

        return out.chomp if rc.zero?

        OpenNebula.log_error("#{__method__}: #{err}")
        nil
    end

end
