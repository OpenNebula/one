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

            # Immutable declaration for one workflow step.
            class Step

                attr_reader :name,
                            :state,
                            :handler,
                            :dependencies,
                            :success,
                            :failure,
                            :on_cancel,
                            :kind,
                            :ensure,
                            :recover

                # Creates a workflow step declaration.
                #
                # The workflow DSL validates every field before constructing a Step.
                # Instances are frozen by that DSL once declared.
                #
                # @param attributes [Hash] Step declaration fields
                # @option attributes [Symbol] :name Step identifier
                # @option attributes [Symbol, nil] :state Owner state entered by the step
                # @option attributes [Symbol] :handler Workflow step callback
                # @option attributes [Array<Symbol>] :dependencies Resources loaded for the step
                # @option attributes [Job::Next, Job::Complete, Hash] :success Declared transition
                # @option attributes [Symbol, Hash, nil] :failure Declared failure transition
                # @option attributes [Symbol, nil] :on_cancel Cancellation callback
                # @option attributes [Symbol] :kind Normal or recovery step kind
                # @option attributes [Symbol, nil] :finalizer Finalizer callback
                # @option attributes [Symbol, nil] :recover Recovery callback
                def initialize(**attributes)
                    @name         = attributes.fetch(:name)
                    @state        = attributes.fetch(:state)
                    @handler      = attributes.fetch(:handler)
                    @dependencies = attributes.fetch(:dependencies)
                    @success      = attributes.fetch(:success)
                    @failure      = attributes.fetch(:failure)
                    @on_cancel    = attributes.fetch(:on_cancel)
                    @kind         = attributes.fetch(:kind)
                    @ensure       = attributes.fetch(:finalizer)
                    @recover      = attributes.fetch(:recover)
                end

                # Checks whether this step declares cancellation behavior.
                #
                # @return [Boolean] true when the step has a cancellation callback
                def cancelable?
                    !on_cancel.nil?
                end

                # Selects the declared outcome for a successful execution.
                #
                # @param outcome [Job::Success] Success name and forwarded arguments
                # @return [Job::Next, Job::Complete] Declared transition
                # @raise [ArgumentError] If the success name is invalid
                def resolve_success(outcome)
                    if success.is_a?(Hash)
                        raise ArgumentError, "Job step #{name} requires a success name" \
                            unless outcome.name

                        success.fetch(outcome.name)
                    else
                        raise ArgumentError, "Job step #{name} has no named success" \
                            if outcome.name

                        success
                    end
                rescue KeyError
                    raise ArgumentError, "Unknown success #{outcome.name} for job step #{name}"
                end

                # Returns the default terminal failure state for this step.
                #
                # @return [Symbol, nil] Default failure state when declared
                def failure_for
                    return failure[:default] if failure.is_a?(Hash)

                    failure
                end

                # Selects the declared terminal failure state for an execution failure.
                #
                # @param outcome [Job::Failure] Failure name and message
                # @return [Symbol] Selected terminal failure state
                # @raise [ArgumentError] If the failure name is invalid
                def resolve_failure(outcome)
                    if failure.is_a?(Hash)
                        failure.fetch(outcome.name || :default)
                    else
                        raise ArgumentError, "Job step #{name} has no named failure" \
                            if outcome.name

                        failure
                    end
                rescue KeyError
                    raise ArgumentError, "Unknown failure #{outcome.name} for job step #{name}"
                end

                # Validates and resolves a finalizer outcome.
                #
                # @param outcome [Job::Outcome] Normalized finalizer result
                # @return [Job::Failure, nil] Failure or nil after success
                def resolve_finalizer(outcome)
                    return if outcome.is_a?(Job::Success)
                    return outcome if outcome.is_a?(Job::Failure)

                    Job.fail("Ensure callback #{@ensure} must return Job.success or Job.fail")
                end

            end

        end

    end

end
