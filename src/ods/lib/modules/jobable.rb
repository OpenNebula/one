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

require 'securerandom'

module OpenNebula

    module DocumentServer

        # Persists the durable context needed to reconstruct lifecycle jobs.
        #
        # Runtime state stays in {Job}. The serialized representation is private to this
        # module; collaborators operate on immutable {JobContext} instances.
        module Jobable

            ACTIVE_JOB = :active_job

            # Raised when an actor is not authorized to operate on a job.
            class AuthError < ArgumentError; end

            # Returns the active durable job context.
            #
            # Known identifiers are restored to Symbols at this persistence boundary.
            # Arbitrary step arguments retain their serialized values.
            #
            # @return [JobContext, nil] Durable context or nil
            def active_job
                data = @body&.[](ACTIVE_JOB)
                JobContext.from_h(data) if data
            end

            # Replaces the in-memory durable context without persisting it.
            #
            # @param value [JobContext, nil] New complete context
            def active_job=(value)
                raise ArgumentError, 'Active job must be a JobContext' \
                    unless value.nil? || value.is_a?(JobContext)

                @body[ACTIVE_JOB] = value&.to_h
            end

            # Starts and persists a new durable lifecycle operation.
            def begin_job!(step:, state:, args:, external_user:, **options)
                unknown = options.keys - [:replace, :parent]
                raise ArgumentError, "Unknown begin job options: #{unknown.join(', ')}" \
                    unless unknown.empty?

                replace = options.fetch(:replace, false)
                parent  = options.fetch(:parent, nil)

                raise ArgumentError, "#{job_resource_label} already has an active job" \
                    if active_job && !replace
                raise ArgumentError, 'Job step must be a Symbol' unless step.is_a?(Symbol)
                raise ArgumentError, 'Job state must be a Symbol' unless state.is_a?(Symbol)

                self.active_job = JobContext.new(
                    :id            => SecureRandom.uuid,
                    :attempt       => 1,
                    :step          => step,
                    :args          => args,
                    :external_user => external_user,
                    :created_at    => Time.now.to_i,
                    :parent        => parent
                )
                self.state = state

                persist_job!
            end

            # Prepares the current durable operation for an explicit retry.
            def recover_job!(
                state:,
                external_user:,
                args: nil,
                step: nil,
                failure_state: nil
            )
                context = active_job
                raise ArgumentError, "#{job_resource_label} has no active job" unless context
                raise ArgumentError, 'Recovered job state must be a Symbol' \
                    unless state.is_a?(Symbol)
                raise ArgumentError, 'Recovered job step must be a Symbol' \
                    unless step.nil? || step.is_a?(Symbol)
                raise ArgumentError, 'Recovered job failure state must be a Symbol' \
                    unless failure_state.nil? || failure_state.is_a?(Symbol)

                self.active_job = context.recover(
                    :external_user => external_user,
                    :args          => args,
                    :step          => step,
                    :failure_state => failure_state
                )
                self.state = state

                persist_job!
            end

            # Requests cancellation of the current durable job.
            def request_job_cancellation!(actor:, oneadmin: false)
                context = active_job
                raise ArgumentError, "#{job_resource_label} has no active job" unless context
                raise ArgumentError, 'Cancellation actor cannot be empty' \
                    if actor.to_s.empty?

                raise AuthError,
                      'Only the user who started this step or oneadmin can cancel it' \
                    unless oneadmin || context.owned_by?(actor)

                self.active_job = context.request_cancel(actor)
                persist_job!

                context.id
            end

            def active_job_owned_by?(actor)
                active_job&.owned_by?(actor) == true
            end

            def cancellation_requested?(job)
                active_job?(job) && !active_job.cancellation.nil?
            end

            # Reconstructs the ephemeral representation of the active job.
            def build_job(workflow_id)
                context = active_job
                raise ArgumentError, "#{job_resource_label} has no active job" unless context

                Job.new(
                    :workflow      => workflow_id,
                    :owner_id      => id,
                    :operation_id  => context.id,
                    :external_user => context.external_user,
                    :state         => state,
                    :attempt       => context.attempt,
                    :step          => context.step,
                    :args          => context.args,
                    :failure_state => context.failure_state,
                    :parent        => context.parent,
                    :children      => context.children,
                    :cancellation  => context.cancellation
                )
            end

            # Checks whether a runtime job still owns the durable context.
            def active_job?(job)
                active_job&.current?(state, job) == true
            rescue StandardError
                false
            end

            # Persists a continuation or completion.
            def transition_job!(job, outcome)
                update_current_job(job) do |context|
                    if outcome.is_a?(Job::Complete)
                        self.active_job = nil
                        self.state      = outcome.state
                    else
                        self.active_job = context.transition(job, outcome)
                        self.state      = outcome.state || job.state
                    end
                end
            end

            # Persists a durable wait for the current step.
            def wait_job!(job, wait)
                update_current_job(job) do |context|
                    self.active_job = context.with_wait(wait)
                end
            end

            # Persists parent arguments, child intents, and their wait atomically.
            def compose_job!(job, children, wait, args: nil)
                update_current_job(job) do |context|
                    self.active_job = context.with_composition(
                        job, children, wait, :args => args
                    )
                end
            end

            # Replaces durable child coordination state for the current job.
            def update_job_children!(job, children)
                update_current_job(job) do |context|
                    self.active_job = context.with_children(children)
                end
            end

            # Persists a terminal failure decision before owned child actions
            # are cancelled. The owner remains in its executable state until
            # composition confirms that every child is accounted for.
            def prepare_job_failure!(job, state, message)
                update_current_job(job) do |context|
                    self.active_job = context.with_pending_failure(state, message)
                end
            end

            # Removes a failed lifecycle context after its workflow has released
            # every owned child action.
            def discard_job!(context)
                return ExecResult.stale unless active_job == context

                self.active_job = nil
                job_update
            end

            # Persists a terminal lifecycle failure.
            def fail_job!(job, state, message)
                raise ArgumentError, 'Failure state must be a Symbol' unless state.is_a?(Symbol)

                update_current_job(job) do |context|
                    set_error(message, :opts => context.args, :step => context.step.to_s)
                    self.active_job = context.clear_pending_failure
                    self.state = state
                end
            end

            # Persists a cancelled lifecycle operation in its failure state.
            def cancel_job!(job, state, message)
                raise ArgumentError, 'Cancellation state must be a Symbol' \
                    unless state.is_a?(Symbol)

                update_current_job(job) do |context|
                    self.active_job = context.cancel
                    set_error(message, :opts => job.args, :step => job.step.to_s)
                    self.state = state
                end
            end

            # Marks an unreconstructable lifecycle operation as failed.
            def fail_orphan_job!(state, message)
                raise ArgumentError, 'Failure state must be a Symbol' unless state.is_a?(Symbol)

                set_error(message, :opts => {}, :step => active_job&.step&.to_s)
                self.active_job = nil
                self.state      = state

                job_update
            end

            # Adds a safe job summary to the public document representation.
            def to_h(opts = {})
                document = super(opts)
                body = document['DOCUMENT']['TEMPLATE'][self.class::TEMPLATE_TAG]

                body.delete(ACTIVE_JOB)
                body.delete(ACTIVE_JOB.to_s)
                body[ACTIVE_JOB] = active_job.public_h if active_job

                document
            end

            def to_json(opts = {})
                opts = {} unless opts.is_a?(Hash)

                to_h(opts).to_json
            end

            private

            def update_current_job(job)
                context = active_job
                return ExecResult.stale unless context&.current?(state, job)

                yield context
                job_update
            end

            def persist_job!
                rc = update
                raise rc.message if OpenNebula.is_error?(rc)

                true
            end

            def job_update
                rc = update
                return ExecResult.error(rc) if OpenNebula.is_error?(rc)

                ExecResult.ok
            rescue StandardError => e
                ExecResult.error(OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION))
            end

            def job_resource_label
                "#{self.class::RESOURCE_NAME} #{id}"
            end

        end

    end

end
