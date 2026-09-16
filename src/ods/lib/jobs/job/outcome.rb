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

        # Workflow job type and its runtime outcomes.
        class Job

            # Base type for values a workflow step may return.
            class Outcome; end

            # Defers completion until an event-driven predicate becomes true.
            class Wait < Outcome

                attr_reader :events, :check

                def self.from_h(value)
                    return value if value.is_a?(self)
                    raise ArgumentError, 'Job wait must be a Hash' unless value.is_a?(Hash)

                    data = value.to_h do |key, item|
                        [key.is_a?(String) ? key.to_sym : key, item]
                    end
                    check = symbol(data[:check])

                    if symbol(data[:type]) == :children
                        return ChildrenWait.new(
                            :check => check,
                            :forward_args => data.fetch(:forward_args, false)
                        )
                    end

                    events = Array(data[:events]).map {|event| symbol(event) }
                    new(:events => events, :check => check)
                end

                def self.symbol(value)
                    value.is_a?(String) ? value.to_sym : value
                end
                private_class_method :symbol

                def initialize(events:, check:)
                    super()

                    @events = Array(events).uniq.freeze
                    @check  = check

                    raise ArgumentError, 'Wait events cannot be empty' if @events.empty?
                    raise ArgumentError, 'Wait events must be Symbols' \
                        unless @events.all? {|event| event.is_a?(Symbol) }
                    raise ArgumentError, 'Wait check must be a Symbol' \
                        unless @check.is_a?(Symbol)

                    freeze
                end

                def to_h
                    { :events => events, :check => check }
                end

                def ==(other)
                    other.is_a?(Wait) && other.to_h == to_h
                end

            end

            # Internal durable wait used by parent-child composition.
            class ChildrenWait < Wait

                EVENT = :__ods_child_state_changed

                def initialize(check:, forward_args: false)
                    raise ArgumentError, 'Children wait forward args must be boolean' \
                        unless [true, false].include?(forward_args)

                    @forward_args = forward_args
                    super(:events => [EVENT], :check => check)
                end

                def forward_args?
                    @forward_args
                end

                def to_h
                    data = { :type => :children, :check => check }
                    data[:forward_args] = true if forward_args?
                    data
                end

            end

            # Declares child workflow requests and the parent's domain predicate.
            # Supplying args replaces the durable parent arguments; omitting it
            # preserves them. Descriptor args remain private to each child.
            class Children < Outcome

                attr_reader :children, :wait, :args

                def initialize(children, wait:, args: nil)
                    super()

                    raise ArgumentError, 'Children must be an Array' \
                        unless children.is_a?(Array)
                    raise ArgumentError, 'Children cannot be empty' if children.empty?
                    raise ArgumentError, 'Children wait must be a Symbol' \
                        unless wait.is_a?(Symbol)
                    raise ArgumentError, 'Children args must be a Hash' \
                        unless args.nil? || args.is_a?(Hash)

                    @children = children.map {|item| ChildRequest.from_h(item) }.freeze
                    @wait     = ChildrenWait.new(
                        :check => wait, :forward_args => !args.nil?
                    )
                    @args = args&.dup&.freeze

                    freeze
                end

                def descriptors(parent_step)
                    children.map {|descriptor| descriptor.child(parent_step) }.freeze
                end

            end

            # Declares an external command runtime outcome.
            class Run < Outcome

                attr_reader :command, :result

                def initialize(command, result: nil)
                    super()

                    @command = command
                    @result  = success_result(result, 'Command')

                    freeze
                end

                private

                def success_result(result, label)
                    outcome =
                        if result.is_a?(Success)
                            result
                        elsif result.nil? || result.is_a?(Symbol)
                            Success.new(result)
                        end

                    raise ArgumentError, "#{label} result must be a success outcome" \
                        unless outcome.is_a?(Success)

                    outcome
                end

            end

            # Declares one Ruby task to run in a job-owned thread.
            class ThreadTask < Outcome

                attr_reader :task, :commit, :args, :result

                def initialize(task, commit: nil, args: nil, result: nil)
                    @task   = task
                    @commit = commit
                    @args   = (args || {}).dup.freeze
                    @result = normalize_result(result)

                    raise ArgumentError, 'Thread task must be a Symbol' unless @task.is_a?(Symbol)
                    raise ArgumentError, 'Thread commit must be a Symbol' \
                        unless @commit.nil? || @commit.is_a?(Symbol)
                    raise ArgumentError, 'Thread args must be a Hash' \
                        unless @args.is_a?(Hash)

                    super()
                    freeze
                end

                private

                def normalize_result(result)
                    outcome =
                        if result.is_a?(Success)
                            result
                        elsif result.nil? || result.is_a?(Symbol)
                            Success.new(result)
                        end

                    raise ArgumentError, 'Thread result must be a success outcome' \
                        unless outcome.is_a?(Success)

                    outcome
                end

            end

            # Declares one Ruby task per item with serial owner commits.
            class ThreadPool < ThreadTask

                attr_reader :items

                def initialize(items, task:, commit: nil, args: nil, result: nil)
                    @items = items&.dup&.freeze

                    raise ArgumentError, 'Thread pool items must be an Array' \
                        unless @items.is_a?(Array)

                    super(
                        task,
                        :commit => commit,
                        :args   => args,
                        :result => result
                    )
                end

            end

            # Selects a success transition declared by the current workflow step.
            class Success < Outcome

                attr_reader :name, :args

                def initialize(name = nil, args: nil)
                    super()

                    @name = name
                    @args = args&.dup&.freeze

                    raise ArgumentError, 'Success args must be a Hash' \
                        unless @args.nil? || @args.is_a?(Hash)
                    raise ArgumentError, 'Success name must be a Symbol' \
                        unless @name.nil? || @name.is_a?(Symbol)

                    freeze
                end

            end

            # Declares continuation with another workflow step.
            class Next < Outcome

                attr_reader :step, :state, :args, :failure_state

                def initialize(step, state: nil, args: nil, failure: nil)
                    super()

                    @step          = step
                    @state         = state
                    @args          = args&.dup&.freeze
                    @failure_state = failure

                    raise ArgumentError, 'Next job step must be a Symbol' \
                        unless @step.is_a?(Symbol)
                    raise ArgumentError, 'Next job args must be a Hash' \
                        unless @args.nil? || @args.is_a?(Hash)
                    raise ArgumentError, 'Next job state must be a Symbol' \
                        unless @state.nil? || @state.is_a?(Symbol)
                    raise ArgumentError, 'Next job failure state must be a Symbol' \
                        unless @failure_state.nil? || @failure_state.is_a?(Symbol)

                    freeze
                end

            end

            # Declares completion in a stable owner state.
            class Complete < Outcome

                attr_reader :state

                def initialize(state, owner_deleted: false)
                    super()

                    @state         = state
                    @owner_deleted = owner_deleted

                    raise ArgumentError, 'Completion state must be a Symbol' \
                        unless @state.is_a?(Symbol)

                    freeze
                end

                def owner_deleted?
                    @owner_deleted
                end

            end

            # Declares failure of the current workflow step.
            class Failure < Outcome

                attr_reader :message, :name

                def initialize(message, name: nil)
                    super()

                    @message = message.to_s
                    @name    = name

                    raise ArgumentError, 'Failure name must be a Symbol' \
                        unless @name.nil? || @name.is_a?(Symbol)

                    freeze
                end

            end

            class << self

                def run(command, result: nil)
                    Run.new(command, :result => result)
                end

                def thread(task, commit: nil, args: nil, result: nil)
                    ThreadTask.new(task, :commit => commit, :args => args, :result => result)
                end

                def thread_pool(items, task:, commit: nil, args: nil, result: nil)
                    ThreadPool.new(
                        items,
                        :task   => task,
                        :commit => commit,
                        :args   => args,
                        :result => result
                    )
                end

                def success(name = nil, args: nil)
                    Success.new(name, :args => args)
                end

                def wait(events:, check:)
                    Wait.new(:events => events, :check => check)
                end

                def children(children, wait:, args: nil)
                    Children.new(children, :wait => wait, :args => args)
                end

                def next(step, state: nil, args: nil, failure: nil)
                    Next.new(step, :state => state, :args => args, :failure => failure)
                end

                def complete(state, owner_deleted: false)
                    Complete.new(state, :owner_deleted => owner_deleted)
                end

                def fail(message, name: nil)
                    Failure.new(message, :name => name)
                end

            end

        end

    end

end
