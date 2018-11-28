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

# Ceph RBD mapper
class RBD < Mapper

    def initialize(ceph_user)
        @ceph_user = ceph_user
    end

    def map(image)
        `sudo rbd --id #{@ceph_user} map #{image}`.chomp
    end

    def unmap(block)
        shell("sudo rbd --id #{@ceph_user} unmap #{block}")
    end

    # Returns an array of mountable block's partitions
    def detect_parts(block)
        parts = `blkid | grep #{block} | grep -w UUID | awk {'print $1'}`.split(":\n")
        uuids = []
        parts.each {|part| uuids.append `blkid #{part} -o export | grep -w UUID`.chomp("\n")[5..-1] }

        formatted = []
        0.upto parts.length - 1 do |i|
            formatted[i] = { 'name' => parts[i], 'uuid' => uuids[i] }
        end

        formatted
    end

    def get_parts(block)
        parts = detect_parts(block)
        parts.each do |part|
            part['name'].slice!('//dev')
        end
        parts
    end

end
