#!/usr/bin/ruby

require_relative 'mount'
include Mount

action = ARGV[0] # map/unmap
disk = ARGV[1] # image file path
directory = ARGV[2] # drectory to mount image/the image is mounted

datastore_path = '/var/lib/one/datastore'
containers = '/var/lib/lxd/containers'

# modprobe nbd
def map(disk)
    block
    exec("qemu-nbd -c /dev/#{block} #{datastore}/#{disk}")
end

def unmap(block)
    exec("qemu-nbd -d /dev/#{block}")
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
    Mount.mount(map(disk), directory)
elsif action == 'unmap'
    block = detect(directory)
    Mount.umount(directory)
    unmap(block)
end
