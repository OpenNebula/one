#!/usr/bin/ruby

require_relative 'mount'
include Mount

action = ARGV[0] # map/unmap
directory = ARGV[1] # drectory to mount image/the image is mounted
disk = ARGV[2] # image file path

# modprobe nbd
def map(disk)
    device = block
    system("sudo qemu-nbd -c #{device} #{disk}")
    device
end

def unmap(block)
    system("sudo qemu-nbd -d #{block}")
end

# Returns the first valid nbd block in which to map the qcow2 disk
def block
    nbds = `lsblk -l | grep nbd | awk '{print $1}'`.split("\n")

    nbds.each {|nbd| nbds.delete(nbd) if nbd.include?('p') }
    nbds.map! {|nbd| nbd[3..-1].to_i }

    '/dev/nbd' + valid(nbds)
end

def valid(array)
    ref = 0
    array.each do |number|
        break if number != ref

        ref += 1
    end

    ref.to_s
end

if action == 'map'
    device = map(disk)
    Mount.mount(device, directory)
elsif action == 'unmap'
    device = Mount.detect(directory)
    Mount.umount(directory)
    unmap(device)
end
