# Deterministic synchronization helpers for concurrent ODS specs
module OdsSpecSupport

    DEFAULT_WAIT = 3

    # One-way gate used to coordinate a waiting worker.
    class Gate

        def initialize(open: false)
            @mutex = Mutex.new
            @condition = ConditionVariable.new
            @open = open
        end

        def open
            @mutex.synchronize do
                @open = true
                @condition.broadcast
            end
        end

        def wait(timeout: DEFAULT_WAIT)
            deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + timeout

            @mutex.synchronize do
                until @open
                    remaining = deadline - Process.clock_gettime(Process::CLOCK_MONOTONIC)
                    raise Timeout::Error, 'gate wait timed out' unless remaining.positive?

                    @condition.wait(@mutex, remaining)
                end
            end

            true
        end

    end

    # Countdown latch used to wait for a fixed number of events
    class Countdown

        attr_reader :count

        def initialize(count)
            @count = count
            @mutex = Mutex.new
            @condition = ConditionVariable.new
        end

        def decrement
            @mutex.synchronize do
                @count -= 1
                @condition.broadcast if @count <= 0
            end
        end

        def wait(timeout: DEFAULT_WAIT)
            deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + timeout

            @mutex.synchronize do
                while @count.positive?
                    remaining = deadline - Process.clock_gettime(Process::CLOCK_MONOTONIC)
                    raise Timeout::Error,
                          "countdown stopped at #{@count}" unless remaining.positive?

                    @condition.wait(@mutex, remaining)
                end
            end

            true
        end

    end

    # Thread-safe event collector with deterministic waiting
    class EventLog

        def initialize
            @events = []
            @mutex = Mutex.new
            @condition = ConditionVariable.new
        end

        def add(event)
            @mutex.synchronize do
                @events << event
                @condition.broadcast
            end
        end

        def snapshot
            @mutex.synchronize { @events.dup }
        end

        def wait_for(size, timeout: DEFAULT_WAIT)
            deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + timeout

            @mutex.synchronize do
                while @events.size < size
                    remaining = deadline - Process.clock_gettime(Process::CLOCK_MONOTONIC)
                    raise Timeout::Error,
                          "only #{@events.size} events observed" unless remaining.positive?

                    @condition.wait(@mutex, remaining)
                end

                @events.dup
            end
        end

        def wait_until(timeout: DEFAULT_WAIT)
            raise ArgumentError, 'Expected an event condition block' unless block_given?

            deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + timeout

            @mutex.synchronize do
                until yield(@events)
                    remaining = deadline - Process.clock_gettime(Process::CLOCK_MONOTONIC)
                    raise Timeout::Error, 'event condition was not met' unless remaining.positive?

                    @condition.wait(@mutex, remaining)
                end

                @events.dup
            end
        end

    end

    module_function

    def reset_thread_manager
        manager = ODS::ThreadManager.instance
        manager.instance_variable_set(:@name_prefix, 'ods-spec')
        manager.instance_variable_set(:@mutex, Mutex.new)
        manager.instance_variable_set(:@threads, [])
        manager.instance_variable_set(:@stop_hooks, [])
        manager.instance_variable_set(:@stop, false)
        manager.instance_variable_set(:@stop_result, nil)
        manager.instance_variable_set(:@shutdown_deadline, nil)
        manager.instance_variable_set(:@shutdown_timeout, 1.0)
        manager.instance_variable_set(:@traps_declared, true)
        manager
    end

    def cleanup_managed_threads
        manager = ODS::ThreadManager.instance
        return unless manager.instance_variable_get(:@mutex)

        threads = manager.threads
        threads.each do |thread|
            next unless thread.alive?

            thread.raise(Timeout::Error, 'spec cleanup')
            thread.join(0.5)
        rescue StandardError
            thread.kill
            thread.join
        end
    end

end
