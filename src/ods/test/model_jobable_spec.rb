require_relative 'shared/spec_helper'

RSpec.describe ODS::Jobable do
    subject(:owner) { OdsSpecSupport::MemoryOwner.new(:id => 7) }

    let(:context) do
        ODS::JobContext.new(
            :id => 'operation-1', :attempt => 1, :step => :perform,
            :args => { :value => 1 }, :external_user => 'alice', :created_at => 100
        )
    end

    def changed(context, **attributes)
        ODS::JobContext.from_h(context.to_h.merge(attributes))
    end

    let(:job) do
        ODS::Job.new(
            :workflow => :workflow, :owner_id => 7, :operation_id => 'operation-1',
            :external_user => 'alice', :state => owner.state, :attempt => 1,
            :step => :perform, :args => { :value => 1 }
        )
    end

    before do
        allow(SecureRandom).to receive(:uuid).and_return('operation-1')
        allow(Time).to receive(:now).and_return(Time.at(100))
    end

    it 'begins and persists a reconstructable operation atomically' do
        expect(owner.begin_job!(
                   :step => :perform, :state => :RUNNING, :args => { :value => 1 },
                   :external_user => 'alice'
               )).to be(true)

        expect(owner.state).to eq(:RUNNING)
        expect(owner.active_job).to eq(context)
        expect(owner.updates).to eq(1)
        expect(owner.build_job(:workflow).signature)
            .to eq([:workflow, '7', 'operation-1', 1, :perform])
    end

    it 'rejects a second operation unless replacement is explicit' do
        owner.active_job = context

        expect do
            owner.begin_job!(
                :step => :perform, :state => :RUNNING, :args => {},
                :external_user => 'alice'
            )
        end.to raise_error(ArgumentError, /already has an active job/)

        expect do
            owner.begin_job!(
                :step => :perform, :state => :RUNNING, :args => {},
                :external_user => 'alice', :replace => true
            )
        end.not_to raise_error
    end

    it 'requires symbols for durable job identifiers and states' do
        expect do
            owner.begin_job!(
                :step => 'perform', :state => :RUNNING, :args => {},
                :external_user => 'alice'
            )
        end.to raise_error(ArgumentError, /Symbol/)
        expect do
            owner.begin_job!(
                :step => :perform, :state => 'RUNNING', :args => {},
                :external_user => 'alice'
            )
        end.to raise_error(ArgumentError, /Symbol/)

        owner.active_job = context

        expect do
            owner.recover_job!(
                :state => :RUNNING, :external_user => 'alice', :step => 'perform'
            )
        end.to raise_error(ArgumentError, /Symbol/)
        expect do
            ODS::JobContext.new(**context.to_h, :step => 'perform')
        end.to raise_error(ArgumentError, /Symbol/)
        expect { owner.build_job('workflow') }.to raise_error(ArgumentError, /Symbol/)
    end

    it 'keeps durable context values immutable' do
        args = { :items => [{ :name => 'one' }] }
        durable = ODS::JobContext.new(
            :id => 'operation-1', :attempt => 1, :step => :perform,
            :args => args, :external_user => 'alice', :created_at => 100
        )

        args[:items].first[:name].replace('changed')

        expect(durable.args).to eq(:items => [{ :name => 'one' }])
        expect(durable.args[:items].first[:name]).to be_frozen
    end

    it 'restores lifecycle symbols from a persisted job context' do
        persisted = context.to_h.merge(
            :step => 'perform', :failure_state => 'RUNNING_FAILURE',
            :wait => { :events => ['changed'], :check => 'ready' },
            :cancellation => {
                :requested_by => 'alice', :requested_at => 100, :status => 'requested'
            }
        )
        persisted_owner = OdsSpecSupport::MemoryOwner.new(
            :id => 7, :body => { :active_job => persisted }
        )

        job = persisted_owner.build_job(:workflow)

        expect(job).to have_attributes(:step => :perform, :failure_state => :RUNNING_FAILURE)
        expect(persisted_owner.active_job).to have_attributes(
            :wait => an_object_having_attributes(
                :events => [:changed], :check => :ready
            ),
            :cancellation => hash_including(
                :requested_by => 'alice', :requested_at => 100, :status => :requested
            )
        )
    end

    it 'persists a pending failure until the terminal state is committed' do
        owner.active_job = context
        owner.state      = :RUNNING

        expect(
            owner.prepare_job_failure!(job, :RUNNING_FAILURE, 'child cleanup pending')
        ).to be_ok
        expect(owner.state).to eq(:RUNNING)
        expect(owner.active_job).to be_failing
        expect(owner.active_job.pending_failure).to eq(
            :state => :RUNNING_FAILURE, :message => 'child cleanup pending'
        )

        restored = ODS::JobContext.from_h(
            context.to_h.merge(
                :pending_failure => {
                    'state' => 'RUNNING_FAILURE', 'message' => 'child cleanup pending'
                }
            )
        )
        expect(restored.pending_failure).to eq(
            :state => :RUNNING_FAILURE, :message => 'child cleanup pending'
        )

        expect(owner.fail_job!(job, :RUNNING_FAILURE, 'child cleanup complete')).to be_ok
        expect(owner.state).to eq(:RUNNING_FAILURE)
        expect(owner.active_job).not_to be_failing
    end

    it 'increments attempts, replaces selected recovery context and clears cancellation' do
        owner.state = :RUNNING
        owner.state = :RUNNING_FAILURE
        owner.active_job = changed(
            context,
            :cancellation => {
                :requested_by => 'alice', :requested_at => 100, :status => :requested
            }
        )

        owner.recover_job!(
            :state => :RUNNING, :external_user => 'admin', :args => { :retry => true },
            :step => :recover_perform, :failure_state => :RUNNING_FAILURE
        )

        expect(owner.active_job).to have_attributes(
            :attempt => 2, :external_user => 'admin', :args => { :retry => true },
            :step => :recover_perform, :failure_state => :RUNNING_FAILURE
        )
        expect(owner.active_job.cancellation).to be_nil
    end

    it 'authorizes, persists and idempotently retains cancellation requests' do
        owner.active_job = context

        expect(owner.request_job_cancellation!(:actor => 'alice')).to eq('operation-1')
        first = owner.active_job.cancellation
        allow(Time).to receive(:now).and_return(Time.at(200))
        expect(owner.request_job_cancellation!(:actor => 'admin', :oneadmin => true))
            .to eq('operation-1')

        expect(owner.active_job.cancellation).to eq(first)
        expect(owner).to be_active_job_owned_by('alice')
        expect(owner).not_to be_active_job_owned_by('bob')
    end

    it 'rejects unauthorized or malformed cancellation requests' do
        expect { owner.request_job_cancellation!(:actor => 'alice') }
            .to raise_error(ArgumentError, /no active job/)
        owner.active_job = context
        expect { owner.request_job_cancellation!(:actor => '') }
            .to raise_error(ArgumentError, /cannot be empty/)
        expect { owner.request_job_cancellation!(:actor => 'bob') }
            .to raise_error(ArgumentError, /Only the user/)
    end

    it 'matches the complete operation identity and safely rejects malformed context' do
        owner.state = :RUNNING
        owner.active_job = context

        expect(owner.active_job?(job)).to be(true)
        owner.active_job = changed(context, :attempt => 2)
        expect(owner.active_job?(job)).to be(false)
        expect(owner.cancellation_requested?(job)).to be(false)
    end

    it 'persists continuations, argument changes and completion' do
        owner.state = :RUNNING
        owner.active_job = context

        next_outcome = ODS::Job.next(
            :finish, :state => :RUNNING, :args => { :next => true },
            :failure => :RUNNING_FAILURE
        )
        expect(owner.transition_job!(job, next_outcome)).to be_ok
        expect(owner.active_job).to have_attributes(
            :step => :finish, :args => { :next => true },
            :failure_state => :RUNNING_FAILURE
        )

        finish_job = owner.build_job(:workflow)
        expect(owner.transition_job!(finish_job, ODS::Job.complete(:DONE))).to be_ok
        expect(owner.state).to eq(:DONE)
        expect(owner.active_job).to be_nil
    end

    it 'keeps an event wait only in durable context and clears it on transition' do
        owner.state = :RUNNING
        owner.active_job = changed(
            context,
            :wait => { :events => [:changed], :check => :ready }
        )

        waiting_job = owner.build_job(:workflow)
        expect(waiting_job).not_to respond_to(:wait)

        expect(owner.transition_job!(waiting_job, ODS::Job.next(:finish))).to be_ok
        expect(owner.active_job).not_to be_waiting
    end

    it 'round-trips parent argument forwarding in a children wait' do
        restored = changed(
            context,
            :wait => {
                :type => :children,
                :check => :children_ready,
                :forward_args => true
            }
        )

        expect(restored.wait).to be_a(ODS::Job::ChildrenWait)
        expect(restored.wait).to be_forward_args
        expect(restored.to_h[:wait]).to eq(
            :type => :children,
            :check => :children_ready,
            :forward_args => true
        )
    end

    it 'returns stale without mutating when runtime identity no longer matches' do
        owner.state = :RUNNING
        owner.active_job = changed(context, :attempt => 2)

        expect(owner.transition_job!(job, ODS::Job.complete(:DONE))).to be_stale
        expect(owner.fail_job!(job, :RUNNING_FAILURE, 'bad')).to be_stale
        expect(owner.cancel_job!(job, :RUNNING_FAILURE, 'cancelled')).to be_stale
        expect(owner.updates).to eq(0)
    end

    it 'persists terminal failure context for later recovery' do
        owner.state = :RUNNING
        owner.active_job = context

        expect(owner.fail_job!(job, :RUNNING_FAILURE, 'apply failed')).to be_ok
        expect(owner.state).to eq(:RUNNING_FAILURE)
        expect(owner.error).to include(
            :message => 'apply failed', :step => 'perform', :opts => { :value => 1 }
        )
        expect(owner.active_job).to eq(context)
    end

    it 'marks cancellation completion while retaining durable operation context' do
        owner.state = :RUNNING
        owner.active_job = changed(
            context,
            :cancellation => {
                :requested_by => 'alice', :requested_at => 100, :status => :requested
            }
        )
        cancelled_job = owner.build_job(:workflow)

        expect(owner.cancel_job!(cancelled_job, :RUNNING_FAILURE, 'cancelled')).to be_ok
        expect(owner.active_job.cancellation[:status]).to eq(:cancelled)
        expect(owner.active_job.cancellation[:cancelled_at]).to eq(100)
        expect(owner.state).to eq(:RUNNING_FAILURE)
    end

    it 'fails orphaned operations and clears their malformed context' do
        owner.state = :RUNNING
        owner.active_job = context

        expect(owner.fail_orphan_job!(:RUNNING_FAILURE, 'cannot rebuild')).to be_ok
        expect(owner.active_job).to be_nil
        expect(owner.error).to include(:message => 'cannot rebuild', :step => 'perform')
    end

    it 'redacts internal job fields from public hash and JSON representations' do
        owner.active_job = changed(
            context,
            :cancellation => {
                :requested_by => 'alice', :requested_at => 100, :status => :requested
            }
        )

        public_job = owner.to_h.dig('DOCUMENT', 'TEMPLATE', 'BODY', :active_job)

        expect(public_job).to include(
            :id => 'operation-1', :attempt => 1, :step => :perform,
            :cancellation => { :status => :requested, :requested_at => 100 }
        )
        expect(public_job).not_to have_key(:args)
        expect(public_job).not_to have_key(:external_user)
        expect(JSON.parse(owner.to_json).dig('DOCUMENT', 'TEMPLATE', 'BODY', 'active_job'))
            .not_to have_key('external_user')
    end

    it 'keeps parent-child internals out of safe public serialization' do
        parent = ODS::Job::Parent.new(
            :workflow => :parent, :owner_id => 9,
            :operation_id => 'parent-operation', :parent_step => :compose
        )
        child = ODS::Job::Child.new(
            :workflow => :child, :owner_id => 10, :parent_step => :perform,
            :step => :run, :args => { :secret => 'value' }
        )
        owner.active_job = changed(context, :parent => parent, :children => [child])

        public_job = owner.to_h.dig('DOCUMENT', 'TEMPLATE', 'BODY', :active_job)

        expect(public_job).not_to have_key(:parent)
        expect(public_job).not_to have_key(:children)
        expect(owner.active_job.to_h).to include(
            :parent => parent.to_h, :children => [child.to_h]
        )
    end

    it 'validates every persisted active job field and cancellation state' do
        invalid = [
            context.to_h.merge(:action => :perform),
            context.to_h.merge(:id => ''),
            context.to_h.merge(:attempt => 0),
            context.to_h.merge(:step => ''),
            context.to_h.merge(:args => []),
            context.to_h.merge(:failure_state => 1),
            context.to_h.merge(:external_user => ''),
            context.to_h.merge(:created_at => 0),
            context.to_h.merge(:wait => true),
            context.to_h.merge(:wait => { :events => [], :check => :ready }),
            context.to_h.merge(:wait => { :events => [:changed], :check => nil }),
            context.to_h.merge(:cancellation => true),
            context.to_h.merge(
                :cancellation => { :requested_by => '', :requested_at => 100 }
            ),
            context.to_h.merge(
                :cancellation => { :requested_by => 'a', :requested_at => 0 }
            ),
            context.to_h.merge(
                :cancellation => {
                    :requested_by => 'a', :requested_at => 1, :status => :unknown
                }
            ),
            context.to_h.merge(
                :cancellation => {
                    :requested_by => 'a', :requested_at => 1,
                    :status => :cancelled, :cancelled_at => 0
                }
            )
        ]

        invalid.each do |value|
            expect { ODS::JobContext.from_h(value) }.to raise_error(ArgumentError)
        end
    end

    it 'raises persistence failures instead of reporting false success' do
        allow(owner).to receive(:update).and_return(OpenNebula::Error.new('database unavailable'))

        expect do
            owner.begin_job!(
                :step => :perform, :state => :RUNNING, :args => {},
                :external_user => 'alice'
            )
        end.to raise_error(RuntimeError, /database unavailable/)
    end
end
