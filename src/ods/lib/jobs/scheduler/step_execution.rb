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

    module DocumentServer

        class JobScheduler

            # Mutable state for one worker execution.
            class ExecState

                attr_accessor :job

                def initialize(job:)
                    @job         = job
                    @disposition = :finish
                end

                def defer!
                    @disposition = :deferred
                end

                def wait!
                    @disposition = :waiting
                end

                def suspend!
                    @disposition = :suspended
                end

                def deferred?
                    @disposition == :deferred
                end

                def requeue_cancel?
                    @disposition == :waiting
                end

            end

            # Executes reachable workflow steps for one runtime job.
            class StepExec

                def initialize(scheduler, concurrency)
                    @scheduler = scheduler
                    @cmd        = CmdExec.new
                    @thread     = ThreadExec.new(concurrency)
                    @trans      = JobTrans.new
                end

                def call(job)
                    state    = ExecState.new(:job => job)
                    workflow = @scheduler.workflow_for(state.job)

                    loop do
                        break if state.job.shutdown_requested?

                        step = workflow.step_for(state.job.step)
                        break if cancel_execution(state, workflow, step)

                        if state.job.failure_outcome
                            persist_failure(
                                state, workflow, step, state.job.failure_outcome
                            )
                            break
                        end

                        result = run_step(workflow, state.job, step)
                        if result.retry?
                            defer(state)
                            break
                        end
                        break if result.stale? || result.stopped? ||
                                 state.job.shutdown_requested?

                        break if cancel_execution(state, workflow, step)

                        result = run_runtime(workflow, state.job, result.value)
                        if result.retry?
                            defer(state)
                            break
                        end
                        break if result.stale? || result.stopped? ||
                                 state.job.shutdown_requested?

                        outcome  = workflow.normalize_outcome(result.value)
                        finalizer = run_finalizer(workflow, state.job, step)
                        if finalizer.retry?
                            defer(state)
                            break
                        end
                        break if finalizer.stale? || finalizer.stopped? ||
                                 state.job.shutdown_requested?

                        outcome = merge_finalizer(step, outcome, finalizer.value)

                        break if cancel_execution(
                            state, workflow, step, finalizer.value, :finalized => true
                        )

                        outcome = workflow.resolve_success(
                            step, outcome, :failure_state => state.job.failure_state
                        ) if outcome.is_a?(Job::Success)

                        case outcome
                        when Job::Children, Job::Wait
                            break unless resolve_suspension(
                                state, workflow, step, outcome
                            )

                            next
                        when Job::Failure
                            # Persist the selected terminal failure state.
                            persist_failure(state, workflow, step, outcome)
                            break
                        when Job::Complete
                            # Persist terminal completion and release the job.
                            result = @trans.complete(workflow, state.job, outcome)
                            if result.retry?
                                defer(state)
                                break
                            end
                            raise result.value.message if result.error?

                            break
                        when Job::Next
                            # Persist the transition and continue with the destination step.
                            workflow.step_for(outcome.step)
                            result = @trans.transition(workflow, state.job, outcome)
                            break if result.stale? || result.cancelled?

                            if result.retry?
                                defer(state)
                                break
                            end

                            if result.error?
                                persist_failure(
                                    state, workflow, step, result.value.message
                                )
                                break
                            end

                            state.job = state.job.next(outcome)
                            @scheduler.replace(state.job)
                        else
                            raise ArgumentError, "Unexpected job outcome #{outcome.inspect}"
                        end
                    end
                rescue StandardError => e
                    unless state.job.shutdown_requested?
                        state.job.failure_outcome = Job.fail(e.message)
                        result = @trans.unhandled(workflow, state.job, step, e)
                        defer(state) if result.error? || result.retry?
                    end
                ensure
                    @scheduler.finish(
                        state.job, :requeue_cancel => state.requeue_cancel?
                    ) unless state.deferred?
                end

                private

                def resolve_suspension(state, workflow, step, outcome)
                    result =
                        if outcome.is_a?(Job::Children)
                            @trans.resolve_children(workflow, state.job, step, outcome)
                        else
                            @trans.resolve_wait(workflow, state.job, step, outcome)
                        end

                    return false if result.stale? || result.cancelled?

                    if result.retry?
                        defer(state)
                        return false
                    end

                    if result.error?
                        persist_failure(state, workflow, step, result.value.message)
                        return false
                    end

                    if result.waiting?
                        state.wait!
                        return false
                    end

                    return false if result.value.is_a?(Job::Complete)

                    state.job = state.job.next(result.value)
                    @scheduler.replace(state.job)
                    true
                end

                def persist_failure(state, workflow, step, failure)
                    failure = Job.fail(failure) unless failure.is_a?(Job::Failure)
                    state.job.failure_outcome = failure
                    result = @trans.failure(
                        workflow, state.job, step, failure
                    )
                    defer(state) if result.error? || result.retry?
                    result
                end

                def cancel_execution(
                    state, workflow, step, ensure_failure = nil, finalized: false
                )
                    return false unless state.job.cancellation_requested?

                    result = @trans.cancel(
                        workflow,
                        state.job,
                        step,
                        ensure_failure,
                        :finalized => finalized
                    )
                    defer(state) if result.error? || result.retry?
                    state.suspend! if result.waiting?

                    true
                end

                def run_step(
                    workflow, job, step, handler: step.handler, dependencies: step.dependencies
                )
                    outcome = nil
                    stale   = false

                    rc = workflow.pool.get(
                        job.owner_id, job.external_user, :with => dependencies
                    ) do |resource, **loaded_dependencies|
                        unless workflow.current?(resource, job)
                            stale = true
                            next
                        end

                        outcome = workflow.execute_handler(
                            handler, resource, job.args, loaded_dependencies
                        )
                    end

                    return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                    return ExecResult.stale if stale

                    ExecResult.ok(outcome)
                rescue StandardError => e
                    ExecResult.ok(Job.fail(e.message))
                end

                def run_runtime(workflow, job, outcome)
                    case outcome
                    when Job::Run
                        @cmd.call(job, outcome)
                    when Job::ThreadTask
                        @thread.call(workflow, job, outcome)
                    else
                        ExecResult.ok(outcome)
                    end
                end

                def run_finalizer(workflow, job, step)
                    return ExecResult.ok unless step.ensure

                    result = run_step(
                        workflow, job, step, :handler => step.ensure, :dependencies => []
                    )
                    return result if result.stale? || result.stopped? || result.retry?

                    outcome = workflow.normalize_outcome(result.value)
                    ExecResult.ok(step.resolve_finalizer(outcome))
                end

                def merge_finalizer(step, outcome, ensure_failure)
                    return outcome unless ensure_failure.is_a?(Job::Failure)
                    return ensure_failure unless outcome.is_a?(Job::Failure)

                    Job.fail(
                        "#{outcome.message}; ensure callback #{step.ensure} failed: " \
                        "#{ensure_failure.message}",
                        :name => outcome.name
                    )
                end

                def defer(state)
                    @scheduler.defer(state.job)
                    state.defer!
                end

            end

        end

    end

end
