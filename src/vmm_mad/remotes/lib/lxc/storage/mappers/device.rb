#!/usr/bin/ruby

$LOAD_PATH.unshift File.dirname(__FILE__)

require 'command'

# Mapping utilities for raw devices (e.g LVM, RDM)
class DeviceMapper

    # Maps raw image file to linux loopdevice
    def map(disk)
        ds_path = source(disk)

        if File.symlink?(ds_path)
            return File.readlink(ds_path) # Raw device path
        end

        nil
    end

    def unmap(_device)
        true
    end

    private

    # Returns the source file for the disk
    def source(disk)
        "#{disk.sysds_path}/#{disk.vm_id}/disk.#{disk.id}"
    end

end
