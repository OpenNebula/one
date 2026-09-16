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

require_relative '../thread_manager'
require_relative 'exec_result'
require_relative 'event_result'

module OpenNebula

    # Provides durable workflow primitives for Document Server resources.
    module DocumentServer

        # Ephemeral runtime execution of a step owned by a {Jobable}
        class Job

            attr_reader :id,
                        :workflow,
                        :owner_id,
                        :operation_id,
                        :external_user,
                        :state,
                        :attempt,
                        :step,
                        :args,
                        :failure_state,
                        :parent,
                        :cancel_flag

            attr_accessor :status,
                          :command,
                          :failure_outcome,
                          :retry_at,
                          :children

            # Reconstructs an ephemeral runtime job.
            def initialize(**attributes)
                [:workflow, :state, :step].each do |attribute|
                    raise ArgumentError, "Job #{attribute} must be a Symbol" \
                        unless attributes[attribute].is_a?(Symbol)
                end

                @id            = attributes[:id] || SecureRandom.uuid
                @workflow      = attributes[:workflow]
                @owner_id      = attributes[:owner_id]
                @operation_id  = attributes[:operation_id].to_s
                @external_user = attributes[:external_user]
                @state         = attributes[:state]
                @attempt       = attributes[:attempt].to_i
                @step          = attributes[:step]
                @args          = (attributes[:args] || {}).dup
                @failure_state = attributes[:failure_state]
                @parent        = attributes[:parent]
                @children      = Array(attributes[:children]).dup.freeze

                @status          = :pending
                @command         = nil
                @failure_outcome = nil
                @retry_at        = nil
                @cancel_mutex    = Mutex.new
                @cancellation    = attributes[:cancellation]
                @cancel_flag     = attributes[:cancel_flag] ||
                                   CancelFlag.new(!@cancellation.nil?)
                @shutdown_requested = false
                @shutdown_deadline  = nil
                @shutdown_waiters   = []
                @runtime_threads    = []

                validate!
            end

            # Returns the identity used to deduplicate reconstructed jobs.
            def signature
                [workflow, owner_id.to_s, operation_id, attempt, step]
            end

            # Returns the identity used for per-owner scheduler exclusion.
            def owner_key
                [workflow, owner_id.to_s]
            end

            # Builds the ephemeral representation for a continuation.
            def next(outcome)
                self.class.new(
                    :workflow      => workflow,
                    :owner_id      => owner_id,
                    :operation_id  => operation_id,
                    :external_user => external_user,
                    :state         => outcome.state || state,
                    :attempt       => attempt,
                    :step          => outcome.step,
                    :args          => outcome.args || args,
                    :failure_state => outcome.failure_state,
                    :parent        => parent,
                    :children      => children,
                    :cancellation  => cancellation,
                    :cancel_flag   => cancel_flag
                )
            end

            # Starts a managed thread inside this job's cancellation scope.
            def start_thread(name = nil, &block)
                raise ArgumentError, 'Block required' unless block
                raise ArgumentError, 'Thread name must be a Symbol' \
                    unless name.nil? || name.is_a?(Symbol)

                @cancel_mutex.synchronize do
                    raise ThreadManager::StoppedError, 'Job is stopping' \
                        if @shutdown_requested

                    thread = ThreadManager.instance.start("job-#{id}:#{name}") do
                        block.call(cancel_flag)
                    ensure
                        @cancel_mutex.synchronize do
                            @runtime_threads.delete(Thread.current)
                        end
                    end
                    @runtime_threads << thread if thread.alive?
                    thread
                end
            end

            # Returns live task threads owned by this runtime job.
            def runtime_threads
                @cancel_mutex.synchronize { @runtime_threads.select(&:alive?) }
            end

            # Opens a fresh cancellation scope after current task threads finish.
            def reset_cancel_flag!
                @cancel_mutex.synchronize do
                    @cancel_flag = CancelFlag.new \
                        unless @cancellation || @shutdown_requested
                end

                cancel_flag
            end

            # Stops this ephemeral execution without requesting durable cancellation.
            # This flag is intentionally excluded from JobContext persistence.
            def request_shutdown!(deadline = nil)
                waiters = @cancel_mutex.synchronize do
                    @shutdown_requested = true
                    if deadline && (!@shutdown_deadline || deadline < @shutdown_deadline)
                        @shutdown_deadline = deadline
                    end

                    current_waiters = @shutdown_waiters.dup
                    @shutdown_waiters.clear
                    current_waiters
                end

                cancel_flag.cancel!
                waiters.each(&:close)

                true
            end

            def shutdown_requested?
                @cancel_mutex.synchronize { @shutdown_requested }
            end

            def shutdown_deadline
                @cancel_mutex.synchronize { @shutdown_deadline }
            end

            # Registers a closeable wait primitive for immediate shutdown wakeup.
            def register_shutdown_waiter(waiter)
                close = @cancel_mutex.synchronize do
                    if @shutdown_requested
                        true
                    else
                        @shutdown_waiters << waiter
                        false
                    end
                end

                waiter.close if close
                waiter
            end

            def unregister_shutdown_waiter(waiter)
                @cancel_mutex.synchronize { @shutdown_waiters.delete(waiter) }
            end

            # Marks the runtime job for cancellation.
            def request_cancel!(details = true)
                @cancel_mutex.synchronize do
                    @cancellation ||= details
                end

                cancel_flag.cancel!

                true
            end

            def cancellation_requested?
                @cancel_mutex.synchronize { !@cancellation.nil? }
            end

            def cancellation
                @cancel_mutex.synchronize { @cancellation }
            end

            # Returns a serializable runtime status snapshot.
            def info
                {
                    :id           => id,
                    :workflow     => workflow,
                    :owner_id     => owner_id,
                    :operation_id => operation_id,
                    :state        => state,
                    :step         => step,
                    :status       => status,
                    :cancellation => cancellation,
                    :command      => command&.info
                }
            end

            private

            def validate!
                raise ArgumentError, 'Job owner cannot be empty' if owner_id.to_s.empty?
                raise ArgumentError, 'Job operation ID cannot be empty' if operation_id.empty?
                raise ArgumentError, 'Job external user cannot be empty' \
                    if external_user.to_s.empty?
                raise ArgumentError, 'Job attempt must be positive' unless attempt.positive?
                raise ArgumentError, 'Job args must be a Hash' unless args.is_a?(Hash)
                raise ArgumentError, 'Job failure state must be a Symbol' \
                    unless failure_state.nil? || failure_state.is_a?(Symbol)
                raise ArgumentError, 'Invalid job parent' \
                    unless parent.nil? || parent.is_a?(Parent)
                raise ArgumentError, 'Invalid job children' \
                    unless children.all? {|child| child.is_a?(Child) }
                raise ArgumentError, 'Invalid job cancel flag' \
                    unless cancel_flag.is_a?(CancelFlag)
            end

        end

        require_relative 'job/relation'

        # Immutable durable context used to reconstruct a runtime job.
        class JobContext

            CANCEL_STATES = [:requested, :cancelled]
            FIELDS = [
                :id, :attempt, :step, :args, :external_user, :created_at,
                :failure_state, :wait, :cancellation, :pending_failure,
                :parent, :children
            ]

            attr_reader :id,
                        :attempt,
                        :step,
                        :args,
                        :external_user,
                        :created_at,
                        :failure_state,
                        :wait,
                        :cancellation,
                        :pending_failure,
                        :parent,
                        :children

            def self.from_h(data)
                raise ArgumentError, 'Active job context must be a Hash' \
                    unless data.is_a?(Hash)

                unknown = data.keys - FIELDS
                raise ArgumentError, "Unknown active job fields: #{unknown.join(', ')}" \
                    unless unknown.empty?

                wait = Job::Wait.from_h(data[:wait]) if data[:wait]

                parent   = Job::Parent.from_h(data[:parent]) if data[:parent]
                children = Array(data[:children]).map {|child| Job::Child.from_h(child) }

                cancellation = data[:cancellation]
                raise ArgumentError, 'Active job cancellation must be a Hash' \
                    unless cancellation.nil? || cancellation.is_a?(Hash)

                cancellation = cancellation&.dup
                if cancellation && cancellation[:status].is_a?(String)
                    cancellation[:status] = cancellation[:status].to_sym
                end

                pending_failure = data[:pending_failure]
                if pending_failure
                    raise ArgumentError, 'Active job pending failure must be a Hash' \
                        unless pending_failure.is_a?(Hash)

                    pending_failure = pending_failure.to_h do |key, value|
                        [key.is_a?(String) ? key.to_sym : key, value]
                    end
                    pending_failure[:state] = symbol(pending_failure[:state])
                end

                new(
                    :id            => data[:id],
                    :attempt       => data[:attempt],
                    :step          => symbol(data[:step]),
                    :args          => data[:args],
                    :external_user => data[:external_user],
                    :created_at    => data[:created_at],
                    :failure_state => symbol(data[:failure_state]),
                    :wait          => wait,
                    :cancellation  => cancellation,
                    :pending_failure => pending_failure,
                    :parent        => parent,
                    :children      => children
                )
            end

            def self.symbol(value)
                value.is_a?(String) ? value.to_sym : value
            end
            private_class_method :symbol

            def initialize(**attrs)
                unknown = attrs.keys - FIELDS
                raise ArgumentError, "Unknown active job fields: #{unknown.join(', ')}" \
                    unless unknown.empty?

                @id            = attrs.fetch(:id).to_s
                @attempt       = attrs.fetch(:attempt).to_i
                @step          = attrs.fetch(:step)
                @args          = immutable(attrs.fetch(:args))
                @external_user = attrs.fetch(:external_user)
                @created_at    = attrs[:created_at]&.to_i
                @failure_state = attrs[:failure_state]
                @wait          = attrs[:wait]&.freeze
                @cancellation  = immutable(attrs[:cancellation])
                @pending_failure = immutable(attrs[:pending_failure])
                @parent        = attrs[:parent]
                @children      = Array(attrs[:children]).dup.freeze

                validate!
                freeze
            end

            def waiting?
                !wait.nil?
            end

            def cancelling?
                cancellation&.[](:status) == :requested
            end

            def cancelled?
                cancellation&.[](:status) == :cancelled
            end

            def failing?
                !pending_failure.nil?
            end

            def owned_by?(actor)
                external_user.to_s == actor.to_s
            end

            def current?(state, job)
                state == job.state &&
                    id == job.operation_id &&
                    attempt == job.attempt &&
                    step == job.step
            end

            def recover(external_user:, args: nil, step: nil, failure_state: nil)
                copy(
                    :attempt       => attempt + 1,
                    :args          => args || self.args,
                    :step          => step || self.step,
                    :external_user => external_user,
                    :failure_state => failure_state,
                    :cancellation  => nil,
                    :pending_failure => nil
                )
            end

            def transition(job, outcome)
                copy(
                    :step          => outcome.step,
                    :args          => outcome.args || job.args,
                    :failure_state => outcome.failure_state,
                    :wait          => nil,
                    :pending_failure => nil
                )
            end

            def with_composition(job, requested_children, child_wait, args: nil)
                raise ArgumentError, 'Expected a children wait' \
                    unless child_wait.is_a?(Job::ChildrenWait)

                current = children.dup
                existing = current.select {|child| child.parent_step == job.step }

                if !existing.empty? && wait != child_wait
                    raise ArgumentError,
                          "Parent step #{job.step} composition conflicts with its " \
                          'persisted wait'
                end

                if !existing.empty? && !args.nil? && self.args != args
                    raise ArgumentError,
                          "Parent step #{job.step} composition conflicts with its " \
                          'persisted arguments'
                end

                requested_children.each do |child|
                    existing = current.find {|item| item.owner_key == child.owner_key }

                    if existing && existing.identity != child.identity
                        raise ArgumentError,
                              "Child #{child.workflow} #{child.owner_id} conflicts with " \
                              "the request owned by parent step #{job.step}"
                    end

                    current << child unless existing
                end

                copy(
                    :args => args || self.args,
                    :children => current,
                    :wait => child_wait
                )
            end

            def with_children(value)
                copy(:children => value)
            end

            def with_wait(value)
                raise ArgumentError, 'Expected a Job.wait outcome' \
                    unless value.is_a?(Job::Wait)

                copy(:wait => value)
            end

            def with_pending_failure(state, message)
                raise ArgumentError, 'Pending failure state must be a Symbol' \
                    unless state.is_a?(Symbol)
                raise ArgumentError, 'Pending failure message cannot be empty' \
                    if message.to_s.empty?

                pending = { :state => state, :message => message.to_s }
                return self if pending_failure == pending
                raise ArgumentError, 'Active job already has a different pending failure' \
                    if pending_failure

                copy(:pending_failure => pending)
            end

            def clear_pending_failure
                return self unless pending_failure

                copy(:pending_failure => nil)
            end

            def request_cancel(actor, at: Time.now.to_i)
                return self if cancellation

                copy(
                    :cancellation => {
                        :requested_by => actor,
                        :requested_at => at,
                        :status       => :requested
                    }
                )
            end

            def cancel(at: Time.now.to_i)
                return self unless cancellation

                copy(
                    :cancellation => cancellation.merge(
                        :status       => :cancelled,
                        :cancelled_at => at
                    )
                )
            end

            def to_h
                {
                    :id            => id,
                    :attempt       => attempt,
                    :step          => step,
                    :args          => args,
                    :external_user => external_user,
                    :created_at    => created_at,
                    :failure_state => failure_state,
                    :wait          => wait&.to_h,
                    :cancellation  => cancellation,
                    :pending_failure => pending_failure,
                    :parent        => parent&.to_h,
                    :children      => children.empty? ? nil : children.map(&:to_h)
                }.compact
            end

            def public_h
                data = {
                    :id         => id,
                    :attempt    => attempt,
                    :step       => step,
                    :created_at => created_at
                }.compact

                if cancellation
                    data[:cancellation] = cancellation.slice(
                        :status, :requested_at, :cancelled_at
                    )
                end

                data
            end

            def ==(other)
                other.is_a?(self.class) && other.to_h == to_h
            end

            private

            def immutable(value)
                case value
                when Hash
                    value.to_h do |key, item|
                        [immutable(key), immutable(item)]
                    end.freeze
                when Array
                    value.map {|item| immutable(item) }.freeze
                when String
                    value.dup.freeze
                else
                    value
                end
            end

            def copy(**changes)
                self.class.from_h(to_h.merge(changes))
            end

            def validate!
                raise ArgumentError, 'Active job ID cannot be empty' if id.empty?
                raise ArgumentError, 'Active job attempt must be positive' unless attempt.positive?
                raise ArgumentError, 'Active job step must be a non-empty Symbol' \
                    unless step.is_a?(Symbol) && !step.to_s.empty?
                raise ArgumentError, 'Active job args must be a Hash' unless args.is_a?(Hash)
                raise ArgumentError, 'Active job external user cannot be empty' \
                    if external_user.to_s.empty?
                raise ArgumentError, 'Active job creation time must be positive' \
                    if created_at && !created_at.positive?
                raise ArgumentError, 'Active job failure state must be a Symbol' \
                    unless failure_state.nil? || failure_state.is_a?(Symbol)
                raise ArgumentError, 'Active job wait must be a Job::Wait' \
                    unless wait.nil? || wait.is_a?(Job::Wait)
                raise ArgumentError, 'Active job parent must be a Job::Parent' \
                    unless parent.nil? || parent.is_a?(Job::Parent)
                raise ArgumentError, 'Active job children must be Job::Child values' \
                    unless children.all? {|child| child.is_a?(Job::Child) }

                validate_pending_failure!

                duplicate = children.group_by(&:owner_key).find do |_key, values|
                    values.map(&:identity).uniq.length > 1
                end
                raise ArgumentError, 'Active job contains incompatible child requests' \
                    if duplicate

                validate_cancellation!
            end

            def validate_pending_failure!
                return unless pending_failure

                raise ArgumentError, 'Active job pending failure must be a Hash' \
                    unless pending_failure.is_a?(Hash)
                raise ArgumentError, 'Active job pending failure has unknown fields' \
                    unless (pending_failure.keys - [:state, :message]).empty?
                raise ArgumentError, 'Pending failure state must be a Symbol' \
                    unless pending_failure[:state].is_a?(Symbol)
                raise ArgumentError, 'Pending failure message cannot be empty' \
                    if pending_failure[:message].to_s.empty?
            end

            def validate_cancellation!
                return unless cancellation

                raise ArgumentError, 'Active job cancellation must be a Hash' \
                    unless cancellation.is_a?(Hash)
                raise ArgumentError, 'Cancellation requester cannot be empty' \
                    if cancellation[:requested_by].to_s.empty?
                raise ArgumentError, 'Cancellation time must be positive' \
                    unless cancellation[:requested_at].to_i.positive?
                raise ArgumentError, 'Invalid cancellation status' \
                    unless CANCEL_STATES.include?(cancellation[:status])
                raise ArgumentError, 'Cancellation completion time must be positive' \
                    if cancelled? && !cancellation[:cancelled_at].to_i.positive?
            end

        end

    end

end

require_relative 'job/request'
require_relative 'job/outcome'
