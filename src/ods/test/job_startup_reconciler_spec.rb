require_relative 'shared/spec_helper'

RSpec.describe ODS::JobWorkflow::StartupReconciler do
    let(:workflow_class) do
        klass = Class.new(ODS::JobWorkflow) do
            workflow_id :reconciler_spec
            failure_states(:RUNNING => :RUNNING_FAILURE)
            stable_states(:PENDING, :DONE)

            step(
                :perform,
                :success => ODS::Job.complete(:DONE),
                :failure => :RUNNING_FAILURE
            )

            def perform(_owner)
                ODS::Job.success
            end
        end
        klass.define_singleton_method(:name) { 'ReconcilerSpecWorkflow' }
        klass
    end
    let(:scheduler) { instance_double(ODS::JobScheduler, :wake => 'operation-id') }

    def owner(id:, state:, active_job: nil)
        item = OdsSpecSupport::MemoryOwner.new(:id => id)
        item.state = :RUNNING if [:RUNNING, :RUNNING_FAILURE, :DONE].include?(state)
        item.state = :RUNNING_FAILURE if state == :RUNNING_FAILURE
        item.state = :DONE if state == :DONE
        item.active_job = active_job if active_job
        item
    end

    def context(step: :perform)
        ODS::JobContext.new(
            :id => SecureRandom.uuid, :attempt => 1, :step => step,
            :args => {}, :external_user => 'alice', :created_at => 1
        )
    end

    it 'discovers every executable owner exactly once' do
        owners = 5.times.map {|id| owner(:id => id, :state => :RUNNING, :active_job => context) }
        pool = OdsSpecSupport::MemoryPool.new(owners)
        workflow = workflow_class.new.configure(pool, scheduler)

        described_class.new(workflow).run

        expect(scheduler).to have_received(:wake).exactly(owners.size).times
        expect(Log).to have_received(:info).with('JOB', /reconciliation/)
    end

    it 'skips stable and failed resources even when stale contexts remain' do
        stable = owner(:id => 1, :state => :DONE, :active_job => context)
        failed = owner(:id => 2, :state => :RUNNING_FAILURE, :active_job => context)
        pool = OdsSpecSupport::MemoryPool.new([stable, failed])
        workflow = workflow_class.new.configure(pool, scheduler)

        described_class.new(workflow).run

        expect(scheduler).not_to have_received(:wake)
    end

    it 'queues durable waits without executing their original step' do
        waiting_class = Class.new(ODS::JobWorkflow) do
            workflow_id :reconciler_spec
            failure_states(:RUNNING => :RUNNING_FAILURE)
            stable_states(:DONE)

            event :changed
            step :observe,
                 :success => ODS::Job.next(:finish),
                 :failure => :RUNNING_FAILURE
            step :finish,
                 :state => :RUNNING,
                 :success => ODS::Job.complete(:DONE),
                 :failure => :RUNNING_FAILURE

            def observe(_resource)
                raise 'durable wait step must not run during catch-up'
            end

            def finish(_resource)
                ODS::Job.success
            end

            def changed(_resource)
                ODS::EventResult.ignore
            end

            def ready(resource)
                resource.instance_variable_get(:@ready) == true
            end
        end
        waiting_class.define_singleton_method(:name) { 'WaitingReconcilerSpecWorkflow' }

        waiting_context = context(:step => :observe).with_wait(
            ODS::Job.wait(:events => [:changed], :check => :ready)
        )
        pending = owner(:id => 1, :state => :RUNNING, :active_job => waiting_context)
        ready = owner(:id => 2, :state => :RUNNING, :active_job => waiting_context)
        ready.instance_variable_set(:@ready, true)
        pool = OdsSpecSupport::MemoryPool.new([pending, ready])
        workflow = waiting_class.new.configure(pool, scheduler)

        described_class.new(workflow).run

        expect(pending.active_job.step).to eq(:observe)
        expect(pending.active_job).to be_waiting
        expect(ready.active_job.step).to eq(:observe)
        expect(ready.active_job).to be_waiting
        expect(scheduler).to have_received(:wake).twice
    end

    it 'moves an active state with no context to the configured failure state' do
        orphan = owner(:id => 1, :state => :RUNNING)
        pool = OdsSpecSupport::MemoryPool.new([orphan])
        workflow = workflow_class.new.configure(pool, scheduler)

        described_class.new(workflow).run

        expect(orphan.state).to eq(:RUNNING_FAILURE)
        expect(orphan.error[:message]).to eq('Lifecycle job context was not recovered')
        expect(Log).to have_received(:error).with('JOB', /has no active job/, 1)
    end

    it 'queues malformed active contexts for authoritative operation reconciliation' do
        malformed = owner(:id => 1, :state => :RUNNING, :active_job => context(:step => :unknown))
        pool = OdsSpecSupport::MemoryPool.new([malformed])
        workflow = workflow_class.new.configure(pool, scheduler)

        described_class.new(workflow).run

        expect(scheduler).to have_received(:wake).with(
            :workflow => :reconciler_spec, :owner_id => 1,
            :operation_id => malformed.active_job.id
        )
        expect(malformed.state).to eq(:RUNNING)
        expect(malformed.active_job).not_to be_nil
    end

    it 'stops cleanly and logs when the pool snapshot cannot be loaded' do
        pool = OdsSpecSupport::MemoryPool.new([])
        allow(pool).to receive(:info).and_return(OpenNebula::Error.new('pool unavailable'))
        workflow = workflow_class.new.configure(pool, scheduler)

        expect(described_class.new(workflow).run).to be_a(OpenNebula::Error)
        expect(scheduler).not_to have_received(:wake)
        expect(Log).to have_received(:error).with('JOB', /pool unavailable/)
    end

    it 'continues reconciling after one resource raises' do
        broken = owner(:id => 1, :state => :RUNNING, :active_job => context)
        valid = owner(:id => 2, :state => :RUNNING, :active_job => context)
        pool = OdsSpecSupport::MemoryPool.new([broken, valid])
        configured_workflow = workflow_class.new.configure(pool, scheduler)
        allow(scheduler).to receive(:wake) do |workflow:, owner_id:, operation_id:|
            raise "unexpected workflow #{workflow}" unless workflow == :reconciler_spec
            raise 'broken resource' if owner_id == 1

            operation_id
        end

        described_class.new(configured_workflow).run

        expect(scheduler).to have_received(:wake).twice
        expect(Log).to have_received(:error).with('JOB', /broken resource/, 1)
    end
end
