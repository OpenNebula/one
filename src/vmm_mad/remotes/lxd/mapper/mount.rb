#!/usr/bin/ruby

module Mount

    class << self

      def mount(disk, path)
          `sudo mount #{disk} #{path}`
      end

      def umount(path)
          `sudo umount #{path}`
      end

      # TODO:
      def detect(path); end

    end

end
