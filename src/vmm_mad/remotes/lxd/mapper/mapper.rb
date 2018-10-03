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

require 'fileutils'

# Mapping disks on the host
class Mapper

    # TODO: move mappers to lib?
    # TODO: format empty datablocks
    # TODO: multiple partitions

    class << self

      def mount(disk, path)
          shell("sudo mount #{disk} #{path}")
      end

      def umount(path)
          shell("sudo umount #{path}")
      end

      # Returns the block device associated to a mount
      def detect(path)
          `df -h #{path} | grep /dev | awk '{print $1}'`
      end

      # Maps/unmamps a disk file to/from a directory
      def run(action, directory, disk = nil)
          case action
          when 'map'
              FileUtils.mkdir_p directory
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
