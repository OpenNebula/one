# --------------------------------------------------------------------------
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# --------------------------------------------------------------------------

require 'pp'
require 'open3'
require 'stringio'
require 'timeout'

# Generic command executor that holds the code shared by all the command
# executors.
#
# Properties:
#
# * +code+: integer holding the exit code. Read-only
# * +stdout+: string of the standard output. Read-only
# * +stderr+: string of the standard error. Read-only
# * +command+: command to execute. Read-only
#
# The protocol for scripts to log is as follows:
#
# * Log messages will be sent to STDOUT
# * The script will return 0 if it succeded or any other value
#   if there was a failure
# * In case of failure the cause of the error will be written to STDERR
#   wrapped by start and end marks as follows:
#
#     ERROR MESSAGE --8<------
#     error message for the failure
#     ERROR MESSAGE ------>8--


class GenericCommand
    ERROR_OPEN  = "ERROR MESSAGE --8<------"
    ERROR_CLOSE = "ERROR MESSAGE ------>8--"

    attr_reader :code, :stdout, :stderr, :command

    # Creates a command and runs it
    def self.run(command, logger=nil, stdin=nil, timeout=nil)
        cmd = self.new(command, logger, stdin, timeout)
        cmd.run
        cmd
    end

    # Creates the new command:
    # +command+: string with the command to be executed
    # +logger+: proc that takes a message parameter and logs it
    def initialize(command, logger=nil, stdin=nil, timeout=nil)
        @command = command
        @logger  = logger
        @stdin   = stdin
        @timeout = timeout
    end

    # Sends a log message to the logger proc
    def log(message, all=true)
        @logger.call(message, all) if @logger
    end

    def kill(pid)
        # executed processes now have its own process group to be able
        # to kill all children
        pgid = Process.getpgid(pid)

        # Kill all processes belonging to process group
        Process.kill("HUP", pgid * -1)
    end

    # Runs the command
    def run
        std = nil
        process = Proc.new do
            std = execute

            # Close standard IO descriptors
            if @stdin
                std[0] << @stdin
                std[0].flush
            end
            std[0].close if !std[0].closed?

            @stdout=std[1].read
            std[1].close if !std[1].closed?

            @stderr=std[2].read
            std[2].close if !std[2].closed?

            @code=get_exit_code(@stderr)

            if @code!=0
                log("Command execution fail: #{command}")
                log(@stderr)
            end
        end

        begin
            if @timeout
                Timeout.timeout(@timeout, nil, &process)
            else
                process.call
            end
        rescue Timeout::Error
            error_message = "Timeout executing #{command}"
            log(error_message)

            @stderr = ERROR_OPEN + "\n" + error_message + "\n" + ERROR_CLOSE

            3.times {|n| std[n].close if !std[n].closed? }

            pid = std[-1].pid
            self.kill(pid)

            @code = 255
        end

        return @code
    end

    # Parses error message from +stderr+ output
    def get_error_message
        tmp=@stderr.scan(/^#{ERROR_OPEN}\n(.*?)#{ERROR_CLOSE}$/m)
        return "-" if !tmp[0]
        tmp[0].join(' ').strip
    end

private

    # Gets exit code from STDERR
    def get_exit_code(str)
        tmp=str.scan(/^ExitCode: (\d*)$/)
        return nil if !tmp[0]
        tmp[0][0].to_i
    end

    # Low level command execution. This method has to be redefined
    # for each kind of command execution. Returns an array with
    # +stdin+, +stdout+ and +stderr+ handlers of the command execution.
    def execute
        puts "About to execute \"#{@command}\""
        [StringIO.new, StringIO.new, StringIO.new]
    end

end

# Executes commands in the machine where it is called. See documentation
# for GenericCommand
class LocalCommand < GenericCommand
private

    def execute
        Open3.popen3("#{command} ; echo ExitCode: $? 1>&2",
                        :pgroup => true)
    end
end

# Executes commands in a remote machine ussing ssh. See documentation
# for GenericCommand
class SSHCommand < GenericCommand
    attr_accessor :host

    # Creates a command and runs it
    def self.run(command, host, logger=nil, stdin=nil, timeout=nil)
        cmd=self.new(command, host, logger, stdin, timeout)
        cmd.run
        cmd
    end

    # This one takes another parameter. +host+ is the machine
    # where the command is going to be executed
    def initialize(command, host, logger=nil, stdin=nil, timeout=nil)
        @host=host
        super(command, logger, stdin, timeout)
    end

private

    def execute
        if @stdin
            Open3.popen3("ssh #{@host} #{@command} ; echo ExitCode: $? 1>&2",
                            :pgroup => true)
        else
            Open3.popen3("ssh -n #{@host} #{@command} ; echo ExitCode: $? 1>&2",
                            :pgroup => true)
        end
    end
end

class RemotesCommand < SSHCommand

    # Creates a command and runs it
    def self.run(command, host, remote_dir, logger=nil, stdin=nil, retries=0, timeout=nil)
        cmd_file = command.split(' ')[0]

        cmd_string = "'if [ -x \"#{cmd_file}\" ]; then #{command}; else\
                              exit #{MAGIC_RC}; fi'"

        cmd = self.new(cmd_string, host, logger, stdin, timeout)
        cmd.run

        while cmd.code != 0 and retries != 0
            if cmd.code == MAGIC_RC
                update_remotes(host, remote_dir, logger)
            end

            sleep 1
            cmd.run
            retries = retries - 1
        end

        cmd
    end

private

    ONE_LOCATION=ENV["ONE_LOCATION"]

    if !ONE_LOCATION
        REMOTES_LOCATION="/var/lib/one/remotes"
    else
        REMOTES_LOCATION=ONE_LOCATION+"/var/remotes/"
    end

    MAGIC_RC = 42

    def self.update_remotes(host, remote_dir, logger=nil)
        if logger != nil
            logger.call("Remote worker node files not found")
            logger.call("Updating remotes")
        end

        #recreate remote dir structure
        SSHCommand.run("mkdir -p #{remote_dir}",host,logger)

        # Use SCP to sync:
        sync_cmd = "scp -rp #{REMOTES_LOCATION}/. #{host}:#{remote_dir}"

        # Use rsync to sync:
        # sync_cmd = "rsync -Laz #{REMOTES_LOCATION} #{host}:#{@remote_dir}"
        LocalCommand.run(sync_cmd, logger)
    end
end


if $0 == __FILE__

    command=GenericCommand.run("uname -a")
    puts command.stderr

    local_command=LocalCommand.run("uname -a")
    puts "STDOUT:"
    puts local_command.stdout
    puts
    puts "STDERR:"
    puts local_command.stderr

    ssh_command=SSHCommand.run("uname -a", "localhost")
    puts "STDOUT:"
    puts ssh_command.stdout
    puts
    puts "STDERR:"
    puts ssh_command.stderr

    fd  = File.new("/etc/passwd")
    str = String.new
    fd.each {|line| str << line}
    fd.close

    ssh_in = SSHCommand.run("cat > /tmp/test","localhost",nil,str)
end
