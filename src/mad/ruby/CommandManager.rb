# --------------------------------------------------------------------------
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems
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
require 'timeout'
require 'base64'

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
# * In case of failure the cause of the error will be written to STDERR.

class GenericCommand

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

    # Runs the command
    def run
        begin
            @stdout, @stderr, status = execute

            if status && status.exited?
                @code = status.exitstatus
            else
                @code = 255
            end

            if @code != 0
                log("Command execution failed (exit code: #{@code}): #{command}")
                log(@stderr)
            end
        rescue Exception => e
            if e.is_a?(Timeout::Error)
                error_message = "Timeout executing #{command}"
            else
                error_message = "Internal error #{e}"
            end

            log(error_message)

            @stderr = error_message
            @code   = 255
        end

        return @code
    end

    # Parses error message from +stderr+ output
    def get_error_message
        return '-' if @stderr.empty?

        @stderr.tr("\n",' ').strip
    end

    def to_xml
        stdout = @stdout.nil? ? '' : @stdout
        stderr = @stderr.nil? ? '' : @stderr

        '<EXECUTION_RESULT>' \
            "<COMMAND>#{@command}</COMMAND>" \
            "<STDOUT>#{Base64.encode64(stdout)}</STDOUT>" \
            "<STDERR>#{Base64.encode64(stderr)}</STDERR>" \
            "<CODE>#{@code}</CODE>" \
        '</EXECUTION_RESULT>'
    end

private

    # Low level command execution. This method has to be redefined
    # for each kind of command execution. Returns an array with
    # +stdout+, +stderr+ and +status+ of the command execution.
    def execute
        puts "About to execute \"#{@command}\""
        ['', '', nil]
    end

    # modified Open3.capture with terminator thread
    # to deal with timeouts
    def capture3_timeout(*cmd)
        if Hash === cmd.last
            opts = cmd.pop.dup
        else
            opts = {}
        end

        stdin_data = opts.delete(:stdin_data) || ''
        binmode = opts.delete(:binmode)

        Open3.popen3(*cmd, opts) {|i, o, e, t|
            if binmode
                i.binmode
                o.binmode
                e.binmode
            end

            terminator_e = nil
            mutex = Mutex.new

            out_reader = Thread.new { o.read }
            err_reader = Thread.new { e.read }
            terminator = Thread.new {
                if @timeout and @timeout>0
                    begin
                        pid = Process.getpgid(t.pid) * -1
                    rescue
                        pid = t.pid
                    end

                    if pid
                        begin
                            sleep @timeout

                            mutex.synchronize do
                                terminator_e = Timeout::Error
                            end
                        ensure
                        end

                        Process.kill('TERM', pid)
                    end
                end
            }

            begin
                i.write stdin_data
                i.close
            rescue Errno::EPIPE
                # the cmd doesn't read the input, ignore error
            end

            # blocking wait for process termination
            t.value

            # if reader threads are not dead yet, kill them
            [out_reader, err_reader].each do |reader|
                next unless reader.status

                reader.join(0.1)
                reader.kill
            end

            mutex.lock
            terminator.kill
            raise terminator_e if terminator_e

            # return values
            [out_reader.value, err_reader.value, t.value]
        }
    end

end

# Executes commands in the machine where it is called. See documentation
# for GenericCommand
class LocalCommand < GenericCommand
private

    def execute
        capture3_timeout("#{command}",
                        :pgroup => true, :stdin_data => @stdin)
    end
end

# Executes commands in a remote machine ussing ssh. See documentation
# for GenericCommand
class SSHCommand < GenericCommand

    attr_accessor :host, :ssh_opts

    # Creates a command and runs it
    def self.run(command, host, logger=nil, stdin=nil, timeout=nil, ssh_opts='')
        cmd=self.new(command, host, logger, stdin, timeout, ssh_opts)
        cmd.run
        cmd
    end

    # This one takes another parameter. +host+ is the machine
    # where the command is going to be executed
    def initialize(command, host, logger=nil, stdin=nil, timeout=nil, ssh_opts='')
        @host=host
        @ssh_opts = ssh_opts

        super(command, logger, stdin, timeout)
    end

private

    def execute
        if @stdin
            capture3_timeout("ssh #{@ssh_opts} #{@host} #{@command}",
                            :pgroup => true, :stdin_data => @stdin)
        else
            capture3_timeout("ssh -n #{@ssh_opts} #{@host} #{@command}",
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
        sync_cmd = "scp -rp #{REMOTES_LOCATION}/* #{host}:#{remote_dir}"

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
