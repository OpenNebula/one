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

require_relative 'mapper'

# Mapping QCOW2 disks
class QCOW2 < Mapper

    class << self

        def map(disk)
            device = block
            shell("sudo qemu-nbd -c #{device} #{disk}")
            device
        end

        def unmap(block)
            shell("sudo qemu-nbd -d #{block}")
        end

        # Returns the first valid nbd block in which to map the qcow2 disk
        def block
            nbds = `lsblk -l | grep nbd | awk '{print $1}'`.split("\n")

            nbds.each {|nbd| nbds.delete(nbd) if nbd.include?('p') }
            nbds.map! {|nbd| nbd[3..-1].to_i }

            '/dev/nbd' + valid(nbds)
        end

        # logic to return the first available nbd
        def valid(array)
            ref = 0
            array.each do |number|
                break if number != ref

                ref += 1
            end

            ref.to_s
        end

  end

end
