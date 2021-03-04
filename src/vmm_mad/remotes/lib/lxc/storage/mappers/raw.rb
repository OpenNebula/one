#!/usr/bin/ruby

$LOAD_PATH.unshift File.dirname(__FILE__)

require 'command'

# TODO: Multipart

# Mapping utilities for loopdevice
class RawMapper

    COMMANDS = {
        :map     => 'sudo -n losetup --find --show',
        :unmap   => 'sudo -n losetup -d'
    }

    # Maps raw image file to linux loopdevice
    def map(disk)
        file = source(disk)
        cmd  = "#{COMMANDS[:map]} #{file}"

        rc, stdout, = Command.execute_log(cmd, false)

        if rc == 0
            return stdout.strip # device used, ex. /dev/loop0
        end

        nil
    end

    # Unmaps loopdevice from Linux
    def unmap(device)
        cmd = "#{COMMANDS[:unmap]} #{device}"

        Command.execute_rc_log(cmd)
    end

    private

    # Returns the source file for the disk
    def source(disk)
        "#{disk.sysds_path}/#{disk.vm_id}/disk.#{disk.id}"
    end

end
