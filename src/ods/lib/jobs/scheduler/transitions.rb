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

            # Resolves and persists lifecycle transitions.
            class JobTrans

                def cancel(workflow, job, step, ensure_failure = nil, finalized: false)
                    unless job.children.empty?
                        children = workflow.cancel_children(job)
                        return children unless children.ok?
                    end

                    result = nil

                    rc = workflow.pool.get(job.owner_id, job.external_user) do |resource|
                        unless workflow.current?(resource, job) &&
                               resource.cancellation_requested?(job)
                            result = ExecResult.stale
                            next
                        end

                        ensure_failure = finalizer_locked(workflow, resource, job, step) \
                            unless finalized || resource.active_job.waiting?

                        result = cancel_locked(
                            workflow, resource, job, step, ensure_failure
                        )
                    end

                    return pool_error(rc) if OpenNebula.is_error?(rc)
                    return result unless result&.ok?

                    Log.warn(
                        JobScheduler::COMP,
                        "#{workflow.job_label(job)} cancelled",
                        job.owner_id
                    )
                    workflow.notify_parent(job)
                    ExecResult.cancelled
                rescue StandardError => e
                    error(e)
                end

                def resolve_children(workflow, job, _step, children)
                    workflow.start_children(job, children)
                rescue StandardError => e
                    error(e)
                end

                def resolve_wait(workflow, job, step, wait)
                    result    = nil
                    cancelled = false

                    rc = workflow.pool.get(
                        job.owner_id, job.external_user, :with => step.dependencies
                    ) do |resource, **dependencies|
                        unless workflow.current?(resource, job)
                            result = ExecResult.stale
                            next
                        end

                        if resource.cancellation_requested?(job)
                            result    = cancel_locked(workflow, resource, job, step)
                            cancelled = true
                            next
                        end

                        result = workflow.resolve_wait!(
                            resource, job, wait, dependencies, :persist => true
                        )
                    end

                    return pool_error(rc) if OpenNebula.is_error?(rc)

                    unless cancelled && result&.ok?
                        workflow.notify_parent(job) if result&.ok?
                        return result
                    end

                    Log.warn(
                        JobScheduler::COMP,
                        "#{workflow.job_label(job)} cancelled",
                        job.owner_id
                    )
                    workflow.notify_parent(job)
                    ExecResult.cancelled
                rescue StandardError => e
                    error(e)
                end

                def transition(workflow, job, outcome)
                    result    = nil
                    cancelled = false

                    rc = workflow.pool.get(job.owner_id, job.external_user) do |resource|
                        unless workflow.current?(resource, job)
                            result = ExecResult.stale
                            next
                        end

                        if resource.cancellation_requested?(job)
                            step      = workflow.step_for(job.step)
                            result    = cancel_locked(workflow, resource, job, step)
                            cancelled = true
                            next
                        end

                        result = workflow.transition!(resource, job, outcome)
                    end

                    return pool_error(rc) if OpenNebula.is_error?(rc)

                    unless cancelled && result&.ok?
                        workflow.notify_parent(job) if result&.ok?
                        return result
                    end

                    Log.warn(
                        JobScheduler::COMP,
                        "#{workflow.job_label(job)} cancelled",
                        job.owner_id
                    )
                    workflow.notify_parent(job)
                    ExecResult.cancelled
                rescue StandardError => e
                    error(e)
                end

                def complete(workflow, job, outcome)
                    if outcome.owner_deleted?
                        workflow.notify_parent(job)
                        return ExecResult.ok
                    end

                    transition(workflow, job, outcome)
                end

                def failure(workflow, job, step, outcome)
                    state =
                        if job.failure_state
                            raise ArgumentError,
                                  "Job step #{step.name} has a fixed failure state" \
                                if outcome.name

                            job.failure_state
                        else
                            step.resolve_failure(outcome)
                        end

                    fail_job(workflow, job, state, outcome.message)
                end

                def unhandled(workflow, job, step, exception)
                    step ||= workflow.step_for(job.step) if workflow
                    return ExecResult.ok unless workflow && step

                    failure(workflow, job, step, Job.fail(exception.message))
                rescue StandardError => e
                    Log.error(
                        JobScheduler::COMP,
                        "Could not handle job #{job.id} failure: #{e.message}",
                        job.owner_id
                    )
                    error(e)
                end

                private

                def finalizer_locked(workflow, resource, job, step)
                    return unless step.ensure

                    outcome = workflow.execute_handler(step.ensure, resource, job.args, {})
                    step.resolve_finalizer(workflow.normalize_outcome(outcome))
                rescue StandardError => e
                    Job.fail(e.message)
                end

                def cancel_locked(workflow, resource, job, step, ensure_failure = nil)
                    outcome = workflow.cancel(resource, job, step)
                    message = outcome.message

                    if ensure_failure.is_a?(Job::Failure)
                        message += "; ensure callback #{step.ensure} failed: " \
                                   "#{ensure_failure.message}"
                    end

                    state = workflow.failure_state_for(job.state)
                    workflow.cancel!(resource, job, state, message)
                end

                def fail_job(workflow, job, state, message)
                    return workflow.fail_children(job, state, message) \
                        unless job.children.empty?

                    result    = nil
                    cancelled = false

                    rc = workflow.pool.get(job.owner_id, job.external_user) do |resource|
                        unless workflow.current?(resource, job)
                            result = ExecResult.stale
                            next
                        end

                        if resource.cancellation_requested?(job)
                            step      = workflow.step_for(job.step)
                            result    = cancel_locked(workflow, resource, job, step)
                            cancelled = true
                            next
                        end

                        result = workflow.fail!(resource, job, state, message)
                    end

                    result = pool_error(rc) if OpenNebula.is_error?(rc)
                    log_failure_error(workflow, job, result.value) if result&.error?
                    return result if result&.error? || result&.retry? || result&.stale?

                    if cancelled
                        Log.warn(
                            JobScheduler::COMP,
                            "#{workflow.job_label(job)} cancelled",
                            job.owner_id
                        )
                        workflow.notify_parent(job)
                        return ExecResult.cancelled
                    end

                    Log.error(
                        JobScheduler::COMP,
                        "#{workflow.job_label(job)} failed: #{message}",
                        job.owner_id
                    )
                    workflow.notify_parent(job)
                    result || ExecResult.ok
                rescue StandardError => e
                    log_failure_error(workflow, job, e)
                    error(e)
                end

                def log_failure_error(workflow, job, failure)
                    Log.error(
                        JobScheduler::COMP,
                        "Could not persist #{workflow.job_label(job)} failure: " \
                        "#{failure.message}",
                        job.owner_id
                    )
                end

                def pool_error(value)
                    ExecResult.retry(value)
                end

                def error(exception)
                    value = OpenNebula::Error.new(
                        exception.message, OpenNebula::Error::EACTION
                    )
                    ExecResult.error(value)
                end

            end

        end

    end

end
