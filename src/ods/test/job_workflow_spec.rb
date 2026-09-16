require_relative 'shared/spec_helper'

RSpec.describe ODS::JobWorkflow do
    def job_context(step: :perform, args: {}, wait: nil)
        ODS::JobContext.new(
            :id => 'operation', :attempt => 1, :step => step,
            :args => args, :external_user => 'alice', :created_at => 1,
            :wait => wait
        )
    end

    def workflow_class
        klass = Class.new(described_class) do
            workflow_id :workflow_spec
            failure_states(
                :RUNNING => :RUNNING_FAILURE,
                :PENDING => :PENDING_FAILURE
            )
            stable_states(:PENDING, :DONE)

            step(
                :perform,
                :success => ODS::Job.next(:finish),
                :failure => :RUNNING_FAILURE,
                :dependencies => [:provider],
                :on_cancel => :cancel_perform,
                :recover => :prepare_retry
            )
            step(
                :finish,
                :state => :RUNNING,
                :success => ODS::Job.complete(:DONE),
                :failure => {
                    :default => :RUNNING_FAILURE,
                    :validation => :RUNNING_FAILURE
                }
            )
            step(
                :override,
                :success => ODS::Job.next(
                    :finish, :state => :PENDING, :failure => :PENDING_FAILURE
                ),
                :failure => :RUNNING_FAILURE
            )
            step(
                :inherit_failure,
                :success => ODS::Job.next(:shared),
                :failure => :RUNNING_FAILURE
            )
            step(
                :shared,
                :state => :RUNNING,
                :success => ODS::Job.complete(:DONE)
            )

            attr_reader :calls

            def initialize
                @calls = []
                super
            end

            def perform(resource, value: nil, provider: nil)
                calls << [:perform, resource.id, value, provider]
                ODS::Job.success(nil, :args => { :value => value })
            end

            def finish(resource, value: nil)
                calls << [:finish, resource.id, value]
                ODS::Job.success
            end

            def override(_resource, **_args)
                ODS::Job.success
            end

            def inherit_failure(_resource, **_args)
                ODS::Job.success
            end

            def shared(_resource, **_args)
                ODS::Job.success
            end

            def cancel_perform(_resource, **_args)
                ODS::Job.fail('cancelled perform')
            end

            def prepare_retry(_resource, **_args)
                ODS::Job.success
            end

            def background(value:, cancel_flag:)
                calls << [:background, value, cancel_flag]
                value * 2
            end

            def background_item(item, factor:, cancel_flag:)
                calls << [:item, item, factor, cancel_flag]
                item * factor
            end

            def commit_background(resource, result, value:)
                calls << [:commit, resource.id, result, value]
                true
            end

            def commit_item(resource, item, result, factor:)
                calls << [:commit_item, resource.id, item, result, factor]
                true
            end
        end
        klass.define_singleton_method(:name) { 'SpecWorkflow' }
        klass
    end

    let(:owner) { OdsSpecSupport::MemoryOwner.new(:id => 7) }
    let(:pool) { OdsSpecSupport::MemoryPool.new([owner]) }
    let(:scheduler) { instance_double(ODS::JobScheduler) }
    let(:klass) { workflow_class }
    subject(:workflow) { klass.new.configure(pool, scheduler) }

    before do
        allow(scheduler).to receive(:schedule) {|job| job.id }
        allow(scheduler).to receive(:wake) do |workflow:, owner_id:, operation_id:|
            _ = [workflow, owner_id]
            operation_id
        end
        allow(scheduler).to receive(:retry_startup).and_return(:reconciler_spec)
        allow(scheduler).to receive(:cancel).and_return(:requested)
    end

    describe 'DSL declarations and validation' do
        it 'normalizes and freezes steps, state maps and inherited declarations' do
            perform = klass.steps[:perform]
            recovery = klass.steps[:recover_perform]

            expect(perform).to be_a(described_class::Step)
            expect(perform).to be_frozen
            expect(perform.state).to be_nil
            expect(klass.steps[:finish].state).to eq(:RUNNING)
            expect(klass.steps[:shared].failure).to be_nil
            expect(perform.dependencies).to eq([:provider])
            expect(recovery).to have_attributes(
                :handler => :prepare_retry, :kind => :recovery,
                :success => an_object_having_attributes(:step => :perform)
            )
            expect(klass.failure_states).to eq(
                :RUNNING => :RUNNING_FAILURE,
                :PENDING => :PENDING_FAILURE
            )
            expect(klass.stable_states).to contain_exactly(:PENDING, :DONE)

            child = Class.new(klass)
            expect(child.steps.keys).to include(:perform, :finish, :recover_perform)
        end

        it 'rejects duplicate, incomplete and unsupported step declarations' do
            bad = Class.new(described_class)
            expect { bad.step(nil, :success => ODS::Job.complete(:DONE), :failure => :FAILED) }
                .to raise_error(ArgumentError, /cannot be empty/)
            expect { bad.step(:x, :success => nil, :failure => :FAILED) }
                .to raise_error(ArgumentError, /Invalid success/)
            expect { bad.step(:x, :success => :target, :failure => :FAILED) }
                .to raise_error(ArgumentError, /Invalid success/)
            expect do
                bad.step(
                    :x, :success => ODS::Job.complete(:DONE),
                    :failure => {}, :unknown => true
                )
            end.to raise_error(ArgumentError, /Unknown job step options/)
            expect do
                bad.step(
                    :state, :state => Object.new,
                    :success => ODS::Job.complete(:DONE), :failure => :FAILED
                )
            end.to raise_error(ArgumentError, /Invalid state/)
        end

        it 'requires symbols in workflow declarations' do
            bad = Class.new(described_class)

            expect { bad.workflow_id('workflow') }.to raise_error(ArgumentError, /Symbol/)
            expect { bad.new }.to raise_error(ArgumentError, /Workflow ID/)
            expect do
                bad.step('perform', :success => ODS::Job.complete(:DONE))
            end.to raise_error(ArgumentError, /Symbol/)
            expect do
                bad.step(
                    :perform, :handler => 'perform', :success => ODS::Job.complete(:DONE)
                )
            end.to raise_error(ArgumentError, /Symbol/)
            expect do
                bad.step(
                    :perform, :dependencies => ['provider'],
                    :success => ODS::Job.complete(:DONE)
                )
            end.to raise_error(ArgumentError, /Symbol/)
            expect { bad.event('changed') }.to raise_error(ArgumentError, /Symbol/)
            expect { bad.failure_states('RUNNING' => :FAILED) }
                .to raise_error(ArgumentError, /Symbols/)
            expect { bad.stable_states('DONE') }.to raise_error(ArgumentError, /Symbols/)
        end

        it 'rejects undefined handlers and transitions during construction' do
            missing_handler = Class.new(described_class) do
                workflow_id :workflow_spec
                failure_states(:RUNNING => :FAILED)
                stable_states(:DONE)
                step(:missing, :success => ODS::Job.complete(:DONE), :failure => :FAILED)
            end
            bad_completion = Class.new(described_class) do
                workflow_id :workflow_spec
                failure_states(:RUNNING => :FAILED)
                def run(_resource); end
                step(:run, :success => ODS::Job.complete(:UNKNOWN), :failure => :FAILED)
            end

            expect { missing_handler.new }.to raise_error(ArgumentError, /Undefined job handler/)
            expect { bad_completion.new }.to raise_error(ArgumentError, /Invalid completion/)
        end

        it 'persists durable waits and resolves them through generic events' do
            waiting = Class.new(described_class) do
                workflow_id :workflow_spec
                failure_states(:RUNNING => :RUNNING_FAILURE)
                stable_states(:DONE)

                event :changed, :handler => :apply_change,
                                :dependencies => [:provider]
                step :observe,
                     :dependencies => [:provider],
                     :success => ODS::Job.complete(:DONE),
                     :failure => :RUNNING_FAILURE

                def observe(_resource)
                    ODS::Job.wait(:events => [:changed], :check => :ready)
                end

                def apply_change(resource, ready:, provider:)
                    resource.instance_variable_set(
                        :@ready, ready && provider == 'provider-dependency'
                    )
                    return ODS::EventResult.ignore(:observed) if ready

                    ODS::EventResult.handled(:applied)
                end

                def ready(resource, **_opts)
                    resource.instance_variable_get(:@ready) == true
                end
            end
            waiting.define_singleton_method(:name) { 'WaitingSpecWorkflow' }

            instance = waiting.new.configure(pool, scheduler)
            owner.begin_job!(
                :step => :observe, :state => :RUNNING, :args => {},
                :external_user => 'alice'
            )
            job  = owner.build_job(instance.id)
            wait = ODS::Job.wait(:events => [:changed], :check => :ready)

            expect(instance.resolve_wait!(
                       owner, job, wait, { :provider => 'provider-dependency' },
                       :persist => true
                   )).to be_waiting
            expect(owner.active_job).to have_attributes(
                :step => :observe,
                :wait => an_object_having_attributes(
                    :events => [:changed], :check => :ready
                )
            )

            expect(instance.dispatch_event(7, :changed, :ready => false)).to eq(:applied)
            expect(owner.active_job.step).to eq(:observe)

            expect(instance.dispatch_event(7, :changed, :ready => true)).to eq(:observed)
            expect(owner.state).to eq(:DONE)
            expect(owner.active_job).to be_nil
            expect(scheduler).not_to have_received(:schedule)
        end

        it 'fails a durable wait when its event handler requests failure' do
            waiting = Class.new(described_class) do
                workflow_id :workflow_spec
                failure_states(:RUNNING => :RUNNING_FAILURE)
                stable_states(:DONE)

                event :failed, :handler => :apply_failure
                step :observe,
                     :state => :RUNNING,
                     :success => ODS::Job.complete(:DONE),
                     :failure => :RUNNING_FAILURE

                attr_reader :checks

                def initialize
                    @checks = 0
                    super
                end

                def observe(_resource)
                    ODS::Job.wait(:events => [:failed], :check => :ready)
                end

                def apply_failure(_resource, message:)
                    ODS::EventResult.fail(message)
                end

                def ready(_resource)
                    @checks += 1
                    false
                end
            end
            waiting.define_singleton_method(:name) { 'FailingWaitSpecWorkflow' }

            instance = waiting.new.configure(pool, scheduler)
            owner.begin_job!(
                :step => :observe, :state => :RUNNING, :args => {},
                :external_user => 'alice'
            )
            job  = owner.build_job(instance.id)
            wait = ODS::Job.wait(:events => [:failed], :check => :ready)

            expect(instance.resolve_wait!(owner, job, wait, {}, :persist => true))
                .to be_waiting
            expect(instance).to receive(:notify_parent).with(
                an_object_having_attributes(
                    :operation_id => job.operation_id,
                    :step => :observe
                )
            ).and_call_original

            expect(instance.dispatch_event(7, :failed, :message => 'VM failed'))
                .to eq('VM failed')
            expect(instance.checks).to eq(1)
            expect(owner.state).to eq(:RUNNING_FAILURE)
            expect(owner.error[:message]).to eq('VM failed')
            expect(owner.active_job).to have_attributes(
                :step => :observe,
                :wait => an_object_having_attributes(:events => [:failed])
            )
            expect(scheduler).not_to have_received(:schedule)
        end

        it 'fails an active step before its durable wait is persisted' do
            workflow_class = Class.new(described_class) do
                workflow_id :workflow_spec
                failure_states(:RUNNING => :RUNNING_FAILURE)
                stable_states(:DONE)

                event :failed, :handler => :apply_failure
                step :observe,
                     :state => :RUNNING,
                     :success => ODS::Job.complete(:DONE),
                     :failure => :RUNNING_FAILURE

                def observe(_resource)
                    ODS::Job.wait(:events => [:failed], :check => :ready)
                end

                def apply_failure(_resource, message:)
                    ODS::EventResult.fail(message)
                end

                def ready(_resource)
                    false
                end
            end
            workflow_class.define_singleton_method(:name) { 'EarlyFailureSpecWorkflow' }

            instance = workflow_class.new.configure(pool, scheduler)
            owner.begin_job!(
                :step => :observe, :state => :RUNNING, :args => {},
                :external_user => 'alice'
            )

            expect(instance.dispatch_event(7, :failed, :message => 'early VM failure'))
                .to eq('early VM failure')
            expect(owner.state).to eq(:RUNNING_FAILURE)
            expect(owner.error[:message]).to eq('early VM failure')
            expect(owner.active_job.wait).to be_nil
            expect(scheduler).not_to have_received(:schedule)
        end

        it 'validates wait events, dependencies and step success' do
            unknown = Class.new(described_class) do
                workflow_id :workflow_spec
                failure_states(:RUNNING => :FAILED)
                stable_states(:DONE)

                step :run,
                     :success => ODS::Job.complete(:DONE),
                     :failure => :FAILED

                def run(_resource)
                    ODS::Job.success
                end

                def ready(_resource)
                    false
                end
            end

            missing_dependency = Class.new(described_class) do
                workflow_id :workflow_spec
                failure_states(:RUNNING => :FAILED)
                stable_states(:DONE)

                event :changed

                step :run,
                     :dependencies => [:provider],
                     :success => ODS::Job.complete(:DONE),
                     :failure => :FAILED

                def changed(_resource)
                    ODS::EventResult.ignore
                end

                def run(_resource)
                    ODS::Job.success
                end

                def ready(_resource, **_opts)
                    false
                end
            end

            named_success = Class.new(described_class) do
                workflow_id :workflow_spec
                failure_states(:RUNNING => :FAILED)
                stable_states(:DONE)

                event :changed

                step :run,
                     :success => { :done => ODS::Job.complete(:DONE) },
                     :failure => :FAILED

                def changed(_resource)
                    ODS::EventResult.ignore
                end

                def run(_resource)
                    ODS::Job.success
                end

                def ready(_resource)
                    false
                end
            end

            unknown_wait = ODS::Job.wait(:events => [:missing], :check => :ready)
            changed_wait = ODS::Job.wait(:events => [:changed], :check => :ready)

            expect do
                instance = unknown.new
                instance.definition.validate_wait!(instance.step_for(:run), unknown_wait)
            end.to raise_error(ArgumentError, /Unknown event missing/)
            expect do
                instance = missing_dependency.new
                instance.definition.validate_wait!(instance.step_for(:run), changed_wait)
            end
                .to raise_error(ArgumentError, /does not load wait dependencies/)
            expect do
                instance = named_success.new
                instance.definition.validate_wait!(instance.step_for(:run), changed_wait)
            end.to raise_error(ArgumentError, /cannot wait with named success/)
        end

        it 'recovers a failed wait without rerunning preparation for its step' do
            waiting = Class.new(described_class) do
                workflow_id :workflow_spec
                failure_states(:RUNNING => :RUNNING_FAILURE)
                stable_states(:DONE)

                event :changed
                step :observe,
                     :success => ODS::Job.complete(:DONE),
                     :failure => :RUNNING_FAILURE,
                     :recover => :prepare_retry

                def observe(_resource)
                    ODS::Job.success
                end

                def changed(_resource)
                    ODS::EventResult.ignore
                end

                def ready(_resource)
                    false
                end

                def prepare_retry(_resource)
                    ODS::Job.success
                end
            end
            waiting.define_singleton_method(:name) { 'RecoverWaitSpecWorkflow' }

            instance = waiting.new.configure(pool, scheduler)
            owner.state = :RUNNING
            owner.active_job = job_context(
                :step => :observe,
                :wait => ODS::Job.wait(:events => [:changed], :check => :ready)
            )
            owner.state = :RUNNING_FAILURE

            result = instance.request_recovery(7, 'admin') do
                ODS::Job.recover(:state => :RUNNING)
            end

            expect(result).to be_a(String)
            expect(owner.active_job).to have_attributes(
                :attempt => 2, :step => :observe, :external_user => 'admin',
                :wait => an_object_having_attributes(
                    :events => [:changed], :check => :ready
                )
            )
        end
    end

    describe 'configuration and job requests' do
        it 'configures once and persists a request before scheduling it' do
            result = workflow.request(7, 'alice', :with => [:provider]) do |resource, provider:|
                expect(resource).to equal(owner)
                expect(provider).to eq('provider-dependency')
                ODS::Job.request(:finish, :args => { :value => 2 })
            end

            expect(result).to be_a(String)
            expect(owner.state).to eq(:RUNNING)
            expect(owner.active_job).to have_attributes(
                :step => :finish, :args => { :value => 2 }, :external_user => 'alice'
            )
            expect(scheduler).to have_received(:schedule).with(an_instance_of(ODS::Job))
            expect { workflow.configure(pool, scheduler) }
                .to raise_error(RuntimeError, /already configured/)
        end

        it 'infers the initial state from the requested step' do
            result = workflow.request(7, 'alice') { ODS::Job.request(:finish) }

            expect(result).to be_a(String)
            expect(owner.state).to eq(:RUNNING)
            expect(owner.active_job).to have_attributes(:step => :finish)
        end

        it 'requires the requested step to declare an initial state' do
            result = workflow.request(7, 'alice') { ODS::Job.request(:perform) }

            expect(result.message).to include('Job step perform has no declared state')
            expect(owner.active_job).to be_nil
        end

        it 'does not accept an explicit state' do
            expect do
                ODS::Job.request(:finish, :state => :RUNNING)
            end.to raise_error(ArgumentError, /unknown keyword: :state/)
        end

        it 'returns domain errors without persisting and converts invalid requests' do
            domain_error = OpenNebula::Error.new('not allowed')
            expect(workflow.request(7, 'alice') { domain_error }).to equal(domain_error)
            expect(owner.active_job).to be_nil

            invalid = workflow.request(7, 'alice') { :not_a_request }
            expect(invalid.message).to include('Expected a job request')
        end

        it 'returns pool dependency errors unchanged' do
            allow(pool).to receive(:get).and_return(OpenNebula::Error.new('database down'))

            result = workflow.request(7, 'alice') { ODS::Job.request(:perform) }

            expect(result.message).to eq('database down')
        end

        it 'recovers through the inferred preparation step and increments attempt' do
            owner.state = :RUNNING
            owner.active_job = job_context(:args => { :value => 2 })
            owner.state = :RUNNING_FAILURE

            result = workflow.request_recovery(
                7, 'admin', :with => [:provider]
            ) do |resource, provider:|
                expect(resource).to equal(owner)
                expect(provider).to eq('provider-dependency')
                ODS::Job.recover(:state => :RUNNING, :args => { :value => 3 })
            end

            expect(result).to be_a(String)
            expect(owner.active_job).to have_attributes(
                :attempt => 2, :step => :recover_perform,
                :failure_state => :RUNNING_FAILURE, :external_user => 'admin'
            )
        end
    end

    describe 'durable operation reconciliation' do
        before do
            owner.state = :RUNNING
            owner.active_job = job_context
        end

        it 'reloads and schedules the exact active operation' do
            result = workflow.reconcile_operation(owner.id, owner.active_job.id)

            expect(result).to be_ok
            expect(scheduler).to have_received(:schedule)
                .with(an_instance_of(ODS::Job)).once
        end

        it 'drops a wakeup for an operation that has been replaced' do
            result = workflow.reconcile_operation(owner.id, 'stale-operation')

            expect(result).to be_stale
            expect(scheduler).not_to have_received(:schedule)
        end

        it 'returns a retryable result when the owner cannot be loaded' do
            unavailable = OpenNebula::Error.new('pool unavailable')
            allow(pool).to receive(:get).and_return(unavailable)

            result = workflow.reconcile_operation(owner.id, owner.active_job.id)

            expect(result).to be_retry
            expect(result.value).to equal(unavailable)
            expect(scheduler).not_to have_received(:schedule)
        end

        it 'preserves a retry returned while resuming a child composition' do
            unavailable = OpenNebula::Error.new('child pool unavailable')
            context = owner.active_job.with_wait(
                ODS::Job::ChildrenWait.new(:check => :ready)
            )
            owner.active_job = context
            composition = workflow.instance_variable_get(:@composition)
            allow(composition).to receive(:resume).and_return(
                ODS::ExecResult.retry(unavailable)
            )

            result = workflow.reconcile_operation(owner.id, context.id)

            expect(result).to be_retry
            expect(result.value).to equal(unavailable)
        end

        it 'terminally fails a malformed operation under a revalidated owner lock' do
            owner.active_job = job_context(:step => :unknown)
            operation_id = owner.active_job.id

            result = workflow.reconcile_operation(owner.id, operation_id)

            expect(result).to be_stale
            expect(owner.state).to eq(:RUNNING_FAILURE)
            expect(owner.active_job).to be_nil
            expect(owner.error[:message]).to include('Unknown job step unknown')
        end
    end

    describe 'execution adapters and transition resolution' do
        let(:flag) { ODS::CancelFlag.new }

        it 'dispatches step, task, pool task and commit methods with keyword arguments' do
            expect(workflow.execute_handler(
                       :perform, owner, { :value => 2 }, { :provider => 'p' }
                   )).to be_a(ODS::Job::Success)
            expect(workflow.execute_thread(:background, { :value => 3 }, flag)).to eq(6)
            expect(workflow.execute_thread_pool(
                       :background_item, 4, { :factor => 2 }, flag
                   )).to eq(8)
            expect(workflow.commit_thread(
                       :commit_background, owner, 6, { :value => 3 }
                   )).to be(true)
            expect(workflow.commit_thread_pool(
                       :commit_item, owner, 4, 8, { :factor => 2 }
                   )).to be(true)
        end

        it 'resolves unnamed and named success/failure branches' do
            perform = workflow.step_for(:perform)
            finish = workflow.step_for(:finish)

            next_outcome = workflow.resolve_success(
                perform, ODS::Job.success(nil, :args => { :forwarded => true })
            )
            expect(next_outcome).to have_attributes(
                :step => :finish, :args => { :forwarded => true }, :state => :RUNNING
            )
            override = workflow.resolve_success(
                workflow.step_for(:override), ODS::Job.success
            )
            expect(override).to have_attributes(
                :step => :finish, :state => :PENDING, :failure_state => :PENDING_FAILURE
            )
            inherited = workflow.resolve_success(
                workflow.step_for(:inherit_failure), ODS::Job.success
            )
            expect(inherited).to have_attributes(
                :step => :shared, :state => :RUNNING, :failure_state => :RUNNING_FAILURE
            )
            retained = workflow.resolve_success(
                workflow.step_for(:inherit_failure),
                ODS::Job.success,
                :failure_state => :PENDING_FAILURE
            )
            expect(retained.failure_state).to eq(:PENDING_FAILURE)
            expect(workflow.resolve_failure(finish, ODS::Job.fail('bad')))
                .to eq(:RUNNING_FAILURE)
            expect(workflow.resolve_failure(
                       finish, ODS::Job.fail('bad', :name => :validation)
                   )).to eq(:RUNNING_FAILURE)
        end

        it 'rejects unknown steps, invalid success names and args on completion' do
            expect { workflow.step_for(:missing) }.to raise_error(ArgumentError, /Unknown/)
            expect do
                workflow.resolve_success(workflow.step_for(:finish), ODS::Job.success(:named))
            end.to raise_error(ArgumentError, /no named success/)
            expect do
                workflow.resolve_success(
                    workflow.step_for(:finish), ODS::Job.success(nil, :args => { :x => 1 })
                )
            end.to raise_error(ArgumentError, /cannot pass args to completion/)
            expect do
                workflow.resolve_failure(
                    workflow.step_for(:finish), ODS::Job.fail('bad', :name => :missing)
                )
            end.to raise_error(ArgumentError, /Unknown failure/)
        end

        it 'delegates current, transition, failure and cancellation persistence' do
            owner.state = :RUNNING
            owner.active_job = job_context
            job = owner.build_job(workflow.id)

            expect(workflow.current?(owner, job)).to be(true)
            expect(workflow.transition!(owner, job, ODS::Job.next(:finish))).to be_ok
            finish_job = owner.build_job(workflow.id)
            expect(workflow.fail!(owner, finish_job, :RUNNING_FAILURE, 'failed')).to be_ok
        end

        it 'exposes cancellation defaults and delegates startup catch-up' do
            expect(workflow.cancelable?(:perform)).to be(true)
            expect(workflow.cancelable?(:finish)).to be(false)
            expect(workflow.cancelable(owner).message).to eq('Cancelled by user')

            reconciler = workflow.instance_variable_get(:@startup_reconciler)
            allow(reconciler).to receive(:run).and_return(:caught_up)
            expect(workflow.catch_up).to eq(:caught_up)

            unconfigured = klass.new
            expect { unconfigured.catch_up }.to raise_error(/has no scheduler/)
        end
    end

    describe 'cancellation requests' do
        before do
            owner.state = :RUNNING
            owner.active_job = job_context
        end

        it 'persists cancellation, reconciles runtime tracking and signals the scheduler' do
            expect(workflow.request_cancellation(7, 'alice')).to eq(:requested)
            expect(owner.active_job.cancellation[:status]).to eq(:requested)
            expect(scheduler).to have_received(:cancel).with(7, 'operation')
        end

        it 'returns idempotent status without scheduling a second request' do
            owner.request_job_cancellation!(:actor => 'alice')
            expect(workflow.request_cancellation(7, 'alice')).to eq(:requested)
            expect(scheduler).not_to have_received(:cancel)
        end

        it 'rejects unauthorized callers, absent jobs, invalid states and untracked jobs' do
            expect(workflow.request_cancellation(7, 'bob').errno)
                .to eq(OpenNebula::Error::EAUTHORIZATION)

            owner.active_job = nil
            expect(workflow.request_cancellation(7, 'alice').message).to include('no active step')

            owner.active_job = job_context
            owner.state = :RUNNING_FAILURE
            expect(workflow.request_cancellation(7, 'alice').message)
                .to include('cannot be cancelled while')

            owner.state = :RUNNING
            allow(scheduler).to receive(:cancel).and_return(:not_found)
            expect(workflow.request_cancellation(7, 'alice').message).to include('not tracked')
        end
    end
end
