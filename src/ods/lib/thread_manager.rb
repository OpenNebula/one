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

        # Manages a set of worker threads, providing spawn, tracking, and graceful shutdown.
        class ThreadManager

            include Singleton

            attr_reader :threads

            COMP = 'THR'

            Thread.report_on_exception = true

            # Minimal thread-safe cancellation flag used to coordinate sibling workers
            class StopFlag

                def initialize(initial = false)
                    @mutex = Mutex.new
                    @value = initial
                end

                def true?
                    @mutex.synchronize { @value }
                end

                def make_true
                    @mutex.synchronize { @value = true }
                end

            end

            # Configure the ThreadManager
            #
            # @param name_prefix [String, nil] optional prefix for thread names
            def configure(prefix)
                @name_prefix ||= prefix
                @mutex       ||= Mutex.new
                @threads     ||= []
                @stop          = false if @stop.nil?

                unless @traps_declared
                    declare_signal_traps
                    @traps_declared = true
                end

                self
            end

            # Starts a new thread and registers it for tracking.
            #
            # @param name [String, Symbol, nil] optional thread name suffix
            # @yield the block to execute inside the thread
            # @return [Thread] the created thread
            def start(name = nil, &block)
                raise ArgumentError, 'Block required' unless block

                thr = Thread.new do
                    tname = [@name_prefix, name].compact.join(':')
                    Thread.current.name = tname if Thread.current.respond_to?(:name=)

                    begin
                        block.call
                    rescue StandardError => e
                        Log.warn(COMP, "[#{tname}] #{e.class}: #{e.message}")
                        Log.debug(COMP, e.backtrace.join("\n"))
                    ensure
                        untrack(Thread.current)
                    end
                end

                track(thr)
                thr
            end

            # Signals all threads to stop and waits for them to finish.
            #
            # @param timeout [Integer] number of seconds to wait per thread
            # @param kill [Boolean] whether to forcefully terminate unresponsive threads
            # @return [void]
            def stop!(timeout: 2, kill: false)
                @stop = true
                list = snapshot

                list.each do |t|
                    next if t.join(timeout)

                    t.kill if kill
                rescue StandardError => e
                    Log.warn(COMP, "[stop] #{e.class}: #{e.message}")
                end
            end

            def stop?
                @stop
            end

            def any_alive?
                snapshot.any?(&:alive?)
            end

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
                stop_flag   = StopFlag.new(false)

                items.each do |item|
                    threads << start(item.class.name) do
                        begin
                            rc = yield(item, stop_flag)

                            if OpenNebula.is_error?(rc)
                                stop_flag.make_true
                                error_queue << rc
                            else
                                on_success.call(item) if on_success && !stop_flag.true?
                            end
                        rescue StandardError => e
                            err = OpenNebula::Error.new(
                                "Task for #{item.class} failed: #{e.message}",
                                OpenNebula::Error::EACTION
                            )

                            stop_flag.make_true
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
                        rescue StandardError
                            Log.error(COMP, e.message)
                        end
                    end

                    return err
                end

                true
            end

            private

            # Adds a thread to the tracked list
            #
            # @param t [Thread]
            def track(t)
                @mutex.synchronize { @threads << t }
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
                        Log.debug(COMP, "#{sig} received — stopping...")
                        stop!(:timeout => 3)
                    end
                end

                signals.each {|sig| trap(sig, &handler) }

                at_exit do
                    stop!(:timeout => 2) if any_alive?
                end
            end

        end

    end

end
