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

# Mapper for qcow2 images (qemu-nbd)
class Qcow2Mapper

    QEMU_NBD_FORK_VERSION = '2.8.0'
    CACHE_MODES = ['none', 'writethrough', 'writeback', 'directsync', 'unsafe']

    COMMANDS = {
        :map     => 'sudo -n qemu-nbd --fork -c',
        :unmap   => 'sudo -n qemu-nbd -d'
    }

    # Maps qcow2 image file to linux nbd device
    def map(disk)
        file   = source(disk)
        device = nbd_device.strip

        cmd = "#{COMMANDS[:map]} #{device} #{file}"

        cmd << " --cache=#{disk['CACHE']}" if
            CACHE_MODES.include?(disk['CACHE'])

        rc = Command.execute_rc_log(cmd, false)

        return unless rc

        device
    end

    # Unmaps loopdevice from Linux
    def unmap(device)
        Command.execute_rc_log("#{COMMANDS[:unmap]} #{device}", false)
    end

    private

    # Returns the source file for the disk
    def source(disk)
        "#{disk.sysds_path}/#{disk.vm_id}/disk.#{disk.id}"
    end

    # TODO, check if necessary
    def fork_supported
        tgt_ver = nbd_version

        return false if tgt_ver == '0.0.0'

        Gem::Version.new(tgt_ver) >= Gem::Version.new(QEMU_NBD_FORK_VERSION)
    end

    def nbd_version
        cmd = "#{@commands[:nbd]} -V"

        rc, out, _err = Command.execute(cmd, false, 1)

        return '0.0.0' unless rc.zero?

        match_v = out.match(/qemu-nbd(?: version)? ((?:[0-9]+\.?)+)\s?\(?.*$/)

        return '0.0.0' if match_v.nil?

        match_v[1]
    end

    # Detects Max number of block devices
    def nbds_max
        File.read('/sys/module/nbd/parameters/nbds_max').chomp.to_i
    rescue StandardError => e
        STDERR.puts("Cannot load kernel module parameter\n#{e}")
        0
    end

    # Returns the first non-used nbd device
    def nbd_device
        sys_parts = Storage.lsblk('')
        nbds      = []

        sys_parts.each do |p|
            m = p['name'].match(/nbd(\d+)/)
            next unless m

            nbds << m[1].to_i if !p['uuid'].nil? && !p['uuid'].empty?
        end

        nbds_max.times do |i| # if nbds_max returns 0 block is skipped
            return "/dev/nbd#{i}" unless nbds.include?(i)
        end

        STDERR.puts("#{__method__}: Cannot find free nbd device")

        ''
    end

end
