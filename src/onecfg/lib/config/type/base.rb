# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

require 'fileutils'
require 'open3'

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::Config::Type

    # Base configuration file
    class Base

        # @name    File name
        # @content File content
        # @strict  Configuration file respects order
        attr_accessor :name
        attr_accessor :content
        attr_reader   :strict

        # Class constructor
        #
        # @param name [String] File name (optional)
        def initialize(name = nil)
            @strict = false

            reset

            # For unspecified file names we'll generate random
            # name. The file should be automatically deleted
            # on object destruction.
            if name.nil?
                tmpfile = Tempfile.new('onescape-')
                tmpfile.close
                @name = tmpfile.path
            else
                @name = name
            end
        end

        # Returns file base name
        #
        # @return [String] Base name
        def basename
            ::File.basename(@name)
        end

        # Clears content stored in the memory
        #
        # No parameters
        # No return
        def reset
            @content = nil
        end

        # Load file content
        #
        # @param name [String] Custom file name
        def load(_name = @name)
            method_not_implemented(__method__)
        end

        # Save content into a file
        #
        # @param name [String] Custom file name
        def save(_name = @name)
            method_not_implemented(__method__)
        end

        # Validates the content, raises exception in case of problem.
        #
        # @return [Boolean] True if OK.
        def validate
            !@content.nil?
        end

        # Delete the file
        def delete
            ::File.delete(@name)
        end

        # Check if file exists
        #
        # @param name [String] Custom file name
        def exist?(name = @name)
            ::File.exist?(name)
        end

        # Copy content from other configuration object
        #
        # @param cfg [OneCfg::Config::Base] Source config. object
        def copy(cfg)
            # TODO: check compatible classes???
            if cfg.content.nil?
                reset
            else
                Tempfile.open('onescape-') do |tmp|
                    tmp.close

                    cfg.save(tmp.path)
                    load(tmp.path)
                end
            end
        end

        # TODO: copy base names

        # Render configuration content as string
        #
        # @return [String] String configuration
        def to_s
            rtn = nil

            Tempfile.open('onescape-') do |tmp|
                tmp.close

                save(tmp.path)

                file_operation(tmp.path, 'r') do |file|
                    rtn = file.read
                end
            end

            rtn
        end

        # Check if content of both configuration objects is same
        #
        # @param cfg [OneCfg::Config::Base] Configuration to compare with
        #
        # @return [Boolean] True if content is same
        def same?(cfg)
            # TODO: check compatible classes
            if content.nil? && cfg.content.nil?
                true
            elsif content.nil? || cfg.content.nil?
                false
            else
                file_diff(cfg).nil?
            end
        end

        # Check if content of both configuration objects is similar
        #
        # @param cfg [OneCfg::Config::Base] Configuration to compare with
        #
        # @return [Boolean] True if content is similar
        def similar?(cfg)
            same?(cfg)
        end

        # Get diff between 2 rendered configuration files
        #
        # @param cfg[OneCfg::Config::Base] Configuration to diff with
        #
        # @return [String, nil] String with diff if files are not
        #   identical. nil if files are identical. Exception on error.
        def diff(cfg)
            data = file_diff(cfg)

            if data.nil?
                nil
            else
                # TODO: split hunks
                [{
                    'path'  => [],
                    'key'   => nil,
                    'value' => data, # or extra?
                    'state' => 'set',
                    'extra' => {}
                }]
            end
        end

        # Patches object based on provided diff data.
        #
        # @param data [Array] Diff data
        # @param mode [Array] Patch modes
        #   :dummy   - dummy mode, don't aply changes to content
        #   :skip    - skip operation if
        #               - path can't be followed
        #               - path doesn't contain expected structure (Hash)
        #               - element to change is already missing
        #   :force   - force application on most suitable place
        #   :replace - replace changed values with proposed new ones
        #
        # @return [[Boolean, Array]] - returns 2 items array
        #   [Boolean] patch status, true if at least 1 patch op. happened
        #   [Array] report with details about each patch operation
        def patch(data, mode = [])
            return if data.nil?

            mode ||= []

            # TODO: rename :none to :dummy
            if mode.include?(:none) || mode.include?(:dummy)
                # In dummy (no operation) mode, we spawn temporary
                # object with same content and try the patch operation
                # on them.
                dummy = self.class.new
                dummy.copy(self)
                ret = dummy.patch(data, mode - [:none, :dummy])

                # Save is just for sure to check the configuration
                # object content is left in a state which can be
                # dumped into a file. Concern are the Augeas classes.
                dummy.save

                return ret
            end

            ret = false
            rep = []

            # We backup current state into a temporary object (file)
            # with copy of our content. In case of exception, we
            # copy back from the backup object.
            backup = self.class.new
            backup.copy(self)

            data.each do |diff_op|
                begin
                    patch_status = apply_diff_op(diff_op, mode)

                    ret ||= patch_status[:status]
                    rep << patch_status

                # TODO: rescue on any exception
                rescue StandardError => e
                    # restore content from backup object
                    copy(backup)

                    if e.is_a?(OneCfg::Config::Exception::PatchException)
                        # enrich patch exception with extra
                        # diff operation data
                        e.data = diff_op
                    end

                    raise e
                end
            end

            [ret, rep]
        end

        # Get human readable hints based on diff
        #
        # @param diff [Array] Array with diff information
        def hintings(data, report = [])
            return if data.nil?

            ret = []
            report ||= []

            data.zip(report).each do |d, r|
                key   = hinting_key(d)
                value = hinting_value(d)
                extra = hinting_extra(d)

                r_status = ''
                r_mode = ''

                if r && r.key?(:status)
                    if r[:mode]
                        r_mode = "#{r[:mode]} "
                    end

                    if r[:status]
                        r_status = "[OK] #{r_mode}"
                    else
                        r_status = "[--] #{r_mode}"
                    end
                end

                case d['state']
                when 'ins'
                    ret << "#{r_status}ins #{key} = #{value} #{extra}"
                when 'set'
                    if value.nil?
                        ret << "#{r_status}set #{key} #{extra}"
                    else
                        ret << "#{r_status}set #{key} = #{value} #{extra}"
                    end
                when 'rm'
                    if value.nil?
                        ret << "#{r_status}rm  #{key} #{extra}"
                    else
                        ret << "#{r_status}rm  #{key} = #{value} #{extra}"
                    end
                else
                    ret << "unknown operation #{state}"
                end
            end

            ret
        end

        # Run shell commands
        #
        # @param cmd   [String] Command to execute
        # @param stdin [Sting] Standard input
        #
        # @return [Array] Array with output, error and return code
        def self.run_shell_command((*cmd), stdin = nil)
            rtn = nil

            if Hash == cmd.last
                opts = cmd.pop.dup
            else
                opts = {}
            end

            binmode = opts.delete(:binmode)

            Open3.popen3(*cmd, opts) do |i, o, e, t|
                i.puts stdin unless stdin.nil?

                if binmode
                    i.binmode
                    o.binmode
                    e.binmode
                end

                out_reader = Thread.new { o.read }
                err_reader = Thread.new { e.read }

                begin
                    i.close
                rescue IOError => e
                    raise e.message
                end

                rtn = [out_reader.value, err_reader.value, t.value]
            end

            rtn
        end

        ##################################################################
        # Private Methods
        ##################################################################

        private

        # Apply single diff/patch operation wrapper.
        #
        # @param data [Hash]  Single diff operation data
        # @param mode [Array] Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op(data, mode)
            ret = { :status => false }

            case data['state']
            when 'set'
                ret = apply_diff_op_set(data, mode)
            else
                raise OneCfg::Config::Exception::FatalError,
                      "Invalid patch action '#{diff_op['state']}'"
            end

            ret
        end

        # Appply single diff/patch "set" operation.
        #
        # @param data [Hash]   Single diff operation data
        # @param mode [Array]  Patch modes (see patch method)
        #
        # @return [Hash] Patch status
        def apply_diff_op_set(data, mode)
            ret = { :status => false }

            begin
                ret[:status] = file_patch(data['value'])
            rescue OneCfg::Config::Exception::PatchException
                # rubocop:disable Style/GuardClause
                if mode.include?(:skip)
                    ret[:mode] = :skip
                else
                    raise
                end
                # rubocop:enable Style/GuardClause
            end

            ret
        end

        # Get key for hintings
        #
        # @param diff [Hash] Element with diff information
        #
        # @return [String] Formatted key
        def hinting_key(data)
            full_path = [data['path'], data['key']].flatten.compact

            if full_path.empty?
                '(top)'
            else
                full_path.join('/')
            end
        end

        # Get value for hintings
        #
        # @param data [Hash] Element with diff information
        #
        # @return [String] Formatted value
        def hinting_value(data)
            ret = '??? UNKNOWN ???'

            if data.key?('value')
                ret = data['value'].inspect
            elsif data.key?('old')
                ret = data['old'].inspect
            end

            ret
        end

        # Get extra metadata for hintings
        #
        # @param data [Hash] Element with diff information
        #
        # @return [String] Formatted value
        def hinting_extra(_data)
            ''
        end

        # Provide a mechanism to duplicate object
        #
        # @param cfg [OneCfg::Config::Base] Configuration object to copy
        def initialize_dup(cfg)
            # TODO: implement elegant object copy
            raise TypeError, "can't dup #{cfg.class}"
        end

        # Provide a mechanism to clone object
        #
        # @param cfg [OneCfg::Config::Base] Configuration object to copy
        def initialize_clone(cfg)
            # TODO: implement elegant object copy
            raise TypeError, "can't clone #{cfg.class}"
        end

        # Provide a mechanism to copy object
        #
        # @param cfg [OneCfg::Config::Base] Configuration object to copy
        def initialize_copy(cfg)
            # TODO: implement elegant object copy
            raise TypeError, "can't copy #{cfg.class}"
        end

        # Get diff between 2 rendered configuration files
        #
        # @param cfg [OneCfg::Config::Base] Configuration to diff with
        #
        # @return [String, nil] String with diff if files are not
        #   identical. nil if files are identical. Exception on error.
        def file_diff(cfg)
            file_a = Tempfile.new('onescape-')
            file_b = Tempfile.new('onescape-')

            file_a.close
            file_b.close

            save(file_a.path)
            cfg.save(file_b.path)

            cmd = 'diff -ud --label old --label new ' \
                  "#{file_a.path} #{file_b.path}"

            out, _err, rtn = Base.run_shell_command(cmd)

            # Exit status is (based on diff manual page)
            # 0 if inputs are the same,
            # 1 if different,
            # 2 if trouble
            case rtn.exitstatus
            when 0
                nil
            when 1
                out
            else
                msg = 'Error generating diff'

                raise OneCfg::Exception::Generic, msg
            end
        ensure
            # TODO: is this better?
            file_a.unlink if defined?(file_a)
            file_b.unlink if defined?(file_b)
        end

        # Apply diff to the configuration object
        #
        # @param diff [String] Diff to apply
        def file_patch(data)
            return if data.nil?

            Tempfile.open('onescape-') do |tmp|
                tmp.close
                save(tmp.path)

                out, err, rtn = Base.run_shell_command("patch -f #{tmp.path}",
                                                       data)

                unless rtn.success?
                    OneCfg::LOG.debug('Patch command failed with output - ' \
                                        "#{out.tr("\n", ' ')} " \
                                        "#{err.tr("\n", ' ')}")

                    raise OneCfg::Config::Exception::PatchException,
                          'Patch command failed'
                end

                load(tmp.path)
            end

            true
        end

        # Get the diff between 1 objects and patch current object
        #
        # @param cfg1 [OneCfg::Config::Base] First configuration obj.
        # @param cfg2 [OneCfg::Config::Base] Second configuration obj.
        #
        # VH: disabling for now, might be confusing which obj.
        # is source and dest.
        # def patch_diff(cfg1, cfg2)
        #    diff = cfg1.diff(cfg2)
        #    patch(diff)
        # end

        # Raise an exception in case method is not implemented
        #
        # @param method [String] Name of the method
        def method_not_implemented(method)
            raise "#{method} is not implemented"
        end

        # Make some files operations
        #
        # @param name      [String] File name
        # @param operation [Char]   File operation: r, w
        def file_operation(name, operation)
            file = File.open(name, operation)

            yield(file)

            file.close
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
