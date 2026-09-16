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

require_relative 'workflow/step'
require_relative 'workflow/event'
require_relative 'workflow/definition'
require_relative 'workflow/dsl'
require_relative 'workflow/startup_reconciler'
require_relative 'workflow/composition'

module OpenNebula

    module DocumentServer

        # Declares lifecycle steps and transitions executed by a {JobScheduler}.
        class JobWorkflow

            extend DSL

            attr_reader :id, :definition, :pool, :scheduler

            def initialize
                @id = self.class.workflow_id
                raise ArgumentError, 'Workflow ID must be declared' unless @id.is_a?(Symbol)

                @definition         = Definition.new(self, self.class.steps, self.class.events)
                @event_exec         = EventExec.new(self)
                @startup_reconciler = StartupReconciler.new(self)
                @composition        = Composition.new(self)
            end

            # Connects the workflow to its persistent pool and scheduler
            #
            # @param pool [Object] Pool used to load persistent job owners
            # @param scheduler [JobScheduler] Scheduler used to schedule jobs
            # @return [JobWorkflow] Configured workflow
            # @raise [RuntimeError] If the workflow was already configured
            def configure(pool, scheduler)
                raise 'Job workflow is already configured' if @pool

                @pool      = pool
                @scheduler = scheduler

                self
            end

            # Starts and schedules a durable job under its owner pool lock
            #
            # The block receives a owner and must return a {Job::Request}
            # or an OpenNebula error. Domain validation and argument construction therefore
            # run against the same locked state that is used to persist the active job.
            #
            # @param owner_id [String, Integer] Identifier of the job owner
            # @param actor [String] User requesting the operation
            # @param with [Array<Symbol>] Named pool dependencies exposed to the block
            # @yieldparam resource [Object] Fresh persistent owner locked by its pool
            # @yieldparam dependencies [Hash] Named resources resolved by the pool
            # @yieldreturn [Job::Request, OpenNebula::Error] Requested job or validation error
            # @return [String, OpenNebula::Error] Scheduled job identifier or an error
            def request(owner_id, actor, with: [])
                result = nil

                rc = pool.get(owner_id, actor, :with => with) do |resource, **dependencies|
                    result = yield(resource, **dependencies)

                    unless OpenNebula.is_error?(result)
                        raise ArgumentError, 'Expected a job request' \
                            unless result.is_a?(Job::Request)

                        step  = step_for(result.step)
                        state = step.state

                        raise ArgumentError, "Job step #{step.name} has no declared state" \
                            unless state

                        if result.replace? && resource.active_job&.children&.any?
                            result = OpenNebula::Error.new(
                                "#{resource.class::RESOURCE_NAME} #{resource.id} " \
                                'cannot start a new action while its current action ' \
                                'is unfinished',
                                OpenNebula::Error::EACTION
                            )
                            next
                        end

                        resource.begin_job!(
                            :step          => result.step,
                            :state         => state,
                            :args          => result.args,
                            :external_user => actor,
                            :replace       => result.replace?
                        )

                        result = schedule(resource)
                    end

                    result
                end

                return rc if OpenNebula.is_error?(rc)

                result
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error requesting action: #{e.message}", OpenNebula::Error::EACTION
                )
            end

            # Releases a failed parent action and its failed children without
            # replacing their durable ownership while cleanup is still pending.
            def discard_failed_composition(owner_id, actor)
                context = nil
                result  = nil

                rc = pool.get(owner_id, actor) do |resource|
                    context = resource.active_job

                    result = OpenNebula::Error.new(
                        "Resource #{resource.id} has no failed action to discard",
                        OpenNebula::Error::EACTION
                    ) unless context

                    next if result

                    result = OpenNebula::Error.new(
                        "Resource #{resource.id} cannot discard its action while it is " \
                        "#{resource.state}",
                        OpenNebula::Error::EACTION
                    ) unless self.class.failure_states.value?(resource.state)
                end

                return rc if OpenNebula.is_error?(rc)
                return result if OpenNebula.is_error?(result)

                @composition.discard_failed(owner_id, context, actor)
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error discarding failed action: #{e.message}", OpenNebula::Error::EACTION
                )
            end

            # Recovers and schedules a durable job under its owner pool lock
            #
            # @param owner_id [String, Integer] Identifier of the job owner
            # @param actor [String] User requesting the recovery
            # @param with [Array<Symbol>] Named pool dependencies exposed to the block
            # @yieldparam resource [Object] Fresh persistent owner locked by its pool
            # @yieldparam dependencies [Hash] Named resources resolved by the pool
            # @yieldreturn [Job::Recovery, OpenNebula::Error] Recovery or validation error
            # @return [String, OpenNebula::Error] Scheduled job identifier or an error
            def request_recovery(owner_id, actor, with: [])
                result           = nil
                waiting_resource = nil
                composition      = nil

                rc = pool.get(owner_id, actor, :with => with) do |resource, **dependencies|
                    result = yield(resource, **dependencies)

                    unless OpenNebula.is_error?(result)
                        raise ArgumentError, 'Expected a job recovery request' \
                            unless result.is_a?(Job::Recovery)

                        context   = resource.active_job
                        step_name = context&.step
                        step      = step_for(step_name)

                        if context.wait.is_a?(Job::ChildrenWait)
                            composition = [resource, result]
                            next
                        end

                        if !context.waiting? &&
                           step.kind == :normal && step.recover
                            step_name = :"recover_#{step.name}"
                            step      = step_for(step_name)
                        end

                        failure_state = context.failure_state
                        failure_state ||= resource.state if step.kind == :recovery

                        resource.recover_job!(
                            :state         => result.state,
                            :external_user => actor,
                            :args          => result.args,
                            :step          => step_name,
                            :failure_state => failure_state
                        )

                        if resource.active_job.waiting?
                            waiting_resource = resource
                            result = resource.active_job.id
                        else
                            result = schedule(resource)
                        end
                    end

                    result
                end

                return rc if OpenNebula.is_error?(rc)
                return public_result(@composition.recover(*composition, actor)) if composition
                return result unless waiting_resource

                resume_wait(waiting_resource)
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error requesting action recovery: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Requests cancellation of an active job
            #
            # @param owner_id [String, Integer] Identifier of the job owner
            # @param actor [String] User requesting the cancellation
            # @param oneadmin [Boolean] Whether the actor belongs to the oneadmin group
            # @return [Symbol, OpenNebula::Error] requested or an error
            def request_cancellation(owner_id, actor, oneadmin: false)
                result = nil

                rc = pool.get(owner_id, actor) do |resource|
                    result = request_cancellation_for(resource, actor, oneadmin)
                end

                return rc if OpenNebula.is_error?(rc)

                result
            rescue Jobable::AuthError => e
                OpenNebula::Error.new(e.message, OpenNebula::Error::EAUTHORIZATION)
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error requesting cancellation: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Finds the declaration for a step
            #
            # @param name [Symbol] Step to find
            # @return [Step] Registered step declaration
            # @raise [ArgumentError] If the step is unknown
            def step_for(name)
                @definition.step(name)
            end

            # Finds an external event declaration.
            #
            # @param name [Symbol] Event name
            # @return [Event] Registered event declaration
            # @raise [ArgumentError] If the event is unknown
            def event_for(name)
                @definition.event(name)
            end

            # Dispatches an external event to its declared workflow handler.
            #
            # @param owner_id [String, Integer] Persistent owner identifier
            # @param name [Symbol] Declared event name
            # @param args [Hash] Event arguments passed to the handler
            # @return [Object, OpenNebula::Error] Event result value or an error
            def dispatch_event(owner_id, name, **args)
                @event_exec.dispatch(owner_id, name, **args)
            end

            # Resolves a wait under the owner lock
            #
            # A new wait is persisted only when its predicate remains false. A satisfied
            # wait applies the step's normal success transition directly, so the step is
            # never rerun and no runtime job needs to remain tracked.
            #
            # @param resource [Object] Locked persistent owner
            # @param job [Job] Runtime identity for the current durable step
            # @param wait [Job::Wait] Wait outcome or reconstructed descriptor
            # @param dependencies [Hash] Dependencies loaded for the step
            # @param persist [Boolean] Whether to store a newly returned wait
            # @return [ExecResult] Wait resolution
            def resolve_wait!(resource, job, wait, dependencies, persist: false)
                step = step_for(job.step)
                @definition.validate_wait!(step, wait)

                satisfied = execute_handler(wait.check, resource, job.args, dependencies)

                raise(
                    ArgumentError, "Wait check #{wait.check} must return true or false"
                ) unless [true, false].include?(satisfied)

                unless satisfied
                    result = resource.wait_job!(job, wait) if persist
                    return result if result && !result.ok?

                    return ExecResult.waiting
                end

                transition = resolve_success(step, Job.success, :failure_state => job.failure_state)
                persisted  = transition!(resource, job, transition)
                return persisted unless persisted.ok?

                ExecResult.ok(transition)
            end

            # Persists and starts declarative child workflow requests.
            def start_children(job, outcome)
                @composition.start(job, outcome)
            end

            # Persists and resolves a parent failure only after its child
            # operations have been safely cancelled or otherwise accounted for.
            def fail_children(job, state, message)
                @composition.fail(job, state, message)
            end

            # Reconnects and re-evaluates a durable child wait.
            def resume_children(resource)
                public_result(@composition.resume(resource))
            end

            # Reloads one durable operation and reconnects its current execution point.
            #
            # The persisted owner context is authoritative. A queued notification may be
            # duplicated or stale, so only the matching operation is resumed or scheduled.
            #
            # @param owner_id [String, Integer] Persistent owner identifier
            # @param operation_id [String] Durable lifecycle operation identifier
            # @return [ExecResult] Reconciliation outcome
            def reconcile_operation(owner_id, operation_id)
                resource = nil

                rc = pool.get(owner_id, nil) do |current|
                    context = current.active_job
                    next unless context&.id == operation_id.to_s
                    next if self.class.failure_states.value?(current.state)
                    next if self.class.stable_states.include?(current.state)

                    resource = current
                end

                return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                return ExecResult.stale unless resource

                relation = validate_parent_relation(resource)
                return relation if relation.retry?
                return fail_reconciled_operation(resource, relation.value) \
                    if relation.error?
                return cancel_reconciled_child(resource) if relation.value == :cancel

                context = resource.active_job
                job     = build_job(resource)
                return fail_reconciled_operation(resource, job) \
                    if OpenNebula.is_error?(job)

                return @composition.resume_failure(resource) if context.failing?

                if context.waiting? && !context.cancellation &&
                   !context.wait.is_a?(Job::ChildrenWait)
                    result = resume_wait_result(resource)
                    return schedule_reconciliation_failure(resource, result.value) \
                        if result.error?

                    return result
                end

                result = if context.waiting? && !context.cancellation
                             @composition.resume(resource)
                         else
                             scheduled = scheduler.schedule(job)
                             if OpenNebula.is_error?(scheduled)
                                 ExecResult.retry(scheduled)
                             else
                                 ExecResult.ok(scheduled)
                             end
                         end

                return result unless result.ok?

                reconciliation_state(owner_id, operation_id, result.value)
            rescue StandardError => e
                ExecResult.retry(
                    OpenNebula::Error.new(
                        "Error reconciling workflow operation: #{e.message}",
                        OpenNebula::Error::EACTION
                    )
                )
            end

            # Cascades cancellation to children owned by this parent operation.
            def cancel_children(job)
                @composition.cancel(job)
            end

            # Prevents a reconstructed child from running when its durable
            # parent is cancelling or has already become terminal.
            def cancel_reconciled_child(resource)
                context = resource.active_job
                return ExecResult.stale unless context

                if context.cancelling?
                    result = schedule(resource)
                    return ExecResult.retry(result) if OpenNebula.is_error?(result)

                    return ExecResult.ok(result)
                end

                result = request_cancellation(
                    resource.id, context.external_user
                )
                return ExecResult.retry(result) if OpenNebula.is_error?(result)

                ExecResult.ok(result)
            rescue StandardError => e
                ExecResult.retry(
                    OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
                )
            end

            # Moves one authoritatively invalid durable operation to its failure state.
            # The snapshot is revalidated under the owner lock before it is changed.
            def fail_orphan(resource, message)
                context       = resource.active_job
                external_user = context&.external_user
                result        = nil

                rc = pool.get(resource.id, external_user) do |item|
                    next unless item.active_job == context

                    state = self.class.failure_states[item.state]
                    next unless state

                    result = item.fail_orphan_job!(state, message)
                end

                error   = rc if OpenNebula.is_error?(rc)
                error ||= result.value if result&.error?
                return true unless error

                Log.error(
                    JobScheduler::COMP,
                    "Could not fail #{resource.class::RESOURCE_NAME} #{resource.id}: " \
                    "#{error.message}",
                    resource.id
                )
                error
            end

            # Invokes a child wait predicate with unlocked child snapshots.
            def execute_child_predicate(handler, resource, args, children)
                execute_handler(handler, resource, args.merge(:children => children), {})
            end

            # Creates or reuses a child operation under only the child owner lock.
            def request_child(child, parent:, actor:)
                result = nil

                rc = pool.get(child.owner_id, actor) do |resource|
                    context = resource.active_job

                    if context
                        if child.operation_id.nil? &&
                           (context.step != child.step || context.args != child.args)
                            result = ExecResult.error(
                                relation_error(
                                    "Child #{id} #{child.owner_id} has incompatible " \
                                    'step or arguments for the parent request'
                                )
                            )
                            next
                        end

                        observation = inspect_child(child, resource, parent)
                        if observation.relationship_error?
                            result = ExecResult.error(relation_error(observation.error))
                            next
                        end

                        result = ExecResult.ok(
                            :status => observation.status,
                            :operation_id => observation.operation_id
                        )
                        next
                    end

                    step = step_for(child.step)
                    raise ArgumentError, "Job step #{step.name} has no declared state" \
                        unless step.state

                    resource.begin_job!(
                        :step          => child.step,
                        :state         => step.state,
                        :args          => child.args,
                        :external_user => actor,
                        :parent        => parent
                    )
                    operation_id = resource.active_job.id
                    result = ExecResult.ok(
                        :status => :active, :operation_id => operation_id
                    )
                end

                if OpenNebula.is_error?(rc)
                    return ExecResult.ok(:status => :missing, :operation_id => nil) \
                        if missing_resource?(rc)

                    return ExecResult.retry(rc)
                end

                result
            rescue ArgumentError => e
                ExecResult.error(relation_error("Error requesting child action: #{e.message}"))
            rescue StandardError => e
                ExecResult.retry(relation_error("Error requesting child action: #{e.message}"))
            end

            # Runs a failed child's declared cancellation cleanup and releases
            # its durable context. This is intentionally limited to terminal
            # failure states, where no runtime worker remains active.
            def discard_failed_child(child, parent:, actor:)
                result = nil

                rc = pool.get(child.owner_id, actor) do |resource|
                    context = resource.active_job

                    unless context
                        status = if self.class.stable_states.include?(resource.state)
                                     :complete
                                 else
                                     :missing
                                 end
                        result = ExecResult.ok(status)
                        next
                    end

                    mismatch = child_relation_mismatch(child, context, parent)
                    if mismatch && !orphaned_failed_child?(context, parent)
                        result = ExecResult.error(relation_error(mismatch))
                        next
                    end

                    unless self.class.failure_states.value?(resource.state)
                        result = ExecResult.error(
                            relation_error(
                                "Child #{id} #{child.owner_id} is still executing in " \
                                "#{resource.state}"
                            )
                        )
                        next
                    end

                    unless context.cancelled?
                        step = step_for(context.step)

                        unless step.cancelable?
                            result = ExecResult.error(
                                relation_error(
                                    "Child #{id} #{child.owner_id} #{context.step} " \
                                    'has no cleanup action'
                                )
                            )
                            next
                        end

                        outcome = cancel(resource, resource.build_job(id), step)
                        unless outcome.is_a?(Job::Failure)
                            result = ExecResult.error(
                                relation_error(
                                    "Child #{id} #{child.owner_id} cleanup did not fail its action"
                                )
                            )
                            next
                        end
                    end

                    result = resource.discard_job!(context)
                end

                return ExecResult.ok(:missing) \
                    if OpenNebula.is_error?(rc) && missing_resource?(rc)
                return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                return result unless result&.ok?

                ExecResult.ok(:discarded)
            rescue ArgumentError => e
                ExecResult.error(relation_error("Error discarding child action: #{e.message}"))
            rescue StandardError => e
                ExecResult.retry(relation_error("Error discarding child action: #{e.message}"))
            end

            # Enqueues a child only after both relationship sides are durable.
            def schedule_child(child, parent:)
                result           = nil
                waiting_resource = nil
                rc = pool.get(child.owner_id, nil) do |resource|
                    observation = inspect_child(child, resource, parent)
                    if observation.relationship_error?
                        result = ExecResult.error(relation_error(observation.error))
                        next
                    end

                    unless observation.status == :active
                        result = ExecResult.ok(observation.status)
                        next
                    end

                    context = resource.active_job
                    if context.waiting?
                        waiting_resource = resource
                        result = ExecResult.ok(context.id)
                    else
                        scheduled = schedule(resource)
                        result = if OpenNebula.is_error?(scheduled)
                                     ExecResult.retry(scheduled)
                                 else
                                     ExecResult.ok(scheduled)
                                 end
                    end
                end

                return ExecResult.ok(:missing) \
                    if OpenNebula.is_error?(rc) && missing_resource?(rc)
                return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                return result unless waiting_resource

                resumed = resume_wait_result(waiting_resource)
                return resumed if resumed.retry? || resumed.error? || resumed.stale?

                ExecResult.ok(resumed.value)
            rescue StandardError => e
                ExecResult.retry(relation_error("Error scheduling child action: #{e.message}"))
            end

            # Reads a child state and proves its durable relationship.
            def observe_child(child, parent:)
                observation = nil
                rc = pool.get(child.owner_id, nil) do |resource|
                    observation = inspect_child(child, resource, parent)
                end

                if OpenNebula.is_error?(rc)
                    return child_observation(child, nil, :missing, child.operation_id, rc.message) \
                        if missing_resource?(rc)

                    return ExecResult.retry(rc)
                end

                observation
            rescue StandardError => e
                ExecResult.retry(
                    OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
                )
            end

            # Requests cancellation only when the child is owned by the given parent.
            def cancel_child(child, parent:, actor:)
                result = nil
                rc = pool.get(child.owner_id, actor) do |resource|
                    observation = inspect_child(child, resource, parent)
                    if observation.relationship_error?
                        result = ExecResult.error(relation_error(observation.error))
                        next
                    end

                    unless Job::Child::RUNNING_STATUSES.include?(observation.status)
                        result = ExecResult.ok(observation.status)
                        next
                    end

                    if observation.status == :cancel_requested
                        result = ExecResult.ok(:requested)
                    else
                        cancelled = request_cancellation_for(resource, actor, false)
                        result = if OpenNebula.is_error?(cancelled)
                                     ExecResult.retry(cancelled)
                                 else
                                     ExecResult.ok(cancelled)
                                 end
                    end
                end

                return ExecResult.ok(:missing) \
                    if OpenNebula.is_error?(rc) && missing_resource?(rc)
                return ExecResult.retry(rc) if OpenNebula.is_error?(rc)

                result
            rescue StandardError => e
                ExecResult.retry(relation_error("Error cancelling child action: #{e.message}"))
            end

            # Recovers or reconnects an owned child operation.
            def recover_child(child, parent:, actor:)
                result           = nil
                waiting_resource = nil

                rc = pool.get(child.owner_id, actor) do |resource|
                    observation = inspect_child(child, resource, parent)
                    context = resource.active_job

                    if observation.relationship_error?
                        result = ExecResult.error(relation_error(observation.error))
                        next
                    end

                    unless context
                        result = ExecResult.ok(observation.status)
                        next
                    end

                    if observation.status == :failed
                        state = recovery_state_for(resource.state)
                        unless state
                            result = ExecResult.error(
                                relation_error(
                                    "Child #{id} #{child.owner_id} is not recoverable from " \
                                    "#{resource.state}"
                                )
                            )
                            next
                        end

                        step_name = context.step
                        step      = step_for(step_name)
                        if !context.waiting? && step.kind == :normal && step.recover
                            step_name = :"recover_#{step.name}"
                            step      = step_for(step_name)
                        end

                        failure_state = context.failure_state
                        failure_state ||= resource.state if step.kind == :recovery
                        resource.recover_job!(
                            :state => state, :external_user => actor,
                            :step => step_name, :failure_state => failure_state
                        )
                    end

                    if resource.active_job.waiting?
                        waiting_resource = resource
                        result = ExecResult.waiting(resource.active_job.id)
                    else
                        scheduled = schedule(resource)
                        result = if OpenNebula.is_error?(scheduled)
                                     ExecResult.retry(scheduled)
                                 else
                                     ExecResult.ok(scheduled)
                                 end
                    end
                end

                return ExecResult.ok(:missing) \
                    if OpenNebula.is_error?(rc) && missing_resource?(rc)
                return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                return result unless waiting_resource

                resume_wait_result(waiting_resource)
            rescue ArgumentError => e
                ExecResult.error(relation_error("Error recovering child action: #{e.message}"))
            rescue StandardError => e
                ExecResult.retry(relation_error("Error recovering child action: #{e.message}"))
            end

            # Notifies a related parent after a child transition or event.
            def notify_parent(job)
                @composition.notify(job)
            end

            # Proves that a persisted child still belongs to a live parent operation.
            def validate_parent_relation(resource)
                context = resource.active_job
                return ExecResult.ok(:execute) unless context&.parent

                parent   = context.parent
                workflow = scheduler.workflow_for_id(parent.workflow)
                decision = nil
                persistence_error = nil

                rc = workflow.pool.get(parent.owner_id, nil) do |owner|
                    parent_context = owner.active_job
                    next unless parent_context&.id == parent.operation_id

                    child = parent_context.children.find do |candidate|
                        candidate.workflow == id &&
                            candidate.owner_id.to_s == resource.id.to_s &&
                            candidate.parent_step == parent.parent_step
                    end
                    next unless child
                    next if child.operation_id && child.operation_id != context.id
                    next if child.operation_id.nil? &&
                            (context.step != child.step || context.args != child.args)

                    if workflow.class.failure_states.value?(owner.state) ||
                       workflow.class.stable_states.include?(owner.state) ||
                       parent_context.failing? || parent_context.cancelling? ||
                       parent_context.cancelled?
                        decision = :cancel
                        next
                    end

                    next unless workflow.class.failure_states.key?(owner.state)

                    if child.operation_id.nil?
                        parent_job = workflow.build_job(owner)
                        next if OpenNebula.is_error?(parent_job)

                        children = parent_context.children.map do |candidate|
                            if candidate.equal?(child)
                                child.with(
                                    :operation_id => context.id, :status => :active,
                                    :error => nil
                                )
                            else
                                candidate
                            end
                        end
                        persisted = owner.update_job_children!(parent_job, children)
                        unless persisted.ok?
                            persistence_error = persisted.value
                            next
                        end
                    end

                    valid = parent_context.children.any? do |candidate|
                        candidate.workflow == id &&
                            candidate.owner_id.to_s == resource.id.to_s &&
                            candidate.parent_step == parent.parent_step &&
                            (candidate.operation_id.nil? ||
                             candidate.operation_id == context.id)
                    end
                    decision = :execute if valid
                end
                if OpenNebula.is_error?(rc)
                    return ExecResult.error(
                        relation_error(
                            "Child #{id} #{resource.id} #{context.step} has no current " \
                            'parent action'
                        )
                    ) if missing_resource?(rc)

                    return ExecResult.retry(rc)
                end
                return ExecResult.retry(persistence_error) if persistence_error
                return ExecResult.ok(decision) if decision

                ExecResult.error(
                    relation_error(
                        "Child #{id} #{resource.id} #{context.step} has no current parent action"
                    )
                )
            rescue KeyError
                ExecResult.error(
                    relation_error("Parent workflow #{parent.workflow} is not registered")
                )
            end

            # Applies a recovery already validated under the parent owner lock.
            def recover_locked!(resource, recovery, actor)
                context   = resource.active_job
                step_name = context.step
                step      = step_for(step_name)

                if !context.waiting? && step.kind == :normal && step.recover
                    step_name = :"recover_#{step.name}"
                    step      = step_for(step_name)
                end

                failure_state = context.failure_state
                failure_state ||= resource.state if step.kind == :recovery

                resource.recover_job!(
                    :state         => recovery.state,
                    :external_user => actor,
                    :args          => recovery.args,
                    :step          => step_name,
                    :failure_state => failure_state
                )
            end

            # Rechecks a durable wait once without reconstructing its original step
            #
            # @param resource [Object] Pool snapshot containing the wait context
            # @return [String, OpenNebula::Error] Operation or scheduled continuation ID
            def resume_wait(resource)
                operation_id = resource.active_job&.id
                result = resume_wait_result(resource)
                return operation_id if result.stale?

                result.value
            end

            # Rechecks a durable wait while preserving retryable and permanent errors.
            # Internal collaborator API used by operation reconciliation.
            def resume_wait_result(resource)
                context = resource.active_job
                raise ArgumentError, 'Resource has no durable wait' \
                    unless context&.waiting?

                step_name     = context.step
                operation_id  = context.id
                external_user = context.external_user
                step          = step_for(step_name)
                next_job = nil
                result   = ExecResult.stale

                rc = pool.get(
                    resource.id, external_user, :with => step.dependencies
                ) do |current, **dependencies|
                    current_context = current.active_job
                    next unless current_context&.waiting?
                    next unless current_context.id == operation_id

                    job = build_job(current)
                    if OpenNebula.is_error?(job)
                        result = ExecResult.error(job)
                        next
                    end

                    resolution = resolve_wait!(
                        current, job, current_context.wait, dependencies
                    )
                    result = if resolution.waiting?
                                 ExecResult.waiting(operation_id)
                             else
                                 resolution
                             end
                    next unless resolution.ok?

                    if resolution.value.is_a?(Job::Next)
                        next_job = job.next(resolution.value)
                    else
                        result = ExecResult.ok(operation_id)
                    end
                end

                return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                return result unless next_job

                scheduled = scheduler.schedule(next_job)
                return ExecResult.retry(scheduled) if OpenNebula.is_error?(scheduled)

                ExecResult.ok(scheduled)
            rescue StandardError => e
                ExecResult.error(
                    OpenNebula::Error.new(
                        "Error resuming workflow wait: #{e.message}",
                        OpenNebula::Error::EACTION
                    )
                )
            end
            private :resume_wait_result

            # Invokes a workflow callback with its owner and durable arguments.
            # @param handler [Symbol] Public workflow method to invoke
            # @param resource [Object] Persistent owner of the job
            # @param args [Hash] Keyword arguments stored in the job
            # @param dependencies [Hash] Keyword dependencies loaded by the pool
            # @return [Object] Value returned by the callback
            # @raise [NameError, ArgumentError] If the callback or arguments are invalid
            def execute_handler(handler, resource, args, dependencies)
                public_send(handler, resource, **args, **dependencies)
            end

            # Converts supported callback values to a job outcome.
            def normalize_outcome(outcome)
                return Job.fail(outcome.message) if OpenNebula.is_error?(outcome)
                return outcome if outcome.is_a?(Job::Outcome)

                Job.fail("Invalid job step result #{outcome.inspect}")
            end

            # Invokes a single Ruby task outside the owner pool lock
            # @param task [Symbol] Public task method to invoke
            # @param args [Hash] Runtime task arguments
            # @param cancel_flag [CancelFlag] Cooperative cancellation flag
            # @return [Object] Value returned by the task
            # @raise [NameError, ArgumentError] If the task or arguments are invalid
            def execute_thread(task, args, cancel_flag)
                public_send(task, **args, :cancel_flag => cancel_flag)
            end

            # Invokes one item of a Ruby thread pool outside the owner pool lock
            # @param task [Symbol] Public task method to invoke
            # @param item [Object] Thread pool item assigned to the task
            # @param args [Hash] Runtime task arguments shared by all items
            # @param cancel_flag [CancelFlag] Cooperative cancellation flag
            # @return [Object] Value returned by the task
            # @raise [NameError, ArgumentError] If the task or arguments are invalid
            def execute_thread_pool(task, item, args, cancel_flag)
                public_send(task, item, **args, :cancel_flag => cancel_flag)
            end

            # Applies the result of a single Ruby task under the owner pool lock
            # @param commit [Symbol] Public commit method to invoke
            # @param resource [Object] Fresh persistent job owner
            # @param result [Object] Value returned by the task
            # @param args [Hash] Runtime task arguments
            # @return [Object] Value returned by the commit
            # @raise [NameError, ArgumentError] If the commit or arguments are invalid
            def commit_thread(commit, resource, result, args)
                public_send(commit, resource, result, **args)
            end

            # Applies one Ruby thread pool result under the owner pool lock
            # @param commit [Symbol] Public commit method to invoke
            # @param resource [Object] Fresh persistent job owner
            # @param item [Object] Thread pool item that completed
            # @param result [Object] Value returned by the task
            # @param args [Hash] Runtime task arguments shared by all items
            # @return [Object] Value returned by the commit
            # @raise [NameError, ArgumentError] If the commit or arguments are invalid
            def commit_thread_pool(commit, resource, item, result, args)
                public_send(commit, resource, item, result, **args)
            end

            # Checks whether a step declares cancellation behavior.
            #
            # @param step [Symbol] Step to inspect
            # @return [Boolean] true when the step can be cancelled
            # @raise [ArgumentError] If the step is unknown
            def cancelable?(step)
                step_for(step).cancelable?
            end

            # Returns the standard user cancellation failure
            # @param _resource [Object] Persistent owner of the job
            # @param _opts [Hash] Arguments stored in the job
            # @return [Job::Failure] Standard cancellation outcome
            def cancelable(_resource, **_opts)
                Job.fail('Cancelled by user')
            end

            # Runs the callback declared for a cancelled step.
            #
            # @param resource [Object] Persistent owner of the job
            # @param job [Job] Runtime job being cancelled
            # @param step [Step] Current step declaration
            # @return [Job::Failure] Cancellation outcome returned by the callback
            # @raise [ArgumentError] If the step is not cancelable or the result is invalid
            def cancel(resource, job, step)
                raise ArgumentError, "Job step #{step.name} cannot be cancelled" \
                    unless step.cancelable?

                outcome = public_send(step.on_cancel, resource, **job.args)
                return outcome if outcome.is_a?(Job::Failure)

                raise ArgumentError,
                      "Cancellation callback #{step.on_cancel} must return Job.fail"
            end

            # Returns the terminal failure state for an owner state
            # @param state [Symbol] Current owner state
            # @return [Symbol] Failure state declared by the workflow
            # @raise [ArgumentError] If the state has no failure mapping
            def failure_state_for(state)
                self.class.failure_states.fetch(state)
            rescue KeyError
                raise ArgumentError, "No failure state declared for #{state}"
            end

            # Resolves a step success against its declaration and destination.
            #
            # @param step [Step] Declaration of the step that succeeded
            # @param success [Job::Success] Success name and forwarded arguments
            # @param failure_state [Symbol, nil] Failure state inherited by the current job
            # @return [Job::Next, Job::Complete] Resolved transition
            # @raise [ArgumentError] If forwarded arguments are invalid
            def resolve_success(step, success, failure_state: nil)
                outcome = step.resolve_success(success)

                if outcome.is_a?(Job::Next)
                    target    = step_for(outcome.step)
                    failure   = outcome.failure_state
                    failure ||= failure_state || step.failure_for if target.failure.nil?

                    outcome = Job.next(
                        target.name,
                        :state   => outcome.state || target.state,
                        :args    => outcome.args,
                        :failure => failure
                    )
                end

                return outcome unless success.args
                raise ArgumentError, "Job step #{step.name} cannot pass args to completion" \
                    unless outcome.is_a?(Job::Next)

                Job.next(
                    outcome.step,
                    :state   => outcome.state,
                    :args    => success.args,
                    :failure => outcome.failure_state
                )
            end

            # Resolves a step failure against its declaration.
            #
            # @param step [Step] Declaration of the step that failed
            # @param failure [Job::Failure] Failure name and message
            # @return [Symbol] Selected terminal failure state
            # @raise [ArgumentError] If the failure name is invalid
            def resolve_failure(step, failure)
                step.resolve_failure(failure)
            end

            # Builds and schedules the current persisted owner job
            #
            # @param resource [Object] Persistent resource containing the job context
            # @return [String] Identifier of the scheduled or previously tracked job
            # @return [OpenNebula::Error] If the job cannot be reconstructed or scheduled
            # @raise [RuntimeError] If the workflow has no scheduler
            def schedule(resource)
                raise 'Job workflow has no scheduler' unless scheduler

                job = build_job(resource)
                return job if OpenNebula.is_error?(job)

                scheduler.schedule(job)
            end

            # Reconciles persisted non-failed, non-stable jobs at server startup
            #
            # Failed jobs are left untouched for explicit recovery; stable states declare
            # completed work and are never reconstructed even if malformed data retains an
            # active job context
            #
            # @raise [RuntimeError] If the workflow has no scheduler
            def catch_up
                raise 'Job workflow has no scheduler' unless scheduler

                result = reconcile_startup
                scheduler.retry_startup(:workflow => id) if OpenNebula.is_error?(result)
                result
            end

            # Performs one startup discovery pass.
            # Internal collaborator API used by the scheduler reconciliation queue.
            def reconcile_startup
                @startup_reconciler.run
            end

            # Reconstructs a job from the active context of a persistent owner
            #
            # @param resource [Object] Persistent resource containing the job context
            # @return [Job] Reconstructed job
            # @return [OpenNebula::Error] If the step is invalid or reconstruction fails
            def build_job(resource)
                step_for(resource.active_job&.step)
                resource.build_job(id)
            rescue StandardError => e
                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            # Checks whether a job still matches the persisted owner context
            #
            # @param resource [Object] Persistent owner of the job
            # @param job [Job] Job expected to be current
            # @return [Boolean] true when the job is still current
            def current?(resource, job)
                resource.active_job?(job)
            end

            # Persists a successful continuation or completion
            #
            # @param resource [Object] Persistent owner of the job
            # @param job [Job] Job whose active context is being transitioned
            # @param outcome [Job::Next, Job::Complete] Transition to persist
            # @return [Object] Persistence result returned by the owner
            def transition!(resource, job, outcome)
                resource.transition_job!(job, outcome)
            end

            # Persists a terminal lifecycle failure
            #
            # @param resource [Object] Persistent owner of the job
            # @param job [Job] Job that failed
            # @param state [Symbol] Failure state to persist
            # @param message [String] Failure description
            # @return [Object] Persistence result returned by the owner
            def fail!(resource, job, state, message)
                resource.fail_job!(job, state, message)
            end

            # Persists a cancelled lifecycle operation in its failure state
            # @param resource [Object] Persistent owner of the job
            # @param job [Job] Runtime job being cancelled
            # @param state [Symbol] Failure state to persist
            # @param message [String] Cancellation description
            # @return [Object] Persistence result returned by the owner
            def cancel!(resource, job, state, message)
                resource.cancel_job!(job, state, message)
            end

            # Builds a human readable label for job logs
            #
            # @param job [Job] Job to identify
            # @return [String] Resource name, owner identifier and step
            def job_label(job)
                resource_name = pool.class::DOCUMENT_CLASS::RESOURCE_NAME

                "#{resource_name} #{job.owner_id} #{job.step}"
            end

            private

            def public_result(result)
                return result unless result.is_a?(ExecResult)
                return result.value if result.ok? || result.waiting? ||
                                       result.retry? || result.error? || result.cancelled?

                nil
            end

            def schedule_reconciliation_failure(resource, error)
                job = build_job(resource)
                return ExecResult.error(job) if OpenNebula.is_error?(job)

                job.failure_outcome = Job.fail(error.message)
                scheduled = scheduler.schedule(job)
                return ExecResult.retry(scheduled) if OpenNebula.is_error?(scheduled)

                ExecResult.ok(scheduled)
            end

            def fail_reconciled_operation(resource, error)
                Log.error(
                    JobScheduler::COMP,
                    "Could not reconnect #{resource.class::RESOURCE_NAME} #{resource.id}: " \
                    "#{error.message}",
                    resource.id
                )
                failed = fail_orphan(resource, error.message)
                return ExecResult.retry(failed) if OpenNebula.is_error?(failed)

                ExecResult.stale
            end

            def reconciliation_state(owner_id, operation_id, value)
                waiting = false
                current = false

                rc = pool.get(owner_id, nil) do |resource|
                    context = resource.active_job
                    next unless context&.id == operation_id.to_s
                    next if self.class.failure_states.value?(resource.state)
                    next if self.class.stable_states.include?(resource.state)

                    current = true
                    waiting = context.waiting?
                end

                return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                return ExecResult.stale unless current
                return ExecResult.waiting(operation_id) if waiting

                ExecResult.ok(value)
            end

            def child_relation_mismatch(child, context, parent)
                return "Child #{id} #{child.owner_id} #{child.step} is owned by another " \
                    'active action' \
                    unless context.parent == parent
                return unless child.operation_id && context.id != child.operation_id

                "Child #{id} #{child.owner_id} #{child.step} is associated with a different " \
                    'active action'
            end

            # A failed parent may have been replaced by an older implementation
            # before its children were released. The explicit discard path may
            # clean that orphan only when it still belongs to this same parent
            # owner and workflow; its operation id (and therefore ownership) is
            # deliberately different.
            def orphaned_failed_child?(context, parent)
                stale_parent = context.parent
                stale_parent &&
                    stale_parent.workflow == parent.workflow &&
                    stale_parent.owner_id == parent.owner_id &&
                    stale_parent.operation_id != parent.operation_id
            end

            def inspect_child(child, resource, parent)
                context = resource.active_job

                if context
                    mismatch = child_relation_mismatch(child, context, parent)
                    return child_observation(
                        child, resource, :failed, child.operation_id, mismatch,
                        :relationship_error => true
                    ) if mismatch

                    return child_observation(
                        child, resource, :cancelled, context.id,
                        resource_error(resource)
                    ) if context.cancelled?

                    return child_observation(
                        child, resource, :failed, context.id,
                        resource_error(resource)
                    ) if self.class.failure_states.value?(resource.state)

                    status = context.cancelling? ? :cancel_requested : :active
                    return child_observation(child, resource, status, context.id)
                end

                return child_observation(
                    child, resource, :complete, child.operation_id
                ) if self.class.stable_states.include?(resource.state)

                return child_observation(
                    child, resource, :failed, child.operation_id,
                    resource_error(resource)
                ) if self.class.failure_states.value?(resource.state)

                child_observation(
                    child, resource, :failed, child.operation_id,
                    "Child #{id} #{child.owner_id} #{child.step} has no durable job in " \
                    "#{resource.state}",
                    :relationship_error => true
                )
            end

            def child_observation(
                child, resource, status, operation_id, error = nil,
                relationship_error: false
            )
                child = child.with(
                    :status => status,
                    :operation_id => operation_id || child.operation_id,
                    :error => error
                )
                Composition::Observation.new(
                    :child => child, :resource => resource,
                    :relationship_error => relationship_error
                ).freeze
            end

            def resource_error(resource)
                error = resource.respond_to?(:error) ? resource.error : nil
                error&.dig(:message) || error&.dig('message') || resource.state.to_s
            end

            def recovery_state_for(failure_state)
                states = self.class.failure_states.select do |_state, failure|
                    failure == failure_state
                end.keys

                states.one? ? states.first : nil
            end

            def missing_resource?(value)
                OpenNebula.is_error?(value) &&
                    value.errno == OpenNebula::Error::ENO_EXISTS
            end

            def relation_error(message)
                OpenNebula::Error.new(message, OpenNebula::Error::EACTION)
            end

            # Requests cancellation for a pool-locked resource
            #
            # @param resource [Object] Persistent job owner locked by its pool
            # @param actor [String] User requesting the cancellation
            # @param oneadmin [Boolean] Whether the actor belongs to the oneadmin group
            # @return [Symbol, OpenNebula::Error] requested or an error
            def request_cancellation_for(resource, actor, oneadmin)
                context = resource.active_job

                return OpenNebula::Error.new(
                    "Resource #{resource.id} has no active step to cancel",
                    OpenNebula::Error::EACTION
                ) unless context

                return context.cancellation[:status] if context.cancellation

                return OpenNebula::Error.new(
                    "Resource #{resource.id} cannot be cancelled while it is #{resource.state}",
                    OpenNebula::Error::EACTION
                ) unless self.class.failure_states.key?(resource.state)

                return OpenNebula::Error.new(
                    "Step #{context.step} cannot be cancelled",
                    OpenNebula::Error::EACTION
                ) unless cancelable?(context.step)

                operation_id = resource.request_job_cancellation!(
                    :actor => actor, :oneadmin => oneadmin
                )

                result = schedule(resource)
                return result if OpenNebula.is_error?(result)

                result = scheduler.cancel(resource.id, operation_id)
                return result if OpenNebula.is_error?(result)

                case result
                when :requested
                    :requested
                when :not_found
                    OpenNebula::Error.new(
                        "Active #{context.step} action is not tracked by the scheduler",
                        OpenNebula::Error::EACTION
                    )
                else
                    OpenNebula::Error.new(
                        "Unexpected cancellation result for active #{context.step} action",
                        OpenNebula::Error::EACTION
                    )
                end
            end

        end

    end

end
