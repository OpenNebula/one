# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

LOG_FILE ||= nil unless defined?(LOG_FILE)

#---------------------------------------------------------------------------
# Helper module to execute commands
#---------------------------------------------------------------------------
module Command

    # rubocop:disable Style/HashSyntax
    def log(message)
        return unless LOG_FILE

        File.write(LOG_FILE, "#{Time.now.strftime('%H:%M:%S.%L')} #{message}\n", mode: 'a')
    end
    # rubocop:enable Style/HashSyntax

    def cmd(command, args, opts = {})
        opts.each do |key, value|
            if value.class == Array
                value.each {|v| command << render_opt(key, v) }
            else
                command << render_opt(key, value)
            end
        end

        log("[CMD]: #{command} #{args}")

        out, err, rc = Open3.capture3("#{command} #{args}", :stdin_data => opts[:stdin_data])

        log('[CMD]: DONE')

        if rc.exitstatus != 0
            raise StandardError, "Error executing '#{command} #{args}':\n#{out} #{err}"
        end

        out
    end

    def render_opt(name, value)
        return '' if name == :stdin_data

        if name.length == 1
            opt = " -#{name.to_s.gsub('_', '-')}"
        else
            opt = " --#{name.to_s.gsub('_', '-')}"
        end

        if value && !value.empty?
            opt << ' ' if name[-1] != '='
            opt << value.to_s
        end

        opt
    end

end

#---------------------------------------------------------------------------
# Helper module to kill running processes
#---------------------------------------------------------------------------
module Cancel

    extend Command

    def self.find_subtasks(ppid, reject = / (blockcommit|snapshot-delete) /)
        begin
            out = cmd('ps', "--no-headers -o pid,cmd --ppid '#{ppid}'")
        rescue StandardError
            return []
        end

        out.lines.each_with_object([]) do |line, acc|
            line.strip!
            next if line.empty?

            pid, command = line.split(' ', 2)
            next if command.match?(reject)

            acc << pid.to_i
        end
    end

    def self.killall_subtasks(signal = :TERM)
        pids = find_subtasks(Process.pid)

        pids.each do |pid|
            log("[KIL]: sending #{signal} to pid=#{pid}")
            Process.kill(signal, pid)
        rescue Errno::ESRCH
            log("[KIL]: pid=#{pid} already exited")
        end
    end

end
