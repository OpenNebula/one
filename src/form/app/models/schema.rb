# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

module OneForm

    # Generic Schema for Form documents
    # Introduces rules to validate the user_inputs and their values
    class FormDocumentSchema < Dry::Validation::Contract

        rule(:user_inputs, :user_inputs_values) do
            user_inputs        = values[:user_inputs]
            user_inputs_values = values[:user_inputs_values] || {}

            user_inputs.each do |input|
                input       = input.transform_keys(&:to_sym)
                input_name  = input[:name]
                input_value = user_inputs_values[input_name]
                input_type  = input[:type].to_s.downcase.gsub(/\(.*\)/, '')

                # Validate that the input value is present
                if input_value.nil?
                    key(input_name).failure('is missing')
                    next
                end

                validate_type(self, input_name, input_type, input_value)
                validate_match(self, input_name, input[:match], input_value, user_inputs_values)
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
            match_values = match[:values].transform_keys(&:to_sym)

            unless match_values.is_a?(Hash)
                ctx.key(:values).failure('must be a map')
                return
            end

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
            match_values = match[:values].transform_keys(&:to_sym)

            unless match_values.is_a?(Hash)
                ctx.key(:values).failure('must be a map')
                return
            end

            min = match_values[:min]
            max = match_values[:max]

            if min.nil? && max.nil?
                ctx.key([name, :max]).failure('at least one of min or max is required')
                return
            end

            ctx.key(:min).failure('must be a number') if min && !min.is_a?(Numeric)
            ctx.key(:max).failure('must be a number') if max && !max.is_a?(Numeric)

            if min && value < min
                ctx.key(name).failure("invalid value '#{value}' for '#{name}', should be ≥ #{min}")
            end

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
            values_map = match[:values].transform_keys(&:to_sym)

            ctx.key(:grouped_by).failure('is missing') if grouped_by.nil?
            ctx.key(:values).failure('is missing')     if values_map.nil?
            ctx.key(:values).failure('must be a map')  if values_map && !values_map.is_a?(Hash)

            return if grouped_by.nil? || !values_map.is_a?(Hash)

            grouped_value = user_inputs_values[grouped_by]

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

# Expanding hash class with new methods
class Hash

    # Returns a new hash containing the contents of other_hash and the
    # contents of self. If the value for entries with duplicate keys
    # is a Hash, it will be merged recursively, otherwise it will be that
    # of other_hash.
    #
    # @param [Hash] other_hash
    #
    # @return [Hash] Containing the merged values
    #
    # @example Merging two hashes
    #   h1 = {:a => 3, {:b => 3, :c => 7}}
    #   h2 = {:a => 22, c => 4, {:b => 5}}
    #
    #   h1.deep_merge(h2) #=> {:a => 22, c => 4, {:b => 5, :c => 7}}
    def deep_merge(other_hash, merge_array = true)
        target = clone

        other_hash.each do |key, value|
            current = target[key]

            target[key] =
                if value.is_a?(Hash) && current.is_a?(Hash)
                    current.deep_merge(value, merge_array)
                elsif value.is_a?(Array) && current.is_a?(Array) && merge_array
                    merged = current + value
                    merged.all? {|el| el.is_a?(Hash) } ? merged.uniq : merged
                else
                    value
                end
        end

        target
    end

end
