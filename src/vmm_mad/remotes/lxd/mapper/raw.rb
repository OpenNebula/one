#!/usr/bin/ruby

module Mapper

    class << self

        def map(disk)
            `sudo losetup -f --show #{disk}`.chomp
        end

        def unmap(block)
            shell("losetup -d #{block}")
        end

    end

end
