require_relative 'shared/spec_helper'

RSpec.describe ODS::CancelFlag do
    it 'is idempotent and visible across concurrently waiting threads' do
        flag = described_class.new
        ready = OdsSpecSupport::Countdown.new(8)
        release = OdsSpecSupport::Gate.new
        observed = Queue.new

        threads = 8.times.map do
            Thread.new do
                ready.decrement
                release.wait
                observed << flag.cancelled?
            end
        end

        ready.wait
        expect(flag.cancel!).to be(true)
        expect(flag.cancel!).to be(true)
        release.open
        threads.each(&:join)

        expect(8.times.map { observed.pop }).to all(be(true))
        expect(flag.cancelled?).to be(true)
    end
end

RSpec.describe ODS::ThreadManager do
    subject(:manager) { OdsSpecSupport.reset_thread_manager }

    it 'configures once without replacing its original name prefix' do
        isolated = described_class.send(:allocate)
        isolated.instance_variable_set(:@traps_declared, true)

        expect(isolated.configure('first')).to equal(isolated)
        isolated.configure('second')

        expect(isolated.instance_variable_get(:@name_prefix)).to eq('first')
        expect(isolated.threads).to eq([])
        expect(isolated).not_to be_any_alive
    end

    it 'rejects a non-positive shutdown timeout' do
        isolated = described_class.send(:allocate)
        isolated.instance_variable_set(:@traps_declared, true)

        expect { isolated.configure('invalid', :shutdown_timeout => 0) }
            .to raise_error(ArgumentError, /positive/)
    end

    it 'tracks named work until completion and returns immutable snapshots' do
        started = OdsSpecSupport::Gate.new
        release = OdsSpecSupport::Gate.new
        thread = manager.start(:work) do
            started.open
            release.wait
        end

        started.wait
        snapshot = manager.threads
        snapshot.clear

        expect(manager.size).to eq(1)
        expect(manager).to be_any_alive
        expect(thread.name).to eq('ods-spec:work') if thread.respond_to?(:name)
        release.open
        thread.join
        expect(manager.size).to eq(0)
    end

    it 'logs StandardError exceptions and always unregisters the worker' do
        thread = manager.start(:boom) { raise 'worker failed' }
        thread.join

        expect(Log).to have_received(:warn).with('THR', /worker failed/)
        expect(manager.size).to eq(0)
    end

    it 'runs every stop hook once and rejects later work' do
        events = Queue.new
        manager.on_stop { events << :first }
        manager.on_stop { events << :second }

        expect(manager.stop!).to be(true)
        expect(manager.stop!).to be(true)

        expect(2.times.map { events.pop }).to contain_exactly(:first, :second)
        expect(manager).to be_stop
        expect { manager.start { nil } }.to raise_error(described_class::StoppedError)
    end

    it 'uses one deadline for uncooperative hooks and managed threads' do
        hook_started = OdsSpecSupport::Gate.new
        hook_release = OdsSpecSupport::Gate.new
        hook_done    = OdsSpecSupport::Gate.new
        worker_started = OdsSpecSupport::Gate.new
        worker_release = OdsSpecSupport::Gate.new
        second_hook = Queue.new

        worker = manager.start(:blocked) do
            worker_started.open
            worker_release.wait
        end
        manager.on_stop do
            hook_started.open
            hook_release.wait
            hook_done.open
        end
        manager.on_stop { second_hook << :called }
        worker_started.wait

        deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 0.05
        started  = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        expect(manager.stop!(:deadline => deadline)).to be(false)
        elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started

        expect(elapsed).to be < 0.5
        expect(hook_started.wait(:timeout => 0.2)).to be(true)
        expect(second_hook.pop).to eq(:called)
        expect(Log).to have_received(:warn).with('THR', /Shutdown deadline reached/)

        hook_release.open
        worker_release.open
        hook_done.wait
        worker.join
    end

    it 'executes list work concurrently and reports every successful item' do
        items = (1..6).to_a
        ready = OdsSpecSupport::Countdown.new(items.size)
        release = OdsSpecSupport::Gate.new
        successes = Queue.new

        result = nil
        caller = Thread.new do
            result = manager.run_list_block(
                items,
                :on_success => proc {|item| successes << item }
            ) do |item, flag|
                ready.decrement
                release.wait
                expect(flag).not_to be_cancelled
                item * 2
            end
        end

        ready.wait
        expect(manager.size).to eq(items.size)
        release.open
        caller.join

        expect(result).to be(true)
        expect(items.size.times.map { successes.pop }).to contain_exactly(*items)
    end

    it 'uses the first failure, signals peers, and runs rollback for every item' do
        items = [:good, :bad, :later]
        ready = OdsSpecSupport::Countdown.new(items.size)
        release = OdsSpecSupport::Gate.new
        failures = Queue.new

        result = nil
        caller = Thread.new do
            result = manager.run_list_block(
                items,
                :on_failure => proc {|item, error| failures << [item, error.message] }
            ) do |item, _flag|
                ready.decrement
                release.wait
                item == :bad ? OpenNebula::Error.new('bad item') : true
            end
        end

        ready.wait
        release.open
        caller.join

        expect(OpenNebula.is_error?(result)).to be(true)
        expect(result.message).to eq('bad item')
        expect(items.size.times.map { failures.pop }.map(&:first)).to contain_exactly(*items)
    end

    it 'converts task exceptions and tolerates rollback exceptions' do
        result = manager.run_list_block(
            [1],
            :on_failure => proc { raise 'rollback failed' }
        ) { raise 'task failed' }

        expect(result.message).to include('task failed')
        expect(Log).to have_received(:error).with('THR', 'rollback failed')
    end
end
