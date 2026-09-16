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

        class Job

            # Recursively freezes the JSON-compatible data carried by child relations.
            module ImmutableChildData

                private

                def immutable(value)
                    case value
                    when Hash
                        value.to_h do |key, item|
                            [immutable(key), immutable(item)]
                        end.freeze
                    when Array
                        value.map {|item| immutable(item) }.freeze
                    when String
                        value.dup.freeze
                    when Symbol, Numeric, true, false, nil
                        value
                    else
                        raise ArgumentError,
                              "Child arguments must be serializable, got #{value.class}"
                    end
                end

            end

            private_constant :ImmutableChildData

            # Immutable reference from a child operation to its parent.
            class Parent

                FIELDS = [:workflow, :owner_id, :operation_id, :parent_step]

                attr_reader(*FIELDS)

                def self.from_h(value)
                    return value if value.is_a?(self)
                    raise ArgumentError, 'Job parent must be a Hash' unless value.is_a?(Hash)

                    data = symbolize(value)
                    unknown = data.keys - FIELDS
                    raise ArgumentError, "Unknown job parent fields: #{unknown.join(', ')}" \
                        unless unknown.empty?

                    new(**data)
                end

                def self.symbolize(value)
                    value.to_h do |key, item|
                        [key.is_a?(String) ? key.to_sym : key, item]
                    end
                end
                private_class_method :symbolize

                def initialize(workflow:, owner_id:, operation_id:, parent_step:)
                    @workflow     = workflow.is_a?(String) ? workflow.to_sym : workflow
                    @owner_id     = immutable(owner_id)
                    @operation_id = operation_id.to_s.freeze
                    @parent_step  = parent_step.is_a?(String) ? parent_step.to_sym : parent_step

                    validate!
                    freeze
                end

                def to_h
                    {
                        :workflow     => workflow,
                        :owner_id     => owner_id,
                        :operation_id => operation_id,
                        :parent_step  => parent_step
                    }
                end

                def ==(other)
                    other.is_a?(self.class) && other.to_h == to_h
                end

                private

                def immutable(value)
                    value.is_a?(String) ? value.dup.freeze : value
                end

                def validate!
                    raise ArgumentError, 'Parent workflow must be a Symbol' \
                        unless workflow.is_a?(Symbol)
                    raise ArgumentError, 'Parent owner cannot be empty' if owner_id.to_s.empty?
                    raise ArgumentError, 'Parent operation ID cannot be empty' \
                        if operation_id.empty?
                    raise ArgumentError, 'Parent step must be a Symbol' \
                        unless parent_step.is_a?(Symbol)
                end

            end

            # Immutable validated descriptor accepted by Job.children.
            class ChildRequest

                include ImmutableChildData

                FIELDS = [:workflow, :owner_id, :step, :args]

                attr_reader(*FIELDS)

                def self.from_h(value)
                    raise ArgumentError, 'Child descriptor must be a Hash' \
                        unless value.is_a?(Hash)

                    data = value.to_h do |key, item|
                        [key.is_a?(String) ? key.to_sym : key, item]
                    end
                    unknown = data.keys - FIELDS
                    raise ArgumentError,
                          "Unknown child descriptor fields: #{unknown.join(', ')}" \
                        unless unknown.empty?

                    missing = [:workflow, :owner_id, :step].reject {|field| data.key?(field) }
                    raise ArgumentError,
                          "Missing child descriptor fields: #{missing.join(', ')}" \
                        unless missing.empty?

                    new(**data)
                end

                def initialize(workflow:, owner_id:, step:, args: {})
                    @workflow = workflow.is_a?(String) ? workflow.to_sym : workflow
                    @owner_id = immutable(owner_id)
                    @step     = step.is_a?(String) ? step.to_sym : step
                    @args     = immutable(args)

                    raise ArgumentError, 'Child workflow must be a Symbol' \
                        unless workflow.is_a?(Symbol)
                    raise ArgumentError, 'Child owner cannot be empty' if owner_id.to_s.empty?
                    raise ArgumentError, 'Child step must be a Symbol' unless step.is_a?(Symbol)
                    raise ArgumentError, 'Child args must be a Hash' unless args.is_a?(Hash)

                    freeze
                end

                def child(parent_step)
                    Child.new(
                        :workflow => workflow, :owner_id => owner_id,
                        :parent_step => parent_step, :step => step, :args => args
                    )
                end

            end

            # Immutable child request and its durable coordination state.
            class Child

                include ImmutableChildData

                RUNNING_STATUSES  = [:active, :cancel_requested].freeze
                FAILURE_STATUSES  = [:failed, :cancelled].freeze
                TERMINAL_STATUSES = [:complete, :missing, *FAILURE_STATUSES].freeze
                STATUSES = [
                    :intent, :active, *TERMINAL_STATUSES,
                    :cancel_requested
                ].freeze
                FIELDS = [
                    :workflow, :owner_id, :parent_step, :step, :args,
                    :status, :operation_id, :error
                ]

                attr_reader(*FIELDS)

                def self.from_descriptor(value, parent_step:)
                    ChildRequest.from_h(value).child(parent_step)
                end

                def self.from_h(value)
                    return value if value.is_a?(self)
                    raise ArgumentError, 'Job child must be a Hash' unless value.is_a?(Hash)

                    data = symbolize(value)
                    unknown = data.keys - FIELDS
                    raise ArgumentError, "Unknown job child fields: #{unknown.join(', ')}" \
                        unless unknown.empty?

                    [:workflow, :parent_step, :step, :status].each do |field|
                        data[field] = data[field].to_sym if data[field].is_a?(String)
                    end

                    new(**data)
                end

                def self.symbolize(value)
                    value.to_h do |key, item|
                        [key.is_a?(String) ? key.to_sym : key, item]
                    end
                end
                private_class_method :symbolize

                def initialize(workflow:, owner_id:, parent_step:, step:, **attributes)
                    unknown = attributes.keys - [:args, :status, :operation_id, :error]
                    raise ArgumentError, "Unknown job child fields: #{unknown.join(', ')}" \
                        unless unknown.empty?

                    args         = attributes.fetch(:args, {})
                    status       = attributes.fetch(:status, :intent)
                    operation_id = attributes.fetch(:operation_id, nil)
                    error        = attributes.fetch(:error, nil)

                    @workflow     = workflow.is_a?(String) ? workflow.to_sym : workflow
                    @owner_id     = immutable(owner_id)
                    @parent_step  = parent_step.is_a?(String) ? parent_step.to_sym : parent_step
                    @step         = step.is_a?(String) ? step.to_sym : step
                    @args         = immutable(args)
                    @status       = status.is_a?(String) ? status.to_sym : status
                    @operation_id = operation_id&.to_s&.freeze
                    @error        = error&.to_s&.freeze

                    validate!
                    freeze
                end

                def identity
                    [workflow, owner_id.to_s, parent_step, step, args]
                end

                def owner_key
                    [workflow, owner_id.to_s, parent_step]
                end

                def requested?
                    !operation_id.to_s.empty?
                end

                def terminal?
                    TERMINAL_STATUSES.include?(status)
                end

                def with(**changes)
                    self.class.from_h(to_h.merge(changes))
                end

                def to_h
                    {
                        :workflow     => workflow,
                        :owner_id     => owner_id,
                        :parent_step  => parent_step,
                        :step         => step,
                        :args         => args,
                        :status       => status,
                        :operation_id => operation_id,
                        :error        => error
                    }.compact
                end

                def ==(other)
                    other.is_a?(self.class) && other.to_h == to_h
                end

                private

                def validate!
                    raise ArgumentError, 'Child workflow must be a Symbol' \
                        unless workflow.is_a?(Symbol)
                    raise ArgumentError, 'Child owner cannot be empty' if owner_id.to_s.empty?
                    raise ArgumentError, 'Child parent step must be a Symbol' \
                        unless parent_step.is_a?(Symbol)
                    raise ArgumentError, 'Child step must be a Symbol' unless step.is_a?(Symbol)
                    raise ArgumentError, 'Child args must be a Hash' unless args.is_a?(Hash)
                    raise ArgumentError, "Invalid child status #{status.inspect}" \
                        unless STATUSES.include?(status)
                    raise ArgumentError, 'Child operation ID cannot be empty' \
                        if !operation_id.nil? && operation_id.empty?
                end

            end

        end

    end

end
