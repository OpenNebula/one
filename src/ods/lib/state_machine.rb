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

        # Base class for State Machine implementation
        module StateMachine

            def self.included(base)
                base.extend(ClassMethods)
            end

            # Mixin state machine class methods
            module ClassMethods

                def state_machine(initial:, transitions: {}, failure_suffix: 'FAILURE')
                    raise ArgumentError, 'Initial state must be provided' if initial.nil?

                    @transitions = transitions || {}
                    build_states!(failure_suffix)

                    raise(
                        ArgumentError, "Initial state #{initial} is not a valid state"
                    ) unless @states.include?(initial)

                    # Validate that no state (except :ANY) points to initial
                    incoming = @transitions.reject {|k, _| k == :ANY }
                    incoming.each do |from, to_list|
                        raise(
                            ArgumentError,
                            "Init state #{initial} cannot have incoming transitions from #{from}"
                        ) if Array(to_list).include?(initial)
                    end

                    @initial_state = initial
                end

                def build_states!(failure_suffix)
                    all_states = []

                    @transitions.each do |from, to_list|
                        all_states << from unless from == :ANY
                        all_states.concat(Array(to_list))
                    end

                    all_states = all_states.compact.uniq - [:ANY]

                    raise(
                        ArgumentError, 'State machine must define at least one state'
                    ) if all_states.empty?

                    @states        = all_states
                    @failed_states = @states.select {|s| s.to_s.end_with?(failure_suffix) }
                end

                def initial_state
                    return @initial_state if instance_variable_defined?(:@initial_state)
                    return superclass.initial_state if superclass.respond_to?(:initial_state)

                    nil
                end

                def states
                    return @states if instance_variable_defined?(:@states)
                    return superclass.states if superclass.respond_to?(:states)

                    nil
                end

                def failed_states
                    return @failed_states if instance_variable_defined?(:@failed_states)
                    return superclass.failed_states if superclass.respond_to?(:failed_states)

                    []
                end

                def transitions
                    return @transitions if instance_variable_defined?(:@transitions)
                    return superclass.transitions if superclass.respond_to?(:transitions)

                    {}
                end

                def valid_transition?(from, to)
                    allowed  = Array(transitions[from])
                    allowed += Array(transitions[:ANY]) if transitions.key?(:ANY)

                    allowed.include?(to)
                end

            end

            def initialize(*args, state_path: nil, **kwargs)
                super(*args, **kwargs) if defined?(super)

                @state_path = state_path
                @state      = self.class.initial_state unless @state_path
            end

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

            def state
                read_state
            end

            def state_str
                state.to_s
            end

            def running?
                state == :RUNNING
            end

            def warning?
                state == :WARNING
            end

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
