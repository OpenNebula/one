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

            # Executes Ruby tasks returned by workflow steps.
            class ThreadExec

                # Wakes a runtime waiter either with a task result or on shutdown.
                class CompletionQueue

                    def initialize
                        @values    = []
                        @mutex     = Mutex.new
                        @condition = ConditionVariable.new
                        @closed    = false
                    end

                    def push(value)
                        @mutex.synchronize do
                            return false if @closed

                            @values << value
                            @condition.signal
                        end

                        true
                    end
                    alias << push

                    def pop
                        @mutex.synchronize do
                            @condition.wait(@mutex) until @closed || !@values.empty?
                            return [false, nil] if @closed

                            [true, @values.shift]
                        end
                    end

                    def close
                        @mutex.synchronize do
                            @closed = true
                            @values.clear
                            @condition.broadcast
                        end

                        true
                    end

                end

                private_constant :CompletionQueue

                def initialize(concurrency)
                    @concurrency = concurrency
                end

                def call(workflow, job, outcome)
                    return thread_pool(workflow, job, outcome) \
                        if outcome.is_a?(Job::ThreadPool)

                    thread(workflow, job, outcome)
                end

                private

                # Runs a single Ruby task outside the owner pool lock
                # @param workflow [JobWorkflow] Workflow that implements the task
                # @param job [Job] Runtime job that owns the task thread
                # @param outcome [Job::ThreadTask] Thread task declaration
                # @return [Job::Success, Job::Failure, Symbol] Task result
                def thread(workflow, job, outcome)
                    results = CompletionQueue.new
                    job.register_shutdown_waiter(results)
                    job.start_thread(outcome.task) do |cancel_flag|
                        result = workflow.execute_thread(outcome.task, outcome.args, cancel_flag)
                        results << result
                    rescue StandardError => e
                        results << task_error(job, e)
                    end

                    available, result = results.pop
                    return ExecResult.stopped unless available
                    return ExecResult.stopped if job.shutdown_requested?

                    failure = task_failure(result)
                    return ExecResult.ok(failure) if failure
                    return ExecResult.ok(Job.fail("#{job.step} cancelled")) \
                        if job.cancel_flag.cancelled?
                    return ExecResult.ok(outcome.result) unless outcome.commit

                    commit = commit_result(workflow, job, outcome, nil, result)
                    return commit if commit.stale? || commit.stopped?

                    ExecResult.ok(task_failure(commit.value) || outcome.result)
                rescue StandardError => e
                    return ExecResult.stopped if job.shutdown_requested?

                    ExecResult.ok(Job.fail(task_error(job, e).message))
                ensure
                    job.unregister_shutdown_waiter(results) if results
                    job.reset_cancel_flag!
                end

                # Runs one Ruby task per item and serializes successful owner commits
                # @param workflow [JobWorkflow] Workflow that implements tasks and commits
                # @param job [Job] Runtime job that owns all task threads
                # @param outcome [Job::ThreadPool] Thread pool declaration
                # @return [Job::Success, Job::Failure, Symbol] Pool result
                def thread_pool(workflow, job, outcome)
                    return ExecResult.ok(outcome.result) if outcome.items.empty?

                    if outcome.items.size > @concurrency
                        message = [
                            "Task #{outcome.task} has #{outcome.items.size} items,",
                            "exceeding the scheduler concurrency limit of #{@concurrency}"
                        ].join(' ')

                        return ExecResult.ok(Job.fail(message))
                    end

                    results = CompletionQueue.new
                    job.register_shutdown_waiter(results)
                    threads = []

                    # Start every task before consuming results so work overlaps
                    outcome.items.each do |item|
                        begin
                            threads << job.start_thread(outcome.task) do |cancel_flag|
                                result = workflow.execute_thread_pool(
                                    outcome.task, item, outcome.args, cancel_flag
                                )

                                results << [item, result]
                            rescue StandardError => e
                                results << [
                                    item,
                                    task_error(job, e)
                                ]
                            end
                        rescue StandardError => e
                            results << [
                                item,
                                task_error(job, e)
                            ]
                        end
                    end

                    failure = nil
                    stale   = false

                    # After the first failure, let workers finish but prevent more commits
                    outcome.items.size.times do
                        available, value = results.pop
                        return ExecResult.stopped unless available
                        return ExecResult.stopped if job.shutdown_requested?

                        item, result    = value
                        current_failure = task_failure(result)

                        if current_failure
                            failure ||= current_failure
                            job.cancel_flag.cancel!
                            next
                        end

                        next if failure || stale || job.cancel_flag.cancelled?
                        next unless outcome.commit

                        commit = commit_result(workflow, job, outcome, item, result)

                        return commit if commit.stopped?

                        if commit.stale?
                            stale = true
                            job.cancel_flag.cancel!
                            next
                        end

                        current_failure = task_failure(commit.value)
                        next unless current_failure

                        failure ||= current_failure
                        job.cancel_flag.cancel!
                    end

                    return ExecResult.stale if stale
                    return ExecResult.stopped if job.shutdown_requested?
                    return ExecResult.ok(failure) if failure
                    if job.cancel_flag.cancelled?
                        return ExecResult.ok(Job.fail("#{job.step} cancelled"))
                    end

                    ExecResult.ok(outcome.result)
                rescue StandardError => e
                    return ExecResult.stopped if job.shutdown_requested?

                    ExecResult.ok(Job.fail(task_error(job, e).message))
                ensure
                    job.unregister_shutdown_waiter(results) if results
                    job.reset_cancel_flag!
                end

                # Applies one task result while holding a fresh owner pool lock
                # @param workflow [JobWorkflow] Workflow that implements the commit
                # @param job [Job] Runtime job expected to remain current
                # @param outcome [Job::ThreadTask, Job::ThreadPool] Task declaration
                # @param item [Object, nil] Thread pool item, or nil for a single task
                # @param task_result [Object] Successful value returned by the task
                # @return [Object, Symbol, OpenNebula::Error] Commit result
                def commit_result(workflow, job, outcome, item, task_result)
                    return ExecResult.stopped if job.shutdown_requested?

                    result = nil
                    stale  = false

                    # Commits reacquire the owner lock and recheck its durable operation
                    rc = workflow.pool.get(job.owner_id, job.external_user) do |resource|
                        unless workflow.current?(resource, job)
                            stale = true
                            next
                        end

                        if job.shutdown_requested?
                            result = ExecResult.stopped
                            next
                        end

                        if job.cancel_flag.cancelled?
                            result = Job.fail("#{job.step} cancelled")
                            next
                        end

                        result =
                            if outcome.is_a?(Job::ThreadPool)
                                workflow.commit_thread_pool(
                                    outcome.commit, resource, item, task_result, outcome.args
                                )
                            else
                                workflow.commit_thread(
                                    outcome.commit, resource, task_result, outcome.args
                                )
                            end

                        next result if OpenNebula.is_error?(result)
                    end

                    return ExecResult.retry(rc) if OpenNebula.is_error?(rc)
                    return ExecResult.stale if stale
                    return result if result.is_a?(ExecResult) && result.stopped?

                    ExecResult.ok(result)
                rescue StandardError => e
                    ExecResult.ok(
                        OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
                    )
                end

                # Normalizes supported task failure results
                # @param result [Object] Task or commit result
                # @return [Job::Failure, nil] Failure outcome when the result failed
                def task_failure(result)
                    return result if result.is_a?(Job::Failure)
                    return Job.fail(result.message) if OpenNebula.is_error?(result)
                end

                # Names failures after the lifecycle step instead of the internal task.
                # @param job [Job] Runtime job that owns the task
                # @param error [Exception] Task exception
                # @return [OpenNebula::Error] Action error suitable for persistence
                def task_error(job, error)
                    OpenNebula::Error.new(
                        "#{job.step} failed: #{error.message}",
                        OpenNebula::Error::EACTION
                    )
                end

            end

        end

    end

end
