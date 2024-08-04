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

require 'yaml'

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::Config::Type

    # Yaml class
    class Yaml < Base

        # Patch Safe Default Modes
        # Empty array, means there is no default mode
        PATCH_SAFE_MODES = []

        # Class constructor
        #
        # @param name [String] File name
        def initialize(name = nil)
            super(name)
        end

        # Load file content
        #
        # @param name [String] Custom file name
        #
        # @return [Object] Read content
        def load(name = @name)
            reset

            if Gem::Version.new(Psych.const_get(:VERSION)) >= Gem::Version.new('4.0')
                @content = YAML.load_file(name, :aliases => true)

                # for backward compatibility with older Psych return `false`
                # instead of `nil` if the file was empty
                @content = false if @content.nil?
            else
                @content = YAML.load_file(name)
            end

            @content
        end

        # Save content into a file
        #
        # @param name [String] Custom file name
        def save(name = @name)
            raise OneCfg::Config::Exception::NoContent if @content.nil?

            file_operation(name, 'w') {|file| file.write(to_s) }
        end

        # Render configuration content as yaml
        #
        # @return [String] Yaml format configuration
        def to_s
            @content.to_yaml(:indentation => 4)
        end

        # Check if content of both configuration objects is similar
        #
        # @param cfg [OneCfg::Config::Type::Base] Configuration to compare
        #
        # @return [Boolean] True if content is similar
        def similar?(cfg)
            return(true) if same?(cfg)

            return(false) unless diff(cfg).nil?

            true
        end

        def diff(cfg)
            tree1 = @content
            tree2 = cfg.content

            ret = diff_subtree(tree1, tree2, [])
            ret.flatten!

            ret.empty? ? nil : ret
        end

        def diff_from_hintings(hintings)
            super(hintings, true)
        end

        ##################################################################
        # Private Methods
        ##################################################################

        private

        def hinting_key(data)
            super(data, true)
        end

        def hinting_value(data)
            super(data, true)
        end

        # Walks through the tree1 and tree2 data structures
        # starting the provided path, compares them and returns
        # array of differences.
        #
        # @param tree1 [Object] Data structure 1 to compare
        # @param tree2 [Object] Data structure 2 to compare
        # @param path  [Array]  Path in the tree to compare
        #
        # @return      [Array]  Array of Hashes with diff objects
        # rubocop:disable Metrics/BlockNesting
        def diff_subtree(tree1, tree2, path)
            ret = []

            # compatible classes
            if tree1.class == tree2.class
                # both subtrees are Hash
                if tree1.is_a? Hash
                    keys = (tree1.keys + tree2.keys).uniq

                    keys.each do |key|
                        if tree1.key?(key) && tree2.key?(key)
                            ret << diff_subtree(tree1[key],
                                                tree2[key],
                                                path + [key])

                        elsif tree1.key?(key)
                            # delete hash key
                            ret << {
                                'path'  => path,
                                'key'   => key,
                                'old'   => tree1[key],
                                'state' => 'rm',
                                'extra' => {}
                            }
                        else
                            # insert new hash key
                            ret << {
                                'path'  => path,
                                'key'   => key,
                                'value' => tree2[key],
                                'state' => 'ins',
                                'extra' => {}
                            }
                        end
                    end

                # both subtrees are Array
                elsif tree1.is_a? Array
                    if @strict
                        idx  = 0
                        idx1 = 0
                        idx2 = 0

                        while (idx1 < tree1.length) || (idx2 < tree2.length)
                            val1 = tree1[idx1]
                            val2 = tree2[idx2]

                            # We need to be sure we are comparing values
                            # still inside the arrays and not valid nil
                            # value with item outside the array range.
                            if (idx1 < tree1.length) && (idx2 < tree2.length)
                                if OneCfg::Config::Utils.deep_compare(val1,
                                                                      val2,
                                                                      @strict)
                                    idx  += 1
                                    idx1 += 1
                                    idx2 += 1
                                else
                                    # Inserting values:
                                    #   1 = A, B, C, D, E, F
                                    #   2 = A, B, X, C, Y, D, E, F
                                    #   INSERT X, idx 2
                                    #   INSERT X, idx 4
                                    # when on pos 2, forward lookup for 'C'
                                    # in tree2, find on pos 3, so add new
                                    # 'X' on pos 2, idx2++
                                    #
                                    # Deleting values:
                                    #   1 = A, B, C, D, E, F
                                    #   2 = A, B, E, F
                                    #   DELETE C, idx 2
                                    #   DELETE D, idx 2
                                    # when on pos 2, forward lookup for 'C'
                                    # in tree, don't find any, so delete
                                    # 'C' from pos 2, idx1++

                                    # forward lookup for val1
                                    fwd_found = false
                                    fwd_idx2  = idx2 + 1

                                    # rubocop:disable Layout/LineLength
                                    while (fwd_idx2 < tree2.length) && !fwd_found
                                        if OneCfg::Config::Utils.deep_compare(tree2[fwd_idx2], val1, @strict)
                                            fwd_found = true
                                        else
                                            fwd_idx2 += 1
                                        end
                                    end
                                    # rubocop:enable Layout/LineLength

                                    if fwd_found
                                        # insert array item
                                        ret << {
                                            'path'  => path,
                                            'key'   => nil,
                                            'value' => val2,
                                            'old'   => val1,
                                            'state' => 'ins',
                                            'extra' => { 'index' => idx }
                                        }

                                        idx  += 1
                                        idx2 += 1

                                    else
                                        # delete array item
                                        ret << {
                                            'path'  => path,
                                            'key'   => nil,
                                            'old'   => val1,
                                            'state' => 'rm',
                                            'extra' => { 'index' => idx }
                                        }

                                        idx1 += 1
                                    end
                                end

                            # Process remaining array items on tree1
                            # by dropping them (not found on tree2)
                            elsif idx1 < tree1.length
                                # delete array item
                                ret << {
                                    'path'  => path,
                                    'key'   => nil,
                                    'old'   => val1,
                                    'state' => 'rm',
                                    'extra' => { 'index' => idx }
                                }

                                idx1 += 1

                            # Process remaining new array items on tree2
                            # by creating them.
                            else
                                # insert array item
                                ret << {
                                    'path'  => path,
                                    'key'   => nil,
                                    'value' => val2,
                                    'old'   => val1,
                                    'state' => 'ins',
                                    'extra' => { 'index' => idx }
                                }

                                idx  += 1
                                idx2 += 1
                            end
                        end
                    else
                        values = (tree1 + tree2).uniq

                        values.each do |val|
                            di1 = OneCfg::Config::Utils.deep_include?(
                                tree1, val, @strict
                            )

                            di2 = OneCfg::Config::Utils.deep_include?(
                                tree2, val, @strict
                            )

                            if di1 && di2
                                # skip
                                nil

                            elsif di1
                                # delete array item
                                ret << {
                                    'path'  => path,
                                    'key'   => nil,
                                    'old'   => val,
                                    'state' => 'rm',
                                    'extra' => {}
                                }
                            else
                                # insert array item
                                ret << {
                                    'path'  => path,
                                    'key'   => nil,
                                    'value' => val,
                                    'state' => 'ins',
                                    'extra' => {}
                                }
                            end
                        end
                    end

                # both subtrees are Nil
                elsif tree1.is_a? NilClass
                    # skip
                    nil

                # both subtrees are of some other type
                else
                    unless OneCfg::Config::Utils.deep_compare(tree1,
                                                              tree2,
                                                              @strict)
                        # set new value
                        ret << {
                            'path'  => path[0..-2],
                            'key'   => path[-1],
                            'value' => tree2,
                            'old'   => tree1,
                            'state' => 'set',
                            'extra' => {}
                        }
                    end
                end

            # Tree1 and tree2 are not same classes. We can't compare
            # them so we take tree2 as new value to set as-is.
            else
                # set new value
                ret << {
                    'path'  => path[0..-2],
                    'key'   => path[-1],
                    'value' => tree2,
                    'old'   => tree1,
                    'state' => 'set',
                    'extra' => {}
                }
            end

            ret
        end
        # rubocop:enable Metrics/BlockNesting

        # Apply single diff/patch operation. Find working subtree
        # based on the patch path. Then trigger inidividual
        # delete / insert / set action on this subtree.
        #
        # @param data [Hash]  Single diff operation data
        # @param mode [Array] Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op(data, mode)
            ret = { :status => false }

            # Follow the path and recursively go deep into the tree,
            # If we don't find structure corresponding to the path,
            # trigger exception (default) or skip operation (skip mode).
            tree = @content
            data['path'].each do |p|
                if tree.is_a?(Hash) && tree.key?(p)
                    tree = tree[p]
                elsif mode.include?(:skip)
                    ret[:mode] = :skip

                    return ret
                else
                    raise OneCfg::Config::Exception::PatchPathNotFound,
                          data['path']
                end
            end

            case data['state']
            when 'rm'
                ret = apply_diff_op_rm(tree, data, mode)
            when 'ins'
                ret = apply_diff_op_ins(tree, data, mode)
            when 'set'
                ret = apply_diff_op_set(tree, data, mode)
            else
                raise OneCfg::Config::Exception::FatalError,
                      "Invalid patch action '#{data['state']}'"
            end

            ret
        end

        # Appply single diff/patch "rm" operation.
        #
        # @param tree [Object] Subtree to work on
        # @param data [Hash]   Single diff operation data
        # @param mode [Array]  Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op_rm(tree, data, mode)
            ret = { :status => false }

            # TODO: check if variable hasn't changed????
            # delete key from Hash
            if data['key']
                if tree.is_a? Hash
                    ret[:status] = tree.key?(data['key'])
                    tree.delete(data['key'])

                elsif mode.include?(:skip)
                    ret[:mode] = :skip
                else
                    raise OneCfg::Config::Exception::PatchExpectedHash,
                          tree.class
                end

            # delete Array element by index
            # rubocop:disable Layout/LineLength
            # rubocop:disable Layout/CommentIndentation
            elsif @strict && data['extra'] && data['extra']['index']
                if tree.is_a? Array
                    tree_idx_value = tree[data['extra']['index']]

                    # try to drop by index
                    if OneCfg::Config::Utils.deep_compare(tree_idx_value, data['old'], @strict)
                        tree.delete_at(data['extra']['index'])
                        ret[:status] = true

# TODO, ----> maybe here we don't need a force drop???, simply skip by value...
                    # or, force drop by value
                    elsif mode.include?(:force)
                        idx = OneCfg::Config::Utils.deep_index(tree, data['old'], @strict)

                        if idx
                            ret[:status] = true
                            ret[:mode] = :force
                            tree.delete_at(idx)
                        end

                    # TODO: is skip right condition?
                    elsif mode.include?(:skip)
                        ret[:mode] = :skip

                    # or, fail on value not found
                    # TODO: else????
                    else
                        raise OneCfg::Config::Exception::PatchValueNotFound,
                              data['old']
                    end

                elsif mode.include?(:skip)
                    ret[:mode] = :skip

                # if not in skip mode, fail on unexpected data str.
                else
                    raise OneCfg::Config::Exception::PatchExpectedArray,
                          tree.class
                end
# TODO, <---------------------------------------------------------------------------------

            # delete Array element by value
            else
                # TODO: merge with above?
                if [Hash, Array].include? tree.class
                    idx = OneCfg::Config::Utils.deep_index(tree,
                                                           data['old'],
                                                           @strict)

                    if idx
                        ret[:status] = true
                        tree.delete_at(idx)
                    end
                elsif mode.include?(:skip)
                    ret[:mode] = :skip
                else
                    raise OneCfg::Config::Exception::PatchUnexpectedData,
                          tree.class
                end
            end
            # rubocop:enable Layout/LineLength
            # rubocop:enable Layout/CommentIndentation

            ret
        end

        # Appply single diff/patch "ins" operation.
        #
        # @param tree [Object] Subtree to work on
        # @param data [Hash]   Single diff operation data
        # @param mode [Array]  Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op_ins(tree, data, mode)
            ret = { :status => false }

            # insert new key into a Hash
            if data['key']

                ### WORKAROUND
                # Insert action created from hintings can't properly
                # distinguish between insert into Array and Hash and
                # set path/key properly. We double check if we don't
                # try to insert into actual Array and if yes, we
                # update the diff structure and retry operation.
                # rubocop:disable Style/SoleNestedConditional
                if data['extra'] && data['extra']['hintings']
                    if tree.is_a?(Hash) && tree[data['key']].is_a?(Array)
                        data['path'] << data['key']
                        data['key'] = nil

                        raise OneCfg::Config::Exception::PatchRetryOperation
                    end
                end
                # rubocop:enable Style/SoleNestedConditional

                if tree.is_a? Hash
                    if tree.key?(data['key'])
                        dc = OneCfg::Config::Utils.deep_compare(
                            tree[data['key']],
                            data['value'],
                            @strict
                        )

                        if !dc && mode.include?(:replace)
                            ret[:status] = true
                            ret[:mode] = :replace
                            ret[:old] = tree[data['key']]
                            tree[data['key']] = data['value']
                        end
                    else
                        tree[data['key']] = data['value']
                        ret[:status] = true
                    end
                elsif mode.include?(:skip)
                    ret[:mode] = :skip
                else
                    raise OneCfg::Config::Exception::PatchExpectedHash,
                          tree.class
                end

            # insert new Array elemented by index
            elsif @strict && data['extra'] && data['extra']['index']
                idx = data['extra']['index']

                if tree.is_a? Array
                    # If element already exists (manually added by user),
                    # we won't touch it and e.g., fix the index. But,
                    # it might break the indexes and expected values
                    # there and application must be forced.
                    if !OneCfg::Config::Utils.deep_include?(tree,
                                                            data['value'],
                                                            @strict)
                        tree_idx_value = tree[idx]

                        # if we find on idx expected data, insert by idx
                        if OneCfg::Config::Utils.deep_compare(tree_idx_value,
                                                              data['old'],
                                                              @strict)

                            # Proposed idx could be after the end of array
                            # and we could be easily comparing nils. Better
                            # check and only append if index is outside.
                            if idx <= tree.length
                                tree.insert(idx, data['value'])
                            else
                                tree.push(data['value'])
                            end

                            ret[:status] = true

                        elsif mode.include?(:force)
                            ret[:status] = true
                            ret[:mode] = :force

                            # On diff proposed index (idx) we expected some
                            # value (data['old']), but it is not there anymore.
                            # We try to guess new index by searching the array
                            # for the element with expected old content. If we
                            # find the element, we place new item on that index
                            # instead of the diff proposed index.
                            guess_idx = OneCfg::Config::Utils.deep_index(
                                tree,
                                data['old'],
                                @strict
                            )

                            # TODO: this automagic placement should be done
                            #  based on 2 values (before / after), not just
                            #  1 (old).
                            # we tolerate only +/- 1 guessed index difference
                            if !guess_idx.nil? && (guess_idx - idx).abs <= 1
                                tree.insert(guess_idx, data['value'])
                            # rubocop:disable Layout/CommentIndentation
                            # rubocop:disable Layout/LineLength
                                # OneCfg::LOG.debug("Guessed placement (#{guess_idx} instead of #{idx})")
                            # rubocop:enable Layout/CommentIndentation
                            # rubocop:enable Layout/LineLength

                            # try to place on same index as proposed
                            # by diff if it's still inside range of Array
                            elsif idx <= tree.length
                                tree.insert(idx, data['value'])

                            # otherwise, append at the end
                            else
                                tree.push(data['value'])
                            end

                        # We probably shouldn't allow skipping now on this
                        # error, as the context placement is currently very
                        # lame and will allow too many changes not to be
                        # applied due to out poor implementation.
                        # ---
                        #  elsif mode.include?(:skip)
                        #      ret[:mode] = :skip

                        else
                            raise OneCfg::Config::Exception::PatchValueNotFound,
                                  data['old']
                        end
                    end
                elsif mode.include?(:skip)
                    ret[:mode] = :skip
                else
                    raise OneCfg::Config::Exception::PatchExpectedArray,
                          tree.class
                end

            # simply append Array element
            else
                if tree.is_a? Array
                    # append only if element doesn't exist already
                    unless OneCfg::Config::Utils.deep_include?(tree,
                                                               data['value'],
                                                               @strict)
                        tree.push(data['value'])
                        ret[:status] = true
                    end
                elsif mode.include?(:skip)
                    ret[:mode] = :skip
                else
                    raise OneCfg::Config::Exception::PatchExpectedArray,
                          tree.class
                end
            end

            ret
        end

        # Appply single diff/patch "set" operation.
        #
        # @param tree [Object] Subtree to work on
        # @param data [Hash]   Single diff operation data
        # @param mode [Array]  Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op_set(tree, data, mode)
            ret = { :status => false }

            if data['key']
                if tree.is_a? Hash
                    if tree.key?(data['key'])
                        # if old data weren't changed, we can replace by new
                        if OneCfg::Config::Utils.deep_compare(tree[data['key']],
                                                              data['old'],
                                                              @strict)
                            tree[data['key']] = data['value']
                            ret[:status] = true

                        elsif mode.include?(:replace)
                            ret[:status] = true
                            ret[:mode] = :replace
                            ret[:old] = tree[data['key']]
                            tree[data['key']] = data['value']
                        end

                    # Key existed in the past, but user deleted it.
                    # We can put it back (replace), skip or fail.
                    elsif mode.include?(:replace)
                        ret[:status] = true
                        ret[:mode] = :replace
                        tree[data['key']] = data['value']

                    elsif mode.include?(:skip)
                        ret[:mode] = :skip
                    else
                        raise OneCfg::Config::Exception::PatchValueNotFound,
                              data['key']
                    end

                elsif mode.include?(:skip)
                    ret[:mode] = :skip
                else
                    raise OneCfg::Config::Exception::PatchExpectedHash,
                          tree.class
                end

            elsif data['path'].empty?
                # WARNING: this is a dirty workaround which allows us
                # to modify root path and completely main root data
                # structure Array <-> Hash. We can't just do this on
                # 'tree', as it would apply only in this method context!
                ret[:status] = true
                @content = data['value']
            else
                # this should never happen
                raise OneCfg::Config::Exception::FatalError,
                      'Invalid patch without "key" or "path"'
            end

            ret
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
