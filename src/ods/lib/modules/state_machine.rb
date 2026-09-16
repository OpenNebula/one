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

        # Adds validated lifecycle state transitions to an object.
        #
        # A class declares its graph once with {.state_machine}. Instances either keep
        # state internally or read and write a configured attribute inside another
        # instance variable. State access is not synchronized; callers must hold the
        # resource lock when instances are shared across threads.
        module StateMachine

            # Extends an including class with the state declaration API.
            #
            # @param base [Class] Including class
            def self.included(base)
                base.extend(ClassMethods)
            end

            # State declaration and introspection methods for including classes.
            module ClassMethods

                # Declares the state graph for this class.
                #
                # The initial state must appear in the graph and cannot have incoming
                # transitions except through the special +:ANY+ source.
                #
                # @param initial [String, Symbol] Initial state
                # @param transitions [Hash] Source states mapped to allowed target states
                # @param failure_suffix [String] Suffix used to classify failed states
                # @return [String, Symbol] Declared initial state
                # @raise [ArgumentError] If the graph is empty or the initial state is invalid
                def state_machine(initial:, transitions: {}, failure_suffix: 'FAILURE')
                    raise ArgumentError, 'Initial state must be provided' if initial.nil?

                    @transitions = transitions || {}
                    build_states!(failure_suffix)

                    raise(
                        ArgumentError, "Initial state #{initial} is not a valid state"
                    ) unless @states.include?(initial)

                    # Validate that no state (except :ANY) points to initial
                    incoming = @transitions.reject {|key, _| key == :ANY }
                    incoming.each do |from, to_list|
                        raise(
                            ArgumentError,
                            "Init state #{initial} cannot have incoming transitions " \
                            "from #{from}"
                        ) if Array(to_list).include?(initial)
                    end

                    @initial_state = initial
                end

                # Rebuilds state and failure-state introspection from the transition graph.
                #
                # This method supports the declaration implementation and should not be
                # needed by workflow consumers.
                #
                # @param failure_suffix [String] Suffix used to classify failure states
                # @return [Array<String, Symbol>] Classified failure states
                # @raise [ArgumentError] If the transition graph has no states
                def build_states!(failure_suffix)
                    all_states = []

                    @transitions.each do |from, to_list|
                        all_states << from unless from == :ANY
                        all_states.concat(Array(to_list))
                    end

                    all_states = all_states.compact.uniq - [:ANY]

                    raise ArgumentError, 'State machine must define at least one state' \
                        if all_states.empty?

                    @states = all_states
                    @failed_states = @states.select do |state|
                        state.to_s.end_with?(failure_suffix)
                    end
                end

                # Returns the inherited initial state.
                #
                # @return [String, Symbol, nil] Initial state, if declared
                def initial_state
                    return @initial_state if instance_variable_defined?(:@initial_state)
                    return superclass.initial_state if superclass.respond_to?(:initial_state)

                    nil
                end

                # Returns every state in the inherited graph.
                #
                # @return [Array<String, Symbol>, nil] Declared states
                def states
                    return @states if instance_variable_defined?(:@states)
                    return superclass.states if superclass.respond_to?(:states)

                    nil
                end

                # Returns states classified as failures.
                #
                # @return [Array<String, Symbol>] Failed states
                def failed_states
                    return @failed_states if instance_variable_defined?(:@failed_states)
                    return superclass.failed_states if superclass.respond_to?(:failed_states)

                    []
                end

                # Returns the inherited transition graph.
                #
                # @return [Hash] Source states mapped to allowed targets
                def transitions
                    return @transitions if instance_variable_defined?(:@transitions)
                    return superclass.transitions if superclass.respond_to?(:transitions)

                    {}
                end

                # Checks whether a direct state transition is allowed.
                #
                # @param from [String, Symbol] Current state
                # @param to [String, Symbol] Target state
                # @return [Boolean] true when explicitly or globally allowed
                def valid_transition?(from, to)
                    allowed  = Array(transitions[from])
                    allowed += Array(transitions[:ANY]) if transitions.key?(:ANY)

                    allowed.include?(to)
                end

            end

            # Initializes state storage after the including class.
            #
            # @param state_path [Array<Symbol>, nil] Instance variable and nested key used
            #   for external state storage; nil uses internal storage
            # @raise [ArgumentError] If initialization delegated to the class fails
            def initialize(*args, state_path: nil, **kwargs)
                super(*args, **kwargs) if defined?(super)

                @state_path = state_path
                @state      = self.class.initial_state unless @state_path
            end

            # Transitions to another state.
            #
            # Assignment is a no-op when the target equals the current state. An object
            # without a current external state may accept its first state directly.
            #
            # @param new_state [String, Symbol, nil] Target state
            # @return [String, Symbol, nil] Requested state
            # @raise [ArgumentError] If the transition is not declared
            def state=(new_state)
                current_state = state
                target_state  = new_state&.to_sym
                return if current_state == target_state

                unless current_state.nil? ||
                       self.class.valid_transition?(current_state, target_state)
                    raise(
                        ArgumentError,
                        "Invalid transition from #{current_state} to #{target_state}"
                    )
                end

                write_state(target_state)
            end

            # Returns the current state.
            #
            # @return [Symbol, nil] Current normalized state
            def state
                read_state
            end

            # Returns the current state for presentation.
            #
            # @return [String] Current state or an empty string
            def state_str
                state.to_s
            end

            # Checks whether the current state is +:RUNNING+.
            #
            # @return [Boolean] true in the running state
            def running?
                state == :RUNNING
            end

            # Checks whether the current state is +:WARNING+.
            #
            # @return [Boolean] true in the warning state
            def warning?
                state == :WARNING
            end

            # Checks whether the current state is classified as failed.
            #
            # The generic +:ERROR+ state is always considered a failure.
            #
            # @return [Boolean] true in a declared failure or error state
            def failed?
                current_state = state
                return false if current_state.nil?

                self.class.failed_states.include?(current_state) || current_state == :ERROR
            end

            private

            def read_state
                if @state_path
                    path, key = @state_path
                    obj = instance_variable_get(path)
                    return unless obj

                    obj[key]&.to_sym
                else
                    @state
                end
            end

            def write_state(new_state)
                if @state_path
                    path, key = @state_path
                    obj       = instance_variable_get(path)
                    return unless obj

                    obj[key] = new_state&.to_s
                else
                    @state = new_state
                end
            end

        end

    end

end
