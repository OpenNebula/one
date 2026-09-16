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

require_relative 'scheduler/command_execution'
require_relative 'scheduler/thread_execution'
require_relative 'scheduler/transitions'
require_relative 'scheduler/step_execution'
require_relative 'scheduler/reconciliation_queue'

module OpenNebula

    module DocumentServer

        # Coordinates job execution for {Jobable} owners
        #
        # The scheduler manages only ephemeral runtime state. Durable step state
        # and lifecycle transitions remain on the owner through {Jobable}, while
        # execution behavior is defined by a registered {JobWorkflow}
        #
        # Public methods are thread-safe. At most one job per owner and workflow may
        # run concurrently. Execution has at-least-once semantics: durable transitions
        # are persisted only after their step, runtime work, and finalizer complete
        class JobScheduler

            COMP        = 'JOB'
            RETRY_DELAY = 5

            # Creates an empty scheduler with a fixed number of workers
            #
            # @param concurrency [Integer] Maximum concurrent jobs and maximum number of
            #   threads allowed in one Job.thread_pool outcome
            # @param shutdown_timeout [Numeric] Maximum seconds spent draining this scheduler
            # @raise [ArgumentError] If concurrency is not positive
            def initialize(
                concurrency: 10,
                shutdown_timeout: ThreadManager::DEFAULT_SHUTDOWN_TIMEOUT
            )
                raise ArgumentError, 'Job concurrency must be positive' \
                    unless concurrency.to_i.positive?
                raise ArgumentError, 'Job shutdown timeout must be positive' \
                    unless shutdown_timeout.to_f.positive?

                @concurrency = concurrency.to_i
                @shutdown_timeout = shutdown_timeout.to_f
                @workflows   = {}
                @queue       = []
                @jobs        = {}
                @signatures  = {}
                @operations  = {}
                @running     = {}
                @mutex       = Mutex.new
                @condition   = ConditionVariable.new
                @started     = false
                @stopped     = false
                @shutdown_deadline = nil
                @shutdown_threads  = []
                @step_exec            = StepExec.new(self, @concurrency)
                @reconciliation_queue = ReconciliationQueue.new(self)
            end

            # Registers a workflow that can execute jobs placed in the scheduler
            #
            # @param workflow [JobWorkflow] Workflow responsible for the registered jobs
            # @return [JobWorkflow] Registered workflow
            # @raise [ArgumentError] If workflow is invalid or name is already registered
            def register(workflow)
                raise ArgumentError, 'Expected a JobWorkflow' \
                    unless workflow.is_a?(JobWorkflow)

                name = workflow.id

                @mutex.synchronize do
                    raise ArgumentError, "Workflow #{name} is already registered" \
                        if @workflows.key?(name)

                    @workflows[name] = workflow
                end
            end

            #------------------------------------------------------
            # Job lifecycle
            #------------------------------------------------------

            # Starts the worker pool and registers scheduler shutdown
            #
            # @return [nil]
            def start
                @mutex.synchronize do
                    return if @started

                    @started = true
                end

                ThreadManager.instance.on_stop do |deadline|
                    request_shutdown(deadline)
                end

                @reconciliation_queue.start

                @concurrency.times do |index|
                    ThreadManager.instance.start(
                        "#{ODS_NAME}-job-scheduler-#{index}"
                    ) { worker }
                end

                nil
            end

            # Stops accepting new work and gracefully drains active jobs
            #
            # Running commands and Ruby tasks receive a runtime-only stop request before
            # waiting for active jobs to release their ephemeral resources. The durable
            # active_job is left untouched for startup reconciliation.
            #
            # Pending jobs are discarded because their durable owner state remains
            # available for later reconstruction through catch-up
            #
            # Threads are never terminated forcefully. All waits share one monotonic
            # deadline; work still alive at that point is left for process termination.
            # @param deadline [Numeric, nil] Absolute monotonic shutdown deadline
            # @return [Boolean] Whether running jobs and command cancellation drained
            def shutdown(deadline: nil)
                deadline ||= monotonic_now + @shutdown_timeout
                request_shutdown(deadline)

                shutdown_deadline = @mutex.synchronize { @shutdown_deadline }
                shutdown_threads  = @mutex.synchronize { @shutdown_threads.dup }

                join_until(shutdown_threads, shutdown_deadline)

                drained = @mutex.synchronize do
                    until @running.empty?
                        remaining = shutdown_deadline - monotonic_now
                        break unless remaining.positive?

                        @condition.wait(@mutex, remaining)
                    end

                    if @running.empty?
                        @queue.clear
                        @jobs.clear
                        @signatures.clear
                        @operations.clear
                        @condition.broadcast
                        true
                    else
                        false
                    end
                end

                survivors = shutdown_threads.select(&:alive?)
                return true if drained && survivors.empty?

                running = @mutex.synchronize do
                    @running.values.map do |job|
                        "#{job.workflow}:#{job.owner_id}:#{job.operation_id}"
                    end
                end
                details = []
                details << "jobs=#{running.join(',')}" unless running.empty?
                details << "shutdown_threads=#{survivors.size}" unless survivors.empty?
                Log.warn(COMP, "Job scheduler shutdown deadline reached (#{details.join(' ')})")

                false
            end

            # Schedules a job unless an equivalent runtime job is already tracked
            #
            # @param job [Job] Reconstructable job to schedule
            # @return [String] Identifier of the scheduled or previously tracked job
            # @return [OpenNebula::Error] If the job cannot be scheduled
            def schedule(job)
                raise ArgumentError, 'Expected a Job' unless job.is_a?(Job)

                @mutex.synchronize do
                    return OpenNebula::Error.new(
                        'Job scheduler is stopped', OpenNebula::Error::EACTION
                    ) if @stopped

                    workflow = @workflows[job.workflow]

                    return OpenNebula::Error.new(
                        "Unknown job workflow #{job.workflow}", OpenNebula::Error::EACTION
                    ) unless workflow

                    return OpenNebula::Error.new(
                        "Job step #{job.step} cannot be cancelled",
                        OpenNebula::Error::EACTION
                    ) if job.cancellation_requested? &&
                         !workflow.cancelable?(job.step)

                    # Reconciliation may rebuild a job already tracked in memory
                    duplicate = @jobs[@signatures[job.signature]]

                    if duplicate && job.cancellation_requested?
                        # The rebuilt job carries a durable cancellation request for it
                        duplicate.request_cancel!(job.cancellation)
                        duplicate.status = :cancelling
                        @condition.broadcast
                    end

                    return duplicate.id if duplicate

                    # Only new jobs enter the queue, duplicates keep their runtime identity
                    track(job)
                    @queue << job.id

                    @condition.signal
                end

                job.id
            rescue StandardError => e
                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            # Requests an idempotent recheck of one durable workflow operation.
            #
            # The durable owner document remains authoritative. Notifications only
            # identify the operation that must be reloaded; no runtime job snapshot is
            # retained by the reconciliation queue.
            #
            # @param workflow [Symbol] Registered durable workflow identifier
            # @param owner_id [String, Integer] Persistent job owner identifier
            # @param operation_id [String] Durable lifecycle operation identifier
            # @return [String, OpenNebula::Error] Operation identifier or an error
            def wake(workflow:, owner_id:, operation_id:)
                workflow_for_id(workflow)
                @reconciliation_queue.wake(
                    :workflow => workflow,
                    :owner_id => owner_id,
                    :operation_id => operation_id
                )
            rescue KeyError
                OpenNebula::Error.new(
                    "Unknown job workflow #{workflow}", OpenNebula::Error::EACTION
                )
            rescue StandardError => e
                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            # Returns the runtime snapshot for an owner lifecycle operation
            #
            # @param owner_id [String, Integer] Identifier of the job owner
            # @param operation_id [String] Durable lifecycle operation identifier
            # @return [Hash, nil] Serialized job information when currently tracked
            def job_for(owner_id, operation_id)
                @mutex.synchronize do
                    find_job(owner_id, operation_id)&.info
                end
            end

            # Requests cancellation of a tracked lifecycle operation
            # @param owner_id [String, Integer] Identifier of the job owner
            # @param operation_id [String] Durable lifecycle operation identifier
            # @return [Symbol, OpenNebula::Error] Cancellation request result
            def cancel(owner_id, operation_id)
                command = nil
                job     = nil

                @mutex.synchronize do
                    job = find_job(owner_id, operation_id)
                    return :not_found unless job

                    # Signal both job-owned Ruby tasks and future command execution
                    job.request_cancel!
                    job.status = :cancelling
                    command = job.command

                    @condition.broadcast
                end

                # Do not hold the scheduler lock while a command performs its shutdown
                ThreadManager.instance.start("cancel-#{job.id}") { command.cancel } if command

                :requested
            rescue StandardError => e
                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            private

            # Signals every runtime component without waiting for it to finish.
            # Returning owned threads lets ThreadManager include them in its deadline.
            def request_shutdown(deadline)
                @reconciliation_queue.stop

                commands, runtime_threads = @mutex.synchronize do
                    @shutdown_deadline = deadline \
                        if !@shutdown_deadline || deadline < @shutdown_deadline
                    return @shutdown_threads.dup if @stopped

                    @stopped = true
                    @running.values.each do |job|
                        job.status = :stopping
                        job.request_shutdown!(@shutdown_deadline)
                    end
                    @condition.broadcast

                    [
                        @running.values.filter_map do |job|
                            [job.id, job.command] if job.command
                        end,
                        @running.values.flat_map(&:runtime_threads)
                    ]
                end

                threads = commands.map do |job_id, command|
                    Thread.new do
                        Thread.current.name = "#{ODS_NAME}-command-shutdown-#{job_id}" \
                            if Thread.current.respond_to?(:name=)

                        command.cancel
                    rescue StandardError => e
                        Log.warn(COMP, "Could not stop command: #{e.message}")
                    end
                end

                threads.concat(runtime_threads)
                @mutex.synchronize { @shutdown_threads.concat(threads).uniq! }
                threads
            end

            # Joins threads without extending the scheduler shutdown deadline.
            def join_until(threads, deadline)
                threads.each do |thread|
                    remaining = deadline - monotonic_now
                    break unless remaining.positive?

                    thread.join(remaining)
                rescue StandardError => e
                    Log.warn(COMP, "Could not wait for command shutdown: #{e.message}")
                end
            end

            def monotonic_now
                Process.clock_gettime(Process::CLOCK_MONOTONIC)
            end

            #------------------------------------------------------
            # Worker pool
            #------------------------------------------------------

            # Continuously takes pending jobs and executes them until shutdown
            def worker
                loop do
                    job = nil

                    begin
                        job = take_job
                        break unless job

                        @step_exec.call(job)
                    rescue StandardError => e
                        Log.error(
                            COMP, "Job scheduler worker failed: #{e.class}: #{e.message}"
                        )

                        begin
                            defer(job) if job
                        rescue StandardError => retry_error
                            Log.error(
                                COMP,
                                "Could not recover job scheduler worker: #{retry_error.message}"
                            )
                        end
                    end
                end
            end

            # Waits for an executable job while enforcing retry times and owner exclusion
            #
            # @return [Job, nil] Next executable job or nil when the scheduler stops
            def take_job
                @mutex.synchronize do
                    loop do
                        return if @stopped

                        now = Process.clock_gettime(Process::CLOCK_MONOTONIC)

                        # An owner has one active job, delayed retries stay queued until due
                        index = @queue.index do |job_id|
                            job = @jobs[job_id]
                            job &&
                                !@running.key?(job.owner_key) &&
                                (job.retry_at.nil? || job.retry_at <= now)
                        end

                        if index
                            job = @jobs[@queue.delete_at(index)]
                            @running[job.owner_key] = job

                            job.status = job.cancellation_requested? ? :cancelling : :running
                            job.retry_at = nil

                            return job
                        end

                        # Wake for the nearest retry or scheduling/cancellation changes
                        retry_in = @queue.filter_map do |job_id|
                            retry_at = @jobs[job_id]&.retry_at
                            retry_at - now if retry_at && retry_at > now
                        end.min

                        @condition.wait(@mutex, retry_in)
                    end
                end
            end

            # Finds the registered workflow referenced by a job
            #
            # @param job [Job] Job containing the workflow identifier
            # @return [JobWorkflow] Registered workflow
            # @raise [KeyError] If the job references an unknown workflow
            public

            # Internal collaborator API. Not part of the scheduler service contract.
            def workflow_for(job)
                @mutex.synchronize { @workflows.fetch(job.workflow) }
            end

            # Finds a registered workflow by its durable identifier.
            def workflow_for_id(id)
                @mutex.synchronize { @workflows.fetch(id) }
            end

            # Reconciles one queued durable operation.
            # Internal collaborator API used only by ReconciliationQueue.
            def reconcile_operation(workflow:, owner_id:, operation_id:)
                workflow_for_id(workflow).reconcile_operation(owner_id, operation_id)
            rescue KeyError
                ExecResult.stale
            rescue StandardError => e
                ExecResult.retry(
                    OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
                )
            end

            # Re-runs startup discovery after a transient pool failure.
            # Internal collaborator API used by JobWorkflow#catch_up.
            def retry_startup(workflow:)
                workflow_for_id(workflow)
                @reconciliation_queue.retry_startup(:workflow => workflow)
            rescue KeyError
                OpenNebula::Error.new(
                    "Unknown job workflow #{workflow}", OpenNebula::Error::EACTION
                )
            rescue StandardError => e
                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            # Performs one queued startup discovery pass.
            # Internal collaborator API used only by ReconciliationQueue.
            def reconcile_startup(workflow:)
                workflow_for_id(workflow).reconcile_startup
            rescue KeyError
                OpenNebula::Error.new(
                    "Unknown job workflow #{workflow}", OpenNebula::Error::EACTION
                )
            end

            private

            # Finds a tracked job by owner and durable operation identifiers
            # @param owner_id [String, Integer] Identifier of the job owner
            # @param operation_id [String] Durable lifecycle operation identifier
            # @return [Job, nil] Matching tracked job
            def find_job(owner_id, operation_id)
                ids  = @operations[operation_key(owner_id, operation_id)] || []
                jobs = ids.filter_map {|id| @jobs[id] }

                jobs.find {|job| @running[job.owner_key]&.id == job.id } || jobs.first
            end

            def operation_key(owner_id, operation_id)
                [owner_id.to_s, operation_id.to_s]
            end

            def track(job)
                @jobs[job.id] = job
                @signatures[job.signature] = job.id
                key = operation_key(job.owner_id, job.operation_id)
                (@operations[key] ||= []) << job.id
            end

            def untrack(job)
                return unless job && @jobs.delete(job.id)

                @signatures.delete(job.signature) if @signatures[job.signature] == job.id
                key = operation_key(job.owner_id, job.operation_id)
                ids = @operations[key]
                return unless ids

                ids.delete(job.id)
                @operations.delete(key) if ids.empty?
            end

            #------------------------------------------------------
            # Scheduler state
            #------------------------------------------------------

            # Replaces the running job after move to another step
            #
            # @param job [Job] New job job for the same owner
            public

            # Internal collaborator API. Not part of the scheduler service contract.
            def replace(job)
                @mutex.synchronize do
                    previous = @running[job.owner_key]
                    duplicate = @jobs[@signatures[job.signature]]
                    duplicate = nil if duplicate&.id == previous&.id
                    cancellation = previous&.cancellation || duplicate&.cancellation

                    # A continuation inherits cancellation from either its previous step
                    # or a reconstructed duplicate scheduled from the durable owner context
                    job.request_cancel!(cancellation) if cancellation
                    if previous&.shutdown_requested?
                        job.request_shutdown!(previous.shutdown_deadline)
                    end
                    untrack(previous)
                    if duplicate
                        untrack(duplicate)
                        @queue.delete(duplicate.id)
                    end

                    track(job)
                    @running[job.owner_key] = job
                    job.status = job.cancellation_requested? ? :cancelling : :running
                end
            end

            # Returns a job to the queue after the retry delay
            #
            # @param job [Job] Job whose execution must be retried
            def defer(job)
                @mutex.synchronize do
                    current = @running[job.owner_key]
                    return unless current&.id == job.id

                    @running.delete(job.owner_key)

                    # Keep the job tracked so the worker can retry it after the backoff
                    job.status = job.cancellation_requested? ? :cancelling : :pending
                    job.retry_at = Process.clock_gettime(Process::CLOCK_MONOTONIC) + RETRY_DELAY

                    @queue << job.id unless @queue.include?(job.id)
                    @condition.broadcast
                end
            end

            # Removes a finished job and releases its owner for queued work
            #
            # @param job [Job] Job to remove from scheduler tracking
            # @param requeue_cancel [Boolean] Keep a just-cancelled durable wait executable
            def finish(job, requeue_cancel: false)
                @mutex.synchronize do
                    current = @running[job.owner_key]
                    @running.delete(job.owner_key) if current&.id == job.id

                    if requeue_cancel && job.cancellation_requested?
                        job.status = :cancelling
                        @queue << job.id unless @queue.include?(job.id)
                    else
                        untrack(job)
                    end

                    @condition.broadcast
                end
            end

        end

    end

end
