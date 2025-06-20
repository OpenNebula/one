# --------------------------------------------------------------------------
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems
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

require 'open3'
require 'timeout'
require 'base64'

require_relative 'DriverLogger'

# rubocop:disable Metrics/ParameterLists

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
    def self.run(command, logger = nil, stdin = nil, timeout = nil, ok_rcs = nil)
        cmd = new(command, logger, stdin, timeout, ok_rcs)
        cmd.run
        cmd
    end

    # Creates the new command:
    # +command+: string with the command to be executed
    # +logger+: proc that takes a message parameter and logs it
    def initialize(command, logger = nil, stdin = nil, timeout = nil, ok_rcs = nil)
        @command = command
        @logger  = logger
        @timeout = timeout

        @stdin  = stdin
        @stdout = ''
        @stderr = ''

        @ok_rcs  = [0]
        @ok_rcs << ok_rcs if ok_rcs
        @ok_rcs.flatten!
        @ok_rcs.uniq!
    end

    # Sends a log message to the logger proc
    def log(message, all = true)
        return unless @logger

        case @logger.arity
        when 2,-2
            @logger.call(message, all)
        when 1
            @logger.call(message)
        end
    end

    # Checks if the execution of the command has been successful. It considers
    # any return code defined as valid in ok_rcs.
    def success?
        @ok_rcs.include?(@code)
    end

    # Runs the command with the execute method and sets @stdout, @stderr and @code
    def run
        begin
            @stdout, @stderr, status = execute

            if status && status.exited?
                @code = status.exitstatus
            else
                @code = 255
            end

            if !@ok_rcs.include?(@code)
                log("Command execution failed (exit code: #{@code}): #{command}")
                log(@stderr)
            end
        rescue StandardError => e
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

    # Serialize the GenericCommand class into a XML document
    def to_xml
        '<EXECUTION_RESULT>' \
            "<COMMAND>#{@command}</COMMAND>" \
            "<STDOUT>#{Base64.encode64(@stdout)}</STDOUT>" \
            "<STDERR>#{Base64.encode64(@stderr)}</STDERR>" \
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
        if cmd.last.is_a?(Hash)
            opts = cmd.pop.dup
        else
            opts = {}
        end

        stdin_data = opts.delete(:stdin_data) || ''
        binmode    = opts.delete(:binmode)

        Open3.popen3(*cmd, opts) do |i, o, e, t|
            if binmode
                i.binmode
                o.binmode
                e.binmode
            end

            terminator_e = nil
            mutex = Mutex.new

            out_reader = Thread.new { o.read }
            err_reader = Thread.new do
                begin
                    e.read
                rescue StandardError
                    ''
                end
            end

            terminator = Thread.new do
                if @timeout && @timeout>0
                    begin
                        pid = Process.getpgid(t.pid) * -1
                    rescue StandardError => e
                        pid = t.pid
                    end

                    if pid
                        sleep @timeout

                        mutex.synchronize do
                            terminator_e = Timeout::Error
                        end

                        Process.kill('TERM', pid)
                    end
                end
            end

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
            [out_reader.value || '', err_reader.value || '', t.value]
        end
    end

end

# Executes commands in the machine where it is called. See documentation
# for GenericCommand for options on the run method
class LocalCommand < GenericCommand

    # Variant of the run method that executes the command in a bash shell though
    # stdin
    #
    # @param [Sting] script with the commands to be executed
    # @param [Hash] options for the execution
    #   @option options [Integer/Array] :ok_rcs of return codes that are considered non-error
    #   @option options [Integer] :timeout for command execution
    #   @option options [Boolean] :exit_fail Abort command execution is the command execution fails
    #
    # @return [GenericCommand] includes return code and standard streams
    def self.run_sh(script, options = {})
        opt = {
            :ok_rcs   => nil,
            :timeout  => nil,
            :exit_fail=> true
        }.merge!(options)

        rc = LocalCommand.run('bash -s 1>/dev/null',
                              OpenNebula::DriverLogger.method(:log_error),
                              script,
                              nil,
                              opt[:ok_rcs])

        if !rc.success? && opt[:exit_fail]
            exit rc.code
        end

        OpenNebula::DriverLogger.log_info "Executed \"#{script}\"."

        rc
    end

    private

    def execute
        capture3_timeout(command.to_s,
                         :pgroup => true,
                         :stdin_data => @stdin)
    end

end

# Executes commands in a remote machine ussing ssh. See documentation
# for GenericCommand
class SSHCommand < GenericCommand

    attr_accessor :host, :ssh_opts

    # Creates a command and runs it
    def self.run(command, host, logger = nil, stdin = nil, timeout = nil, ssh_opts = '')
        cmd=new(command, host, logger, stdin, timeout, ssh_opts)
        cmd.run
        cmd
    end

    # This one takes another parameter. +host+ is the machine
    # where the command is going to be executed
    def initialize(command, host, logger = nil, stdin = nil, timeout = nil, ssh_opts = '')
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

# TODO: Add documentation
# Placeholder
class RemotesCommand < SSHCommand

    # Creates a command and runs it
    def self.run(command, host, remote_dir, logger = nil, stdin = nil, retries = 0, timeout = nil)
        cmd_file = command.split(' ')[0]

        cmd_string = "'if [ -x \"#{cmd_file}\" ]; then #{command}; else\
                              exit #{MAGIC_RC}; fi'"

        cmd = new(cmd_string, host, logger, stdin, timeout)
        cmd.run

        while cmd.code != 0 && retries != 0
            if cmd.code == MAGIC_RC
                update_remotes(host, remote_dir, logger)
            end

            sleep 1
            cmd.run
            retries -= 1
        end

        cmd
    end

    ONE_LOCATION=ENV['ONE_LOCATION']

    if !ONE_LOCATION
        REMOTES_LOCATION = '/var/lib/one/remotes'
    else
        REMOTES_LOCATION = ONE_LOCATION + '/var/remotes/'
    end

    MAGIC_RC = 42

    def self.update_remotes(host, remote_dir, logger = nil)
        if !logger.nil?
            logger.call('Remote worker node files not found')
            logger.call('Updating remotes')
        end

        # recreate remote dir structure
        SSHCommand.run("mkdir -p #{remote_dir}", host, logger)

        # Use SCP to sync:
        sync_cmd = "scp -rp #{REMOTES_LOCATION}/* #{host}:#{remote_dir}"

        # Use rsync to sync:
        # sync_cmd = "rsync -Laz #{REMOTES_LOCATION} #{host}:#{@remote_dir}"
        LocalCommand.run(sync_cmd, logger)
    end

end

# rubocop:enable Metrics/ParameterLists
