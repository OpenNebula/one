require_relative 'shared/spec_helper'

RSpec.describe ODS::JobScheduler do
    # Controllable command double used to exercise scheduler cancellation.
    class SchedulerSpecCommand

        Result = Struct.new(:success?, :error)

        attr_reader :cancel_count

        def initialize(started:, release:, cancel_releases: true)
            @started = started
            @release = release
            @cancel_releases = cancel_releases
            @cancel_count = 0
            @mutex = Mutex.new
            @cancelled = false
        end

        def run
            @started.open
            @release.wait
            cancelled = @mutex.synchronize { @cancelled }
            Result.new(!cancelled, cancelled ? 'command cancelled' : nil)
        end

        def cancel
            @mutex.synchronize do
                @cancelled = true
                @cancel_count += 1
            end
            @release.open if @cancel_releases
            true
        end

        def info
            { :cancel_count => cancel_count }
        end

    end

    def build_workflow_class
        klass = Class.new(ODS::JobWorkflow) do
            workflow_id :scheduler_spec
            failure_states(:RUNNING => :RUNNING_FAILURE)
            stable_states(:DONE)

            step(
                :perform,
                :success => ODS::Job.complete(:DONE),
                :failure => :RUNNING_FAILURE,
                :on_cancel => :cancel_perform
            )

            attr_reader :events, :execution_counts, :commit_counts, :max_active

            def initialize(controls, events)
                @controls = controls
                @events = events
                @execution_counts = Hash.new(0)
                @commit_counts = Hash.new(0)
                @active = 0
                @max_active = 0
                @mutex = Mutex.new
                super()
            end

            def perform(_owner, token:)
                control = @controls.fetch(token)

                case control[:type]
                when :command
                    ODS::Job.run(control.fetch(:command))
                when :pool
                    ODS::Job.thread_pool(
                        control.fetch(:items),
                        :task => :pool_work,
                        :commit => :commit_pool_work,
                        :args => { :token => token }
                    )
                else
                    ODS::Job.thread(
                        :work,
                        :commit => :commit_work,
                        :args => { :token => token }
                    )
                end
            end

            def work(token:, cancel_flag:)
                control = @controls.fetch(token)
                started(token)
                control[:started]&.decrement
                control[:gate]&.wait
                raise control[:failure] if control[:failure]
                raise 'cancelled by flag' if control[:check_cancel] && cancel_flag.cancelled?

                token
            ensure
                finished(token)
            end

            def commit_work(_owner, result, token:)
                @mutex.synchronize { @commit_counts[token] += 1 }
                @events.add([:commit, token, result])
                true
            end

            def pool_work(item, token:, cancel_flag:)
                control = @controls.fetch(token)
                started([token, item])
                control[:started]&.decrement
                control.fetch(:gates, {})[item]&.wait
                raise "item #{item} failed" if control[:fail_item] == item
                raise 'pool cancelled' if control[:check_cancel] && cancel_flag.cancelled?

                item * 10
            ensure
                finished([token, item])
            end

            def commit_pool_work(_owner, item, result, token:)
                @mutex.synchronize { @commit_counts[[token, item]] += 1 }
                @events.add([:pool_commit, token, item, result])
                true
            end

            def cancel_perform(_owner, **_args)
                ODS::Job.fail('cancelled by user')
            end

            def transition!(resource, job, outcome)
                result = super
                @events.add([:complete, resource.id]) \
                    if result.ok? && outcome.is_a?(ODS::Job::Complete)
                result
            end

            def fail!(resource, job, state, message)
                result = super
                @events.add([:failed, resource.id, message]) if result.ok?
                result
            end

            def cancel!(resource, job, state, message)
                result = super
                @events.add([:cancelled, resource.id, message]) if result.ok?
                result
            end

            private

            def started(key)
                @mutex.synchronize do
                    @execution_counts[key] += 1
                    @active += 1
                    @max_active = [@max_active, @active].max
                end
                @events.add([:start, key])
            end

            def finished(key)
                @mutex.synchronize { @active -= 1 }
                @events.add([:finish, key])
            end
        end
        klass.define_singleton_method(:name) { 'SchedulerSpecWorkflow' }
        klass
    end

    let(:events) { OdsSpecSupport::EventLog.new }
    let(:controls) { {} }
    let(:owners) { [] }
    let(:pool) { OdsSpecSupport::MemoryPool.new(owners) }
    let(:workflow_class) { build_workflow_class }
    let(:workflow) { workflow_class.new(controls, events) }
    let(:manager) { OdsSpecSupport.reset_thread_manager }
    let(:concurrency) { 4 }
    let(:shutdown_timeout) { 1 }
    subject(:scheduler) do
        described_class.new(
            :concurrency => concurrency, :shutdown_timeout => shutdown_timeout
        )
    end

    before do
        manager
        workflow.configure(pool, scheduler)
        scheduler.register(workflow)
    end

    after do
        scheduler.shutdown
        manager.stop!
    end

    def build_owner(id, token)
        owner = OdsSpecSupport::MemoryOwner.new(:id => id)
        owners << owner
        pool.owners[owner.id.to_s] = owner
        owner.begin_job!(
            :step => :perform,
            :state => :RUNNING,
            :args => { :token => token },
            :external_user => 'alice'
        )
        owner
    end

    def schedule_owner(owner)
        job = workflow.build_job(owner)
        raise job.message if OpenNebula.is_error?(job)

        scheduler.schedule(job)
    end

    describe 'registration and lifecycle' do
        it 'rejects invalid concurrency and workflow registrations' do
            expect { described_class.new(:concurrency => 0) }
                .to raise_error(ArgumentError, /positive/)
            expect { described_class.new(:shutdown_timeout => 0) }
                .to raise_error(ArgumentError, /shutdown timeout must be positive/i)
            expect { scheduler.register(Object.new) }
                .to raise_error(ArgumentError, /JobWorkflow/)
            expect { scheduler.register(workflow) }
                .to raise_error(ArgumentError, /already registered/)
        end

        it 'starts a fixed worker pool exactly once and releases every worker' do
            ready = OdsSpecSupport::Countdown.new(concurrency)
            allow(scheduler).to receive(:worker).and_wrap_original do |original|
                ready.decrement
                original.call
            end
            scheduler.start
            scheduler.start
            ready.wait

            expect(manager.size).to eq(concurrency + 1)
            expect(manager.threads.map(&:name).uniq.size).to eq(concurrency + 1)

            expect(scheduler.shutdown).to be(true)
            manager.stop!
            expect(manager.size).to eq(0)
        end

        it 'rejects unknown workflows, non-jobs and work after shutdown' do
            owner = build_owner(1, :one)
            controls[:one] = {}
            job = workflow.build_job(owner)
            unknown = ODS::Job.new(
                :workflow => :unknown, :owner_id => 1, :operation_id => 'op',
                :external_user => 'alice', :state => :RUNNING,
                :attempt => 1, :step => :perform, :args => {}
            )

            expect(scheduler.schedule(Object.new).message).to include('Expected a Job')
            expect(scheduler.schedule(unknown).message).to include('Unknown job workflow')
            expect(
                scheduler.wake(
                    :workflow => :unknown, :owner_id => 1, :operation_id => 'op'
                ).message
            ).to include('Unknown job workflow')
            scheduler.shutdown
            expect(scheduler.schedule(job).message).to include('stopped')
            expect(
                scheduler.wake(
                    :workflow => workflow.id, :owner_id => 1,
                    :operation_id => job.operation_id
                ).message
            ).to include('stopped')
        end
    end

    describe 'durable reconciliation' do
        before do
            stub_const(
                'ODS::JobScheduler::ReconciliationQueue::RETRY_DELAY', 0.01
            )
            stub_const(
                'ODS::JobScheduler::ReconciliationQueue::RECHECK_DELAY', 0.01
            )
        end

        it 'deduplicates wakeups and retries transient and unresolved operations' do
            attempts = 0
            calls    = OdsSpecSupport::Countdown.new(3)
            mutex    = Mutex.new
            error    = OpenNebula::Error.new('pool unavailable')

            allow(workflow).to receive(:reconcile_operation) do
                attempt = mutex.synchronize do
                    attempts += 1
                end
                calls.decrement

                case attempt
                when 1 then ODS::ExecResult.retry(error)
                when 2 then ODS::ExecResult.waiting
                else ODS::ExecResult.stale
                end
            end

            2.times do
                expect(
                    scheduler.wake(
                        :workflow => workflow.id, :owner_id => 1,
                        :operation_id => 'operation'
                    )
                ).to eq('operation')
            end

            scheduler.start
            calls.wait

            expect(attempts).to eq(3)
            expect(workflow).to have_received(:reconcile_operation)
                .with(1, 'operation').exactly(3).times
        end

        it 'retries a failed startup discovery and schedules its durable operation' do
            controls[:startup] = {}
            owner = build_owner(1, :startup)
            unavailable = OpenNebula::Error.new('pool unavailable')
            allow(pool).to receive(:info).and_return(unavailable, nil)

            expect(workflow.catch_up).to equal(unavailable)

            scheduler.start
            events.wait_until do |observed|
                observed.any? {|event| event == [:complete, owner.id] }
            end

            expect(pool).to have_received(:info).twice
            expect(workflow.execution_counts[:startup]).to eq(1)
            expect(owner.state).to eq(:DONE)
        end

        it 'bounds shutdown while an active reconciliation call is blocked' do
            started = OdsSpecSupport::Gate.new
            release = OdsSpecSupport::Gate.new
            allow(workflow).to receive(:reconcile_operation) do
                started.open
                release.wait
                ODS::ExecResult.stale
            end

            scheduler.wake(
                :workflow => workflow.id, :owner_id => 1,
                :operation_id => 'blocked-reconciliation'
            )
            scheduler.start
            started.wait

            deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 0.05
            started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
            expect(manager.stop!(:deadline => deadline)).to be(false)
            elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at

            expect(elapsed).to be < 0.5
            expect(Log).to have_received(:warn).with(
                'THR', /job-reconciliation/
            )

            release.open
            Timeout.timeout(1) do
                sleep(0.01) while manager.any_alive?
            end
        end
    end

    describe 'queue identity and owner exclusion' do
        it 'deduplicates reconstructed jobs and preserves runtime identity' do
            owner = build_owner(1, :one)
            controls[:one] = {}
            first = workflow.build_job(owner)
            duplicate = workflow.build_job(owner)

            expect(scheduler.schedule(first)).to eq(first.id)
            expect(scheduler.schedule(duplicate)).to eq(first.id)
            expect(scheduler.job_for(1, owner.active_job.id)).to include(:id => first.id)
            expect(scheduler.cancel(99, 'missing')).to eq(:not_found)
        end

        it 'skips queued jobs for a running owner without blocking other owners' do
            first = ODS::Job.new(
                :workflow => workflow.id, :owner_id => 1, :operation_id => 'one-a',
                :external_user => 'alice', :state => :RUNNING,
                :attempt => 1, :step => :perform, :args => {}
            )
            same_owner = ODS::Job.new(
                :workflow => workflow.id, :owner_id => 1, :operation_id => 'one-b',
                :external_user => 'alice', :state => :RUNNING,
                :attempt => 1, :step => :perform, :args => {}
            )
            other_owner = ODS::Job.new(
                :workflow => workflow.id, :owner_id => 2, :operation_id => 'two',
                :external_user => 'alice', :state => :RUNNING,
                :attempt => 1, :step => :perform, :args => {}
            )
            [first, same_owner, other_owner].each {|job| scheduler.schedule(job) }

            expect(scheduler.send(:take_job)).to equal(first)
            expect(scheduler.send(:take_job)).to equal(other_owner)
            scheduler.send(:finish, first)
            scheduler.send(:finish, other_owner)
            expect(scheduler.send(:take_job)).to equal(same_owner)
            scheduler.send(:finish, same_owner)
        end

        it 'queues a deferred job once with retry state and releases its owner' do
            job = ODS::Job.new(
                :workflow => workflow.id, :owner_id => 1, :operation_id => 'one',
                :external_user => 'alice', :state => :RUNNING,
                :attempt => 1, :step => :perform, :args => {}
            )
            scheduler.schedule(job)
            expect(scheduler.send(:take_job)).to equal(job)

            scheduler.send(:defer, job)
            scheduler.send(:defer, job)

            expect(job.status).to eq(:pending)
            expect(job.retry_at).to be > Process.clock_gettime(Process::CLOCK_MONOTONIC)
            expect(scheduler.instance_variable_get(:@queue)).to eq([job.id])
            expect(scheduler.instance_variable_get(:@running)).to be_empty
        end

        it 'replaces a continuation atomically and preserves cancellation state' do
            owner = build_owner(1, :one)
            controls[:one] = {}
            current = workflow.build_job(owner)
            scheduler.schedule(current)
            expect(scheduler.send(:take_job)).to equal(current)
            cancellation = { :actor => 'alice', :requested_at => 1 }
            current.request_cancel!(cancellation)
            continuation = current.next(
                ODS::Job.next(:perform, :state => :RUNNING, :args => { :token => :one })
            )

            scheduler.send(:replace, continuation)

            expect(scheduler.job_for(1, owner.active_job.id)).to include(
                :id => continuation.id, :status => :cancelling,
                :cancellation => cancellation
            )
            expect(scheduler.instance_variable_get(:@jobs)).not_to have_key(current.id)
            scheduler.send(:finish, continuation)
        end
    end

    describe 'concurrent execution' do
        it 'executes multiple owners concurrently up to the configured limit' do
            ready = OdsSpecSupport::Countdown.new(concurrency)
            gate = OdsSpecSupport::Gate.new
            concurrency.times do |index|
                token = "job-#{index}"
                controls[token] = { :started => ready, :gate => gate }
                schedule_owner(build_owner(index, token))
            end

            scheduler.start
            ready.wait

            expect(workflow.max_active).to eq(concurrency)
            expect(owners).to all(have_attributes(:state => :RUNNING))

            gate.open
            events.wait_for(concurrency * 4)
            expect(owners.map(&:state)).to all(eq(:DONE))
            expect(workflow.execution_counts.values).to all(eq(1))
            expect(workflow.commit_counts.values).to all(eq(1))
        end

        it 'drains a high workload without loss, duplication or shared-state corruption' do
            total = 120
            total.times do |index|
                token = "load-#{index}"
                controls[token] = {}
                schedule_owner(build_owner(index, token))
            end

            scheduler.start
            completed = events.wait_until(:timeout => 10) do |observed|
                observed.count {|event| event.first == :complete } >= total
            end

            expect(workflow.execution_counts.size).to eq(total)
            expect(workflow.execution_counts.values).to all(eq(1))
            expect(workflow.commit_counts.size).to eq(total)
            expect(workflow.commit_counts.values).to all(eq(1))
            complete_ids = completed.filter_map do |event|
                event[1] if event.first == :complete
            end
            expect(complete_ids).to match_array(owners.map(&:id))
            expect(owners.map(&:state)).to all(eq(:DONE))
            expect(workflow.max_active).to be_between(1, concurrency)
        end

        it 'isolates a partial failure while unrelated jobs continue' do
            total = 6
            total.times do |index|
                token = "partial-#{index}"
                controls[token] = index == 2 ? { :failure => 'intentional failure' } : {}
                schedule_owner(build_owner(index, token))
            end

            scheduler.start
            events.wait_for((total - 1) * 4 + 3, :timeout => 5)

            failed = owners.fetch(2)
            expect(failed.state).to eq(:RUNNING_FAILURE)
            expect(failed.error[:message]).to include('intentional failure')
            expect((owners - [failed]).map(&:state)).to all(eq(:DONE))
            expect(workflow.execution_counts.values).to all(eq(1))
            expect(workflow.commit_counts).not_to have_key('partial-2')
        end
    end

    describe 'thread-pool outcomes' do
        let(:concurrency) { 3 }

        it 'starts all allowed items together and commits in deterministic completion order' do
            token = :pool
            gates = { 1 => OdsSpecSupport::Gate.new, 2 => OdsSpecSupport::Gate.new,
                      3 => OdsSpecSupport::Gate.new }
            ready = OdsSpecSupport::Countdown.new(3)
            controls[token] = {
                :type => :pool, :items => [1, 2, 3], :gates => gates, :started => ready
            }
            owner = build_owner(1, token)
            job = workflow.build_job(owner)
            outcome = workflow.perform(owner, :token => token)
            result = Queue.new
            caller = Thread.new do
                result << described_class::ThreadExec.new(concurrency).call(
                    workflow, job, outcome
                )
            end

            ready.wait
            expect(workflow.max_active).to eq(3)
            gates[2].open
            events.wait_for(5)
            gates[1].open
            events.wait_for(7)
            gates[3].open
            caller.join

            commits = events.snapshot.select {|event| event.first == :pool_commit }
            expect(commits.map {|event| event[2] }).to eq([2, 1, 3])
            expect(result.pop.value).to be_a(ODS::Job::Success)
            expect(workflow.commit_counts.values).to all(eq(1))
        end

        it 'rejects item counts above the scheduler limit before starting work' do
            token = :too_many
            controls[token] = { :type => :pool, :items => [1, 2, 3, 4] }
            owner = build_owner(1, token)
            job = workflow.build_job(owner)
            outcome = workflow.perform(owner, :token => token)

            result = described_class::ThreadExec.new(concurrency).call(
                workflow, job, outcome
            )

            expect(result.value).to be_a(ODS::Job::Failure)
            expect(result.value.message).to include('exceeding the scheduler concurrency limit')
            expect(workflow.execution_counts).to be_empty
        end

        it 'joins sibling tasks and prevents commits after the first item failure' do
            token = :pool_failure
            gates = { 1 => OdsSpecSupport::Gate.new, 2 => OdsSpecSupport::Gate.new,
                      3 => OdsSpecSupport::Gate.new }
            ready = OdsSpecSupport::Countdown.new(3)
            controls[token] = {
                :type => :pool, :items => [1, 2, 3], :gates => gates,
                :started => ready, :fail_item => 2
            }
            owner = build_owner(1, token)
            job = workflow.build_job(owner)
            outcome = workflow.perform(owner, :token => token)
            result = Queue.new
            caller = Thread.new do
                result << described_class::ThreadExec.new(concurrency).call(
                    workflow, job, outcome
                )
            end

            ready.wait
            gates[2].open
            events.wait_for(4)
            gates[1].open
            gates[3].open
            caller.join

            failure = result.pop.value
            expect(failure).to be_a(ODS::Job::Failure)
            expect(failure.message).to eq('perform failed: item 2 failed')
            expect(workflow.commit_counts).to be_empty
            expect(workflow.execution_counts.values).to all(eq(1))
        end

        it 'wakes a blocked pool waiter on shutdown and discards late results' do
            token = :pool_shutdown
            gates = { 1 => OdsSpecSupport::Gate.new, 2 => OdsSpecSupport::Gate.new }
            ready = OdsSpecSupport::Countdown.new(2)
            controls[token] = {
                :type => :pool, :items => [1, 2], :gates => gates, :started => ready
            }
            owner = build_owner(1, token)
            job = workflow.build_job(owner)
            outcome = workflow.perform(owner, :token => token)
            result = Queue.new
            caller = Thread.new do
                result << described_class::ThreadExec.new(concurrency).call(
                    workflow, job, outcome
                )
            end

            ready.wait
            job.request_shutdown!(Process.clock_gettime(Process::CLOCK_MONOTONIC) + 1)
            caller.join(0.5)

            expect(caller).not_to be_alive
            expect(result.pop).to be_stopped
            expect(workflow.commit_counts).to be_empty

            gates.each_value(&:open)
            events.wait_until do |observed|
                observed.count {|event| event.first == :finish } == 2
            end
            expect(workflow.commit_counts).to be_empty
        end
    end

    describe 'cancellation and cleanup' do
        let(:concurrency) { 1 }

        it 'cancels a running command and allows the worker to release all resources' do
            started = OdsSpecSupport::Gate.new
            release = OdsSpecSupport::Gate.new
            command = SchedulerSpecCommand.new(:started => started, :release => release)
            controls[:command] = { :type => :command, :command => command }
            owner = build_owner(1, :command)
            schedule_owner(owner)
            scheduler.start
            started.wait

            operation_id = owner.active_job.id
            owner.request_job_cancellation!(:actor => 'alice')
            expect(scheduler.cancel(1, operation_id)).to eq(:requested)
            events.wait_for(1)

            expect(command.cancel_count).to eq(1)
            expect(owner.state).to eq(:RUNNING_FAILURE)
            expect(owner.error[:message]).to include('cancelled')
            expect(scheduler.job_for(1, operation_id)).to be_nil
        end

        it 'shutdown cancels active commands, discards pending runtime entries and is idempotent' do
            started = OdsSpecSupport::Gate.new
            release = OdsSpecSupport::Gate.new
            command = SchedulerSpecCommand.new(:started => started, :release => release)
            controls[:running] = { :type => :command, :command => command }
            controls[:pending] = {}
            schedule_owner(build_owner(1, :running))
            schedule_owner(build_owner(2, :pending))
            scheduler.start
            started.wait

            expect(scheduler.shutdown).to be(true)
            expect(scheduler.shutdown).to be(true)

            expect(command.cancel_count).to eq(1)
            expect(scheduler.instance_variable_get(:@running)).to be_empty
            expect(scheduler.instance_variable_get(:@queue)).to be_empty
            expect(scheduler.instance_variable_get(:@jobs)).to be_empty
            expect(owners.fetch(1).state).to eq(:RUNNING)
        end

        it 'stops waiting for an uncooperative command at the shutdown deadline' do
            started = OdsSpecSupport::Gate.new
            release = OdsSpecSupport::Gate.new
            command = SchedulerSpecCommand.new(
                :started => started, :release => release, :cancel_releases => false
            )
            controls[:blocked] = { :type => :command, :command => command }
            owner = build_owner(1, :blocked)
            schedule_owner(owner)
            scheduler.start
            started.wait

            deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 0.05
            before   = owner.active_job.to_h
            started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)

            expect(scheduler.shutdown(:deadline => deadline)).to be(false)
            elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at

            expect(elapsed).to be < 0.5
            expect(command.cancel_count).to eq(1)
            expect(owner.state).to eq(:RUNNING)
            expect(owner.active_job.to_h).to eq(before)
            expect(Log).to have_received(:warn).with(
                'JOB', /Job scheduler shutdown deadline reached/
            )

            release.open
            Timeout.timeout(1) do
                sleep(0.01) while scheduler.job_for(owner.id, owner.active_job.id)
            end
        end

        it 'abandons an uncooperative Ruby task without persisting a failure' do
            started = OdsSpecSupport::Countdown.new(1)
            release = OdsSpecSupport::Gate.new
            controls[:blocked] = { :started => started, :gate => release }
            owner = build_owner(1, :blocked)
            before = owner.active_job.to_h
            schedule_owner(owner)
            scheduler.start
            started.wait

            deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 0.05
            expect(scheduler.shutdown(:deadline => deadline)).to be(false)

            expect(owner.state).to eq(:RUNNING)
            expect(owner.active_job.to_h).to eq(before)
            expect(workflow.commit_counts).to be_empty
            expect(events.snapshot.none? {|event| event.first == :failed }).to be(true)

            release.open
            events.wait_until do |observed|
                observed.include?([:finish, :blocked])
            end
            expect(workflow.commit_counts).to be_empty
            expect(owner.active_job.to_h).to eq(before)

            replacement_scheduler = described_class.new(
                :concurrency => 1, :shutdown_timeout => 1
            )
            replacement_workflow = workflow_class.new(controls, events)
                .configure(pool, replacement_scheduler)
            replacement_scheduler.register(replacement_workflow)
            expect(replacement_workflow.catch_up).to be(true)
            replacement_scheduler.start
            events.wait_until do |observed|
                observed.include?([:complete, owner.id])
            end

            expect(owner.state).to eq(:DONE)
            expect(owner.active_job).to be_nil
            expect(replacement_workflow.commit_counts[:blocked]).to eq(1)
            replacement_scheduler.shutdown
        end
    end
end

RSpec.describe ODS::JobScheduler, 'event-driven waits' do
    let(:events) { OdsSpecSupport::EventLog.new }
    let(:owner) { OdsSpecSupport::MemoryOwner.new(:id => 31) }
    let(:pool) { OdsSpecSupport::MemoryPool.new([owner]) }
    let(:workflow_class) do
        log = events
        klass = Class.new(ODS::JobWorkflow) do
            workflow_id :scheduler_spec
            failure_states(:RUNNING => :RUNNING_FAILURE)
            stable_states(:DONE)

            event :changed
            step :observe,
                 :success => ODS::Job.next(:finish),
                 :failure => :RUNNING_FAILURE,
                 :on_cancel => :cancel_wait,
                 :ensure => :finish_observe
            step :finish,
                 :state => :RUNNING,
                 :success => ODS::Job.complete(:DONE),
                 :failure => :RUNNING_FAILURE

            def observe(_resource)
                @observe_calls = observe_calls + 1
                ODS::Job.wait(:events => [:changed], :check => :ready)
            end

            def observe_calls
                @observe_calls.to_i
            end

            def finish_observe(_resource)
                @ensure_calls = ensure_calls + 1
                ODS::Job.success
            end

            def ensure_calls
                @ensure_calls.to_i
            end

            def finish(_resource)
                @finish_calls = finish_calls + 1
                ODS::Job.success
            end

            def finish_calls
                @finish_calls.to_i
            end

            define_method(:changed) do |resource, ready:|
                resource.instance_variable_set(:@ready, ready)
                ODS::EventResult.handled(:changed)
            end

            define_method(:ready) do |resource, **_opts|
                ready = resource.instance_variable_get(:@ready) == true
                log.add([:checked, ready])
                ready
            end

            def cancel_wait(_resource, **_opts)
                ODS::Job.fail('cancelled wait')
            end

            define_method(:transition!) do |resource, job, outcome|
                result = super(resource, job, outcome)
                log.add([:completed, resource.id]) if result.ok?
                result
            end
        end
        klass.define_singleton_method(:name) { 'EventWaitSchedulerSpecWorkflow' }
        klass
    end
    let(:scheduler) { described_class.new(:concurrency => 1) }
    let(:workflow) { workflow_class.new.configure(pool, scheduler) }

    before do
        OdsSpecSupport.reset_thread_manager
        scheduler.register(workflow)
        owner.begin_job!(
            :step => :observe, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )
        scheduler.schedule(workflow.build_job(owner))
        scheduler.start
        events.wait_for(1)
        Timeout.timeout(2) do
            sleep(0.01) until owner.active_job.waiting? &&
                              scheduler.job_for(owner.id, owner.active_job.id).nil?
        end
    end

    after do
        scheduler.shutdown
        ODS::ThreadManager.instance.stop!
    end

    it 'releases the worker and lets an event complete the durable wait' do
        operation_id = owner.active_job.id
        expect(scheduler.job_for(owner.id, operation_id)).to be_nil
        expect(owner.active_job.to_h).to include(
            :step => :observe,
            :wait => { :events => [:changed], :check => :ready }
        )

        expect(workflow.dispatch_event(owner.id, :changed, :ready => true)).to eq(:changed)
        events.wait_for(4)

        expect(owner.state).to eq(:DONE)
        expect(owner.active_job).to be_nil
        expect(workflow.observe_calls).to eq(1)
        expect(workflow.ensure_calls).to eq(1)
        expect(workflow.finish_calls).to eq(1)
        expect(scheduler.job_for(owner.id, operation_id)).to be_nil
    end

    it 'reconstructs a short cancellation job for a durable wait' do
        operation_id = owner.active_job.id

        expect(workflow.request_cancellation(owner.id, 'alice')).to eq(:requested)
        Timeout.timeout(2) do
            sleep(0.01) until owner.state == :RUNNING_FAILURE
        end

        expect(owner.error[:message]).to eq('cancelled wait')
        expect(workflow.observe_calls).to eq(1)
        expect(workflow.ensure_calls).to eq(1)
        expect(workflow.finish_calls).to eq(0)
        expect(scheduler.job_for(owner.id, operation_id)).to be_nil
    end
end

RSpec.describe ODS::JobScheduler, 'workflow outcome orchestration' do
    let(:workflow_class) do
        klass = Class.new(ODS::JobWorkflow) do
            workflow_id :scheduler_spec
            failure_states(:RUNNING => :RUNNING_FAILURE)
            stable_states(:DONE)

            step(
                :first,
                :success => ODS::Job.next(:second),
                :failure => :RUNNING_FAILURE,
                :dependencies => [:provider],
                :on_cancel => :cancel_first,
                :ensure => :cleanup_first
            )
            step(
                :second,
                :state => :RUNNING,
                :success => ODS::Job.complete(:DONE)
            )

            attr_reader :calls

            def initialize
                @calls = []
                super
            end

            def first(resource, mode:, provider:)
                calls << [:first, mode, provider]

                if mode == :self_cancel
                    resource.request_job_cancellation!(:actor => 'alice')
                    scheduler.cancel(resource.id, resource.active_job.id)
                end

                case mode
                when :invalid
                    :invalid_result
                when :failure, :retry_failure
                    ODS::Job.fail('primary failure')
                else
                    ODS::Job.success(nil, :args => { :mode => mode })
                end
            end

            def cleanup_first(_resource, mode:)
                calls << [:cleanup, mode]
                return ODS::Job.fail('cleanup failure') \
                    if [:ensure_failure, :primary_ensure_failure].include?(mode)

                ODS::Job.success
            end

            def second(_resource, mode:)
                calls << [:second, mode]
                return ODS::Job.fail('secondary failure') if mode == :second_failure

                ODS::Job.success
            end

            def cancel_first(_resource, **_args)
                calls << [:cancel]
                ODS::Job.fail('cancelled first')
            end
        end
        klass.define_singleton_method(:name) { 'SchedulerOutcomesSpecWorkflow' }
        klass
    end

    let(:owner) { OdsSpecSupport::MemoryOwner.new(:id => 7) }
    let(:pool) { OdsSpecSupport::MemoryPool.new([owner]) }
    let(:scheduler) { described_class.new(:concurrency => 2) }
    let(:workflow) { workflow_class.new.configure(pool, scheduler) }

    before do
        OdsSpecSupport.reset_thread_manager
        scheduler.register(workflow)
    end

    after do
        scheduler.shutdown
    end

    def queued_job(mode)
        owner.begin_job!(
            :step => :first,
            :state => :RUNNING,
            :args => { :mode => mode },
            :external_user => 'alice'
        )
        job = workflow.build_job(owner)
        scheduler.schedule(job)
        scheduler.send(:take_job)
    end

    def execute(job)
        scheduler.instance_variable_get(:@step_exec).call(job)
    end

    it 'persists a multi-step continuation before completing the owner' do
        job = queued_job(:success)

        execute(job)

        expect(owner.state).to eq(:DONE)
        expect(owner.active_job).to be_nil
        expect(workflow.calls).to eq([
                                         [:first, :success, 'provider-dependency'],
                                         [:cleanup, :success],
                                         [:second, :success]
                                     ])
        expect(scheduler.job_for(owner.id, job.operation_id)).to be_nil
    end

    it 'inherits the invoking step failure state for a shared continuation' do
        execute(queued_job(:second_failure))

        expect(owner.state).to eq(:RUNNING_FAILURE)
        expect(owner.error[:message]).to eq('secondary failure')
        expect(workflow.calls).to eq([
                                         [:first, :second_failure,
                                          'provider-dependency'],
                                         [:cleanup, :second_failure],
                                         [:second, :second_failure]
                                     ])
    end

    it 'normalizes invalid step results into the declared failure state' do
        execute(queued_job(:invalid))

        expect(owner.state).to eq(:RUNNING_FAILURE)
        expect(owner.error[:message]).to include('Invalid job step result :invalid_result')
        expect(workflow.calls).to eq([
                                         [:first, :invalid,
                                          'provider-dependency'], [:cleanup, :invalid]
                                     ])
    end

    it 'merges finalizer failure details without losing the primary failure' do
        allow(workflow).to receive(:first).and_wrap_original do |original, resource, **args|
            original.call(resource, **args)
            ODS::Job.fail('primary failure')
        end
        execute(queued_job(:primary_ensure_failure))

        expect(owner.state).to eq(:RUNNING_FAILURE)
        expect(owner.error[:message]).to include(
            'primary failure; ensure callback cleanup_first failed: cleanup failure'
        )
    end

    it 'honors cancellation already persisted before step execution' do
        job = queued_job(:success)
        owner.request_job_cancellation!(:actor => 'alice')
        job.request_cancel!(owner.active_job.cancellation)

        execute(job)

        expect(owner.state).to eq(:RUNNING_FAILURE)
        expect(owner.error[:message]).to eq('cancelled first')
        expect(workflow.calls).to eq([[:cleanup, :success], [:cancel]])
    end

    it 'honors cancellation requested by an step before runtime resolution' do
        execute(queued_job(:self_cancel))

        expect(owner.state).to eq(:RUNNING_FAILURE)
        expect(owner.error[:message]).to eq('cancelled first')
        expect(workflow.calls).to eq([
                                         [:first, :self_cancel, 'provider-dependency'],
                                         [:cleanup, :self_cancel],
                                         [:cancel]
                                     ])
    end

    it 'discards stale runtime work without changing its current owner' do
        job = queued_job(:success)
        owner.active_job = ODS::JobContext.from_h(
            owner.active_job.to_h.merge(:id => 'replacement-operation')
        )

        execute(job)

        expect(owner.state).to eq(:RUNNING)
        expect(owner.active_job.id).to eq('replacement-operation')
        expect(workflow.calls).to be_empty
        expect(scheduler.job_for(owner.id, job.operation_id)).to be_nil
    end

    it 'retries only durable failure persistence without executing the step twice' do
        job = queued_job(:retry_failure)
        pool_calls = 0
        allow(pool).to receive(:get).and_wrap_original do |original, *args, **kwargs, &block|
            pool_calls += 1
            if pool_calls == 3
                OpenNebula::Error.new('persistence unavailable')
            else
                original.call(*args, **kwargs, &block)
            end
        end

        execute(job)

        expect(job.status).to eq(:pending)
        expect(owner.state).to eq(:RUNNING)
        expect(workflow.calls.count {|call| call.first == :first }).to eq(1)

        allow(pool).to receive(:get).and_call_original
        job.retry_at = nil
        expect(scheduler.send(:take_job)).to equal(job)
        execute(job)

        expect(owner.state).to eq(:RUNNING_FAILURE)
        expect(owner.error[:message]).to eq('primary failure')
        expect(workflow.calls.count {|call| call.first == :first }).to eq(1)
    end
end
