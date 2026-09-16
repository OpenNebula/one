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

        # Base schema for ODS documents
        class Schema < Dry::Validation::Contract

            # Specifies the class the contract document belongs to
            option :document_class, :default => -> {}

        end

        # Schema for a single user input definition
        class UserInputSchema < Dry::Validation::Contract

            INPUT_TYPES = ['string', 'number', 'bool', 'list', 'tuple', 'map', 'object']

            params do
                required(:name).filled(:string)
                optional(:description).maybe(:string)
                required(:type).filled(:string)
                optional(:default)
                optional(:mandatory).filled(:bool)
                optional(:sensitive).filled(:bool)
                optional(:match).maybe(:hash)
            end

            rule(:type) do
                type = value.downcase.gsub(/\(.*\)/, '')
                key.failure('Unknown type') unless INPUT_TYPES.include?(type)
            end

            rule(:type, :default) do
                next if values[:default].nil?

                type = values[:type].to_s.downcase.gsub(/\(.*\)/, '')
                next unless INPUT_TYPES.include?(type)

                case type
                when 'string'
                    key(:default).failure('must be a string') unless values[:default].is_a?(String)
                when 'number'
                    key(:default).failure('must be a number') unless values[:default].is_a?(Numeric)
                when 'bool'
                    key(:default).failure('must be a boolean') \
                        unless [true, false].include?(values[:default])
                when 'list', 'tuple'
                    key(:default).failure('must be a list') unless values[:default].is_a?(Array)
                when 'object', 'map'
                    key(:default).failure('must be a map') unless values[:default].is_a?(Hash)
                end
            end

        end

        # Adds user input definition and value validation to a document schema
        module UserInputsRules

            def self.included(base)
                base.class_eval do
                    rule do
                        user_inputs_attr =
                            document_class ? document_class::USER_INPUTS_ATTR : :user_inputs
                        user_values_attr =
                            document_class ? document_class::USER_VALUES_ATTR : :user_inputs_values

                        user_inputs        = values[user_inputs_attr]
                        user_inputs_values = values[user_values_attr] || {}

                        # Skip the rule if no user_inputs
                        next if user_inputs.nil? || user_inputs.empty?

                        input_names       = []
                        user_input_schema = UserInputSchema.new

                        user_inputs.each do |input|
                            input = input.transform_keys(&:to_sym)
                            input_name = input[:name]
                            validation = user_input_schema.call(input)

                            unless validation.success?
                                error_key = user_inputs_attr
                                error_key = input_name \
                                    if input_name.is_a?(String) && !input_name.empty?

                                validation.errors.to_h.each do |attribute, messages|
                                    key(error_key).failure(
                                        "#{attribute} #{Array(messages).join(', ')}"
                                    )
                                end
                                next
                            end

                            if input_names.include?(input_name)
                                key(input_name).failure('input name must be unique')
                                next
                            end

                            input_names << input_name
                            input_value = user_inputs_values[input_name.to_sym]
                            input_type  = input[:type].downcase.gsub(/\(.*\)/, '')

                            # Validate that the input value is present
                            if input_value.nil?
                                key(input_name).failure('is missing')
                                next
                            end

                            validate_type(self, input_name, input_type, input_value)
                            validate_match(
                                self, input_name, input[:match], input_value, user_inputs_values
                            )
                        end
                    end
                end
            end

            # Validates the type of the input value
            # against the expected type defined in the schema.
            #
            # @param name [String]  The name of the input
            # @param value [Object] The value of the input
            # @param type [String]  The expected type of the input
            def validate_type(ctx, name, type, value)
                case type
                when 'string'
                    ctx.key(name).failure('must be a string') unless value.is_a?(String)
                when 'number'
                    ctx.key(name).failure('must be a number') unless value.is_a?(Numeric)
                when 'bool'
                    ctx.key(name).failure('must be a boolean') unless [true, false].include?(value)
                when 'list', 'tuple'
                    ctx.key(name).failure('must be a list') unless value.is_a?(Array)
                when 'map', 'object'
                    ctx.key(name).failure('must be a map') unless value.is_a?(Hash)
                else
                    ctx.key(name).failure('Unknown type')
                end
            end

            # Validates the match conditions for the input value
            # against the expected match conditions defined in the schema.
            #
            # @param name [String]             The name of the input
            # @param match [Hash]              The match conditions defined in the schema
            # @param value [Object]            The value of the input
            # @param user_inputs_values [Hash] The user inputs values
            def validate_match(ctx, name, match, value, user_inputs_values)
                return if match.nil?

                match = match.transform_keys(&:to_sym)

                case match[:type].to_s.downcase
                when 'string'
                    validate_match_string(ctx, name, match, value)
                when 'number'
                    validate_match_number(ctx, name, match, value)
                when 'list'
                    validate_match_list(ctx, name, match, value)
                when 'map'
                    validate_match_map(ctx, name, match, value, user_inputs_values)
                else
                    ctx.key(name).failure('Unknown match type')
                end
            end

            # Validates the match conditions for string type
            def validate_match_string(ctx, name, match, value)
                match_values = match[:values]

                unless match_values.is_a?(Hash)
                    ctx.key(:values).failure('must be a map')
                    return
                end

                match_values = match_values.transform_keys(&:to_sym)

                regex = match_values[:regex]

                if regex.nil?
                    ctx.key(:regex).failure('is missing')
                elsif !regex.is_a?(String)
                    ctx.key(:regex).failure('must be a string')
                elsif value !~ Regexp.new(regex)
                    ctx.key(name).failure(
                        "invalid value '#{value}' for '#{name}', " \
                        "it does not match the regex '#{regex}'."
                    )
                end
            end

            # Validates the match conditions for number type
            def validate_match_number(ctx, name, match, value)
                match_values = match[:values]

                unless match_values.is_a?(Hash)
                    ctx.key(:values).failure('must be a map')
                    return
                end

                match_values = match_values.transform_keys(&:to_sym)

                min = match_values[:min]
                max = match_values[:max]

                if min.nil? && max.nil?
                    ctx.key([name, :max]).failure('at least one of min or max is required')
                    return
                end

                ctx.key(:min).failure('must be a number') if min && !min.is_a?(Numeric)
                ctx.key(:max).failure('must be a number') if max && !max.is_a?(Numeric)

                ctx.key(name).failure(
                    "invalid value '#{value}' for '#{name}', should be ≥ #{min}"
                ) if min && value < min

                return unless max && value > max

                ctx.key(name).failure("invalid value '#{value}' for '#{name}', should be ≤ #{max}")
            end

            # Validates the match conditions for list type
            def validate_match_list(ctx, name, match, value)
                match_values = match[:values]

                unless match_values.is_a?(Array)
                    ctx.key(:values).failure('must be a list')
                    return
                end

                if match_values.nil?
                    ctx.key(:values).failure('is missing')
                elsif !match_values.is_a?(Array)
                    ctx.key(:values).failure('must be a list')
                elsif !match_values.include?(value)
                    ctx.key(name).failure(
                        "invalid value '#{value}' for '#{name}'. " \
                        "Choose from: #{match_values.join(', ')}."
                    )
                end
            end

            # Validates the match conditions for map type
            def validate_match_map(ctx, name, match, value, user_inputs_values)
                grouped_by = match[:grouped_by]
                values_map = match[:values]

                ctx.key(:grouped_by).failure('is missing') if grouped_by.nil?
                ctx.key(:values).failure('is missing')     if values_map.nil?
                ctx.key(:values).failure('must be a map')  if values_map && !values_map.is_a?(Hash)

                return if grouped_by.nil? || !values_map.is_a?(Hash)

                values_map = values_map.transform_keys(&:to_sym)

                grouped_value = user_inputs_values[grouped_by.to_sym]

                if grouped_value.nil?
                    ctx.key(name).failure(
                        "cannot group by '#{grouped_by}', it is not present " \
                        'in the user inputs values.'
                    )
                    return
                end

                group_values = values_map[grouped_value.to_sym]

                if group_values.nil?
                    ctx.key(name).failure(
                        "invalid value '#{grouped_value}' for '#{grouped_by}', " \
                        'no entry found in values match map.'
                    )
                    return
                end

                unless group_values.is_a?(Array)
                    ctx.key(name).failure(
                        "invalid group '#{grouped_value}' for '#{grouped_by}', " \
                        'expected an array in match values.'
                    )
                    return
                end

                return if group_values.include?(value)

                ctx.key(name).failure(
                    "invalid value '#{value}' for '#{name}', " \
                    "choose from: #{group_values.join(', ')}."
                )
            end

        end

    end

end
