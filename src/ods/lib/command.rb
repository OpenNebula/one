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

module OpenNebula

    module DocumentServer

        # Represents an executable command returned by a declarative job action.
        # A command encapsulates the arguments required to execute a process, captures
        # its standard output and standard error, and supports cancellation.
        #
        # Instances are single-use. {#cancel} may be called concurrently with {#run};
        # all other methods are intended for observation only.
        #
        # Construction errors are normally converted to OpenNebula errors by {.build}.
        class Command

            # Execution wrapper for commands
            class Execution < LocalCommand

                TERMINATION_SIGNAL = 'TERM'
                TERMINATION_GRACE  = 1

                def initialize(argv, logger, timeout, **options)
                    @env               = options[:env]
                    @cwd               = options[:cwd]
                    @cancel_signal     = options[:cancel_signal]
                    @cancel_grace      = options[:cancel_grace]
                    @stdout_formatter  = options[:stdout_formatter]
                    @process_mutex     = Mutex.new
                    @process_condition = ConditionVariable.new
                    @process_target    = nil
                    @cancelled         = false

                    super(argv, logger, nil, timeout)
                end

                # Terminates the process group currently executing the command
                def cancel
                    target = @process_mutex.synchronize do
                        unless @cancelled
                            @cancelled = true
                            @process_target
                        end
                    end

                    terminate(
                        target,
                        :signal => @cancel_signal,
                        :grace  => @cancel_grace
                    )
                end

                # Runs the process and reports execution failures explicitly as errors
                # @return [Integer] Process exit code
                def run
                    @stdout, @stderr, status = execute
                    @code = status&.exited? ? status.exitstatus : 255

                    unless success?
                        log(
                            "Command execution failed (exit code: #{@code}): #{command}",
                            :error
                        )
                    end

                    @code
                rescue StandardError => e
                    message =
                        if e.is_a?(Timeout::Error)
                            "Timeout executing #{command}"
                        else
                            "Internal error #{e}"
                        end

                    log(message, :error)

                    @stderr = message
                    @code   = 255
                end

                private

                # Executes argv directly with its environment and working directory
                def execute
                    raise 'Command execution cancelled' if cancelled?

                    options = {
                        :pgroup => true,
                        :chdir  => @cwd
                    }

                    Open3.popen3(@env, *command, options) do |stdin, stdout, stderr, wait_thread|
                        stdin.close

                        target = process_target(wait_thread.pid)
                        cancel = @process_mutex.synchronize do
                            @process_target = target
                            @cancelled
                        end
                        if cancel
                            terminate(
                                target,
                                :signal => @cancel_signal,
                                :grace  => @cancel_grace
                            )
                        end

                        out_reader = Thread.new { read_stream(stdout, :debug, @stdout_formatter) }
                        err_reader = Thread.new { read_stream(stderr, :warn) }

                        status = wait_for(wait_thread, target)
                        raise 'Command execution cancelled' if cancelled?

                        [
                            out_reader.value || '',
                            err_reader.value || '',
                            status
                        ]
                    ensure
                        @process_mutex.synchronize do
                            @process_target = nil
                            @process_condition.broadcast
                        end

                        readers = [out_reader, err_reader].compact
                        if readers.any?(&:alive?)
                            [stdout, stderr].compact.each do |stream|
                                stream.close unless stream.closed?
                            rescue IOError
                                nil
                            end
                        end

                        readers.each do |reader|
                            next unless reader.alive?

                            reader.join(0.1)
                            next unless reader.alive?

                            reader.kill
                            reader.join
                        end
                    end
                end

                # Captures a command stream while logging each non-empty line
                # @param stream [IO] Process output stream
                # @param level [Symbol] Default log level for emitted lines
                # @param formatter [#call, nil] Optional stdout log formatter
                # @return [String] Complete captured stream
                def read_stream(stream, level, formatter = nil)
                    output = +''

                    stream.each_line do |line|
                        output << line

                        message = line.strip
                        next if message.empty?

                        log_level, message = format_stdout(message, level, formatter)
                        log(message, log_level)
                    end

                    output
                rescue IOError, Errno::EBADF
                    output
                end

                # Applies a command-specific stdout formatter without interrupting logging
                # @param message [String] Output line without surrounding whitespace
                # @param default_level [Symbol] Default log level for the output stream
                # @param formatter [#call, nil] Optional formatter returning [level, message]
                # @return [Array<Symbol, String>] Log level and message to emit
                def format_stdout(message, default_level, formatter)
                    formatted = formatter&.call(message)
                    return [default_level, message] unless formatted.is_a?(Array) &&
                                                        formatted.size == 2

                    level, formatted_message = formatted
                    return [default_level, message] \
                        unless [:debug, :info, :warn, :error].include?(level)
                    return [default_level, message] if formatted_message.to_s.empty?

                    [level, formatted_message]
                rescue StandardError
                    [default_level, message]
                end

                # Sends execution messages with an explicit severity
                # @param message [String] Message to log
                # @param level [Symbol] Log severity
                def log(message, level)
                    @logger&.call(level, message)
                end

                # Returns the process group target used for termination
                def process_target(pid)
                    Process.getpgid(pid) * -1
                rescue StandardError
                    pid
                end

                # Waits for completion and terminates the process after the timeout
                def wait_for(wait_thread, target)
                    return wait_thread.value unless @timeout && @timeout.to_f.positive?

                    Timeout.timeout(@timeout) { wait_thread.value }
                rescue Timeout::Error
                    terminate(target)
                    raise
                end

                # Checks the cancellation flag shared with the scheduler shutdown path
                def cancelled?
                    @process_mutex.synchronize { @cancelled }
                end

                # Sends the configured signal and then KILL when the process remains alive
                # @param target [Integer, nil] Process or process group identifier
                # @param signal [String] Initial termination signal
                # @param grace [Numeric] Seconds allowed for graceful termination
                def terminate(target, signal: TERMINATION_SIGNAL, grace: TERMINATION_GRACE)
                    return unless target

                    Process.kill(signal, target)
                    return if terminated?(target, grace)

                    Process.kill('KILL', target)
                rescue Errno::ESRCH
                    nil
                end

                # Waits passively for the command process to finish
                # @param target [Integer] Process or process group identifier
                # @param grace [Numeric] Maximum seconds to wait
                # @return [Boolean] true when the process finished during the grace period
                def terminated?(target, grace)
                    deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) +
                               grace.to_f

                    @process_mutex.synchronize do
                        while @process_target == target
                            remaining = deadline - Process.clock_gettime(
                                Process::CLOCK_MONOTONIC
                            )
                            break unless remaining.positive?

                            @process_condition.wait(@process_mutex, remaining)
                        end

                        @process_target != target
                    end
                end

            end

            private_constant :Execution

            attr_reader :id,
                        :owner_id,
                        :operation,
                        :argv,
                        :cwd,
                        :env,
                        :timeout,
                        :status,
                        :result

            # Immutable result of a completed command execution
            class Result

                attr_reader :exit_code, :stdout, :stderr, :error

                # Creates a command result and derives its failure message.
                #
                # @param exit_code [Integer] Process exit status
                # @param stdout [String, nil] Captured standard output
                # @param stderr [String, nil] Captured standard error
                # @param stderr_formatter [#call, nil] Optional failure message formatter
                def initialize(exit_code:, stdout:, stderr:, stderr_formatter: nil)
                    @exit_code = exit_code
                    @stdout    = stdout.to_s
                    @stderr    = stderr.to_s
                    @error     = exit_code.to_i.zero? ? nil : failure_message(stderr_formatter)
                end

                # Checks whether the process exited successfully
                #
                # @return [Boolean] true when the exit status is zero
                def success?
                    exit_code.to_i.zero?
                end

                private

                def failure_message(stderr_formatter)
                    formatted = format_stderr(stderr_formatter)
                    return formatted unless formatted.nil? || formatted.empty?

                    return stderr unless stderr.empty?

                    "Command failed with exit status #{exit_code}"
                end

                # Uses a command-specific formatter without masking execution failures
                # @param stderr_formatter [#call, nil] Formatter receiving output and exit code
                # @return [String, nil] Formatted failure detail
                def format_stderr(stderr_formatter)
                    return unless stderr_formatter

                    stderr_formatter.call(stdout, stderr, exit_code).to_s
                rescue StandardError
                    nil
                end

            end

            # Builds a command
            #
            # @param argv [Array<String>] Executable and arguments, without shell parsing
            # @param owner_id [String, Integer] Identifier used in command logs
            # @param cwd [String] Existing working directory
            # @param options [Hash] Execution options
            # @option options [String, Symbol] :operation Log component name
            # @option options [String, Symbol] :component Custom log component name
            # @option options [Hash] :env Child process environment
            # @option options [#call] :stdout_formatter Formatter returning [level, message]
            # @option options [#call] :stderr_formatter Formatter receiving output and exit code
            # @option options [String] :cancel_signal Initial cancellation signal
            # @option options [Numeric] :cancel_grace Seconds before forced termination
            # @option options [Numeric, nil] :timeout Maximum execution time
            # @return [Command, OpenNebula::Error] Command or validation error
            def self.build(argv, owner_id:, cwd:, **options)
                new(
                    argv,
                    :owner_id        => owner_id,
                    :operation       => options[:operation] || :command,
                    :component       => options[:component],
                    :cwd             => cwd,
                    :env             => options[:env],
                    :cancel_signal   => options.fetch(:cancel_signal, 'TERM'),
                    :cancel_grace    => options.fetch(:cancel_grace, 10),
                    :stdout_formatter => options[:stdout_formatter],
                    :stderr_formatter => options[:stderr_formatter],
                    :timeout         => options.fetch(
                        :timeout,
                        defined?(SERVER_CONF) ? SERVER_CONF[:command_timeout] : nil
                    )
                )
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Invalid command: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Creates a command
            #
            # Prefer {.build} at API boundaries so validation failures use the standard
            # OpenNebula error representation.
            #
            # @param argv [Array<String>] Executable and arguments
            # @param owner_id [String, Integer] Identifier used in logs
            # @param operation [String, Symbol] Operation name used in logs
            # @option options [String, Symbol] :component Custom log component name
            # @param cwd [String] Existing working directory
            # @param options [Hash] Environment, timeout, and cancellation options
            # @raise [ArgumentError] If an identifier, argv, directory, or option is invalid
            def initialize(argv, owner_id:, operation:, cwd:, **options)
                @id            = SecureRandom.uuid
                @owner_id      = owner_id
                @operation     = operation.to_sym
                @component     = options[:component] || operation
                @argv          = argv
                @cwd           = cwd
                @env           = options[:env] || {}
                @timeout       = options[:timeout]
                @cancel_signal = options[:cancel_signal]
                @cancel_grace  = options[:cancel_grace]
                @stdout_formatter = options[:stdout_formatter]
                @stderr_formatter = options[:stderr_formatter]
                @status        = :pending
                @execution     = nil
                @result        = nil
                @cancelled     = false
                @mutex         = Mutex.new

                raise ArgumentError, 'Command owner cannot be empty' \
                    if owner_id.to_s.empty?
                raise ArgumentError, 'Command operation cannot be empty' \
                    if operation.to_s.empty?
                raise ArgumentError, 'Command component cannot be empty' \
                    if @component.to_s.empty?
                raise ArgumentError, 'Command argv must be a non-empty Array of Strings' \
                    unless argv.is_a?(Array) && !argv.empty? &&
                           argv.all? {|argument| argument.is_a?(String) }
                raise ArgumentError, "Command cwd #{cwd} is not a directory" \
                    unless cwd.is_a?(String) && Dir.exist?(cwd)
                raise ArgumentError, 'Command env must be a Hash' unless env.is_a?(Hash)
                raise ArgumentError, 'Command cancel signal cannot be empty' \
                    if @cancel_signal.to_s.empty?
                raise ArgumentError, 'Command cancel grace cannot be negative' \
                    if @cancel_grace.to_f.negative?
                raise ArgumentError, 'Command stdout formatter must be callable' \
                    if @stdout_formatter && !@stdout_formatter.respond_to?(:call)
                raise ArgumentError, 'Command stderr formatter must be callable' \
                    if @stderr_formatter && !@stderr_formatter.respond_to?(:call)
            end

            # Executes the command once and captures its result
            #
            # Execution and process errors are converted to a failed {Result}. Concurrent
            # or repeated calls also return a failed result without replacing the result
            # of the invocation that already owns the command.
            #
            # @return [Result] Successful or failed command result
            def run
                started   = false
                execution = nil
                logger    = lambda do |level, message|
                    Log.public_send(
                        level,
                        @component.to_s.upcase,
                        message,
                        owner_id
                    )
                end

                @mutex.synchronize do
                    raise "Command #{id} is already executed" \
                        unless @status == :pending

                    @status = :running
                    started = true
                    raise "Command #{id} was cancelled" if @cancelled

                    execution = Execution.new(
                        argv,
                        logger,
                        timeout,
                        :env => env,
                        :cwd => cwd,
                        :cancel_signal => @cancel_signal,
                        :cancel_grace  => @cancel_grace,
                        :stdout_formatter => @stdout_formatter
                    )
                    @execution = execution
                end
                execution.run

                completed = Result.new(
                    :exit_code => execution.code,
                    :stdout    => execution.stdout,
                    :stderr    => execution.stderr,
                    :stderr_formatter => @stderr_formatter
                )
                @mutex.synchronize do
                    @result = completed
                    @status = completed.success? ? :success : :error
                end

                completed
            rescue StandardError => e
                failed = Result.new(
                    :exit_code => 255,
                    :stdout    => '',
                    :stderr    => e.message,
                    :stderr_formatter => @stderr_formatter
                )
                @mutex.synchronize do
                    if started
                        @status = :error
                        @result = failed
                    end
                end

                failed
            ensure
                if started
                    @mutex.synchronize do
                        @execution = nil if @execution.equal?(execution)
                    end
                end
            end

            # Requests cancellation of a pending or running command
            #
            # The first request is retained. If the process is running, its configured
            # signal is sent to the process group and escalated after the grace period.
            #
            # @return [Boolean, nil] Process cancellation result, or nil when no process
            def cancel
                execution = @mutex.synchronize do
                    unless @cancelled
                        @cancelled = true
                        @execution
                    end
                end

                execution&.cancel
            end

            # Returns a serializable command status snapshot
            #
            # @return [Hash] Identity, operation, argv, status, and optional exit code
            def info
                {
                    :id        => id,
                    :status    => status,
                    :operation => operation,
                    :argv      => argv,
                    :exit_code => result&.exit_code
                }
            end

        end

    end

end
