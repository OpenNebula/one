require_relative 'shared/spec_helper'

RSpec.describe ODS::JobWorkflow, 'parent-child composition' do
    def wait_until(timeout: 3, &block)
        Timeout.timeout(timeout) do
            sleep(0.01) until block.call
        end
    end

    def child_workflow_class
        klass = Class.new(ODS::JobWorkflow) do
            workflow_id :child_spec
            failure_states(:RUNNING => :RUNNING_FAILURE)
            stable_states(:DONE)

            event :released
            event :failed

            step :perform,
                 :state => :RUNNING,
                 :success => ODS::Job.complete(:DONE),
                 :failure => :RUNNING_FAILURE,
                 :on_cancel => :cancelable

            attr_reader :calls

            def initialize(controls)
                @controls = controls
                @calls    = Hash.new(0)
                super()
            end

            def perform(resource, token: resource.id, **_opts)
                @calls[token] += 1
                return ODS::Job.fail("child #{token} failed") if @controls[token] == :fail
                return ODS::Job.success if @controls[token] == :ready

                ODS::Job.wait(:events => [:released, :failed], :check => :ready)
            end

            def released(resource, ready: true, **_opts)
                @controls[resource.id] = :ready if ready
                ODS::EventResult.handled(:released)
            end

            def failed(_resource, message:)
                ODS::EventResult.fail(message)
            end

            def ready(resource, token: resource.id, **_opts)
                @controls[token] == :ready
            end
        end
        klass.define_singleton_method(:name) { 'ChildCompositionSpecWorkflow' }
        klass
    end

    def parent_workflow_class
        klass = Class.new(ODS::JobWorkflow) do
            workflow_id :parent_spec
            failure_states(:RUNNING => :RUNNING_FAILURE)
            stable_states(:DONE)

            step :perform,
                 :state => :RUNNING,
                 :success => ODS::Job.next(:finish),
                 :failure => :RUNNING_FAILURE,
                 :on_cancel => :cancelable

            step :finish,
                 :state => :RUNNING,
                 :success => ODS::Job.complete(:DONE),
                 :failure => :RUNNING_FAILURE

            attr_reader :calls, :predicate_locked, :predicate_args, :finish_args
            attr_writer :forwarded_args

            def initialize(descriptors)
                @descriptors = descriptors
                @calls       = 0
                super()
            end

            def perform(_resource, **_opts)
                @calls += 1
                ODS::Job.children(
                    @descriptors,
                    :wait => :children_ready,
                    :args => @forwarded_args
                )
            end

            def children_ready(_resource, children:, **opts)
                @predicate_locked = pool.active.positive?
                @predicate_args   = opts
                children.all? do |child|
                    child.nil? || (child.state == :DONE && child.active_job.nil?)
                end
            end

            def finish(_resource, **opts)
                @finish_args = opts
                ODS::Job.success
            end
        end
        klass.define_singleton_method(:name) { 'ParentCompositionSpecWorkflow' }
        klass
    end

    let(:controls) { {} }
    let(:parent_owner) { OdsSpecSupport::MemoryOwner.new(:id => 1) }
    let(:child_owners) do
        [
            OdsSpecSupport::MemoryOwner.new(:id => 10),
            OdsSpecSupport::MemoryOwner.new(:id => 11)
        ]
    end
    let(:parent_pool) { OdsSpecSupport::MemoryPool.new([parent_owner]) }
    let(:child_pool) { OdsSpecSupport::MemoryPool.new(child_owners) }
    let(:scheduler) { ODS::JobScheduler.new(:concurrency => 4) }
    let(:descriptors) do
        child_owners.map do |owner|
            {
                :workflow => :child_spec,
                :owner_id => owner.id,
                :step => :perform,
                :args => { :token => owner.id }
            }
        end
    end
    let(:parent_workflow) { parent_workflow_class.new(descriptors) }
    let(:child_workflow) { child_workflow_class.new(controls) }

    before do
        OdsSpecSupport.reset_thread_manager
        parent_workflow.configure(parent_pool, scheduler)
        child_workflow.configure(child_pool, scheduler)
        scheduler.register(parent_workflow)
        scheduler.register(child_workflow)
    end

    after do
        scheduler.shutdown
        ODS::ThreadManager.instance.stop!
    end

    def start_parent
        parent_workflow.request(parent_owner.id, 'alice') do
            ODS::Job.request(:perform)
        end
    end

    def parent_reference(operation_id: 'parent-operation')
        ODS::Job::Parent.new(
            :workflow => :parent_spec, :owner_id => parent_owner.id,
            :operation_id => operation_id, :parent_step => :perform
        )
    end

    def active_child_reference(parent: parent_reference, token: 10)
        owner = child_owners.first
        owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => { :token => token },
            :external_user => 'alice', :parent => parent
        )

        ODS::Job::Child.new(
            :workflow => :child_spec, :owner_id => owner.id,
            :parent_step => :perform, :step => :perform,
            :args => { :token => token }, :status => :active,
            :operation_id => owner.active_job.id
        )
    end

    def persist_parent_intent
        parent_owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )
        job     = parent_workflow.build_job(parent_owner)
        outcome = parent_workflow.perform(parent_owner)
        result  = parent_owner.compose_job!(
            job, outcome.descriptors(job.step), outcome.wait
        )
        raise result.value.message unless result.ok?

        parent_reference(:operation_id => job.operation_id)
    end

    it 'leaves standalone workflows independent of composition metadata' do
        controls[10] = :ready
        result = child_workflow.request(child_owners.first.id, 'alice') do
            ODS::Job.request(:perform, :args => { :token => 10 })
        end

        expect(result).to be_a(String)
        expect(child_owners.first.active_job.parent).to be_nil
        expect(child_owners.first.active_job.children).to be_empty

        scheduler.start
        wait_until { child_owners.first.state == :DONE }

        expect(child_workflow.calls[10]).to eq(1)
        expect(child_owners.first.active_job).to be_nil
    end

    it 'validates and freezes the public composition outcome' do
        args = { :nested => [{ :value => 'one' }] }
        outcome = ODS::Job.children(
            [{
                :workflow => :child_spec, :owner_id => 10,
                :step => :perform, :args => args
            }],
            :wait => :children_ready
        )
        args[:nested][0][:value] = 'changed'

        expect(outcome.children.first).to have_attributes(
            :workflow => :child_spec, :owner_id => 10, :step => :perform,
            :args => { :nested => [{ :value => 'one' }] }
        )
        expect(outcome.children.first.args).to be_frozen
        expect(outcome.wait.to_h).to eq(
            :type => :children, :check => :children_ready
        )
        expect do
            ODS::Job.children(outcome.children, :wait => :children_ready, :args => [])
        end.to raise_error(ArgumentError, /Children args must be a Hash/)
    end

    it 'persists parent arguments before waiting and forwards them after resumption' do
        forwarded = { :operation => :add, :group_id => 10 }
        parent_workflow.forwarded_args = forwarded

        start_parent
        scheduler.start
        wait_until { child_owners.all? {|owner| owner.active_job&.waiting? } }

        expect(parent_owner.active_job.args).to eq(forwarded)

        child_owners.each do |owner|
            expect(child_workflow.dispatch_event(owner.id, :released)).to eq(:released)
        end
        wait_until { parent_owner.state == :DONE }

        expect(parent_workflow.predicate_args).to eq(forwarded)
        expect(parent_workflow.finish_args).to eq(forwarded)
    end

    it 'persists both sides of parallel durable child relations' do
        start_parent
        scheduler.start
        wait_until do
            parent_owner.active_job&.wait.is_a?(ODS::Job::ChildrenWait) &&
                child_owners.all? {|owner| owner.active_job&.waiting? }
        end

        children = parent_owner.active_job.children
        expect(children.map(&:owner_id)).to eq([10, 11])
        expect(children.map(&:operation_id)).to all(be_a(String))
        expect(children.map(&:status)).to all(eq(:active))
        expect(child_owners.map {|owner| owner.active_job.parent }).to all(
            have_attributes(
                :workflow => :parent_spec, :owner_id => 1,
                :operation_id => parent_owner.active_job.id,
                :parent_step => :perform
            )
        )
    end

    it 'reuses an identical child request without duplicate execution' do
        parent_owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )
        job     = parent_workflow.build_job(parent_owner)
        outcome = parent_workflow.perform(parent_owner)

        expect(parent_workflow.start_children(job, outcome)).to be_waiting
        operation_id = child_owners.first.active_job.id
        expect(parent_workflow.start_children(job, outcome)).to be_waiting

        expect(child_owners.first.active_job.id).to eq(operation_id)
        expect(child_owners.first.active_job.attempt).to eq(1)
    end

    it 'reconciles a child after its operation ID initially fails to persist in the parent' do
        parent_owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )
        job     = parent_workflow.build_job(parent_owner)
        outcome = parent_workflow.perform(parent_owner)
        failure = OpenNebula::Error.new(
            'temporary parent update failure', OpenNebula::Error::EACTION
        )
        failed = false

        allow(parent_owner).to receive(:update_job_children!).and_wrap_original do |
            original, current_job, children
        |
            if !failed && children.any?(&:requested?)
                failed = true
                ODS::ExecResult.error(failure)
            else
                original.call(current_job, children)
            end
        end

        expect(parent_workflow.start_children(job, outcome)).to be_waiting
        child_operation = child_owners.first.active_job.id

        expect(parent_owner.active_job.children.first.operation_id).to be_nil
        expect(child_owners.first.active_job).not_to be_waiting
        expect(child_owners.first.active_job.cancellation).to be_nil

        scheduler.start
        wait_until do
            # rubocop:disable-next Style/SafeNavigationChainLength
            parent_owner.active_job&.children&.first&.operation_id == child_operation &&
                child_owners.first.active_job&.waiting?
        end

        expect(parent_owner.active_job.children.first.status).to eq(:active)
        expect(child_owners.first.active_job.id).to eq(child_operation)
        expect(child_workflow.calls[10]).to eq(1)
    end

    it 'retries a transient parent reload without creating a child prematurely' do
        parent_owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )
        job         = parent_workflow.build_job(parent_owner)
        outcome     = parent_workflow.perform(parent_owner)
        unavailable = OpenNebula::Error.new('parent pool unavailable')
        reads       = 0

        allow(parent_pool).to receive(:get).and_wrap_original do |original, *args, **opts, &block|
            reads += 1
            if reads == 2
                unavailable
            else
                original.call(*args, **opts, &block)
            end
        end

        result = parent_workflow.start_children(job, outcome)

        expect(result).to be_retry
        expect(result.value).to equal(unavailable)
        expect(parent_owner.active_job).to be_waiting
        expect(parent_owner.active_job.children.first.status).to eq(:intent)
        expect(child_owners.first.active_job).to be_nil

        expect(parent_workflow.start_children(job, outcome)).to be_waiting
        expect(child_owners.first.active_job).not_to be_nil
    end

    it 'keeps a parent non-terminal until durable child compensation completes' do
        parent = persist_parent_intent
        child  = active_child_reference(:parent => parent)
        job    = parent_workflow.build_job(parent_owner)

        result = parent_workflow.fail_children(
            job, :RUNNING_FAILURE, 'parent action failed'
        )

        expect(result).to be_waiting
        expect(parent_owner.state).to eq(:RUNNING)
        expect(parent_owner.active_job).to be_failing
        expect(parent_owner.active_job.pending_failure).to eq(
            :state => :RUNNING_FAILURE, :message => 'parent action failed'
        )
        expect(parent_owner.active_job.children.first).to have_attributes(
            :operation_id => child.operation_id, :status => :cancel_requested
        )
        expect(child_owners.first.active_job).to be_cancelling

        restarted_scheduler = ODS::JobScheduler.new(:concurrency => 2)
        restarted_parent    = parent_workflow_class.new(descriptors)
        restarted_child     = child_workflow_class.new(controls)
        restarted_parent.configure(parent_pool, restarted_scheduler)
        restarted_child.configure(child_pool, restarted_scheduler)
        restarted_scheduler.register(restarted_parent)
        restarted_scheduler.register(restarted_child)
        restarted_scheduler.start
        restarted_parent.catch_up
        restarted_child.catch_up

        begin
            wait_until do
                parent_owner.state == :RUNNING_FAILURE &&
                    child_owners.first.active_job&.cancelled?
            end
        ensure
            restarted_scheduler.shutdown
        end

        expect(parent_owner.active_job).not_to be_failing
        expect(parent_owner.error[:message]).to eq('parent action failed')
        expect(child_workflow.calls[10]).to eq(0)
        expect(restarted_child.calls[10]).to eq(0)
    end

    it 'persists and retries a failed child compensation request' do
        stub_const('ODS::JobScheduler::ReconciliationQueue::RETRY_DELAY', 0.01)
        parent = persist_parent_intent
        active_child_reference(:parent => parent)
        job = parent_workflow.build_job(parent_owner)
        unavailable = OpenNebula::Error.new(
            'temporary cancellation failure', OpenNebula::Error::EACTION
        )
        attempts = 0

        allow(child_workflow).to receive(:cancel_child).and_wrap_original do |
            original, *args, **opts
        |
            attempts += 1
            if attempts == 1
                ODS::ExecResult.retry(unavailable)
            else
                original.call(*args, **opts)
            end
        end

        expect(
            parent_workflow.fail_children(job, :RUNNING_FAILURE, 'parent action failed')
        ).to be_retry
        expect(parent_owner.state).to eq(:RUNNING)
        expect(parent_owner.active_job.children.first).to have_attributes(
            :status => :cancel_requested,
            :error => 'temporary cancellation failure'
        )

        scheduler.start
        wait_until do
            parent_owner.state == :RUNNING_FAILURE &&
                child_owners.first.active_job&.cancelled?
        end

        expect(attempts).to be >= 2
        expect(child_workflow.calls[10]).to eq(0)
    end

    it 'refuses to replace a parent action that still owns child actions' do
        parent_owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )
        job     = parent_workflow.build_job(parent_owner)
        outcome = parent_workflow.perform(parent_owner)
        parent_owner.compose_job!(job, outcome.descriptors(job.step), outcome.wait)

        result = parent_workflow.request(parent_owner.id, 'alice') do
            ODS::Job.request(:perform, :replace => true)
        end

        expect(result).to be_a(OpenNebula::Error)
        expect(result.message).to include('cannot start a new action while its current action')
        expect(parent_owner.active_job.id).to eq(job.operation_id)
    end

    it 'releases failed composed children before discarding their failed parent action' do
        parent_owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )
        job     = parent_workflow.build_job(parent_owner)
        outcome = parent_workflow.perform(parent_owner)
        parent_owner.compose_job!(job, outcome.descriptors(job.step), outcome.wait)

        parent = ODS::Job::Parent.new(
            :workflow => :parent_spec, :owner_id => parent_owner.id,
            :operation_id => 'previous-parent-action', :parent_step => :perform
        )
        child_owners.each do |owner|
            owner.begin_job!(
                :step => :perform, :state => :RUNNING,
                :args => { :token => owner.id }, :external_user => 'alice', :parent => parent
            )
            owner.state = :RUNNING_FAILURE
        end
        parent_owner.state = :RUNNING_FAILURE

        result = parent_workflow.discard_failed_composition(parent_owner.id, 'alice')

        expect(result).to be_ok
        expect(parent_owner.active_job).to be_nil
        expect(child_owners.map(&:active_job)).to all(be_nil)
    end

    it 'rejects incompatible arguments for the same parent child identity' do
        parent_owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )
        job = parent_workflow.build_job(parent_owner)
        first = ODS::Job.children(
            [{
                :workflow => :child_spec, :owner_id => 10,
                :step => :perform, :args => { :token => 10 }
            }],
            :wait => :children_ready
        )
        incompatible = ODS::Job.children(
            [{
                :workflow => :child_spec, :owner_id => 10,
                :step => :perform, :args => { :token => 99 }
            }],
            :wait => :children_ready
        )

        expect(parent_workflow.start_children(job, first)).to be_waiting
        operation_id = child_owners.first.active_job.id
        result = parent_workflow.start_children(job, incompatible)

        expect(result).to be_error
        expect(result.value.message).to include('conflicts with the request')
        expect(child_owners.first.active_job.id).to eq(operation_id)
    end

    it 'rejects different parent arguments for an existing composition' do
        parent_owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )
        job = parent_workflow.build_job(parent_owner)
        first = ODS::Job.children(
            [descriptors.first], :wait => :children_ready,
            :args => { :group_id => 10 }
        )
        incompatible = ODS::Job.children(
            [descriptors.first], :wait => :children_ready,
            :args => { :group_id => 11 }
        )

        expect(parent_workflow.start_children(job, first)).to be_waiting
        result = parent_workflow.start_children(job, incompatible)

        expect(result).to be_error
        expect(result.value.message).to include('conflicts with its persisted arguments')
        expect(parent_owner.active_job.args).to eq(:group_id => 10)
    end

    it 'rejects foreign and incompatible ownership explicitly' do
        child_owners.first.begin_job!(
            :step => :perform, :state => :RUNNING, :args => { :token => 10 },
            :external_user => 'bob'
        )
        parent_owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )

        result = parent_workflow.start_children(
            parent_workflow.build_job(parent_owner),
            parent_workflow.perform(parent_owner)
        )

        expect(result).to be_error
        expect(result.value.message).to include('perform is owned by another active action')
    end

    it 'rejects an unconfirmed child with incompatible durable arguments' do
        parent_owner.begin_job!(
            :step => :perform, :state => :RUNNING, :args => {},
            :external_user => 'alice'
        )
        job     = parent_workflow.build_job(parent_owner)
        outcome = parent_workflow.perform(parent_owner)
        parent_owner.compose_job!(job, outcome.descriptors(job.step), outcome.wait)
        parent = ODS::Job::Parent.new(
            :workflow => :parent_spec, :owner_id => parent_owner.id,
            :operation_id => job.operation_id, :parent_step => job.step
        )
        child_owners.first.begin_job!(
            :step => :perform, :state => :RUNNING,
            :args => { :token => 99 }, :external_user => 'alice',
            :parent => parent
        )

        result = parent_workflow.start_children(job, outcome)

        expect(result).to be_error
        expect(result.value.message).to include('incompatible step or arguments')
    end

    context 'with a missing child accepted by the domain predicate' do
        let(:descriptors) do
            [{
                :workflow => :child_spec, :owner_id => 99,
                :step => :perform, :args => { :token => 99 }
            }]
        end

        it 'lets the parent complete without creating an orphan operation' do
            forwarded = { :operation => :delete, :group_id => 99 }
            parent_workflow.forwarded_args = forwarded

            start_parent
            scheduler.start
            wait_until { parent_owner.state == :DONE }

            expect(parent_owner.active_job).to be_nil
            expect(child_pool.owners).not_to have_key('99')
            expect(parent_workflow.calls).to eq(1)
            expect(parent_workflow.predicate_args).to eq(forwarded)
            expect(parent_workflow.finish_args).to eq(forwarded)
        end
    end

    describe 'child observation read failures' do
        it 'returns retry for a non-missing OpenNebula error' do
            parent = parent_reference
            child  = active_child_reference(:parent => parent)
            error  = OpenNebula::Error.new(
                'temporary XML-RPC failure', OpenNebula::Error::EACTION
            )
            allow(child_pool).to receive(:get).and_return(error)

            result = child_workflow.observe_child(child, :parent => parent)

            expect(result).to be_retry
            expect(result.value).to equal(error)
            expect(child_owners.first.state).to eq(:RUNNING)
            expect(child_owners.first.active_job.id).to eq(child.operation_id)
        end

        it 'returns retry when the pool read raises' do
            parent = parent_reference
            child  = active_child_reference(:parent => parent)
            allow(child_pool).to receive(:get).and_raise('temporary parsing failure')

            result = child_workflow.observe_child(child, :parent => parent)

            expect(result).to be_retry
            expect(result.value).to be_a(OpenNebula::Error)
            expect(result.value.message).to eq('temporary parsing failure')
            expect(child_owners.first.state).to eq(:RUNNING)
            expect(child_owners.first.active_job.id).to eq(child.operation_id)
        end
    end

    describe 'relationship observation persistence' do
        let(:composition) { parent_workflow.instance_variable_get(:@composition) }
        let(:child) do
            ODS::Job::Child.new(
                :workflow => :child_spec, :owner_id => 10,
                :parent_step => :perform, :step => :perform,
                :args => { :token => 10 }, :status => :active,
                :operation_id => 'expected-child-operation'
            )
        end

        it 'rejects an unknown durable child status explicitly' do
            expect do
                child.with(:status => :unknown)
            end.to raise_error(ArgumentError, /Invalid child status :unknown/)
        end

        it 'persists a missing durable child context as a relationship failure' do
            parent_owner.begin_job!(
                :step => :perform, :state => :RUNNING, :args => {},
                :external_user => 'alice'
            )
            job = parent_workflow.build_job(parent_owner)
            outcome = ODS::Job.children(
                [descriptors.first], :wait => :children_ready
            )
            parent_owner.compose_job!(job, outcome.descriptors(job.step), outcome.wait)
            orphan = parent_owner.active_job.children.first.with(
                :status => :cancel_requested,
                :operation_id => 'missing-child-operation'
            )
            parent_owner.update_job_children!(job, [orphan])

            observation = child_workflow.observe_child(
                orphan, :parent => parent_reference
            )
            expect(observation).to have_attributes(
                :status => :failed,
                :operation_id => 'missing-child-operation'
            )
            expect(observation.error).to include('has no durable job in PENDING')

            expect(parent_workflow.resume_children(parent_owner)).to be_a(String)
            expect(parent_owner.active_job.children.first).to have_attributes(
                :status => :failed,
                :operation_id => 'missing-child-operation'
            )

            scheduler.start
            wait_until { parent_owner.state == :RUNNING_FAILURE }

            expect(parent_owner.error[:message]).to include(
                'Child child_spec 10 perform failed:'
            )
            expect(parent_owner.error[:message]).to include(
                'has no durable job in PENDING'
            )
        end

        it 'fails an incompatible relation without attaching its operation' do
            parent = persist_parent_intent
            job    = parent_workflow.build_job(parent_owner)
            expected = parent_owner.active_job.children.first.with(
                :status => :cancel_requested,
                :operation_id => 'expected-child-operation'
            )
            parent_owner.update_job_children!(job, [expected])
            foreign_parent = ODS::Job::Parent.new(
                **parent.to_h, :operation_id => 'another-parent-operation'
            )
            child_owners.first.begin_job!(
                :step => :perform, :state => :RUNNING,
                :args => { :token => 10 }, :external_user => 'alice',
                :parent => foreign_parent
            )
            foreign_operation = child_owners.first.active_job.id

            observation = child_workflow.observe_child(
                expected, :parent => parent
            )
            expect(observation).to have_attributes(
                :status => :failed,
                :operation_id => 'expected-child-operation'
            )
            expect(observation.error).to include(
                'owned by another active action'
            )

            expect(parent_workflow.resume_children(parent_owner)).to be_a(String)
            expect(parent_owner.active_job.children.first).to have_attributes(
                :status => :failed,
                :operation_id => 'expected-child-operation'
            )

            scheduler.start
            wait_until { parent_owner.state == :RUNNING_FAILURE }

            expect(parent_owner.error[:message]).to include(
                'Child child_spec 10 perform failed:'
            )
            expect(parent_owner.error[:message]).to include(
                'owned by another active action'
            )
            expect(child_owners.first.active_job.id).to eq(foreign_operation)
        end
    end

    it 'resumes from child events without rerunning the requesting step' do
        start_parent
        scheduler.start
        wait_until { child_owners.all? {|owner| owner.active_job&.waiting? } }

        child_owners.each do |owner|
            expect(child_workflow.dispatch_event(owner.id, :released)).to eq(:released)
        end
        wait_until { parent_owner.state == :DONE }

        expect(parent_workflow.calls).to eq(1)
        expect(parent_workflow.predicate_locked).to be(true)
        expect(child_workflow.calls.values).to all(eq(1))
        expect(parent_owner.active_job).to be_nil
    end

    context 'when the parent is temporarily unavailable' do
        let(:child_owners) { [OdsSpecSupport::MemoryOwner.new(:id => 10)] }

        it 'retries the notification without failing or rerunning either workflow step' do
            stub_const(
                'ODS::JobScheduler::ReconciliationQueue::RETRY_DELAY', 0.01
            )
            controls[10] = nil
            start_parent
            scheduler.start
            wait_until { child_owners.first.active_job&.waiting? }

            attempts = 0
            allow(parent_pool).to receive(:get).and_wrap_original do |
                original, *args, **opts, &block
            |
                if args.first.to_s == parent_owner.id.to_s && attempts.zero?
                    attempts += 1
                    OpenNebula::Error.new('parent pool unavailable')
                else
                    original.call(*args, **opts, &block)
                end
            end

            expect(child_workflow.dispatch_event(10, :released)).to eq(:released)
            wait_until { parent_owner.state == :DONE }

            expect(attempts).to eq(1)
            expect(parent_workflow.calls).to eq(1)
            expect(child_workflow.calls[10]).to eq(1)
        end
    end

    it 'rechecks waiting siblings without rerunning their lifecycle steps' do
        start_parent
        scheduler.start
        wait_until { child_owners.all? {|owner| owner.active_job&.waiting? } }

        expect(child_workflow.dispatch_event(child_owners.first.id, :released))
            .to eq(:released)

        expect(child_owners.first.state).to eq(:DONE)
        expect(child_owners.last.active_job).to be_waiting
        expect(parent_owner.state).to eq(:RUNNING)
        expect(child_workflow.calls.values).to all(eq(1))
    end

    it 'ignores stale child notifications for another operation' do
        start_parent
        scheduler.start
        wait_until { child_owners.first.active_job&.waiting? }

        parent = child_owners.first.active_job.parent
        stale = ODS::Job.new(
            :workflow => :child_spec, :owner_id => 10,
            :operation_id => 'stale-child', :external_user => 'alice',
            :state => :RUNNING, :attempt => 1, :step => :perform,
            :args => {}, :parent => parent
        )

        expect(child_workflow.notify_parent(stale)).to eq(parent.operation_id)
        expect(parent_owner.active_job.step).to eq(:perform)
        expect(parent_workflow.calls).to eq(1)
    end

    it 'propagates child failure and recovers the same durable relationship' do
        controls[10] = :fail
        controls[11] = :ready
        start_parent
        scheduler.start
        wait_until { parent_owner.state == :RUNNING_FAILURE }

        message = parent_owner.error[:message]
        expect(message).to eq('Child child_spec 10 perform failed: child 10 failed')
        expect(message).not_to include(parent_owner.active_job.children.first.operation_id)
        operation_ids = parent_owner.active_job.children.map(&:operation_id)
        controls[10] = :ready

        result = parent_workflow.request_recovery(parent_owner.id, 'alice') do
            ODS::Job.recover(:state => :RUNNING)
        end
        expect(result).to be_a(String)
        wait_until { parent_owner.state == :DONE }

        expect(parent_workflow.calls).to eq(1)
        expect(child_workflow.calls[10]).to eq(2)
        expect(operation_ids).to all(be_a(String))
    end

    it 'propagates a child failure received while its workflow is waiting' do
        start_parent
        scheduler.start
        wait_until { child_owners.all? {|owner| owner.active_job&.waiting? } }

        result = child_workflow.dispatch_event(
            child_owners.first.id, :failed, :message => 'VM 10 failed'
        )

        expect(result).to eq('VM 10 failed')
        wait_until { parent_owner.state == :RUNNING_FAILURE }
        expect(child_owners.first.state).to eq(:RUNNING_FAILURE)
        expect(parent_owner.error[:message]).to eq(
            'Child child_spec 10 perform failed: VM 10 failed'
        )
    end

    it 'cascades cancellation and waits for child cancellation finalization' do
        start_parent
        scheduler.start
        wait_until { child_owners.all? {|owner| owner.active_job&.waiting? } }

        expect(parent_workflow.request_cancellation(parent_owner.id, 'alice'))
            .to eq(:requested)
        wait_until do
            parent_owner.active_job&.cancelled? &&
                child_owners.all? {|owner| owner.active_job&.cancelled? }
        end

        expect(parent_owner.state).to eq(:RUNNING_FAILURE)
        expect(child_owners.map(&:state)).to all(eq(:RUNNING_FAILURE))
        expect(parent_workflow.calls).to eq(1)
    end

    it 'does not leave unmanaged children when cancellation races the request' do
        start_parent
        scheduler.start
        expect(parent_workflow.request_cancellation(parent_owner.id, 'alice'))
            .to eq(:requested)

        wait_until { parent_owner.active_job&.cancelled? }
        child_owners.each do |owner|
            context = owner.active_job
            expect(context).to be_nil.or(be_cancelled)
        end
        expect(child_workflow.calls.values).to all(be <= 1)
    end

    it 'cancels instead of executing a child reconstructed under a failed parent' do
        parent = persist_parent_intent
        child  = active_child_reference(:parent => parent)
        parent_owner.state = :RUNNING_FAILURE

        expect(child_workflow.catch_up).to be(true)
        scheduler.start
        wait_until { child_owners.first.active_job&.cancelled? }

        expect(parent_owner.active_job.children.first.operation_id).to be_nil
        expect(child_owners.first.state).to eq(:RUNNING_FAILURE)
        expect(child_owners.first.active_job.id).to eq(child.operation_id)
        expect(child_workflow.calls[10]).to eq(0)
    end

    it 'marks a child whose persisted parent operation disappeared as orphaned' do
        parent = ODS::Job::Parent.new(
            :workflow => :parent_spec, :owner_id => parent_owner.id,
            :operation_id => 'missing-parent', :parent_step => :perform
        )
        child_owners.first.begin_job!(
            :step => :perform, :state => :RUNNING, :args => { :token => 10 },
            :external_user => 'alice', :parent => parent
        )

        scheduler.start
        child_workflow.catch_up
        wait_until { child_owners.first.state == :RUNNING_FAILURE }

        expect(child_owners.first.state).to eq(:RUNNING_FAILURE)
        expect(child_owners.first.active_job).to be_nil
        expect(child_owners.first.error[:message]).to include('has no current parent')
    end

    it 'marks a child whose parent resource no longer exists as orphaned' do
        parent = parent_reference
        active_child_reference(:parent => parent)
        missing = OpenNebula::Error.new(
            'parent not found', OpenNebula::Error::ENO_EXISTS
        )
        allow(parent_pool).to receive(:get).and_return(missing)

        scheduler.start
        child_workflow.catch_up
        wait_until { child_owners.first.state == :RUNNING_FAILURE }

        expect(child_owners.first.state).to eq(:RUNNING_FAILURE)
        expect(child_owners.first.active_job).to be_nil
        expect(child_owners.first.error[:message]).to include('has no current parent')
    end

    it 'marks a child with an incompatible persisted parent relationship as orphaned' do
        parent = persist_parent_intent
        active_child_reference(:parent => parent, :token => 99)

        scheduler.start
        child_workflow.catch_up
        wait_until { child_owners.first.state == :RUNNING_FAILURE }

        expect(child_owners.first.state).to eq(:RUNNING_FAILURE)
        expect(child_owners.first.active_job).to be_nil
        expect(child_owners.first.error[:message]).to include('has no current parent')
    end

    context 'when the parent read fails during startup reconciliation' do
        let(:child_owners) { [OdsSpecSupport::MemoryOwner.new(:id => 10)] }

        it 'preserves the child and reconnects the relationship on the next attempt' do
            stub_const(
                'ODS::JobScheduler::ReconciliationQueue::RETRY_DELAY', 0.01
            )
            controls[10] = nil
            parent = persist_parent_intent
            child  = active_child_reference(:parent => parent)
            original_context = child_owners.first.active_job.to_h
            attempts = 0
            unavailable = OpenNebula::Error.new(
                'parent pool unavailable', OpenNebula::Error::EACTION
            )
            allow(parent_pool).to receive(:get).and_wrap_original do |
                original, *args, **opts, &block
            |
                if attempts.zero?
                    attempts += 1
                    unavailable
                else
                    original.call(*args, **opts, &block)
                end
            end

            expect(child_workflow.catch_up).to be(true)
            expect(child_owners.first.state).to eq(:RUNNING)
            expect(child_owners.first.active_job.to_h).to eq(original_context)
            expect(child_owners.first.error).to be_nil

            scheduler.start
            wait_until do
                # rubocop:disable-next Style/SafeNavigationChainLength
                parent_owner.active_job&.children&.first&.operation_id == child.operation_id &&
                    child_owners.first.active_job&.waiting?
            end

            expect(parent_owner.active_job.children.first.status).to eq(:active)
            expect(child_workflow.dispatch_event(child.owner_id, :released)).to eq(:released)
            wait_until do
                child_owners.first.state == :DONE && parent_owner.state == :DONE
            end

            expect(attempts).to eq(1)
            expect(child_owners.first.active_job).to be_nil
            expect(parent_owner.active_job).to be_nil
            expect(parent_workflow.calls).to eq(1)
            expect(child_workflow.calls[child.owner_id]).to eq(1)
        end
    end

    it 'reconnects active and completed children during catch-up' do
        controls[10] = :ready
        start_parent
        scheduler.start
        wait_until { child_owners.first.state == :DONE }
        wait_until { parent_owner.active_job&.waiting? || parent_owner.state == :DONE }

        expect { parent_workflow.catch_up }.not_to raise_error
        expect(parent_workflow.calls).to eq(1)
    end
end
