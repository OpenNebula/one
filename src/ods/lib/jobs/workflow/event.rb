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

        class JobWorkflow

            # Immutable declaration for one workflow event.
            class Event

                attr_reader :name, :handler, :dependencies

                def initialize(name, handler, dependencies)
                    @name         = name
                    @handler      = handler
                    @dependencies = dependencies

                    freeze
                end

                def resolves?(wait)
                    wait.events.include?(name)
                end

                def handle(workflow, resource, args, dependencies)
                    result = workflow.execute_handler(handler, resource, args, dependencies)
                    return result if result.is_a?(EventResult::Result)

                    raise ArgumentError,
                          "Event handler #{handler} must return " \
                          'EventResult.handled, EventResult.ignore or EventResult.fail'
                end

            end

            # Dispatches workflow events and resumes durable waits.
            class EventExec

                def initialize(workflow)
                    @workflow = workflow
                end

                def dispatch(owner_id, name, **args)
                    event      = @workflow.event_for(name)
                    value      = nil
                    next_job   = nil
                    child_job  = nil
                    failed_job = nil

                    rc = @workflow.pool.get(
                        owner_id, nil, :with => event.dependencies
                    ) do |resource, **dependencies|
                        child_job = @workflow.build_job(resource) if resource.active_job
                        child_job = nil if OpenNebula.is_error?(child_job)
                        event_result = event.handle(@workflow, resource, args, dependencies)
                        value        = event_result.value
                        context      = resource.active_job

                        if context && event_result.is_a?(EventResult::Failed) &&
                           (!context.waiting? || event.resolves?(context.wait))
                            failing_job = @workflow.build_job(resource)
                            next failing_job if OpenNebula.is_error?(failing_job)

                            unless resource.cancellation_requested?(failing_job)
                                step    = @workflow.step_for(failing_job.step)
                                failure = Job.fail(event_result.message)
                                state   = failing_job.failure_state ||
                                          step.resolve_failure(failure)
                                result  = @workflow.fail!(
                                    resource, failing_job, state, failure.message
                                )

                                next result.value if result.error?

                                failed_job = failing_job
                                next
                            end
                        end

                        if context&.waiting?
                            waiting_job = @workflow.build_job(resource)
                            next waiting_job if OpenNebula.is_error?(waiting_job)

                            step = @workflow.step_for(waiting_job.step)

                            if event.resolves?(context.wait) &&
                               !resource.cancellation_requested?(waiting_job)
                                check_dependencies = dependencies.slice(*step.dependencies)
                                result = @workflow.resolve_wait!(
                                    resource, waiting_job, context.wait, check_dependencies
                                )

                                next result.value if result.error?

                                if result.ok? && result.value.is_a?(Job::Next)
                                    next_job = waiting_job.next(result.value)
                                    next
                                end

                                next if result.ok? && result.value.is_a?(Job::Complete)
                            end
                        end

                        next unless event_result.is_a?(EventResult::Handled)

                        update = resource.update
                        next update if OpenNebula.is_error?(update)
                    end

                    return rc if OpenNebula.is_error?(rc)

                    if failed_job
                        Log.error(
                            JobScheduler::COMP,
                            "#{@workflow.job_label(failed_job)} failed: #{value}",
                            failed_job.owner_id
                        )
                    end

                    @workflow.notify_parent(child_job) if child_job

                    if next_job
                        scheduled = @workflow.scheduler.schedule(next_job)
                        return scheduled if OpenNebula.is_error?(scheduled)
                    end

                    value
                rescue StandardError => e
                    OpenNebula::Error.new(
                        "Error dispatching workflow event #{name}: #{e.message}",
                        OpenNebula::Error::EACTION
                    )
                end

            end

        end

    end

end
