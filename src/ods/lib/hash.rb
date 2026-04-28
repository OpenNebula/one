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
                    merged.all?(Hash) ? merged.uniq : merged
                else
                    value
                end
        end

        target
    end

    # Recursively converts all hash keys to symbols
    #
    # @return [Hash] a new hash with symbolized keys
    def deep_symbolize_keys
        each_with_object({}) do |(key, value), result|
            sym_key = key.is_a?(String) ? key.to_sym : key
            result[sym_key] =
                case value
                when Hash
                    value.deep_symbolize_keys
                when Array
                    value.map {|e| e.is_a?(Hash) ? e.deep_symbolize_keys : e }
                else
                    value
                end
        end
    end

    class << self

        # Converts a hash to a raw String in the form KEY = VAL
        #
        # @param template [String]          Hash content
        #
        # @return [Hash, OpenNebula::Error] String representation in the form KEY = VALUE of
        #                                   the hash, or an OpenNebula Error if the conversion fails
        def to_raw(content_hash, nested = false)
            return '' if content_hash.nil? || content_hash.empty?

            content = ''
            content_hash.each do |key, value|
                case value
                when Hash
                    sub_content = to_raw(value, true)
                    return sub_content if OpenNebula.is_error?(sub_content)

                    content += "#{key} = [\n#{sub_content}\n]\n"
                when Array
                    value.each do |element|
                        content += to_raw({ key.to_s => element }, false)
                        content += "\n" unless element == value.last
                    end
                else
                    content += "#{key} = \"#{value.to_s.gsub('"', '\"')}\""
                    content += ",\n" if nested
                    content += "\n" unless nested
                end
            end

            content = content.sub(/,\n\z/, "\n") if nested
            content.chomp
        rescue StandardError => e
            OpenNebula::Error.new("Error wrapping the hash: #{e.message}")
        end

    end

end
