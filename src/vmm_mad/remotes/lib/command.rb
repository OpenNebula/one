#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

            stdout, stderr, s = Open3.capture3(cmd, opts)
        ensure
            unlock(fd) if block
        end

        return [s.exitstatus, stdout, stderr] if verbose <= 0

        stdin = if opts[:stdin_data]
                    opts[:stdin_data].lines.map {|l| "[stdin]: #{l}" }.join
                else
                    ''
                end

        if s.exitstatus == 0
            STDERR.puts cmd
            STDERR.puts stdin.to_s unless stdin.empty?
        else
            STDERR.puts "Error executing: #{cmd}"
            STDERR.puts stdin.to_s unless stdin.empty?
            STDERR.puts "\t[stdout]: #{stdout}" unless stdout.empty?
            STDERR.puts "\t[stderr]: #{stderr}" unless stderr.empty?
        end

        [s.exitstatus, stdout, stderr]
    end

    def self.execute_once(cmd, lock)
        execute(cmd, lock, 1) unless running?(cmd.split[0])
    end

    # Returns true/false if status is 0/!=0 and logs error if needed
    def self.execute_rc_log(cmd, lock = false)
        rc = execute(cmd, lock, 1)

        rc[0] == 0
    end

    # Execute cmd and logs error if needed
    def self.execute_log(cmd, lock = false)
        execute(cmd, lock, 1)
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

    def self.ssh(options = {})
        opt = {
            :cmds    => '',
            :host    => '',
            :forward => false,
            :nostdout => false,
            :nostderr => false,
            :verbose  => 1,
            :block    => false,
            :emsg     => ''
        }.merge!(options)

        script = <<~EOS
            export LANG=C
            export LC_ALL=C
            #{opt[:cmds]}
        EOS

        cmd = 'ssh -o ControlMaster=no -o ControlPath=none'
        cmd << ' -o ForwardAgent=yes' if opt[:forward]
        cmd << " #{opt[:host]} bash -s "
        cmd << ' 1>/dev/null' if opt[:nostdout]
        cmd << ' 2>/dev/null' if opt[:nostderr]

        r, o, e = execute(cmd, opt[:block], opt[:verbose], :stdin_data => script)

        return [r, o, e] if r == 0 || emsg.empty?

        raise StandardError, "#{emsg}: #{e}"
    end

end
