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

        # Configuration validator
        module Validator

            class ValidationError < StandardError; end

            # Validates a config hash against the given schema
            #
            # @param config [Hash] configuration to validate
            # @param schema [Hash] schema definition
            # @param path [Array<String>] internal recursion path (used for nested keys)
            # @param allow_extra [Boolean] keep keys not defined in the schema
            #
            # @return [Hash] validated configuration (defaults applied)
            def self.validate(config, schema, path = [], allow_extra = false)
                validated = allow_extra ? config.dup : {}

                schema.each do |key, rules|
                    key_sym   = key.to_sym
                    full_path = (path + [key.to_s]).join('.')
                    value     = config_value(config, key)

                    # Check required values
                    if rules[:required] && value.nil?
                        raise ValidationError, "Missing required key: #{full_path}"
                    end

                    # Add defaults
                    if value.nil? && rules.key?(:default)
                        value = rules[:default]
                    end

                    # Skip validation if still nil and not required
                    next if value.nil?

                    # Check type
                    case rules[:type]
                    when 'string', :string
                        raise ValidationError, "Invalid type for #{full_path}: expected String" \
                        unless value.is_a?(String)
                    when 'integer', :integer
                        raise ValidationError, "Invalid type for #{full_path}: expected Integer" \
                        unless value.is_a?(Integer)
                    when 'address', :address
                        begin
                            IPAddr.new(value)
                        rescue IPAddr::InvalidAddressError
                            raise ValidationError, "Invalid address format for #{full_path}"
                        end
                    when 'object', :object
                        raise ValidationError, "Invalid type for #{full_path}: expected Hash" \
                        unless value.is_a?(Hash)

                        # Recursive validation
                        value = validate(
                            value,
                            rule_value(rules, :keys) || {},
                            path + [key.to_s],
                            rule_value(rules, :allow_extra)
                        )
                    else
                        raise ValidationError, "Unknown type for #{full_path}: #{rules[:type]}"
                    end

                    # Allowed values
                    if rules[:allowed] && !rules[:allowed].include?(value)
                        raise ValidationError,
                              "Invalid value for #{full_path}: #{value.inspect} " \
                              "(allowed: #{rules[:allowed].join(', ')})"
                    end

                    validated.delete(key_sym)
                    validated.delete(key.to_s)
                    validated[key_sym] = value
                end

                validated
            end

            def self.config_value(config, key)
                key_sym = key.to_sym
                return config[key_sym] if config.key?(key_sym)

                config[key.to_s]
            end

            def self.rule_value(rules, key)
                key_sym = key.to_sym
                return rules[key_sym] if rules.key?(key_sym)

                rules[key.to_s]
            end

        end

    end

end
