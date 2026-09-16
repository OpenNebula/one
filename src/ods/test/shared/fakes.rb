# Shared in-memory doubles for isolated ODS specs.
module OdsSpecSupport

    # Base document double used by in-memory ODS resources.
    class MemoryOwnerBase

        RESOURCE_NAME = 'memory owner'
        TEMPLATE_TAG = 'BODY'
        EVENTS = { :changed => 'changed' }.freeze

        attr_reader :id, :updates

        def initialize(id: 1, body: {})
            @id = id
            @body = body
            @updates = 0
            super()
        end

        def update(_value = {})
            @updates += 1
            nil
        end

        def plain_body
            { :id => id }
        end

        def to_h(_opts = {})
            {
                'DOCUMENT' => {
                    'TEMPLATE' => {
                        self.class::TEMPLATE_TAG => Marshal.load(Marshal.dump(@body))
                    }
                }
            }
        end

    end

    # Job-capable resource double with a minimal state machine.
    class MemoryOwner < MemoryOwnerBase

        include ODS::StateMachine
        include ODS::Errorable
        include ODS::Jobable
        include ODS::Historyable

        RESOURCE_NAME = 'memory owner'
        TEMPLATE_TAG = 'BODY'
        EVENTS = { :changed => 'changed' }.freeze

        state_machine(
            :initial => :PENDING,
            :transitions => {
                :PENDING => [:RUNNING, :RUNNING_FAILURE],
                :RUNNING => [:DONE, :RUNNING_FAILURE],
                :RUNNING_FAILURE => [:RUNNING]
            }
        )

    end

    # Locking in-memory pool that exposes ODS document access semantics.
    class MemoryPool

        DOCUMENT_CLASS = MemoryOwner

        attr_reader :owners, :active, :max_active

        def initialize(owners)
            @owners = owners.to_h {|owner| [owner.id.to_s, owner] }
            @locks = Hash.new {|hash, key| hash[key] = Mutex.new }
            @active = 0
            @max_active = 0
            @counter_mutex = Mutex.new
        end

        def get(id, _external_user = nil, with: [], raw: false)
            _ = raw
            owner = @owners[id.to_s]
            return OpenNebula::Error.new('owner not found',
                                         OpenNebula::Error::ENO_EXISTS) unless owner

            @locks[id.to_s].synchronize do
                @counter_mutex.synchronize do
                    @active += 1
                    @max_active = [@max_active, @active].max
                end

                dependencies = Array(with).to_h {|name| [name, "#{name}-dependency"] }
                return yield(owner, **dependencies) if block_given?

                owner
            ensure
                @counter_mutex.synchronize { @active -= 1 }
            end
        end

        def info
            nil
        end

        def each(&block)
            @owners.values.each(&block)
        end

    end

    def self.build_job(owner, workflow:, step: :perform, args: {})
        context = owner.active_job

        ODS::Job.new(
            :workflow      => workflow,
            :owner_id      => owner.id,
            :operation_id  => context.id,
            :external_user => context.external_user,
            :state         => owner.state,
            :attempt       => context.attempt,
            :step          => step,
            :args          => args
        )
    end

end
