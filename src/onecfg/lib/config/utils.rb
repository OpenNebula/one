# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

module OneCfg

    module Config

        # Config::Utils module
        module Utils

            # Deep comparison of data structures
            #
            # @param val1   [Object]  First value
            # @param val2   [Object]  Second value
            # @param strict [Boolean] Strict ordered Array values
            #
            # @return [Boolean] True if values are same
            #
            # Note: Strict order applied only on Arrays, which are
            # used as values. Strict order doesn't apply on Array
            # used as a Hash key!!!
            def self.deep_compare(val1, val2, strict = false)
                # values are not of the same type
                return(false) unless val1.class == val2.class

                # rubocop:disable Style/CaseLikeIf
                # rubocop:disable Style/RedundantReturn
                if val1.is_a? Array
                    # arrays are not of the same length
                    return(false) unless val1.length == val2.length

                    idx1 = 0
                    idxs = 0.step(val1.length - 1, 1).to_a

                    while idx1 < val1.length
                        # in strict mode, we compare same indexes,
                        # in non-strict mode, we try to find an element
                        if strict
                            ret = deep_compare(val1[idx1], val2[idx1],
                                               strict)

                            idxs.delete(idx1)

                            # rubocop:disable Style/IdenticalConditionalBranches
                            return(false) unless ret
                            # rubocop:enable Style/IdenticalConditionalBranches
                        else
                            ret = false

                            # we iterate over indexes we didn't go through
                            # yet, if we find matching index, we drop it
                            # from next runs
                            idxs.each do |idx2|
                                ret = deep_compare(val1[idx1], val2[idx2],
                                                   strict)

                                if ret
                                    idxs.delete(idx2)
                                    break
                                end
                            end

                            # rubocop:disable Style/IdenticalConditionalBranches
                            return(false) unless ret
                            # rubocop:enable Style/IdenticalConditionalBranches
                        end

                        idx1 += 1
                    end

                    # at the end, the indexes to check must be empty
                    return(idxs.empty?)

                elsif val1.is_a? Hash
                    keys1 = val1.keys.sort_by {|k| k.to_s }
                    keys2 = val2.keys.sort_by {|k| k.to_s }

                    # hashes must have same keys
                    return(false) unless keys1.length == keys2.length
                    return(false) unless deep_compare(keys1, keys2, strict)

                    keys1.each do |key|
                        ret = deep_compare(val1[key], val2[key], strict)

                        return(false) unless ret
                    end

                    return(true)
                else
                    return(val1 == val2)
                end
                # rubocop:enable Style/CaseLikeIf
                # rubocop:enable Style/RedundantReturn
            end

            # Detects existence of element in array by deep comparison
            # and returns true/false based on the search.
            #
            # @param tree   [Array]   First value
            # @param val    [Object]  Value to check
            # @param strict [Boolean] Strict ordered Array values
            #
            # @return [Boolean] True if value exists in array
            def self.deep_include?(tree, val, strict = false)
                tree.each do |tree_val|
                    return(true) if deep_compare(tree_val, val, strict)
                end

                false
            end

            # Detects existence of element in array by deep comparison
            # and returns its index or nil.
            #
            # @param tree   [Array]   First value
            # @param val    [Object]  Value to check
            # @param strict [Boolean] Strict ordered Array values
            #
            # @return [Integer,Nil] Value index or nil.
            def self.deep_index(tree, val, strict = false)
                tree.each_with_index do |tree_val, idx|
                    return(idx) if deep_compare(tree_val, val, strict)
                end

                nil
            end

            # Get path with prefix.
            #
            # @param path   [String] Path
            # @param prefix [String] Prefix
            #
            # @return [String] Prefixed path.
            def self.prefixed(path, prefix)
                if prefix == '/'
                    path
                else
                    if prefix[-1] == '/' || path[0] == '/'
                        "#{prefix}#{path}"
                    else
                        "#{prefix}/#{path}"
                    end
                end
            end

            # Get path without prefix.
            #
            # @param path   [String] Path
            # @param prefix [String] Prefix
            #
            # @return [String] unprefixed path
            def self.unprefixed(path, prefix)
                path.sub(%r{^#{prefix}/*}, '/')
            end

        end

    end

end
