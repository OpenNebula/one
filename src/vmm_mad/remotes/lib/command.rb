#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

    def self.execute(cmd, block, verbose = 0, opts = {})
        stdout = ''
        stderr = ''

        begin
            fd = lock if block

            STDERR.puts "Running command #{cmd}" if verbose >= 1

            stdout, stderr, s = Open3.capture3(cmd, opts)
        ensure
            unlock(fd) if block
        end

        STDERR.puts "#{stdout}\n#{stderr}" if verbose == 2

        [s.exitstatus, stdout, stderr]
    end

    def self.execute_once(cmd, lock)
        execute(cmd, lock, 1) unless running?(cmd.split[0])
    end

    # Returns true/false if status is 0/!=0 and logs error if needed
    def self.execute_rc_log(cmd, lock = false)
        rc, _stdout, stderr = execute(cmd, lock, 1)

        STDERR.puts stderr unless rc.zero?

        rc.zero?
    end

    # Execute cmd and logs error if needed
    def self.execute_log(cmd, lock = false)
        rc = execute(cmd, lock, 1)

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
