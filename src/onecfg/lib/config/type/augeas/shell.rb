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

    # Shell Augeas class
    class Augeas::Shell < Augeas

        # Patch Safe Default Modes
        # Empty array, means there is no default mode
        PATCH_SAFE_MODES = []

        # Class constructor
        #
        # @param name      [String] File name
        # @param load_path [String] directories for modules
        def initialize(name = nil, load_path = nil)
            super(name, 'Shellvars.lns', load_path)

            @strict = false
        end

        # Load file content
        #
        # @param name [String] Custom file name
        #
        # @return [Object] Read content
        def load(name = @name)
            super(name)

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
            tree = get_tree

            tree.each do |key, val|
                next if val.length <= 1

                OneCfg::LOG.warn("File #{basename}: " \
                                 "Variable #{key} specified " \
                                 'multiple times. Only last ' \
                                 'value will be respected.')
            end

            true
        end

        # Get list of keys (node names) from Augeas tree
        #
        # @return [Array] List of keys
        # rubocop:disable Naming/AccessorMethodName
        def get_keys
            keys = super(false)

            keys.reject! {|v| v.start_with?('@export') }

            keys
        end
        # rubocop:enable Naming/AccessorMethodName

        # Check if content of both configuration objects is similar
        #
        # @param cfg [OneCfg::Config::Base] Configuration to compare
        #
        # @return [Boolean] True if content is similar
        def similar?(cfg)
            return(true) if same?(cfg)

            tree1 = get_tree
            tree2 = cfg.get_tree
            keys1 = tree1.keys.sort
            keys2 = tree2.keys.sort

            return(false) if keys1.size != keys2.size

            # NOTE, It should be enough just to check emptiness of "diff"
            # structure, but it's so easy to do it here. Also, we can take
            # this as a validation of "diff" method.

            # Take keys on both sides and compare content ...
            # Variables, values and exports must be all the same.
            keys1.zip(keys2) do |k1, k2|
                return(false) if k1                != k2
                return(false) if tree1[k1].last    != tree2[k2].last
                return(false) if exported_key?(k1) != cfg.exported_key?(k2)
            end

            true
        end

        # Get diff between 2 configuration files
        #
        # @param cfg [Augeas::Shell] Configuration to diff with
        #
        # @return [Array, nil] Array with diff if files are not
        #   identical. nil if files are identical. Exception on error.
        def diff(cfg)
            ret = []

            tree1 = get_tree
            tree2 = cfg.get_tree
            keys1 = tree1.keys.sort
            keys2 = tree2.keys.sort

            (keys1 + keys2).uniq.each do |key|
                val1 = tree1[key].last if tree1.key?(key)
                val2 = tree2[key].last if tree2.key?(key)
                exp1 = exported_key?(key)
                exp2 = cfg.exported_key?(key)

                next if val1 == val2 && exp1 == exp2

                # change variable (content or export flag)
                if !val1.nil? && !val2.nil?
                    op = {
                        'path'  => [],
                        'key'   => key,
                        'state' => 'set',
                        'extra' => {}
                    }

                    # changed value
                    if val1 != val2
                        op['value'] = val2
                        op['old']   = val1
                    end

                    # changed export flag
                    if exp1 != exp2
                        op['extra']['export'] = exp2
                    end

                    ret << op

                # delete variable
                elsif !val1.nil?
                    ret << {
                        'path'  => [],
                        'key'   => key,
                        'old'   => val1,
                        'state' => 'rm',
                        'extra' => {}
                    }

                # insert new variable
                elsif !val2.nil?
                    op = {
                        'path'  => [],
                        'key'   => key,
                        'value' => val2,
                        'state' => 'ins',
                        'extra' => { 'export' => exp2 }
                    }

                    # TODO: before/after context

                    ret << op
                end
            end

            ret.empty? ? nil : ret
        end

        # Check if key with variable is exported inside configuration
        #
        # @param key [String] Variable
        #
        # @return [Boolean] True if variable is exported
        def exported_key?(key)
            ret = nil

            begin
                # find exports within assignments, e.g.:
                # export KEY=VALUES
                ret = @content.exists("#{key}/export")

                # find exports outside assignments, e.g.:
                # export KEY1 KEY2 KEY3
                # rubocop:disable Style/OrAssignment
                unless ret
                    # We might get Augeas key with index if multiple
                    # variables with same name is defined, but in @export,
                    # there is a list of raw unindexed variable names.
                    # E.g., for 2x "export LIBVIRT_URI"
                    # LIBVIRT_URI[1]/export
                    # LIBVIRT_URI[2]/export
                    # but, for "export LIBVIRT_URI LIBVIRT_URI"
                    # @export/1 LIBVIRT_URI
                    # @export/2 LIBVIRT_URI
                    ret = @content.exists("@export/*[.='#{strip_index(key)}']")
                end
                # rubocop:enable Style/OrAssignment
            rescue ::Augeas::MultipleMatchesError
                ret = true
            end

            ret
        end

        # Exports or unexports variable.
        #
        # @param key [String]  Variable name
        # @param new [Boolean] True if export
        def export_key(key, new)
            state = exported_key?(key)

            if new && !state
                content.set("#{key}/export", nil)

            elsif !new && state
                content.rm("#{key}/export")
                content.rm("@export/*[.='#{key}']")

                # all @exports without any children must be dropped
                content.match('@export').reverse_each do |node|
                    content.rm(node) if content.match("#{node}/*").empty?
                end
            end
        end

        ##################################################################
        # Private Methods
        ##################################################################

        private

        # Appply single diff/patch operation. Based on type
        # trigger inidividual delete / insert / set actions.
        #
        # @param data [Hash]  Single diff operation data
        # @param mode [Array] Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op(data, mode)
            ret = { :status => false }

            case data['state']
            when 'rm'
                ret = apply_diff_op_rm(data, mode)
            when 'ins'
                ret = apply_diff_op_ins(data, mode)
            when 'set'
                ret = apply_diff_op_set(data, mode)
            else
                raise OneCfg::Config::Exception::FatalError,
                      "Invalid patch action '#{data['state']}'"
            end

            ret
        end

        # Appply single diff/patch "rm" operation.
        #
        # @param data [Hash]  Single diff operation data
        # @param mode [Array] Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op_rm(data, _mode)
            ret = { :status => false }

            key, _val, _old, _exp = extract_diff_op(data)

            # delete all matching variables and unexport
            content.match(key).length.times do
                ret[:status] = (content.rm("#{key}[last()]") > 0)
            end

            export_key(key, false)

            ret
        end

        # Appply single diff/patch "ins" operation.
        #
        # @param data [Hash]  Single diff operation data
        # @param mode [Array] Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op_ins(data, mode)
            ret = { :status => false }

            key, val, _old, exp = extract_diff_op(data)

            found = get_values(key)

            # New variables are easily set with required export status.
            if found.empty?
                content.set(key, val.to_s)
                export_key(key, exp)
                ret[:status] = true

            # It can happen that variable is already in the file placed
            # manually by the user. We don't touch it, unless "replace"
            # mode specified.
            elsif found[-1] != val && mode.include?(:replace)
                # drop all variable occurances, leave only last one
                (found.length - 1).times do
                    content.rm("#{key}[1]")
                end

                content.set(key, val.to_s)
                export_key(key, exp)

                ret[:status] = true
                ret[:mode] = :replace
                ret[:old] = found
            end

            ret
        end

        # Apply single diff/patch "set" operation.
        #
        # @param data [Hash]  Single diff operation data
        # @param mode [Array] Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op_set(data, mode)
            ret = { :status => false }

            key, val, old, exp = extract_diff_op(data)

            # change in value
            if val && old
                found = get_values(key)

                # Set new value only if user didn't change it (respect
                # last found value), or if user forced replace.
                if found[-1] == old || mode.include?(:replace)
                    # drop all variable occurances, leave only last one
                    (found.length - 1).times do
                        content.rm("#{key}[1]")
                    end

                    content.set(key, val.to_s)

                    ret[:status] = true
                    ret[:mode] = :replace if found[-1] != old
                    ret[:old] = found
                end
            end

            # change in export status
            unless exp.nil?
                # Set export state only if it's different
                # to current state.
                # rubocop:disable Style/SoleNestedConditional
                if exp != exported_key?(key)
                    export_key(key, exp)
                    ret[:status] = true
                end
                # rubocop:enable Style/SoleNestedConditional
            end

            ret
        end

        # Get extra metadata for hintings
        #
        # @param data [Hash] Element with diff information
        #
        # @return [String] Formatted value
        def hinting_extra(data)
            return super(data)

            ### This function is disabled for now ###
            # rubocop:disable Lint/UnreachableCode

            return unless data.key?('extra')

            ret = ''

            if data['state'] == 'set' && data['extra'].key?('export')
                if data['extra']['export']
                    ret << ' export'
                else
                    ret << ' unexport'
                end
            end

            ret.strip
            # rubocop:enable Lint/UnreachableCode
        end

        # Returns all details from single diff operation metadata
        #
        # @param data [Hash] Single diff operation data
        #
        # @return [Array] Array of with [key, value, old, export]
        def extract_diff_op(data)
            [
                data['key'],
                data['value'],
                data['old'],
                data['extra']['export']
            ]
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
