#!/usr/bin/ruby

# Mapping disks on the host
# TODO: mve mappers to lib
class Mapper

    class << self

      def mount(disk, path)
          shell("sudo mount #{disk} #{path}")
      end

      def umount(path)
          shell("sudo umount #{path}")
      end

      def detect(path)
          `df -h #{path} | grep /dev | awk '{print $1}'`
      end

      def run(action, directory, disk = nil)
          case action
          when 'map'
              device = map(disk)
              mount(device, directory)
          when 'unmap'
              device = detect(directory)
              umount(directory)
              unmap(device)
          end
      end

      def shell(command)
          raise 'command failed to execute' unless system(command)
      end

    end

end
