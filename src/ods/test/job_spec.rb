require_relative 'shared/spec_helper'

RSpec.describe ODS::Job do
    let(:attributes) do
        {
            :id => 'runtime-1',
            :workflow => :lifecycle,
            :owner_id => 7,
            :operation_id => 'operation-1',
            :external_user => 'alice',
            :state => :RUNNING,
            :attempt => 2,
            :step => :apply,
            :args => { :value => 1 }
        }
    end

    subject(:job) { described_class.new(**attributes) }

    describe 'request and outcome factories' do
        it 'preserves symbol requests and protects their arguments' do
            args = { :value => 1 }
            request = described_class.request(
                :apply, :args => args, :replace => true
            )
            args[:value] = 2

            expect(request.step).to eq(:apply)
            expect(request.args).to eq(:value => 1)
            expect(request).to be_replace
            expect(request.args).to be_frozen
        end

        it 'preserves symbol recovery, success, next, complete and failure outcomes' do
            recovery = described_class.recover(:state => :RUNNING, :args => { :retry => true })
            success = described_class.success(:created, :args => { :id => 1 })
            continuation = described_class.next(
                :finish, :state => :RUNNING, :args => { :id => 1 }, :failure => :FAILURE
            )
            complete = described_class.complete(:DONE, :owner_deleted => true)
            failure = described_class.fail(StandardError.new('bad'), :name => :validation)
            wait = described_class.wait(:events => [:changed], :check => :ready)
            children = described_class.children(
                [{ :workflow => :child, :owner_id => 2, :step => :run }],
                :wait => :children_ready,
                :args => { :child_id => 2 }
            )

            expect(recovery.state).to eq(:RUNNING)
            expect(success.name).to eq(:created)
            expect(continuation.step).to eq(:finish)
            expect(continuation.failure_state).to eq(:FAILURE)
            expect(complete).to be_owner_deleted
            expect(failure.message).to eq('bad')
            expect(failure.name).to eq(:validation)
            expect(wait).to have_attributes(:events => [:changed], :check => :ready)
            expect(wait.to_h).to eq(:events => [:changed], :check => :ready)
            expect(children.children.first).to have_attributes(
                :workflow => :child, :owner_id => 2, :step => :run
            )
            expect(children.wait).to be_a(ODS::Job::ChildrenWait)
            expect(children.args).to eq(:child_id => 2)
            expect(children.wait.to_h).to eq(
                :type => :children, :check => :children_ready,
                :forward_args => true
            )
        end

        it 'builds command and thread outcomes with explicit success results' do
            command = instance_double(ODS::Command)
            run = described_class.run(command, :result => :created)
            thread = described_class.thread(:load, :commit => :save, :args => { :x => 1 })
            pool = described_class.thread_pool([1, 2], :task => :load, :result => :done)

            expect(run.command).to equal(command)
            expect(run.result.name).to eq(:created)
            expect(thread).to have_attributes(:task => :load, :commit => :save,
                                              :args => { :x => 1 })
            expect(pool.items).to eq([1, 2])
            expect(pool.result.name).to eq(:done)
        end

        {
            'empty request step' => proc { described_class.request(nil) },
            'invalid request args' => proc {
                described_class.request(:x, :args => [])
            },
            'invalid recovery args' => proc {
                described_class.recover(:state => :RUNNING, :args => [])
            },
            'invalid run result' => proc { described_class.run(Object.new, :result => Object.new) },
            'empty thread task' => proc { described_class.thread(nil) },
            'invalid thread args' => proc { described_class.thread(:x, :args => []) },
            'invalid pool items' => proc { described_class.thread_pool(nil, :task => :x) },
            'invalid success args' => proc { described_class.success(nil, :args => []) },
            'empty wait events' => proc { described_class.wait(:events => [], :check => :ready) },
            'empty wait check' => proc { described_class.wait(:events => [:x], :check => nil) },
            'empty children' => proc {
                described_class.children([], :wait => :ready)
            },
            'invalid child descriptor' => proc {
                described_class.children([{ :workflow => :child }], :wait => :ready)
            },
            'invalid children args' => proc {
                described_class.children(
                    [{ :workflow => :child, :owner_id => 2, :step => :run }],
                    :wait => :ready, :args => []
                )
            },
            'empty next step' => proc { described_class.next(nil) },
            'invalid next args' => proc { described_class.next(:x, :args => []) },
            'empty completion state' => proc { described_class.complete(nil) }
        }.each do |label, constructor|
            it "rejects #{label}" do
                expect(&constructor).to raise_error(StandardError)
            end
        end

        it 'rejects strings for lifecycle identifiers and callbacks' do
            expect { described_class.request('apply') }
                .to raise_error(ArgumentError, /Symbol/)
            expect { described_class.recover(:state => 'RUNNING') }
                .to raise_error(ArgumentError, /Symbol/)
            expect { described_class.success('created') }.to raise_error(ArgumentError, /Symbol/)
            expect { described_class.next('finish') }.to raise_error(ArgumentError, /Symbol/)
            expect { described_class.complete('DONE') }.to raise_error(ArgumentError, /Symbol/)
            expect { described_class.fail('bad', :name => 'validation') }
                .to raise_error(ArgumentError, /Symbol/)
            expect { described_class.wait(:events => ['changed'], :check => :ready) }
                .to raise_error(ArgumentError, /Symbols/)
            expect { described_class.wait(:events => [:changed], :check => 'ready') }
                .to raise_error(ArgumentError, /Symbol/)
            expect { described_class.run(Object.new, :result => 'created') }
                .to raise_error(ArgumentError, /success outcome/)
            expect { described_class.thread('load') }.to raise_error(ArgumentError, /Symbol/)
        end
    end

    describe 'runtime identity and continuation' do
        it 'normalizes identity, signature and owner exclusion keys' do
            expect(job.signature).to eq([:lifecycle, '7', 'operation-1', 2, :apply])
            expect(job.owner_key).to eq([:lifecycle, '7'])
            expect(job.status).to eq(:pending)
        end

        it 'builds a continuation with a shared cancellation scope and inherited arguments' do
            job.request_cancel!(:requested_by => 'alice')
            continuation = job.next(described_class.next(:finish))

            expect(continuation.step).to eq(:finish)
            expect(continuation.args).to eq(:value => 1)
            expect(continuation.cancel_flag).to equal(job.cancel_flag)
            expect(continuation.cancellation).to eq(:requested_by => 'alice')
        end

        it 'starts managed task threads with the shared cancellation flag' do
            OdsSpecSupport.reset_thread_manager
            received = Queue.new
            thread = job.start_thread(:load) {|flag| received << flag }
            thread.join

            expect(received.pop).to equal(job.cancel_flag)
            expect(thread.name).to include('job-runtime-1:load') if thread.respond_to?(:name)
            expect(job.runtime_threads).to be_empty
        end

        it 'keeps the first cancellation details under concurrent requests' do
            ready = OdsSpecSupport::Countdown.new(10)
            release = OdsSpecSupport::Gate.new
            threads = 10.times.map do |index|
                Thread.new do
                    ready.decrement
                    release.wait
                    job.request_cancel!(:request => index)
                end
            end

            ready.wait
            release.open
            threads.each(&:join)

            expect(job).to be_cancellation_requested
            expect(job.cancellation).to be_a(Hash)
            expect(job.cancellation.keys).to eq([:request])
            expect(job.cancel_flag).to be_cancelled
        end

        it 'resets internal fail-fast cancellation but retains durable cancellation' do
            original = job.cancel_flag
            original.cancel!
            expect(job.reset_cancel_flag!).not_to equal(original)
            expect(job.cancel_flag).not_to be_cancelled

            job.request_cancel!
            retained = job.cancel_flag
            expect(job.reset_cancel_flag!).to equal(retained)
            expect(retained).to be_cancelled
        end

        it 'wakes runtime waiters on shutdown without requesting cancellation' do
            waiter = instance_double('ShutdownWaiter')
            allow(waiter).to receive(:close)
            deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 1

            job.register_shutdown_waiter(waiter)
            expect(job.request_shutdown!(deadline)).to be(true)

            expect(job).to be_shutdown_requested
            expect(job.shutdown_deadline).to eq(deadline)
            expect(job).not_to be_cancellation_requested
            expect(job.cancel_flag).to be_cancelled
            expect(waiter).to have_received(:close).once
            expect(job.reset_cancel_flag!).to equal(job.cancel_flag)
            expect(job.cancel_flag).to be_cancelled
        end

        it 'returns a safe runtime snapshot including command information' do
            command = instance_double(ODS::Command, :info => { :status => :running })
            job.command = command
            job.status = :running

            expect(job.info).to include(
                :id => 'runtime-1', :workflow => :lifecycle, :owner_id => 7,
                :operation_id => 'operation-1', :status => :running,
                :command => { :status => :running }
            )
        end
    end

    describe 'initialization validation' do
        [:workflow, :state, :step].each do |attribute|
            it "rejects an empty #{attribute}" do
                expect { described_class.new(**attributes, attribute => nil) }
                    .to raise_error(ArgumentError, /#{attribute}/i)
            end
        end

        it 'requires symbols for runtime lifecycle identity' do
            expect { described_class.new(**attributes, :workflow => 'lifecycle') }
                .to raise_error(ArgumentError, /Symbol/)
            expect { described_class.new(**attributes, :state => 'RUNNING') }
                .to raise_error(ArgumentError, /Symbol/)
            expect { described_class.new(**attributes, :step => 'apply') }
                .to raise_error(ArgumentError, /Symbol/)
        end

        it 'rejects incomplete durable identity and malformed args' do
            expect { described_class.new(**attributes, :owner_id => nil) }
                .to raise_error(ArgumentError, /owner/)
            expect { described_class.new(**attributes, :operation_id => nil) }
                .to raise_error(ArgumentError, /operation/)
            expect { described_class.new(**attributes, :external_user => '') }
                .to raise_error(ArgumentError, /external user/)
            expect { described_class.new(**attributes, :attempt => 0) }
                .to raise_error(ArgumentError, /attempt/)
            expect { described_class.new(**attributes, :args => []) }
                .to raise_error(ArgumentError, /args/)
            expect { described_class.new(**attributes, :cancel_flag => Object.new) }
                .to raise_error(ArgumentError, /cancel flag/)
        end
    end
end
