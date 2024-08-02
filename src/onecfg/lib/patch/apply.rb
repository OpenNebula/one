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
module OneCfg::Patch

    # Class for generating patches
    class Apply

        # Class constructor
        def initialize(args = {})
            @patches = { 'patches' => {} }

            # TODO: move common defaults on a single place
            @prefix       = '/'
            @unprivileged = false
            @no_operation = false

            # set based on args
            @prefix       = args[:prefix] unless args[:prefix].nil?
            @unprivileged = args[:unprivileged] unless args[:unprivileged].nil?
            @no_operation = args[:noop] unless args[:noop].nil?
        end

        def read_from_file(filename, format)
            if format.nil?
                begin
                    if File.open(filename, &:readline).strip == '---'
                        format = 'yaml'
                    end
                rescue StandardError
                    # we do silently ignore any errors in format detection
                    # as they might be much better handled below
                end

                format ||= 'line'
            end

            begin
                case format
                when 'yaml'
                    parse_yaml(filename)
                else
                    parse_hintings(filename)
                end
            rescue OneCfg::Exception::FileParseError => e
                raise e
            rescue StandardError => e
                raise "Error reading #{format} patch (#{e})"
            end
        end

        def apply(all = true)
            if @patches['patches'].empty?
                OneCfg::LOG.error('No changes to apply')
                return(-1)
            end

            # all changes are running in transaction,
            # which is "rollbacked" in case of error
            tr = OneCfg::Transaction.new

            tr.prefix       = @prefix
            tr.unprivileged = @unprivileged
            tr.no_operation = @no_operation

            OneCfg::LOG.info('Applying patch to ' \
                             "#{@patches['patches'].size} files")

            ret = 0

            # total number of changes
            total_count   = 0
            total_success = 0

            tr.execute do |tr_prefix, _fops|
                @patches['patches'].each do |filename, patch|
                    # Get prefixed name (do not modified original file)
                    pre_name = OneCfg::Config::Utils.prefixed(filename,
                                                              tr_prefix)

                    # Get file object based on the type
                    OneCfg::LOG.ddebug("Reading file '#{filename}'")
                    file = OneCfg::Config::Files.type_class(patch['class'])
                                                .new(pre_name)
                    file.load

                    # Apply changes
                    begin
                        OneCfg::LOG.debug("Patching file '#{filename}'")
                        rc, rep = file.patch(patch['change'], [:replace])
                    rescue StandardError => e
                        OneCfg::LOG.error('Failed to patch file ' \
                                          "'#{filename}' - #{e}")
                        return(-1)
                    end

                    # Count non/applied patches
                    patch_count   = rep.size
                    patch_success = 0

                    rep.each do |r|
                        if r[:status]
                            patch_success += 1
                        else
                            ret = 1
                        end
                    end

                    # Add counts to totals
                    total_count   += patch_count
                    total_success += patch_success

                    OneCfg::LOG.info("Patched '#{filename}' with " \
                                     "#{patch_success}/#{patch_count} " \
                                     'changes')

                    # show report
                    OneCfg::LOG.debug("--- PATCH REPORT '#{filename}' --- ")
                    file.hintings(patch['change'], rep).each do |l|
                        OneCfg::LOG.debug("Patch #{l}")
                    end

                    file.save if rc
                end

                # there were changes, but nothing could be applied
                if total_success == 0
                    OneCfg::LOG.error('No changes applied')
                    return(-1)
                end

                # use requested all changes to apply, not even less
                if all && total_success != total_count
                    OneCfg::LOG.error('Modifications not saved due to ' \
                                      "#{total_count - total_success} " \
                                      'unapplied changes!')
                    return(-1)
                end

                # statistics at the end before finishing transaction
                OneCfg::LOG.info("Applied #{total_success}/#{total_count} " \
                                 'changes')
            end

            ret
        end

        private

        # Add a file diff to be processed
        #
        # @param filename [String] path to patch in YAML format
        def parse_yaml(filename)
            if Psych::VERSION > '4.0'
                @patches = YAML.load_file(filename, :aliases => true)
            else
                @patches = YAML.load_file(filename)
            end

            return if @patches.is_a?(Hash)

            raise OneCfg::Exception::FileParseError,
                  'The patch does not contain expected YAML document'
        end

        # Add a file diff to be processed in hinting format
        #
        # @param filename [String] path to patch in hintings format
        def parse_hintings(filename)
            files = OneCfg::Config::Files.new.scan(@prefix, false)

            changes = {}

            File.open(filename).each_with_index do |line, idx|
                # skip empty lines and comments
                line.strip!
                next if line.empty? || line.start_with?('#')

                # line format: <file> <hinting>
                if line.split.size < 2
                    raise OneCfg::Exception::FileParseError,
                          "Invalid format at line: #{idx + 1}."
                end

                # TODO: should be managed by parser
                h_filename, hintings = line.split(' ', 2)

                unless files.key?(h_filename)
                    raise OneCfg::Exception::FileParseError,
                          "Unknown or missing file to patch '#{h_filename}'"
                end

                # get suitable file manipulation object and create a diff
                file_obj = files[h_filename]['ruby_class'].new(h_filename)
                changes[h_filename] ||= []
                changes[h_filename] << file_obj.diff_from_hintings(hintings)
            end

            # create internal structure similar to what we get from YAML
            changes.each do |f, c|
                @patches['patches'][f] = {
                    'class'  => files[f]['class'],
                    'change' => c
                }
            end
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
