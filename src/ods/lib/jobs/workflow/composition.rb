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

module OpenNebula

    # Provides durable workflow orchestration for Document Server resources.
    module DocumentServer

        class JobWorkflow

            # Coordinates durable parent-child workflow relationships without
            # holding parent and child owner locks at the same time. Parent
            # intent, child references, and the ChildrenWait are persisted before
            # children are requested, so recovery can reconnect the composition
            # and the parent worker is not kept waiting for child execution.
            class Composition

                Observation = Struct.new(
                    :child, :resource, :relationship_error,
                    :keyword_init => true
                ) do
                    def status
                        child.status
                    end

                    def operation_id
                        child.operation_id
                    end

                    def error
                        child.error
                    end

                    def relationship_error?
                        relationship_error == true
                    end
                end

                def initialize(workflow)
                    @workflow = workflow
                end

                # Persists the parent composition before requesting children, then
                # creates or reconnects them under their own owner locks. The
                # initial evaluation can resolve immediately when all children
                # already satisfy the wait predicate.
                def start(job, outcome)
                    step = @workflow.step_for(job.step)
                    @workflow.definition.validate_wait!(step, outcome.wait)
                    @workflow.resolve_success(
                        step,
                        Job.success(nil, :args => outcome.args),
                        :failure_state => job.failure_state
                    ) if outcome.args

                    children = outcome.descriptors(job.step)
                    children.each {|child| child_workflow(child) }

                    result = persist_intent(job, children, outcome.wait, outcome.args)
                    return result unless result.ok?

                    loaded = load_context(job)
                    return loaded unless loaded.ok?

                    job.children = loaded.value.children

                    result = ensure_requests(job)
                    return result unless result.ok?

                    evaluate(job)
                rescue StandardError => e
                    error(e.message)
                end

                # Reconnects a persisted composition after a child notification or
                # recovery without running the requesting parent step again.
                # Re-evaluation observes children first; it invokes the predicate
                # only after no child remains active or cancelling, and no terminal
                # child error was observed.
                def resume(resource)
                    job = @workflow.build_job(resource)
                    return ExecResult.error(job) if OpenNebula.is_error?(job)

                    result = ensure_requests(job)
                    return result if result.retry? || result.waiting? || result.stale?
                    return schedule_failure(job, result.value) if result.error?

                    result = evaluate(job)
                    return result if result.retry? || result.stale?
                    return schedule_failure(job, result.value) if result.error?

                    if result.waiting?
                        if job.cancellation_requested?
                            scheduled = @workflow.scheduler.schedule(job)
                            return ExecResult.retry(scheduled) \
                                if OpenNebula.is_error?(scheduled)

                            return ExecResult.ok(scheduled)
                        end

                        return ExecResult.waiting(job.operation_id)
                    end

                    return ExecResult.ok(job.operation_id) \
                        unless result.value.is_a?(Job::Next)

                    scheduled = @workflow.scheduler.schedule(job.next(result.value))
                    return ExecResult.retry(scheduled) if OpenNebula.is_error?(scheduled)

                    ExecResult.ok(scheduled)
                rescue StandardError => e
                    ExecResult.retry(
                        error_value("Error resuming child workflows: #{e.message}")
                    )
                end

                # Cascades cancellation and reports whether child finalization is pending.
                def cancel(job)
                    loaded = load_context(job)
                    return loaded unless loaded.ok?

                    context = loaded.value
                    errors = []
                    children = context.children.reject(&:terminal?)

                    children.each do |child|
                        parent = parent_reference(job, child.parent_step)
                        result = cancel_relation(
                            job, child, parent, :error_status => :cancel_requested
                        )

                        unless result.ok?
                            errors << "#{child.workflow} #{child.owner_id}: " \
                                      "#{result.value.message}"
                        end
                    end

                    return error("Could not cancel child workflows: #{errors.join('; ')}") \
                        unless errors.empty?

                    observations = children.map do |child|
                        observation = child_workflow(child).observe_child(
                            child, :parent => parent_reference(job, child.parent_step)
                        )
                        return observation if observation.is_a?(ExecResult)

                        observation
                    end

                    result = persist_observations(job, observations, :predicate => false)
                    return result unless result.ok?

                    pending = observations.any? do |observation|
                        Job::Child::RUNNING_STATUSES.include?(observation.status)
                    end

                    pending ? ExecResult.waiting : ExecResult.ok
                rescue StandardError => e
                    error(e.message)
                end

                # Persists a failure decision and compensates every child before
                # moving the parent to its terminal failure state.
                def fail(job, state, message)
                    prepared = prepare_failure(job, state, message)
                    return prepared unless prepared.ok?

                    wake(job)
                    compensate_failure(job)
                rescue StandardError => e
                    error(e.message)
                end

                # Resumes durable compensation discovered after a notification
                # or service restart.
                def resume_failure(resource)
                    context = resource.active_job
                    return ExecResult.stale unless context&.failing?

                    job = @workflow.build_job(resource)
                    return ExecResult.error(job) if OpenNebula.is_error?(job)

                    compensate_failure(job)
                rescue StandardError => e
                    ExecResult.retry(error_value(e.message))
                end

                # Recovers related children before making the parent executable again.
                def recover(resource, recovery, actor)
                    context = resource.active_job
                    parent  = Job::Parent.new(
                        :workflow => @workflow.id, :owner_id => resource.id,
                        :operation_id => context.id, :parent_step => context.step
                    )

                    step_children(context, context.step).each do |child|
                        result = child_workflow(child).recover_child(
                            child, :parent => parent, :actor => actor
                        )
                        return result unless result.ok?
                    end

                    current = nil
                    rc = @workflow.pool.get(resource.id, actor) do |parent_resource|
                        next unless parent_resource.active_job == context

                        @workflow.recover_locked!(parent_resource, recovery, actor)
                        current = parent_resource
                    end

                    return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                    return ExecResult.stale unless current

                    resume(current)
                rescue StandardError => e
                    ExecResult.retry(
                        error_value("Error recovering child workflows: #{e.message}")
                    )
                end

                # Cleans failed children under their original parent relation
                # before releasing a failed parent context for replacement.
                def discard_failed(owner_id, context, actor)
                    context.children.each do |child|
                        child_parent = parent_reference_for(context, owner_id, child.parent_step)
                        result = child_workflow(child).discard_failed_child(
                            child, :parent => child_parent, :actor => actor
                        )
                        return result unless result.ok?
                    end

                    result = nil
                    rc = @workflow.pool.get(owner_id, actor) do |resource|
                        result = resource.discard_job!(context)
                    end

                    return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                    return ExecResult.retry(result.value) if result&.error?

                    result || ExecResult.stale
                rescue StandardError => e
                    ExecResult.retry(
                        error_value("Error discarding failed child workflows: #{e.message}")
                    )
                end

                # Queues an idempotent parent recheck after a child event or transition.
                # This runs after the child owner lock is released. The parent durable
                # operation is reloaded by the reconciliation worker.
                def notify(job)
                    parent = job.parent
                    return unless parent

                    result = @workflow.scheduler.wake(
                        :workflow => parent.workflow,
                        :owner_id => parent.owner_id,
                        :operation_id => parent.operation_id
                    )
                    return result unless OpenNebula.is_error?(result)

                    Log.error(
                        JobScheduler::COMP,
                        "Could not notify parent #{parent.workflow} #{parent.owner_id}: " \
                        "#{result.message}",
                        job.owner_id
                    )

                    result
                rescue StandardError => e
                    Log.error(
                        JobScheduler::COMP,
                        "Could not notify parent #{parent.workflow} #{parent.owner_id}: " \
                        "#{e.message}",
                        job.owner_id
                    )
                end

                private

                def persist_intent(job, children, wait, args)
                    result = nil
                    rc = @workflow.pool.get(job.owner_id, job.external_user) do |resource|
                        unless @workflow.current?(resource, job)
                            result = ExecResult.stale
                            next
                        end

                        # This is the durability boundary: the parent records its
                        # new arguments, ChildrenWait, and child identities before
                        # child scheduling.
                        result = resource.compose_job!(
                            job, children, wait, :args => args
                        )
                    end

                    return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                    return ExecResult.retry(result.value) if result&.error?

                    result || ExecResult.stale
                end

                def prepare_failure(job, state, message)
                    result = nil
                    rc = @workflow.pool.get(job.owner_id, job.external_user) do |resource|
                        unless @workflow.current?(resource, job)
                            result = ExecResult.stale
                            next
                        end

                        result = resource.prepare_job_failure!(job, state, message)
                    end

                    return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                    return ExecResult.retry(result.value) if result&.error?

                    result || ExecResult.stale
                end

                def compensate_failure(job)
                    loaded = load_context(job)
                    return loaded unless loaded.ok?

                    context = loaded.value
                    return ExecResult.stale unless context.failing?
                    parent = parent_reference(job)

                    step_children(context, job.step).reject(&:terminal?).each do |child|
                        result = cancel_relation(
                            job, child, parent, :error_status => :missing
                        )
                        return result if result.retry?
                    end

                    loaded = load_context(job)
                    return loaded unless loaded.ok?

                    current = loaded.value
                    return ExecResult.stale unless current.failing?
                    return ExecResult.waiting if step_children(current, job.step).any? do |child|
                        !child.terminal?
                    end

                    finalize_failure(job)
                end

                def finalize_failure(job)
                    result  = nil
                    failure = nil
                    rc = @workflow.pool.get(job.owner_id, job.external_user) do |resource|
                        unless @workflow.current?(resource, job)
                            result = ExecResult.stale
                            next
                        end

                        context = resource.active_job
                        failure = context.pending_failure
                        unless failure && step_children(context, job.step).all?(&:terminal?)
                            result = ExecResult.waiting
                            next
                        end

                        result = @workflow.fail!(
                            resource, job, failure[:state], failure[:message]
                        )
                    end

                    return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                    return ExecResult.retry(result.value) if result&.error?
                    return result unless result&.ok?

                    Log.error(
                        JobScheduler::COMP,
                        "#{@workflow.job_label(job)} failed: #{failure[:message]}",
                        job.owner_id
                    )
                    @workflow.notify_parent(job)
                    result
                end

                def cancel_relation(job, child, parent, error_status:)
                    workflow = child_workflow(child)

                    unless child.requested?
                        observation = workflow.observe_child(child, :parent => parent)
                        return observation if observation.is_a?(ExecResult)

                        child = observation.child
                        persisted = update_child(job, child)
                        return persisted unless persisted.ok?
                        return ExecResult.ok(child) if child.terminal?
                    end

                    result = workflow.cancel_child(
                        child, :parent => parent, :actor => job.external_user
                    )
                    status =
                        if result.ok?
                            terminal_child_status(result.value) || :cancel_requested
                        elsif result.retry?
                            :cancel_requested
                        else
                            error_status
                        end
                    updated = child.with(
                        :status => status,
                        :error => result.ok? ? nil : result.value.message
                    )
                    persisted = update_child(job, updated)
                    return persisted unless persisted.ok?

                    result.ok? ? ExecResult.ok(updated) : result
                end

                def terminal_child_status(value)
                    value if Job::Child::TERMINAL_STATUSES.include?(value)
                end

                def ensure_requests(job)
                    loaded = load_context(job)
                    return loaded unless loaded.ok?

                    context = loaded.value
                    parent = parent_reference(job)

                    step_children(context, job.step).each do |child|
                        workflow = child_workflow(child)

                        if child.status == :intent
                            current = load_context(job)
                            return current unless current.ok?
                            return ExecResult.waiting if current.value.cancelling?

                            result = workflow.request_child(
                                child, :parent => parent, :actor => job.external_user
                            )

                            if result.retry?
                                persisted = update_child(
                                    job, child.with(:status => :intent,
                                                    :error => result.value.message)
                                )
                                return defer_reconciliation(job, persisted.value) \
                                    unless persisted.ok?

                                return defer_reconciliation(job, result.value)
                            end

                            if result.error?
                                persisted = update_child(
                                    job, child.with(:status => :intent,
                                                    :error => result.value.message)
                                )
                                return defer_reconciliation(job, persisted.value) \
                                    unless persisted.ok?

                                return result
                            end

                            request = result.value
                            child = child.with(
                                :status       => request[:status],
                                :operation_id => request[:operation_id],
                                :error        => nil
                            )
                            persisted = update_child(job, child)

                            unless persisted.ok?
                                return defer_reconciliation(job, persisted.value)
                            end
                        end

                        next unless child.status == :active

                        current = load_context(job)
                        return current unless current.ok?

                        parent_context = current.value
                        if parent_context.cancelling?
                            workflow.cancel_child(
                                child, :parent => parent, :actor => job.external_user
                            )
                            return ExecResult.waiting
                        end

                        scheduled = workflow.schedule_child(child, :parent => parent)
                        if scheduled.retry?
                            return defer_reconciliation(job, scheduled.value)
                        end

                        if scheduled.error?
                            persisted = update_child(
                                job, child.with(:status => :active,
                                                :error => scheduled.value.message)
                            )
                            return defer_reconciliation(job, persisted.value) \
                                unless persisted.ok?

                            return scheduled
                        end

                        status = scheduled.value
                        next unless Job::Child::TERMINAL_STATUSES.include?(status)

                        persisted = update_child(
                            job, child.with(:status => status, :error => nil)
                        )
                        return defer_reconciliation(job, persisted.value) unless persisted.ok?
                    end

                    ExecResult.ok
                end

                # Observes child snapshots without holding the parent lock, then
                # records them and evaluates the parent predicate under that lock.
                # Active children keep the parent durably suspended; failed or
                # cancelled children fail the parent instead of invoking it.
                def evaluate(job)
                    observations = observe(job)
                    return observations if observations.is_a?(ExecResult)

                    persist_observations(job, observations, :predicate => true)
                end

                def observe(job)
                    loaded = load_context(job)
                    return loaded unless loaded.ok?

                    context = loaded.value
                    parent = parent_reference(job)
                    observations = step_children(context, job.step).map do |child|
                        observation = child_workflow(child).observe_child(
                            child, :parent => parent
                        )
                        return observation if observation.is_a?(ExecResult)

                        observation
                    end

                    observations
                rescue StandardError => e
                    error(e.message)
                end

                # Persists the latest child observations before making a parent
                # decision. The predicate receives child snapshots only once no
                # child is active or cancelling and no terminal error was observed.
                def persist_observations(job, observations, predicate:)
                    result = nil
                    rc = @workflow.pool.get(job.owner_id, job.external_user) do |resource|
                        unless @workflow.current?(resource, job)
                            result = ExecResult.stale
                            next
                        end

                        context = resource.active_job

                        unless context.wait.is_a?(Job::ChildrenWait) &&
                               context.step == job.step
                            result = ExecResult.stale
                            next
                        end

                        updated = merge_observations(context.children, observations)
                        saved   = resource.update_job_children!(job, updated)
                        unless saved.ok?
                            result = saved.error? ? ExecResult.retry(saved.value) : saved
                            next
                        end

                        unless predicate
                            result = ExecResult.ok
                            next
                        end

                        if resource.cancellation_requested?(job)
                            result = ExecResult.waiting
                            next
                        end

                        failure = observations.find do |observation|
                            Job::Child::FAILURE_STATUSES.include?(
                                observation.status
                            )
                        end
                        if failure
                            result = error(child_failure_message(failure))
                            next
                        end

                        if observations.any? do |observation|
                            Job::Child::RUNNING_STATUSES.include?(observation.status)
                        end
                            result = ExecResult.waiting
                            next
                        end

                        # All remaining child operations are settled. Invoke the
                        # parent domain predicate with their resource snapshots.
                        children  = observations.map(&:resource)
                        satisfied = @workflow.execute_child_predicate(
                            context.wait.check, resource, context.args, children
                        )

                        unless [true, false].include?(satisfied)
                            result = error(
                                "Children wait check #{context.wait.check} must return " \
                                'true or false'
                            )
                            next
                        end

                        unless satisfied
                            if observations.any? {|observation| observation.status == :missing }
                                result = error(
                                    'A missing child did not satisfy the parent domain predicate'
                                )
                            else
                                # The children are known, but the parent domain is
                                # not ready yet; retain the durable wait.
                                result = ExecResult.waiting
                            end

                            next
                        end

                        # The predicate passed: resolve the declared success of the
                        # current parent step and persist that lifecycle transition.
                        step       = @workflow.step_for(job.step)
                        success    = if context.wait.forward_args?
                                         Job.success(nil, :args => context.args)
                                     else
                                         Job.success
                                     end
                        transition = @workflow.resolve_success(
                            step, success, :failure_state => job.failure_state
                        )
                        persisted = @workflow.transition!(resource, job, transition)
                        result = persisted.ok? ? ExecResult.ok(transition) : persisted
                    end

                    return ExecResult.retry(rc) if OpenNebula.is_error?(rc)

                    @workflow.notify_parent(job) if result&.ok? &&
                                                    result.value.is_a?(Job::Outcome)

                    result || ExecResult.stale
                rescue StandardError => e
                    error(e.message)
                end

                def load_context(job)
                    context = nil
                    rc = @workflow.pool.get(job.owner_id, job.external_user) do |resource|
                        context = resource.active_job if @workflow.current?(resource, job)
                    end

                    return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                    return ExecResult.stale unless context

                    ExecResult.ok(context)
                end

                def update_child(job, child)
                    result = nil
                    rc = @workflow.pool.get(job.owner_id, job.external_user) do |resource|
                        unless @workflow.current?(resource, job)
                            result = ExecResult.stale
                            next
                        end

                        children = resource.active_job.children.map do |current|
                            current.identity == child.identity ? child : current
                        end
                        result = resource.update_job_children!(job, children)
                    end

                    return ExecResult.retry(rc) if OpenNebula.is_error?(rc)

                    return ExecResult.retry(result.value) if result&.error?

                    result || ExecResult.stale
                end

                def merge_observations(children, observations)
                    observed = observations.to_h do |observation|
                        [observation.child.identity, observation.child]
                    end

                    children.map do |child|
                        observed.fetch(child.identity, child)
                    end
                end

                def step_children(context, step)
                    context.children.select {|child| child.parent_step == step }
                end

                def parent_reference(job, parent_step = job.step)
                    Job::Parent.new(
                        :workflow => @workflow.id, :owner_id => job.owner_id,
                        :operation_id => job.operation_id, :parent_step => parent_step
                    )
                end

                def parent_reference_for(context, owner_id, parent_step)
                    Job::Parent.new(
                        :workflow => @workflow.id, :owner_id => owner_id,
                        :operation_id => context.id, :parent_step => parent_step
                    )
                end

                def child_workflow(child)
                    workflow = @workflow.scheduler.workflow_for_id(child.workflow)
                    workflow.step_for(child.step)
                    workflow
                rescue KeyError
                    raise ArgumentError, "Unknown child workflow #{child.workflow}"
                end

                def child_failure_message(observation)
                    child = observation.child
                    error = observation.error.to_s.sub(
                        /\A#{Regexp.escape(child.step.to_s)} failed:\s*/i, ''
                    )

                    "Child #{child.workflow} #{child.owner_id} #{child.step} " \
                        "#{observation.status}: #{error}"
                end

                def schedule_failure(job, value)
                    failure = value.is_a?(OpenNebula::Error) ? value : error_value(value.to_s)
                    job.failure_outcome = Job.fail(failure.message)
                    scheduled = @workflow.scheduler.schedule(job)
                    return ExecResult.retry(scheduled) if OpenNebula.is_error?(scheduled)

                    ExecResult.ok(scheduled)
                end

                def defer_reconciliation(job, value)
                    wake(job)
                    Log.warn(
                        JobScheduler::COMP,
                        "Deferring #{@workflow.job_label(job)} relationship persistence: " \
                        "#{value&.message || value}",
                        job.owner_id
                    )
                    ExecResult.waiting(job.operation_id)
                end

                def wake(job)
                    result = @workflow.scheduler.wake(
                        :workflow => @workflow.id,
                        :owner_id => job.owner_id,
                        :operation_id => job.operation_id
                    )
                    if OpenNebula.is_error?(result)
                        Log.error(
                            JobScheduler::COMP,
                            "Could not queue #{@workflow.job_label(job)} reconciliation: " \
                            "#{result.message}",
                            job.owner_id
                        )
                    end

                    result
                rescue StandardError => e
                    Log.error(
                        JobScheduler::COMP,
                        "Could not queue #{@workflow.job_label(job)} reconciliation: #{e.message}",
                        job.owner_id
                    )
                    nil
                end

                def error(message)
                    ExecResult.error(error_value(message))
                end

                def error_value(message)
                    OpenNebula::Error.new(message.to_s, OpenNebula::Error::EACTION)
                end

            end

        end

    end

end
