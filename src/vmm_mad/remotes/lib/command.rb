#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

    # Returns true/false if status is 0/!=0 and logs error if needed
    def self.execute_rc_log(cmd, lock = false)
        rc, _stdout, stderr = execute(cmd, lock)

        STDERR.puts stderr unless rc.zero?

        rc.zero?
    end

    # Execute cmd and logs error if needed
    def self.execute_log(cmd, lock = false)
        rc = execute(cmd, lock)

        STDERR.puts rc[2] unless rc[0].zero?

        rc
    end

    def self.execute_detach(cmd)
        pid = Process.fork do
            exec(cmd)
        end

        !Process.detach(pid).nil?
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
