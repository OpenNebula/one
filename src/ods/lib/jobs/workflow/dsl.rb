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

            # Class-level DSL used to declare workflow steps and states
            module DSL

                # Declares a step, its entry state, and its success and failure transitions
                #
                # @param name [Symbol] Durable step identifier
                # @param state [Symbol, nil] Owner state persisted when a continuation
                #   without an explicit state enters this step
                # @param handler [Symbol, nil] Public method executed for this step
                # @param success [Job::Next, Job::Complete, Hash] Success transition or named
                #   success transition map
                # @param failure [Symbol, Hash, nil] Failure state or named failure
                #   transition map. When omitted, continuations inherit the invoking step's
                #   failure state. Named maps must declare a +:default+ branch for
                #   unclassified runtime failures.
                # @param dependencies [Array<Symbol>] Resources loaded with the owner
                # @param on_cancel [Symbol, nil] Callback that enables cancellation
                # @param ensure [Symbol, nil] Public finalizer callback run after the step
                # @param recover [Symbol, nil] Handler run before retrying a failed step
                # @return [Step] Frozen step declaration
                # @raise [ArgumentError] If the declaration is duplicated or invalid
                def step(name, **options)
                    success      = options.delete(:success)
                    failure      = options.delete(:failure)
                    state        = options.delete(:state)
                    dependencies = options.delete(:dependencies) || []
                    on_cancel    = options.delete(:on_cancel)
                    handler      = options.delete(:handler)
                    finalizer    = options.delete(:ensure)
                    recover      = options.delete(:recover)

                    raise ArgumentError, 'Job step name cannot be empty' \
                        if name.nil? || name == :""
                    raise ArgumentError, 'Job step name must be a Symbol' \
                        unless name.is_a?(Symbol)
                    raise ArgumentError, "Unknown job step options: #{options.keys.join(', ')}" \
                        unless options.empty?

                    handler ||= name

                    raise ArgumentError, "Job step #{name} is already registered" \
                        if steps.key?(name)

                    raise ArgumentError, "Invalid success for job step #{name}" \
                        unless valid_success?(success)
                    raise ArgumentError, "Invalid failure for job step #{name}" \
                        unless valid_failure?(failure)

                    raise ArgumentError,
                          "Invalid state for job step #{name}: must be a Symbol" \
                        unless state.nil? || state.is_a?(Symbol)
                    raise ArgumentError,
                          "Invalid handler for job step #{name}: must be a Symbol" \
                        unless handler.is_a?(Symbol)
                    raise ArgumentError,
                          "Invalid dependencies for job step #{name}: must be Symbols" \
                        unless dependencies.is_a?(Array) &&
                               dependencies.all? {|dependency| dependency.is_a?(Symbol) }
                    raise ArgumentError,
                          "Invalid cancellation callback for job step #{name}: " \
                          'must be a Symbol' \
                        unless on_cancel.nil? || on_cancel.is_a?(Symbol)
                    raise ArgumentError,
                          "Invalid ensure callback for job step #{name}: must be a Symbol" \
                        unless finalizer.nil? || finalizer.is_a?(Symbol)
                    raise ArgumentError,
                          "Invalid recovery callback for job step #{name}: must be a Symbol" \
                        unless recover.nil? || recover.is_a?(Symbol)

                    step = Step.new(
                        :name         => name,
                        :state        => state,
                        :handler      => handler,
                        :dependencies => dependencies.dup.freeze,
                        :success      => normalize_success(success),
                        :failure      => normalize_failure(failure),
                        :on_cancel    => on_cancel,
                        :kind         => :normal,
                        :finalizer    => finalizer,
                        :recover      => recover
                    ).freeze

                    own_steps[name] = step
                    register_recovery_step(name, recover, dependencies) if recover

                    step
                end

                # Defines or returns the stable workflow identifier.
                #
                # @param id [Symbol, nil] Identifier persisted by durable jobs
                # @return [Symbol, nil] Local or inherited workflow identifier
                def workflow_id(id = nil)
                    if id
                        raise ArgumentError, 'Workflow ID must be a Symbol' \
                            unless id.is_a?(Symbol)

                        @workflow_id = id
                    end

                    return @workflow_id if defined?(@workflow_id)
                    return superclass.workflow_id if superclass.respond_to?(:workflow_id)
                end

                # Declares an external event that can mutate owners and resolve durable waits
                #
                # @param name [Symbol] Event identifier referenced by wait declarations
                # @param handler [Symbol, nil] Workflow callback, defaults to the name
                # @param dependencies [Array<Symbol>] Resources loaded with the owner
                # @return [Event] Event declaration
                def event(name, handler: nil, dependencies: [])
                    raise ArgumentError, 'Workflow event name must be a Symbol' \
                        unless name.is_a?(Symbol)

                    handler ||= name

                    raise ArgumentError,
                          "Invalid handler for workflow event #{name}: must be a Symbol" \
                        unless handler.is_a?(Symbol)
                    raise ArgumentError,
                          "Invalid dependencies for workflow event #{name}: must be Symbols" \
                        unless dependencies.is_a?(Array) &&
                               dependencies.all? {|dependency| dependency.is_a?(Symbol) }

                    raise ArgumentError, "Workflow event #{name} is already registered" \
                        if events.key?(name)

                    declaration = Event.new(
                        name, handler, dependencies.dup.freeze
                    ).freeze

                    own_events[name] = declaration
                end

                # Returns inherited and locally declared workflow events
                def events
                    inherited = superclass.respond_to?(:events) ? superclass.events : {}
                    inherited.merge(own_events).freeze
                end

                # Returns inherited and locally declared steps
                #
                # @return [Hash<Symbol, Step>] Frozen declarations keyed by name
                def steps
                    inherited = superclass.respond_to?(:steps) ? superclass.steps : {}
                    inherited.merge(own_steps).freeze
                end

                # Defines local failure state mappings and returns all inherited mappings
                #
                # @param states [Hash, nil] Optional source state to failure state mappings
                # @return [Hash<Symbol, Symbol>] Frozen combined failure state mappings
                # @raise [ArgumentError] If a provided mapping does not use Symbols
                def failure_states(states = nil)
                    if states
                        unless states.is_a?(Hash) && states.all? do |state, failure|
                            state.is_a?(Symbol) && failure.is_a?(Symbol)
                        end
                            raise ArgumentError, 'Failure states must map Symbols to Symbols'
                        end

                        @failure_states = states.dup.freeze
                    end

                    inherited =
                        if superclass.respond_to?(:failure_states)
                            superclass.failure_states
                        else
                            {}
                        end

                    inherited.merge(@failure_states || {}).freeze
                end

                # Defines local stable states and returns all inherited stable states
                #
                # @param states [Array<Symbol>] Optional states to register
                # @return [Array<Symbol>] Frozen unique stable states
                # @raise [ArgumentError] If a provided state is not a Symbol
                def stable_states(*states)
                    unless states.empty?
                        raise ArgumentError, 'Stable states must be Symbols' \
                            unless states.all? {|state| state.is_a?(Symbol) }

                        @stable_states = states.freeze
                    end

                    inherited =
                        if superclass.respond_to?(:stable_states)
                            superclass.stable_states
                        else
                            []
                        end

                    (inherited + (@stable_states || [])).uniq.freeze
                end

                private

                # Checks whether a success declaration contains supported outcomes
                #
                # @param success [Object] Success declaration to validate
                # @return [Boolean] true when the declaration is valid
                def valid_success?(success)
                    return true if success.is_a?(Job::Next) ||
                                   success.is_a?(Job::Complete)
                    return false unless success.is_a?(Hash) && !success.empty?

                    success.values.all? do |outcome|
                        outcome.is_a?(Job::Next) || outcome.is_a?(Job::Complete)
                    end
                end

                # Freezes a named success declaration
                #
                # @param success [Job::Next, Job::Complete, Hash] Success declaration
                # @return [Job::Next, Job::Complete, Hash] Normalized declaration
                def normalize_success(success)
                    return success unless success.is_a?(Hash)

                    raise ArgumentError, 'Success names must be Symbols' \
                        unless success.keys.all? {|name| name.is_a?(Symbol) }

                    success.dup.freeze
                end

                # Checks whether a failure declaration contains supported handlers.
                #
                # @param failure [Object] Failure declaration to validate
                # @return [Boolean] true when the declaration is valid
                def valid_failure?(failure)
                    return true if failure.nil?
                    return valid_failure_handler?(failure) unless failure.is_a?(Hash)
                    return false if failure.empty?

                    failure.keys.all? {|key| key.is_a?(Symbol) } &&
                        failure.key?(:default) &&
                        failure.values.all? {|handler| valid_failure_handler?(handler) }
                end

                # Checks one terminal failure state declaration.
                #
                # @param handler [Object] Failure handler to validate
                # @return [Boolean] true when the handler is supported
                def valid_failure_handler?(handler)
                    handler.is_a?(Symbol)
                end

                # Freezes named failure declarations.
                #
                # @param failure [Symbol, Hash] Declaration
                # @return [Symbol, Hash, nil] Frozen declaration
                def normalize_failure(failure)
                    return if failure.nil?
                    return failure unless failure.is_a?(Hash)

                    failure.dup.freeze
                end

                # Registers the internal step that prepares a failed step for retry.
                # @param name [Symbol] Normal step resumed after preparation
                # @param handler [Symbol] Public preparation method
                # @param dependencies [Array<Symbol>] Resources for preparation
                # @return [Step] Inferred recovery declaration
                # @raise [ArgumentError] If the inferred step is already in use
                def register_recovery_step(name, handler, dependencies)
                    recovery_step = :"recover_#{name}"
                    existing      = steps[recovery_step]

                    return existing if existing&.kind == :recovery &&
                                       existing.handler == handler

                    if existing
                        raise ArgumentError,
                              "Job step #{recovery_step} is already registered"
                    end

                    own_steps[recovery_step] = Step.new(
                        :name         => recovery_step,
                        :state        => nil,
                        :handler      => handler,
                        :dependencies => dependencies.dup.freeze,
                        :success      => Job.next(name),
                        :failure      => nil,
                        :on_cancel    => :cancelable,
                        :kind         => :recovery,
                        :finalizer    => nil,
                        :recover      => nil
                    ).freeze
                end

                # Returns the step declarations owned by this workflow class
                #
                # @return [Hash<Symbol, Step>] Mutable local declaration registry
                def own_steps
                    @own_steps ||= {}
                end

                # Returns event declarations owned by this workflow class
                #
                # @return [Hash<Symbol, Event>] Mutable local event registry
                def own_events
                    @own_events ||= {}
                end

            end

        end

    end

end
