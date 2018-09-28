#!/usr/bin/ruby

module Mount

    class << self

      def mount(disk, path)
          system("sudo mount #{disk} #{path}")
      end

      def umount(path)
          system("sudo umount #{path}")
      end

      def detect(path)
          `df -h #{path} | grep /dev | awk '{print $1}'`
      end

    end

end
