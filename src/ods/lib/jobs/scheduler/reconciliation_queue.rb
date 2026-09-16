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

            # Deduplicates and retries rechecks of durable workflow operations.
            #
            # Entries are deliberately ephemeral: the owner active_job is the durable
            # source of truth and StartupReconciler repopulates this queue after restart.
            class ReconciliationQueue

                RETRY_DELAY       = 1
                MAX_RETRY_DELAY   = 30
                RECHECK_DELAY     = 30
                MAX_BACKOFF_POWER = 5

                Entry = Struct.new(
                    :kind, :workflow, :owner_id, :operation_id,
                    :attempt, :retry_at,
                    :keyword_init => true
                ) do
                    def key
                        if kind == :startup
                            [kind, workflow]
                        else
                            [kind, workflow, owner_id.to_s, operation_id.to_s]
                        end
                    end
                end

                def initialize(scheduler)
                    @scheduler = scheduler
                    @entries   = {}
                    @mutex     = Mutex.new
                    @condition = ConditionVariable.new
                    @started   = false
                    @stopped   = false
                end

                # Starts the single reconciliation worker.
                def start
                    @mutex.synchronize do
                        return if @started

                        @started = true
                    end

                    ThreadManager.instance.start("#{ODS_NAME}-job-reconciliation") { worker }
                    nil
                end

                # Stops accepting reconciliation requests and releases the worker.
                def stop
                    @mutex.synchronize do
                        @stopped = true
                        @entries.clear
                        @condition.broadcast
                    end

                    true
                end

                # Queues one durable operation for immediate reconciliation.
                def wake(workflow:, owner_id:, operation_id:)
                    raise ArgumentError, 'Reconciliation owner cannot be empty' \
                        if owner_id.to_s.empty?
                    raise ArgumentError, 'Reconciliation operation cannot be empty' \
                        if operation_id.to_s.empty?

                    entry = Entry.new(
                        :kind => :operation, :workflow => workflow,
                        :owner_id => owner_id, :operation_id => operation_id.to_s,
                        :attempt => 0
                    )
                    push(entry, 0, :reset_attempt => true)

                    entry.operation_id
                end

                # Queues a failed startup discovery pass for retry.
                def retry_startup(workflow:)
                    entry = Entry.new(
                        :kind => :startup, :workflow => workflow, :attempt => 0
                    )
                    push(entry, retry_delay(entry))

                    workflow
                end

                private

                def worker
                    loop do
                        entry = take
                        break unless entry

                        process(entry)
                    rescue StandardError => e
                        Log.error(
                            JobScheduler::COMP,
                            "Workflow reconciliation worker failed: #{e.class}: #{e.message}"
                        )
                        retry_entry(entry, e) if entry
                    end
                end

                def process(entry)
                    if entry.kind == :startup
                        result = @scheduler.reconcile_startup(:workflow => entry.workflow)
                        return retry_entry(entry, result) if OpenNebula.is_error?(result)

                        return
                    end

                    result = @scheduler.reconcile_operation(
                        :workflow => entry.workflow,
                        :owner_id => entry.owner_id,
                        :operation_id => entry.operation_id
                    )

                    if result.retry?
                        retry_entry(entry, result.value)
                    elsif result.waiting?
                        push(entry, RECHECK_DELAY, :reset_attempt => true)
                    elsif result.error?
                        Log.error(
                            JobScheduler::COMP,
                            "Could not reconcile #{label(entry)}: #{result.value.message}",
                            entry.owner_id
                        )
                    end
                end

                def retry_entry(entry, error)
                    Log.warn(
                        JobScheduler::COMP,
                        "Retrying reconciliation of #{label(entry)}: #{error.message}",
                        entry.owner_id
                    )
                    entry.attempt = [entry.attempt + 1, MAX_BACKOFF_POWER].min
                    push(entry, retry_delay(entry))
                end

                def push(entry, delay, reset_attempt: false)
                    now = Process.clock_gettime(Process::CLOCK_MONOTONIC)
                    due = now + delay

                    @mutex.synchronize do
                        raise 'Job reconciliation queue is stopped' if @stopped

                        current = @entries[entry.key]
                        if current
                            current.retry_at = [current.retry_at, due].min
                            current.attempt = 0 if reset_attempt
                        else
                            entry.attempt = 0 if reset_attempt
                            entry.retry_at = due
                            @entries[entry.key] = entry
                        end

                        @condition.signal
                    end
                end

                def take
                    @mutex.synchronize do
                        loop do
                            return if @stopped

                            now   = Process.clock_gettime(Process::CLOCK_MONOTONIC)
                            entry = @entries.values.min_by(&:retry_at)

                            unless entry
                                @condition.wait(@mutex)
                                next
                            end

                            delay = entry.retry_at - now
                            if delay.positive?
                                @condition.wait(@mutex, delay)
                                next
                            end

                            return @entries.delete(entry.key)
                        end
                    end
                end

                def retry_delay(entry)
                    base = RETRY_DELAY * (2**[entry.attempt, MAX_BACKOFF_POWER].min)
                    [base * (0.75 + (rand * 0.5)), MAX_RETRY_DELAY].min
                end

                def label(entry)
                    return "startup for #{entry.workflow}" if entry.kind == :startup

                    "#{entry.workflow} #{entry.owner_id} operation #{entry.operation_id}"
                end

            end

        end

    end

end
