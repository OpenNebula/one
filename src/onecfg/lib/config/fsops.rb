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

require 'tmpdir'

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::Config

    # Management file class
    class FileOperation

        # @prefix       directory where all operations are done
        # @unprivileged true to skip some operations
        attr_reader :prefix, :unprivileged

        # Class constructor
        #
        # @param prefix       [String]  Directory where all operations are done
        # @param unprivileged [Boolean] True to skip some operations
        def initialize(prefix = '/', unprivileged = false)
            @prefix       = prefix
            @unprivileged = unprivileged
        end

        # Create a new directory if it doesn't exist
        #
        # @param name [String] Directory path
        def mkdir(path)
            target = prefixed(path)

            if exist?(target)
                dddebug('mkdir', [path], 'Already exists')
            else
                dddebug('mkdir', [path])
                FileUtils.mkdir_p(target)
            end
        end

        # Change file ownership
        #
        # @param path  [String] File path
        # @param owner [String] New owner
        # @param group [String] New group (by default the same as owner)
        def chown(path, owner, group = owner)
            target = prefixed(path)

            if @unprivileged
                dddebug('chown',
                        [path, owner, group],
                        'Skipped on unprivileged run')
            else
                # TODO: recursive?
                dddebug('chown', [path, owner, group])
                FileUtils.chown_R(owner, group, target)
            end
        end

        # Change file permissions
        #
        # @param path [String] File path
        # @param mode [String] New permissions
        def chmod(path, mode)
            target = prefixed(path)
            dddebug('chmod', [path, mode])
            FileUtils.chmod(mode, target)
        end

        # Move file or directory from src location to dst location
        #
        # @param src [String] Source path
        # @param dst [String] Destination path
        def move(src, dst)
            dddebug('move', [src, dst])

            glob(src, false).each do |f|
                begin
                    # glob returns relative paths inside the prefix.
                    # We have to prefix bouth source and dst.
                    pre_f   = prefixed(f)
                    pre_dst = prefixed(dst)

                    OneCfg::LOG.dddebug("Move #{pre_f} " \
                                          "into #{pre_dst}")

                    FileUtils.mv(pre_f, pre_dst)
                rescue StandardError => e
                    # skip files which are the same as destination
                    # TODO: WTF is error 22 !!!
                    next if e.errno == 22

                    raise e
                end
            end
        end

        # Check if the given path exists
        #
        # @param path [String] File path
        def exist?(path)
            ::File.exist?(prefixed(path))
        end

        # Check if the given path is a file
        #
        # @param path [String] File path
        def file?(path)
            ::File.file?(prefixed(path))
        end

        # Check if the given path is a directory
        #
        # @param path [String] Directory path
        def directory?(path)
            ::File.directory?(prefixed(path))
        end

        # Delete the file
        #
        # @param path [String] File path
        def delete(path)
            dddebug('delete', [path])

            FileUtils.rm_r(prefixed(path))
        end

        # Get directory files
        #
        # @param path [String]  Directory path
        # @param deep [Boolean] True to read recursively all files
        def glob(path, deep = true)
            dddebug('glob', [path, deep])

            target = prefixed(path)

            if ::File.directory?(target) && deep
                ret = Dir["#{target}/**/**"]
            elsif ::File.directory?(target)
                ret = Dir["#{target}/**"]
            else
                ret = Dir[target]
            end

            # remove prefix and duplicate //
            ret.map do |f|
                unprefixed(f)
            end
        end

        # Read file content
        #
        # @param path [String] File path
        #
        # @return [String] File content
        def file_read(path)
            ret = ''

            dddebug('file_read', [path])
            ::File.open(prefixed(path), 'r') do |file|
                ret += file.read
            end

            ret
        end

        # Write content into file
        #
        # @param path    [String]  File path
        # @param content [String]  File content
        # @param append  [Boolean] true to append the content
        #                          false to replace
        def file_write(path, content, append = false)
            dddebug('file_write', [path, '...', append])

            append == true ? mode = 'a' : mode = 'w'

            ::File.open(prefixed(path), mode) do |file|
                file.write(content)
            end
        end

        # Get path with prefix
        #
        # @param path [String] Path to add prefix
        #
        # @return [String] Prefixed path
        def prefixed(path)
            OneCfg::Config::Utils.prefixed(path, @prefix)
        end

        # Get path without prefix
        #
        # @param path [String] Path to remove prefix
        #
        # @return [String] Unprefixed path
        def unprefixed(path)
            OneCfg::Config::Utils.unprefixed(path, @prefix)
        end

        private

        # Log debug^3 message about
        #
        # @param method  [String] Method name
        # @param args    [Array]  Method arguments
        # @param comment [String] Optional comment
        def dddebug(method, args, comment = nil)
            text = self.class.name.split('::').last + ' '
            text << "[prefix=#{prefix}] "
            text << "#{method}(#{args.join(',')})"
            text << " ... #{comment}" if comment

            OneCfg::LOG.dddebug(text)
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
