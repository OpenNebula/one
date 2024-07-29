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

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::Config::Type

    # One Augeas class
    class Augeas::ONE < Augeas

        # Patch Safe Default Modes
        PATCH_SAFE_MODES = [:skip]

        # Sections with their unique identification parameters.
        SECTIONS = {
            'IM_MAD'          => 'NAME',
            'VM_MAD'          => 'NAME',
            'VM_HOOK'         => 'NAME',
            'VNET_HOOK'       => 'NAME',
            'USER_HOOK'       => 'NAME',
            'GROUP_HOOK'      => 'NAME',
            'IMAGE_HOOK'      => 'NAME',
            'HOST_HOOK'       => 'NAME',
            'TM_MAD_CONF'     => 'NAME',
            'DS_MAD_CONF'     => 'NAME',
            'MARKET_MAD_CONF' => 'NAME',
            'AUTH_MAD_CONF'   => 'NAME',
            'VN_MAD_CONF'     => 'NAME'
            # 'TM_MAD'          => 'EXECUTABLE',
            # 'AUTH_MAD'        => 'EXECUTABLE',
        }

        # Parameters which are expected to be specified MULTIPLE
        # times in the main section of configuration file.
        MULTIPLE = [
            'VM_RESTRICTED_ATTR',
            'IMAGE_RESTRICTED_ATTR',
            'VNET_RESTRICTED_ATTR',
            'USER_RESTRICTED_ATTR',
            'GROUP_RESTRICTED_ATTR',
            'DOCUMENT_ENCRYPTED_ATTR',
            'HOST_ENCRYPTED_ATTR',
            'IMAGE_ENCRYPTED_ATTR',
            'VM_ENCRYPTED_ATTR',
            'VNET_ENCRYPTED_ATTR',
            'DATASTORE_ENCRYPTED_ATTR',
            'CLUSTER_ENCRYPTED_ATTR',
            'INHERIT_DATASTORE_ATTR',
            'INHERIT_IMAGE_ATTR',
            'INHERIT_VNET_ATTR'
        ]

        # Class constructor
        #
        # @param name      [String] File name
        # @param load_path [String] directories for modules
        def initialize(name = nil, load_path = nil)
            super(name, 'Oned.lns', load_path)
        end

        # Load file content
        #
        # @param name [String] Custom file name
        #
        # @return [Object] Read content
        def load(name = @name)
            super(name)

            upcase_keys

            # any structure error is fatal for load
            begin
                validate
            rescue StandardError
                reset
                raise
            end

            @content
        end

        # Validates the content, raises exception for serious problems.
        #
        # @return [Boolean] True if OK.
        def validate
            # rubocop:disable Lint/UselessAssignment
            tree = get_tree
            # rubocop:enable Lint/UselessAssignment

            # TODO: validate here for parameters specified multiple times
            # tree.keys.each do |section|
            #   ...
            # end

            true
        end

        # Get list of keys (node names) from Augeas tree
        #
        # @return [Array] List of keys
        # rubocop:disable Naming/AccessorMethodName
        def get_keys
            super(true)
        end
        # rubocop:enable Naming/AccessorMethodName

        # Check if content of both configuration objects is similar
        #
        # @param cfg [OneCfg::Config::Type::Base] Configuration to compare
        #
        # @return [Boolean] True if content is similar
        def similar?(cfg)
            return(true) if same?(cfg)

            diff(cfg).nil?
        end

        # Get complete content tree from Augeas as Hash. Tree doesn't
        # contain metadata for comments and shell exports.
        #
        # For known SECTIONS, the numeric index of subsection is replaced
        # by unique string identification taken from subsection key field.
        #
        # @return [Hash] Hash with Augeas content
        # rubocop:disable Naming/AccessorMethodName
        def get_tree
            tree = super

            # Transform number based indexes in nested sections by
            # unique name identification based on the section content
            # (e.g., usually the "NAME" value from inside the section). E.g.
            #   AUTH_MAD_CONF['1']['MAX_TOKEN_TIME'] -->
            #   AUTH_MAD_CONF['core']['MAX_TOKEN_TIME']
            tree.keys.each do |section|
                # we check every element of our tree, which
                # contains Hash structure inside
                next unless tree[section].is_a? Hash

                # If section is not described in known SECTIONS, it must
                # contain only unindexed (nil) subsection identification.
                # If it contains multiple or indexed subsections, the file
                # is **semantically wrong**.
                #
                # E.g., good example:
                #   "VXLAN_IDS"=>
                #    {nil=>{"START"=>["\"2\"", "VXLAN_IDS[1]/START"]}}
                #
                # bad example:
                #   "VXLAN_IDS"=>
                #    {"1"=>{"START"=>["\"2\"", "VXLAN_IDS[1]/START"]},
                #     "2"=>{"START"=>["\"2\"", "VXLAN_IDS[2]/START"]}},
                unless SECTIONS.key?(section)
                    next if tree[section].keys.length == 1 &&
                            tree[section].keys.include?(nil)

                    raise OneCfg::Config::Exception::StructureError,
                          "Invalid multiple sections of #{section}"
                end

                id = SECTIONS[section]

                tree[section].keys.each do |idx|
                    # Section doesn't have key inside we use for unique
                    # identification. E.g., TM_MAD_CONF without NAME
                    unless tree[section][idx].key?(id)
                        raise OneCfg::Config::Exception::StructureError,
                              "Missing #{id} identification for " \
                              "#{section}[#{idx}]"
                    end

                    # Section can't have multiple keys which are used for
                    # unique identification. E.g., TM_MAD_CONF with 2x NAME
                    unless tree[section][idx][id].is_a?(Array) &&
                           tree[section][idx][id].length == 1
                        raise OneCfg::Config::Exception::StructureError,
                              "Multiple #{id} identifications for " \
                              "#{section}[#{idx}]"
                    end

                    # TODO: unquote???
                    # new_idx = unquote(tree[section][idx][id][0])
                    new_idx = tree[section][idx][id][0]

                    # Section is already defined. There is a section
                    # with same key value multiple times. E.g.,
                    # 2x TM_MAD_CONF with same NAME=ceph
                    if tree[section].key?(new_idx)
                        raise OneCfg::Config::Exception::StructureError,
                              'Duplicate identification for ' \
                              "#{section}[#{new_idx}]"
                    end

                    tree[section][new_idx] = tree[section].delete(idx)
                end
            end

            tree
        end
        # rubocop:enable Naming/AccessorMethodName

        # Get diff between 2 configuration files
        #
        # @param cfg [Augeas::ONE] Configuration to diff with
        #
        # @return [Array, nil] Array with diff if files are not
        #   identical. nil if files are identical. Exception on error.
        def diff(cfg)
            tree1 = get_tree
            tree2 = cfg.get_tree

            ret = diff_subtree(tree1, tree2, [])
            ret.flatten!

            ret.empty? ? nil : ret
        end

        ##################################################################
        # Private Methods
        ##################################################################

        private

        # Walks through the tree1 and tree2 data structures
        # starting the provided path, compares them and returns
        # array of differences.
        #
        # @param tree1 [Object] Data structure 1 to compare
        # @param tree2 [Object] Data structure 2 to compare
        # @param path  [Array]  Path from the tree top
        #
        # @return      [Array]  Array of Hashes with diff objects
        def diff_subtree(tree1, tree2, path)
            ret = []

            keys = (tree1.keys + tree2.keys).uniq

            keys.each do |key|
                if tree1.key?(key) && tree2.key?(key)
                    val1 = tree1[key]
                    val2 = tree2[key]

                    if val1.class == val2.class
                        # rubocop:disable Style/CaseLikeIf
                        if val1.is_a? Hash
                            ret << diff_subtree(val1, val2, path + [key])
                        elsif val1.is_a? Array
                            ret << diff_subtree_array(val1, val2, path + [key])
                        else
                            # this should never happen
                            raise OneCfg::Config::Exception::FatalError,
                                  'Types to compare are not Hash nor Array ' \
                                  "(but #{val1.class})"
                        end
                        # rubocop:enable Style/CaseLikeIf
                    else
                        # changed data structure
                        ret << {
                            'path'  => path.compact,
                            'key'   => key,
                            'old'   => tree1[key],
                            'state' => 'rm',
                            'extra' => {}
                        }

                        # create path
                        ret << diff_subtree_ins(tree2[key], path + [key])
                    end

                elsif tree1.key?(key)
                    # drop path
                    ret << diff_subtree_rm(tree1[key], path + [key])

                    # ret << {
                    #     'path'  => path,
                    #     'key'   => key,
                    #     'old'   => tree1[key], # TODO: too complex data there
                    #     'state' => 'rm',
                    #     'extra' => {}
                    # }
                else
                    # create path
                    ret << diff_subtree_ins(tree2[key], path + [key])
                end
            end

            ret
        end

        # On a subtrees locations provided in tree1 and tree2,
        # we expect and compare Arrays with values, e.g.
        # all merged values of VM_RESTRICTED_ATTR. Returns list
        # of diff (Hash) operations.
        #
        # @param tree1 [Object] Data structure 1 to compare
        # @param tree2 [Object] Data structure 2 to compare
        # @param path  [Array]  Path from the tree top
        #
        # @return      [Array]  Array of Hashes with diff objects
        def diff_subtree_array(tree1, tree2, path)
            ret = []

            # TODO?
            # For top level multiple parameters, we ignore the order of values,
            # as mostly all the values are taken and merged and order is not
            # important. In deeper levels, the multiple parameters are mostly
            # an error, redundant option incorrectly used. In deeper levels,
            # we take care of order.
            ###
            # strict = (path.length > 1)
            # strict = false

            if OneCfg::Config::Utils.deep_compare(tree1, tree2)
                return(ret)
            end

            is_m = multiple?(path)

            # We have change in simple parameters, e.g.
            #   MONITORING_INTERVAL = "60"
            if tree1.length == 1 && tree2.length == 1 && !is_m
                ret << {
                    'path'  => path[0..-2].compact,
                    'key'   => path[-1],
                    'value' => tree2[0],
                    'old'   => tree1[0],
                    'state' => 'set',
                    'extra' => {}
                }

            # We have change in multiple parameters, e.g.
            #   VM_RESTRICTED_ATTR = "CONTEXT/FILES"
            #   VM_RESTRICTED_ATTR = "NIC/MAC"
            else
                found_m = (tree1.length > 1) || (tree2.length > 1)

                if found_m && !is_m
                    p = path.flatten.compact.join('/')

                    # TODO: Move into validate (basename can be different file)
                    OneCfg::LOG.warn("File #{basename}: " \
                                       "Parameter #{p} specified " \
                                       'multiple times.')
                end

                # --- Multiple parameters reduced to single one
                # We reduce unexpectedly multiple parameter (found_m && !is_m)
                # back to single occurance. We handle this differently. Example:
                # - tree1: TM_MAD_SYSTEM="X", TM_MAD_SYSTEM="Y"
                # - tree2: TM_MAD_SYSTEM="Z"
                # Instead of dropping olds and creating new, we drop all extra
                # occurances, and change first one with set. Patch would be:
                # - rm Y
                # - set Z (old X)
                if found_m && !is_m && tree2.length == 1
                    if tree1.include?(tree2[0])
                        # If tree2 contains value from tree1, we only
                        # drop old values found in tree1. No insert/set
                        # need to happen.
                        (tree1 - tree2).uniq.each do |val|
                            ret << {
                                'path'  => path[0..-2].compact,
                                'key'   => path[-1],
                                'old'   => val,
                                'state' => 'rm',
                                'extra' => { 'multiple' => found_m || is_m }
                            }
                        end
                    else
                        # If tree2 contains different value, we go by index
                        # and drop values from tree1 from index 1 and up,
                        # and set new value for index 0. See example with X,Y,Z.
                        tree1[1..-1].uniq.each do |val|
                            ret << {
                                'path'  => path[0..-2].compact,
                                'key'   => path[-1],
                                'old'   => val,
                                'state' => 'rm',
                                'extra' => { 'multiple' => found_m || is_m }
                            }
                        end

                        ret << {
                            'path'  => path[0..-2].compact,
                            'key'   => path[-1],
                            'value' => tree2[0],
                            'old'   => tree1[0],
                            'state' => 'set',
                            'extra' => {} # multiple??
                        }
                    end
                else
                    (tree1 + tree2).uniq.each do |val|
                        # Parameter with value was removed
                        if tree1.include?(val) && !tree2.include?(val)
                            ret << {
                                'path'  => path[0..-2].compact,
                                'key'   => path[-1],
                                'old'   => val,
                                'state' => 'rm',
                                'extra' => { 'multiple' => found_m || is_m }
                            }

                        # New parameter value was added
                        elsif tree2.include?(val) && !tree1.include?(val)
                            ret << {
                                'path'  => path[0..-2].compact,
                                'key'   => path[-1],
                                'value' => val,
                                'state' => 'ins',
                                'extra' => { 'multiple' => found_m || is_m }
                            }
                        end
                    end
                end
            end

            ret
        end

        # Drops subtree. For sections, remove whole path identifying
        # the subtree. For values of multiple parameters remove each
        # individual value.
        #
        # @param tree [Object] Tree structure to remove
        # @param path [Array]  Path from the tree top
        #
        # @return     [Array]  Array of Hashes with diff objects
        def diff_subtree_rm(tree, path)
            ret = []

            # rubocop:disable Style/CaseLikeIf
            if tree.is_a? Hash
                # drop each parameter and value
                # TODO: drop section key as last
                # TODO: consider if we really want to drop each parameter
                ###
                # tree.each_key do |key|
                #     ret << diff_subtree_rm(tree[key], path + [key])
                # end

                # final path drop
                ret << {
                    # Just path, no key inside...
                    # 'path'  => path[0..-2].compact,
                    # 'key'   => path[-1],
                    'path'  => path.compact,
                    'key'   => nil,
                    'state' => 'rm',
                    'extra' => {}
                }
            elsif tree.is_a? Array
                found_m = (tree.length > 1)

                if found_m && !multiple?(path)
                    p = path.flatten.compact.join('/')

                    # TODO: Move into validate (basename can be different file)
                    OneCfg::LOG.warn("File #{basename}: " \
                                       "Parameter #{p} specified " \
                                       'multiple times.')
                end

                tree.each do |val|
                    ret << {
                        'path'  => path[0..-2].compact,
                        'key'   => path[-1],
                        'old'   => val,
                        'state' => 'rm',
                        'extra' => { 'multiple' => found_m } # '|| is_m' ???
                    }
                end
            else
                # this should never happen
                raise OneCfg::Config::Exception::FatalError,
                      'Type of subtree is not Hash nor Array ' \
                      "(but #{tree.class})"
            end
            # rubocop:enable Style/CaseLikeIf

            ret
        end

        # Inserts subtree. For sections, recursively insert all
        # parameters with their values. For regular parameters,
        # insert each individual value.
        #
        # @param tree [Object] Tree structure to insert
        # @param path [Array]  Path from the tree top
        #
        # @return     [Array]  Array of Hashes with diff objects
        def diff_subtree_ins(tree, path)
            ret = []

            # rubocop:disable Style/CaseLikeIf
            # For a subsection (Hash), we process individual parameters.
            # E.g., for tree["DS_MAD_CONF"]["ceph"] we go through
            #  {"NAME"=>["\"ceph\""],
            #   "REQUIRED_ATTRS"=>["\"DISK_TYPE,BRIDGE_LIST\""],
            #   "PERSISTENT_ONLY"=>["\"NO\""],
            #   "MARKETPLACE_ACTIONS"=>["\"export\""]}
            if tree.is_a? Hash
                keys = tree.keys

                # --- Reprioritize section identifying parameter
                # If subtree is a known multiple section, we check if parameter
                # inside used to uniquely identify the section (usually "NAME")
                # is listed on first place. If not, we move it in the array.
                # E.g., for some TM_MAD_CONF change
                # - from: ['LN_TARGET', 'NAME', 'SHARED']
                # - to:   ['NAME', 'LN_TARGET', 'SHARED']
                section_key = SECTIONS[path[0]]

                if keys.length > 1 &&
                   !section_key.nil? &&
                   keys.include?(section_key) &&
                   keys[0] != section_key

                    keys.insert(0, keys.delete(section_key))
                end

                keys.each do |key|
                    ret << diff_subtree_ins(tree[key], path + [key])
                end

            # For end values (Array), we add each individual value.
            # E.g., for tree["VM_RESTRICTED_ATTR"] we process array of values
            #  ["\"CONTEXT/FILES\"",
            #   "\"NIC/MAC\"",
            #   "\"NIC/VLAN_ID\"",
            #   "\"NIC/BRIDGE\"",
            #   "\"NIC_DEFAULT/MAC\"", ...]
            elsif tree.is_a? Array
                tree.each do |val|
                    ret << {
                        'path'  => path[0..-2].compact,
                        'key'   => path[-1],
                        'value' => val,
                        'state' => 'ins',
                        'extra' => { 'multiple' => tree.length > 1 }
                    }
                end
            else
                # this should never happen
                raise OneCfg::Config::Exception::FatalError,
                      'Type of subtree is not Hash nor Array ' \
                      "(but #{tree.class})"
            end
            # rubocop:enable Style/CaseLikeIf

            ret
        end

        # Apply single diff/patch operation on current content. Finds
        # the path in Augeas tree and triggers the method handling
        # particular apply (patch) action (set/ins/rm).
        #
        # @param data [Hash]  Single diff operation data
        # @param mode [Array] Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op(data, mode)
            ret = { :status => false }

            path = nil

            # Based on diff path (and parameter key name) we propose
            # full Augeas key path/name. For new sections, we construct
            # a path so that the section for them is created.
            if data['path'].length == 2
                # second path component uniquely identifies location,
                # but needs to be transformed into Augeas specific path
                idx = SECTIONS[data['path'][0]]

                if idx.nil?
                    # this should never happen
                    raise OneCfg::Config::Exception::FatalError,
                          'Unknown index key name for section ' \
                          "#{data['path'][0]}"
                end

                # prepare just section part of path to check if
                # there is some matching element already, or we
                # have to create a new one
                path = [
                    data['path'][0],
                    '[' + idx + " = '" + data['path'][1] + "']"
                ].flatten.compact

                found = content.match(path.join)

                if found.empty?
                    # If diff key is section key (idx), allow to create
                    # new section. We specify index 0, but Augeas puts
                    # it automatically on next available index number.
                    # All other operations on the section are already
                    # addressed by section unique identifier.
                    if idx == data['key']
                        path = [
                            data['path'][0],
                            '[0]'
                        ].flatten.compact

                    elsif mode.include?(:skip)
                        ret[:mode] = :skip

                        return ret
                    else
                        raise OneCfg::Config::Exception::PatchPathNotFound,
                              data['path']
                    end

                # We found multiple matching sections, we can't uniquely
                # address the change. This is a fatal problem of the file
                # content we can't just skip.
                elsif found.length > 1
                    raise OneCfg::Config::Exception::PatchPathNotFound,
                          data['path']
                end

                # add section parameter name and merge path
                if data['key']
                    path << '/' \
                         << data['key']
                end

                path = path.join

            elsif data['path'].length < 2
                path = [
                    data['path'],
                    data['key']
                ].flatten.compact.join('/')
            else
                # this should never happen
                raise OneCfg::Config::Exception::FatalError,
                      'Diff path can not have more than 2 components ' \
                      "(got #{data['path'].length})"
            end

            case data['state']
            when 'rm'
                ret = apply_diff_op_rm(path, data, mode)
            when 'ins'
                ret = apply_diff_op_ins(path, data, mode)
            when 'set'
                ret = apply_diff_op_set(path, data, mode)
            else
                raise OneCfg::Config::Exception::FatalError,
                      "Invalid patch action '#{data['state']}'"
            end

            ret
        end

        # Appply single diff/patch "rm" operation.
        #
        # @param path [String] Augeas path
        # @param data [Hash]   Single diff operation data
        # @param mode [Array]  Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op_rm(path, data, _mode)
            ret = { :status => false }

            is_m = multiple?([data['path'], data['key']])

            # We also respect what diff considered as multiple
            # parameter occurances. But, we don't follow this strictly.
            if data['extra'].key?('multiple')
                is_m ||= data['extra']['multiple']
            end

            # Parameters, which are unique (doesn't repeat), we blindly
            # drop the path. For the recurrent parameters, we drop
            # **by value**.
            if is_m
                idx = get_values(path).index(data['old'])

                if idx
                    # We find old value in current Augeas values, the order
                    # of array values respects order in Augeas tree, only
                    # index from 0, not from 1.
                    ret_rm = content.rm(path + '[' + (idx + 1).to_s + ']')

                    ret[:status] = (ret_rm > 0)
                end
            else
                ret_rm = content.rm(path)

                # NOTE, here, it can happen than that we remove multiple
                # entries (ret_rm>1) in Augeas tree. It doesn't have to
                # be error, as we might be dropping whole section at once.

                ret[:status] = (ret_rm > 0)
            end

            ret
        end

        # Appply single diff/patch "ins" operation.
        #
        # @param path [String] Augeas path
        # @param data [Hash]   Single diff operation data
        # @param mode [Array]  Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op_ins(path, data, mode)
            ret = { :status => false }

            found = get_values(path)

            if found.empty?
                ret[:status] = true

                content.set(path, data['value'].to_s)
            else
                is_m = multiple?([data['path'], data['key']])

                # We also respect what diff considered as multiple
                # parameter occurances. But, we don't follow this strictly.
                if data['extra'].key?('multiple')
                    is_m ||= data['extra']['multiple']
                end

                if is_m
                    unless found.include?(data['value'])
                        content.set("#{path}[0]", data['value'].to_s)

                        ret[:status] = true
                    end
                elsif found.length == 1
                    if found[0] != data['value'] && mode.include?(:replace)
                        content.set(path, data['value'].to_s)

                        ret[:status] = true
                        ret[:mode] = :replace
                        ret[:old] = found[0]
                    end
                elsif !found.include?(data['value'])
                    if mode.include?(:replace)
                        # Configuration file has multiple parameters, but
                        # we didn't expect this parameter to exist already and
                        # even shouldn't be multiple. On replace, we drop
                        # all indexes >1 and replace base path at the end
                        (found.length - 1).times do
                            content.rm("#{path}[last()]")
                        end

                        content.set(path, data['value'].to_s)

                        ret[:status] = true
                        ret[:mode] = :replace
                        ret[:old] = found

                    elsif mode.include?(:skip)
                        ret[:mode] = :skip
                    else
                        raise OneCfg::Config::Exception::PatchInvalidMultiple,
                              path
                    end
                end
            end

            ret
        end

        # Apply single diff/patch "set" operation.
        #
        # @param path [String] Augeas path
        # @param data [Hash]   Single diff operation data
        # @param mode [Array]  Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op_set(path, data, mode)
            ret = { :status => false }

            found = get_values(path)

            # rubocop:disable Style/EmptyElse
            if found[0] == data['old']
                if found.length > 1
                    # Even if we want to "set" unique parameter, there
                    # can be multiple params created wrongly by user. So we
                    # try to test and set only first one. Nothing else
                    # matters anyway...
                    content.set("#{path}[1]", data['value'].to_s)
                else
                    content.set(path, data['value'].to_s)
                end

                ret[:status] = true

            elsif mode.include?(:replace)
                if found.length > 1
                    (found.length - 1).times do
                        content.rm("#{path}[last()]")
                    end
                end

                content.set(path, data['value'].to_s)

                ret[:status] = true
                ret[:mode] = :replace
                ret[:old] = found
            else
                # TODO, ??? exception ???
            end
            # rubocop:enable Style/EmptyElse

            ret
        end

        # Get key for hintings
        #
        # @param diff [Hash] Element with diff information
        #
        # @return [String] Formatted key
        def hinting_key(data)
            return super(data)

            ### This function is disabled for now ###
            # rubocop:disable Lint/UnreachableCode

            full_path = [data['path'], data['key']].flatten.compact

            if full_path.empty?
                '(top)'
            else
                # if first element of path is section with known identifier,
                # merge first 2 elements into Augeas-like path expression
                # rubocop:disable Style/FormatStringToken
                if SECTIONS.key?(full_path[0])
                    full_path[0] = format("%s[%s = '%s']",
                                          full_path[0],
                                          SECTIONS[full_path[0]],
                                          full_path.delete_at(1))
                end
                # rubocop:enable Style/FormatStringToken

                full_path.join('/')
            end
            # rubocop:enable Lint/UnreachableCode
        end

        # Upcase node names in the Augeas content object to avoid
        # problems with case sensitivity. Change is directly in
        # the Augeas tree.
        #
        # no parameters
        # no return value
        def upcase_keys
            get_keys.reverse.each do |key|
                # upper case last part of the path
                parts = key.split('/', 2)
                parts[-1].upcase!
                new_key = parts.join('/')

                # TODO: on duplicate tm_mad_system breaks the order
                # rubocop:disable Style/Next
                if key != new_key
                    if new_key.end_with?(']')
                        # if we are changing casing on last indexed []
                        # node we have to drop the index as the new
                        # index will be assigned automatically by
                        # Augeas, for example:
                        # tm_mad_conf[2]               -> TM_MAD_CONF
                        # tm_mad_conf/tm_mad_system[2] -> TM_MAD_SYSTEM
                        parts[-1].sub!(/\[[0-9]+\]$/, '')
                        new_key = parts.join('/')
                    end

                    # Rename only if paths differ and expect
                    # the change to happen on just single node,
                    # not more or less. Otherwise it's a BUG!
                    changed = @content.rename(key, parts[-1])

                    if changed != 1
                        raise OneCfg::Config::Exception::StructureError,
                              "Upcase of '#{key}' to '#{new_key}' updated " \
                              "#{changed} nodes instead of expected 1"
                    end
                end
                # rubocop:enable Style/Next
            end
        end

        # Returns if configuration parameter is expected to appear multiple
        # times (e.g., VM_RESTRICTED_ATTR). Doesn't apply to multiple
        # sections.
        #
        # @param path [Array] Path as array of path components
        #
        # @return [Boolean] True or False if multiple.
        def multiple?(path)
            MULTIPLE.include?(path.flatten.compact[0])
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
