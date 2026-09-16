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

        # Thread-safe cooperative cancellation flag shared by background tasks
        class CancelFlag

            # Creates a cancellation flag.
            #
            # @param cancelled [Boolean] Whether cancellation was already requested
            def initialize(cancelled = false)
                @mutex     = Mutex.new
                @cancelled = cancelled
            end

            # Requests cooperative cancellation.
            #
            # This operation is idempotent and safe from any thread.
            #
            # @return [Boolean] true
            def cancel!
                @mutex.synchronize { @cancelled = true }

                true
            end

            # Checks whether cancellation was requested.
            #
            # @return [Boolean] Current cancellation state
            def cancelled?
                @mutex.synchronize { @cancelled }
            end

        end

        # Manages background threads and coordinates process shutdown.
        #
        # Threads started through {#start} are tracked until their blocks finish. The
        # manager is safe to use concurrently after {#configure}; shutdown hooks and
        # thread snapshots are protected by an internal mutex. Task blocks must still
        # provide their own synchronization for application state
        class ThreadManager

            include Singleton

            COMP = 'THR'
            DEFAULT_SHUTDOWN_TIMEOUT = 30

            Thread.report_on_exception = true

            # Raised when work is submitted after shutdown starts
            class StoppedError < StandardError

            end

            # Configures thread naming and signal handling.
            #
            # Repeated calls preserve the first prefix and existing tracked threads
            #
            # @param prefix [String, nil] Optional prefix for managed thread names
            # @param shutdown_timeout [Numeric] Maximum seconds spent stopping
            # @return [ThreadManager] This manager
            def configure(prefix, shutdown_timeout: DEFAULT_SHUTDOWN_TIMEOUT)
                raise ArgumentError, 'Shutdown timeout must be positive' \
                    unless shutdown_timeout.to_f.positive?

                @name_prefix ||= prefix
                @mutex       ||= Mutex.new
                @threads     ||= []
                @stop_hooks  ||= []
                @stop          = false if @stop.nil?
                @shutdown_timeout ||= shutdown_timeout.to_f

                unless @traps_declared
                    declare_signal_traps
                    @traps_declared = true
                end

                self
            end

            # Returns a snapshot of currently tracked threads.
            #
            # Mutating the returned array does not affect manager state.
            #
            # @return [Array<Thread>] Tracked thread snapshot
            def threads
                snapshot
            end

            # Starts and tracks a background thread.
            #
            # Exceptions derived from StandardError are logged in the worker and are not
            # propagated to the caller. The thread unregisters itself on every exit path.
            #
            # @param name [String, Symbol, nil] Optional thread name suffix
            # @yield Work to execute inside the thread
            # @return [Thread] Created thread
            # @raise [ArgumentError] If no block is provided
            # @raise [StoppedError] If manager shutdown already started
            def start(name = nil, &block)
                raise ArgumentError, 'Block required' unless block

                @mutex.synchronize do
                    raise StoppedError, 'Thread manager is stopped' if @stop

                    thread = Thread.new do
                        tname = [@name_prefix, name].compact.join(':')
                        Thread.current.name = tname \
                            if Thread.current.respond_to?(:name=)

                        begin
                            block.call
                        rescue StandardError => e
                            Log.warn(COMP, "[#{tname}] #{e.class}: #{e.message}")
                            Log.debug(COMP, e.backtrace.join("\n"))
                        ensure
                            untrack(Thread.current)
                        end
                    end

                    @threads << thread
                    thread
                end
            end

            # Registers work that runs before managed threads are joined.
            #
            # Hooks run concurrently exactly once so one uncooperative component cannot
            # prevent the remaining components from receiving the shutdown signal. Hook
            # exceptions are logged without preventing the remaining hooks from running.
            # Hooks may return threads they started so those threads share the same deadline.
            #
            # @yield [deadline] Shutdown work with an absolute monotonic deadline
            # @return [Array<Proc>] Snapshot of registered hooks
            # @raise [ArgumentError] If no block is provided
            def on_stop(&block)
                raise ArgumentError, 'Block required' unless block

                @mutex.synchronize do
                    @stop_hooks << block
                    @stop_hooks.dup
                end
            end

            # Signals global shutdown and waits for managed threads.
            #
            # Shutdown hooks are responsible for waking or cooperatively cancelling their
            # workers. Every hook and managed thread shares one monotonic deadline. Threads
            # that remain alive after it are reported and left for process termination.
            #
            # @param deadline [Numeric, nil] Absolute monotonic shutdown deadline
            # @return [Boolean, nil] Whether every observed thread stopped; nil when another
            #   caller already owns shutdown and has not completed yet
            def stop!(deadline: nil)
                hooks, shutdown_deadline = @mutex.synchronize do
                    already_stopped = @stop
                    @stop = true
                    unless already_stopped
                        @shutdown_deadline = deadline || monotonic_now + @shutdown_timeout
                    end

                    return @stop_result if already_stopped

                    [@stop_hooks.dup, @shutdown_deadline]
                end

                hook_results = Queue.new
                hook_threads = hooks.each_with_index.map do |hook, index|
                    Thread.new do
                        Thread.current.name = shutdown_thread_name(index) \
                            if Thread.current.respond_to?(:name=)

                        begin
                            Array(hook.call(shutdown_deadline)).each do |candidate|
                                hook_results << candidate if candidate.is_a?(Thread)
                            end
                        rescue StandardError => e
                            Log.warn(COMP, "[stop] #{e.class}: #{e.message}")
                        end
                    end
                end

                join_until(hook_threads, shutdown_deadline)

                extra_threads = []
                extra_threads << hook_results.pop until hook_results.empty?
                managed_threads = (snapshot + extra_threads).uniq.reject do |thread|
                    thread == Thread.current
                end
                join_until(managed_threads, shutdown_deadline)

                survivors = (hook_threads + managed_threads).select(&:alive?).uniq
                result    = survivors.empty?

                unless result
                    names = survivors.map {|thread| thread.name || "thread-#{thread.object_id}" }
                    Log.warn(
                        COMP,
                        "Shutdown deadline reached with #{survivors.size} active thread(s): " \
                        "#{names.join(', ')}"
                    )
                end

                @mutex.synchronize { @stop_result = result }
                result
            end

            # Checks whether global shutdown was requested.
            #
            # @return [Boolean] true after {#stop!} starts
            def stop?
                @mutex.synchronize { @stop }
            end

            # Checks whether any tracked thread is alive.
            #
            # @return [Boolean] true when a managed thread is still running
            def any_alive?
                snapshot.any?(&:alive?)
            end

            # Returns the number of currently tracked threads.
            #
            # @return [Integer] Tracked thread count
            def size
                snapshot.size
            end

            # Executes a set of list items in parallel with fail-fast behavior
            # If any item fails, a stop_flag is set to cancel remaining tasks
            # - on_success is called for items that finish successfully
            # - on_failure is called for all items after threads complete if failure
            #
            # @param items [Array<Object>] items to process
            # @param on_success [Proc, nil] called with each successful item
            # @param on_failure [Proc, nil] called with each item if any failure occurs
            # @yield [item, stop_flag] block to execute for each item,
            #  should check stop_flag for cancellation
            # @return [true, OpenNebula::Error] true if all succeed, or the first error encountered
            def run_list_block(items, on_success: nil, on_failure: nil)
                raise ArgumentError, 'Block required' unless block_given?
                return true if items.empty?

                threads     = []
                error_queue = Queue.new
                stop_flag   = CancelFlag.new(false)

                items.each do |item|
                    threads << start(item.class.name) do
                        begin
                            rc = yield(item, stop_flag)

                            if OpenNebula.is_error?(rc)
                                stop_flag.cancel!
                                error_queue << rc
                            else
                                on_success.call(item) if on_success && !stop_flag.cancelled?
                            end
                        rescue StandardError => e
                            err = OpenNebula::Error.new(
                                "Task for #{item.class} failed: #{e.message}",
                                OpenNebula::Error::EACTION
                            )

                            stop_flag.cancel!
                            error_queue << err
                        end
                    end
                end

                threads.each(&:join)

                unless error_queue.empty?
                    err = error_queue.pop

                    items.each do |item|
                        begin
                            on_failure.call(item, err) if on_failure
                        rescue StandardError => e
                            Log.error(COMP, e.message)
                        end
                    end

                    return err
                end

                true
            end

            private

            # Returns the current monotonic time used by shutdown deadlines.
            def monotonic_now
                Process.clock_gettime(Process::CLOCK_MONOTONIC)
            end

            # Joins threads without extending the shared shutdown deadline.
            def join_until(threads, deadline)
                threads.each do |thread|
                    remaining = deadline - monotonic_now
                    break unless remaining.positive?

                    thread.join(remaining)
                rescue StandardError => e
                    Log.warn(COMP, "[stop] #{e.class}: #{e.message}")
                end
            end

            # Builds a diagnostic name for a shutdown hook thread.
            def shutdown_thread_name(index)
                [@name_prefix, "shutdown-hook-#{index}"].compact.join(':')
            end

            # Removes a thread from the tracked list
            #
            # @param t [Thread]
            def untrack(t)
                @mutex.synchronize { @threads.delete(t) }
            end

            # Returns a copy of the current tracked threads
            #
            # @return [Array<Thread>]
            def snapshot
                @mutex.synchronize { @threads.dup }
            end

            # Installs INT/TERM traps for stop and ensures cleanup at exit
            def declare_signal_traps
                signals  = ['INT', 'TERM']
                stopping = false

                Log.debug(COMP, "Installing signal traps (#{signals.join(', ')})")

                handler = proc do |sig|
                    unless stopping
                        stopping = true
                        Thread.new do
                            Log.debug(COMP, "#{sig} received — stopping...")
                            stop!
                            exit
                        end
                    end
                end

                signals.each {|sig| trap(sig, &handler) }

                at_exit do
                    stop! if any_alive? && !stop?
                end
            end

        end

    end

end
