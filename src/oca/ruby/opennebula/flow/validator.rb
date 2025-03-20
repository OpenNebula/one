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

require 'uri'
require 'json'

# Overwriting hash class with new methods
class Hash

    # Returns a new hash containing the contents of other_hash and the
    #   contents of self. If the value for entries with duplicate keys
    #   is a Hash, it will be merged recursively, otherwise it will be that
    #   of other_hash.
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
    def deep_merge(other_hash)
        target = dup

        other_hash.each do |hash_key, hash_value|
            if hash_value.is_a?(Hash) && self[hash_key].is_a?(Hash)
                target[hash_key] = self[hash_key].deep_merge(hash_value)
            elsif hash_value.is_a?(Array) && self[hash_key].is_a?(Array)
                hash_value.each_with_index do |elem, i|
                    if self[hash_key][i].is_a?(Hash) && elem.is_a?(Hash)
                        target[hash_key] = self[hash_key] + hash_value
                    else
                        target[hash_key] = hash_value
                    end
                end
            else
                target[hash_key] = hash_value
            end
        end

        target
    end

    class << self

        # Converts a hash to a raw String in the form KEY = VAL
        #
        # @param template [String]          Hash content
        #
        # @return [Hash, OpenNebula::Error] String representation in the form KEY = VALUE of
        #                                   the hash, or an OpenNebula Error if the conversion fails
        def to_raw(content_hash)
            return '' if content_hash.nil? || content_hash.empty?

            content = ''
            content_hash.each do |key, value|
                case value
                when Hash
                    sub_content = to_raw(value)

                    content      += "#{key} = [\n"
                    content_lines = sub_content.split("\n")

                    content_lines.each_with_index do |line, index|
                        content += line.to_s
                        content += ",\n" unless index == content_lines.size - 1
                    end

                    content += "\n]\n"
                when Array
                    value.each do |element|
                        content += to_raw({ key.to_s => element })
                    end
                else
                    content += "#{key} = \"#{value}\"\n"
                end
            end

            content
        rescue StandardError => e
            return OpenNebula::Error.new("Error wrapping the hash: #{e.message}")
        end

    end

end

module Validator

    class ParseException < StandardError; end
    class SchemaException < StandardError; end

    # The Validator class is used to validate a JSON body based on a schema
    # which is a Hash that describes the structure of the body.
    class Validator

        # @param [Hash] opts the options to validate a body
        # @option opts [Boolean] :default_values Set default values if the schema
        #   specifies it (if true)
        # @option opts [Boolean] :delete_extra_properties If the body contains properties
        #   not specified in the schema delete them from the body (if true)
        #   or raise an exception (if false)
        # @option opts [Boolean] :allow_extra_properties Allow properties
        #   not specified in the schema
        def initialize(opts = {})
            @opts = {
                :default_values => true,
                :delete_extra_properties => false,
                :allow_extra_properties => false
            }.merge(opts)
        end

        # Recursively validate and modify a JSON body based on a schema.
        #
        # @see http://tools.ietf.org/html/draft-zyp-json-schema-03
        #
        # @param [Hash, Array, String, nil] body JSON represented as Ruby objects
        # @param [Hash] schema that will be used to validate
        # @param [String] key of the body that will be validated in this step
        #
        # @return [Hash, Array, String, nil] The modified body
        #
        # @raise [SchemaException] If the schema is not correctly defined
        # @raise [ParseException] if the body does not meet the schema definition
        #
        # @example Validate a User
        #   schema = {
        #       :type => :object,
        #       :properties => {
        #           'username' => {
        #               :type => :string
        #           }
        #       }
        #   }
        #
        #   hash = {
        #       'username' => 'pepe'
        #   }
        #
        #   Validator.validate!(hash, schema)
        #   #=> {'username' => 'pepe'}
        #
        # @note The parameter body will be modified
        # @note Schema options supported
        #   :extends
        #   :type => [:object, :array, :string, :null]
        #
        def validate!(body, schema, key = '')
            if schema[:extends]
                base_schema = schema.delete(:extends)
                schema      = base_schema.deep_merge(schema)
            end

            case schema[:type]
            when :object  then validate_object(body, schema, key)
            when :array   then validate_array(body, schema, key)
            when :string  then validate_string(body, schema, key)
            when :integer then validate_integer(body, schema, key)
            when :null    then validate_null(body, schema, key)
            when :boolean then validate_boolean(body, schema, key)
            else raise SchemaException, "Unsupported type #{schema[:type]}"
            end
        end

        private

        # Validate an object type
        #
        # @param [Hash] body to be validated
        # @param [Hash] schema_object of the objectto validate the body
        # @param [String] key of the body that will be validated in this step
        #
        # @return [Hash] The modified body
        #
        # @raise [ParseException] if the body does not meet the schema definition
        #
        # @example Validate with default values
        #   schema_body = {
        #       :type => :object,
        #       :properties => {
        #           'username' => {
        #               :type => :string,
        #               :default => 'def'
        #           }
        #       }
        #
        #   body = {}
        #
        #   Validator.validate_object(body, schema_body)
        #   #=> {'username' => 'def'}
        #
        # @note The parameter body will be modified
        # @note Schema options supported
        #   :properties
        #   :required
        #   :default
        #
        def validate_object(body, schema_object, key)
            unless body.is_a?(Hash)
                raise ParseException, "KEY: '#{key}' must be an Object;"
            end

            return body if schema_object[:properties].empty?

            new_body = body.dup

            schema_object[:properties].each do |schema_key, schema_value|
                body_value = new_body.delete(schema_key)

                if body_value
                    body[schema_key] = validate!(body_value, schema_value, schema_key)
                else
                    if schema_value[:required]
                        raise ParseException,
                              "Mandatory document key '#{schema_key} (#{schema_value[:type]})' is missing from #{JSON.dump(body)}"
                    end

                    if @opts[:default_values] && schema_value[:default]
                        body[schema_key] = schema_value[:default]
                    end
                end
            end

            # raise error if body.keys is not empty
            unless new_body.keys.empty?
                if @opts[:delete_extra_properties]
                    new_body.keys.each {|key| body.delete(key) }
                else
                    return body if @opts[:allow_extra_properties]

                    raise ParseException, "The following keys are not allowed: #{new_body.keys.join(', ')};"
                end
            end

            body
        end

        # Validate an array type
        #
        # @param [Array] body to be validated
        # @param [Hash] schema_array of the object to validate the body
        # @param [String] schema_key of the body that will be validated in this step
        #
        # @return [Hash] The modified body
        #
        # @raise [ParseException] if the body does not meet the schema definition
        #
        # @example Validate array
        #   schema = {
        #       :type => :array,
        #       :items => {
        #           :type => :string
        #       }
        #   }
        #
        #   body = ['pepe', 'luis', 'juan']
        #
        #   Validator.validate_array(body, schema)
        #   #=> 'username' => ['pepe', 'luis', 'juan']
        #
        # @note The parameter body will be modified
        # @note Schema options supported
        #   :items
        #
        def validate_array(body, schema_array, schema_key)
            unless body.instance_of?(Array)
                raise ParseException, "KEY: '#{schema_key}' must be an Array;"
            end

            return body if schema_array[:items].empty?

            body.collect do |body_item|
                validate!(body_item, schema_array[:items], schema_key)
            end
        end

        # Validate an integer type
        #
        # @param [Array] body to be validated
        # @param [Hash] schema_array of the object to validate the body
        # @param [String] schema_key of the body that will be validated in this step
        #
        # @return [Hash] The modified body
        #
        # @raise [ParseException] if the body does not meet the schema definition
        #
        # @example Validate array
        #   schema = {
        #       :type => :integer
        #   }
        #
        #   body = 5
        #
        #   Validator.validate_integer(body, schema)
        #   #=> 5
        #
        #
        def validate_integer(body, schema_array, schema_key)
            value = Integer(body)

            if schema_array[:maximum]
                excl = schema_array[:exclusiveMaximum]
                max = schema_array[:maximum]
                if !(excl ? value < max : value <= max)
                    raise ParseException, "KEY: '#{schema_key}' must be "\
                        "lower than #{excl ? '' : 'or equal to'} #{max};"
                end
            end

            if schema_array[:minimum]
                excl = schema_array[:exclusiveMinimum]
                min = schema_array[:minimum]
                if !(excl ? value > min : value >= min)
                    raise ParseException, "KEY: '#{schema_key}' must be "\
                        "greater than #{excl ? '' : 'or equal to'} #{min};"
                end
            end

            value
        rescue ArgumentError
            raise ParseException, "KEY: '#{schema_key}' must be an Integer;"
        end

        # Validate an null type
        #
        # @param [nil] body to be validated
        # @param [Hash] schema_null of the object to validate the body
        # @param [String] schema_key of the body that will be validated in this step
        #
        # @return [nil]
        #
        # @raise [ParseException] if the body is not nil
        #
        # @example Validate array
        #   schema = {
        #       :type => :null
        #   }
        #
        #   body = nil
        #
        #   Validator.validate_null(body, schema)
        #   #=> nil
        #
        #
        def validate_null(body, schema_null, schema_key)
            return if body.nil?

            raise ParseException, "KEY: '#{schema_key}' is not allowed in #{schema_null};"
        end

        # Validate an boolean type
        #
        # @param [Object] body to be validated
        # @param [Hash] schema_boolean of the object to validate the body
        # @param [String] schema_key of the body that will be validated in this step
        #
        # @return [nil]
        #
        # @raise [ParseException] if the body is not a boolean
        #
        # @example Validate array
        #   schema = {
        #       :type => :boolean
        #   }
        #
        #   body = true
        #
        #   Validator.validate_boolean(body, schema)
        #   #=> nil
        #
        #
        def validate_boolean(body, schema_boolean, schema_key)
            if body != true && body != false
                raise ParseException, "KEY: '#{schema_key}' is not allowed in #{schema_boolean};"
            end

            body
        end

        # Validate an string type
        #
        # @param [String] body to be validated
        # @param [Hash] schema_string of the object to validate the body
        # @param [String] schema_key of the body that will be validated in this step
        #
        # @return [String] The modified body
        #
        # @raise [ParseException] if the body does not meet the schema definition
        #
        # @example Validate array
        #   schema = {
        #       :type => :string
        #   }
        #
        #   body = "pepe"
        #
        #   Validator.validate_string(body, schema)
        #   #=> "pepe"
        #
        # @note The parameter body will be modified
        # @note Schema options supported
        #   :format
        #   :enum
        #   :regex
        #
        def validate_string(body, schema_string, schema_key)
            unless body.instance_of?(String)
                raise ParseException, "KEY: '#{schema_key}' must be a String;"
            end

            if schema_string[:format]
                check_format(body, schema_string, schema_key)
            elsif schema_string[:enum]
                check_enum(body, schema_string, schema_key)
            elsif schema_string[:regex]
                check_regex(body, schema_string, schema_key)
            else
                body
            end
        end

        # Validate an string format
        #
        # @param [String] body_value to be validated
        # @param [Hash] schema_string of the object to validate the body
        # @param [String] schema_key of the body that will be validated in this step
        #
        # @return [String] The modified body
        #
        # @raise [ParseException] if the body does not meet the schema definition
        #
        # @example Validate array
        #   schema = {
        #       :type => :string,
        #       :format => :url
        #   }
        #
        #   body = "http://localhost:4567"
        #
        #   Validator.check_format(body, schema)
        #   #=> "http://localhost:4567"
        #
        # @note The parameter body will be modified
        # @note Schema options supported
        #   :url
        #
        def check_format(body_value, schema_string, schema_key)
            case schema_string[:format]
            when :uri
                begin
                    require 'uri'
                    URI.parse(body_value)
                rescue URI::InvalidURIError
                    raise ParseException, "KEY: '#{schema_key}' must be a valid URL;"
                end

                body_value
            end

            body_value
        end

        # Validate an string enum
        #
        # @param [String] body_value to be validated
        # @param [Hash] schema_string of the object to validate the body
        # @param [String] schema_key of the body that will be validated in this step
        #
        # @return [String] The modified body
        #
        # @raise [ParseException] if the body does not meet the schema definition
        #
        # @example Validate array
        #   schema = {
        #       :type => :string,
        #       :enum => ['juan', 'luis']
        #   }
        #
        #   body = "juan"
        #
        #   Validator.check_enum(body, schema)
        #   #=> "juan"
        #
        # @note The parameter body will be modified
        # @note Schema options supported
        #   :enum
        #
        def check_enum(body_value, schema_string, schema_key)
            if schema_string[:enum].include?(body_value)
                body_value
            else
                raise ParseException, "KEY: '#{schema_key}' must be one of"\
                    " #{schema_string[:enum].join(', ')};"
            end
        end

        # Validate an string regex
        #
        # @param [String] body_value to be validated
        # @param [Hash] schema_string of the object to validate the body
        # @param [String] schema_key of the body that will be validated in this step
        #
        # @return [String] The modified body
        #
        # @raise [ParseException] if the body does not meet the schema definition
        #
        # @example Validate array
        #   schema = {
        #       :type => :string,
        #       :regex =>  /^\w+$/
        #   }
        #
        #   body = "juan"
        #
        #   Validator.check_regex(body, schema)
        #   #=> "juan"
        #
        # @note The parameter body will be modified
        # @note Schema options supported
        #   :enum
        #
        def check_regex(body_value, schema_string, schema_key)
            if schema_string[:regex] =~ body_value
                body_value
            else
                raise(
                    ParseException,
                    "KEY: '#{schema_key}' must match regexp #{schema_string[:regex].inspect};"
                )
            end
        end

    end

end
