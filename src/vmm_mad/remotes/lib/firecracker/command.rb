#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'open3'

# This module can be used to execute commands. It wraps popen3 and provides
# locking capabilites using flock
module Command

    LOCK_FILE = '/tmp/onefirecracker-lock'

    def self.execute(cmd, block)
        stdout = ''
        stderr = ''

        begin
            fd = lock if block

            stdout, stderr, s = Open3.capture3(cmd)
        ensure
            unlock(fd) if block
        end

        [s.exitstatus, stdout, stderr]
    end

    def self.execute_once(cmd, lock)
        execute(cmd, lock) unless running?(cmd.split[0])
    end

    def self.execute_rc_log(cmd, lock = false)
        rc, _stdout, stderr = execute(cmd, lock)

        puts stderr unless rc.zero?

        rc.zero?
    end

    # Return true if command is running
    def self.running?(command)
        !`ps  --noheaders -C #{command}`.empty?
    end

    def self.lock
        lfd = File.open(LOCK_FILE, 'w')
        lfd.flock(File::LOCK_EX)

        lfd
    end

    def self.unlock(lfd)
        lfd.close
    end

end
