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

            # Validated immutable workflow definition.
            class Definition

                attr_reader :steps, :events

                def initialize(workflow, steps, events)
                    @workflow = workflow
                    @steps    = steps
                    @events   = events

                    validate!
                    freeze
                end

                def step(name)
                    steps[name] || raise(ArgumentError, "Unknown job step #{name}")
                end

                def event(name)
                    events[name] || raise(ArgumentError, "Unknown workflow event #{name}")
                end

                def validate_wait!(step, wait)
                    raise ArgumentError, 'Expected a Job.wait outcome' \
                        unless wait.is_a?(Job::Wait)
                    raise ArgumentError, "Job step #{step.name} cannot wait with named success" \
                        if step.success.is_a?(Hash)
                    raise ArgumentError, "Undefined wait check #{wait.check}" \
                        unless @workflow.respond_to?(wait.check)

                    return true if wait.is_a?(Job::ChildrenWait)

                    wait.events.each do |name|
                        declaration = events[name]
                        raise ArgumentError, "Unknown event #{name} for job step #{step.name}" \
                            unless declaration

                        missing = step.dependencies - declaration.dependencies
                        next if missing.empty?

                        raise ArgumentError,
                              "Event #{name} does not load wait dependencies: " \
                              "#{missing.join(', ')}"
                    end

                    true
                end

                private

                def validate!
                    steps.each_value {|step| validate_step!(step) }
                    events.each_value {|event| validate_event!(event) }
                end

                def validate_step!(step)
                    raise ArgumentError, "Undefined job handler #{step.handler}" \
                        unless @workflow.respond_to?(step.handler)
                    raise ArgumentError, "Undefined cancellation callback #{step.on_cancel}" \
                        if step.on_cancel && !@workflow.respond_to?(step.on_cancel)
                    raise ArgumentError, "Undefined ensure callback #{step.ensure}" \
                        if step.ensure && !@workflow.respond_to?(step.ensure)

                    outcomes = step.success.is_a?(Hash) ? step.success.values : [step.success]
                    outcomes.each {|outcome| validate_success!(step, outcome) }
                    validate_failure!(step)
                end

                def validate_success!(step, outcome)
                    if outcome.is_a?(Job::Complete)
                        return if @workflow.class.stable_states.include?(outcome.state)

                        raise ArgumentError, "Invalid completion for job step #{step.name}"
                    end

                    return unless outcome.is_a?(Job::Next)

                    target = steps[outcome.step]
                    valid_failure = outcome.failure_state.nil? ||
                                    @workflow.class.failure_states.value?(
                                        outcome.failure_state
                                    )
                    return if target&.kind == :normal && valid_failure

                    raise ArgumentError, "Invalid success for job step #{step.name}"
                end

                def validate_failure!(step)
                    return if step.failure.nil?

                    states = step.failure.is_a?(Hash) ? step.failure.values : [step.failure]
                    return if states.all? do |state|
                        @workflow.class.failure_states.value?(state)
                    end

                    raise ArgumentError, "Invalid failure for job step #{step.name}"
                end

                def validate_event!(event)
                    raise ArgumentError, "Undefined event handler #{event.handler}" \
                        unless @workflow.respond_to?(event.handler)
                end

            end

        end

    end

end
