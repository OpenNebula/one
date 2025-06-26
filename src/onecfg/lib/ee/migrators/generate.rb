# -------------------------------------------------------------------------- #
# Copyright 2019-2023, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::EE

    # Generate methods
    class Migrators::Generate

        # @fops file system operations manager
        attr_accessor :fops

        # Class constructor
        # def initialize
        #     super
        # end

        # TODO: split functions, polish parameters

        # Get diffs from configuration files between 2 OpenNebula versions
        #
        # @param git_path [String] Path to git repository
        # @param source   [String] Source version
        # @param target   [String] Target version
        # @param migrator [String] Path to migrator file
        # @param options  [String] CLI options
        #
        # @return [Yaml] Change descriptor with all diffs
        def generate(git_path, source, target, migrator, options)
            OneCfg::LOG.info('Generating automatic migrator')

            # create temporal directories to install OpenNebula
            s_dir = Dir.mktmpdir
            t_dir = Dir.mktmpdir

            begin
                git = Git.open(git_path)
            rescue StandardError => e
                raise OneCfg::Config::Exception::FatalError,
                      "Git error: #{e}"
            end

            # install both OpenNebula versions
            #   - first go to the repo
            #   - checkout to release branch
            #   - run install.sh on a dedicated directory
            install_one(git, git_path, source, s_dir)
            install_one(git, git_path, target, t_dir)

            # change installation paths, by real paths
            #   - from etc/ to /etc/one
            #   - from var/ to /var/lib/one
            fix_installation_paths(s_dir)
            fix_installation_paths(t_dir)

            @fops = OneCfg::Config::FileOperation.new(s_dir, true)

            if migrator.nil?
                OneCfg::LOG.debug('No Ruby migrator available')
            else
                # load Ruby migrator to be able to execute methods
                OneCfg::LOG.debug("Using migrator #{migrator}")

                begin
                    load(migrator)
                    extend Migrator
                rescue StandardError => e
                    raise OneCfg::Config::Exception::FatalError,
                          "Failed to load migrator #{migrator}: #{e}"
                end

                OneCfg::LOG.ddebug('Migrator loaded')

                # run Ruby pre_up
                if defined? pre_up
                    OneCfg::LOG.ddebug('Running Ruby pre_up')

                    begin
                        pre_up
                    rescue StandardError => e
                        raise OneCfg::Config::Exception::FatalError,
                              "Ruby migrator error: #{e}"
                    end

                    OneCfg::LOG.ddebug('Finished Ruby pre_up')
                else
                    OneCfg::LOG.warn('No Ruby pre_up available')
                end
            end

            # get files from both installation
            files = OneCfg::Config::Files.new
            s_files = files.scan(s_dir)
            t_files = files.scan(t_dir)

            # sandboxed operations
            s_fops = OneCfg::Config::FileOperation.new(s_dir)
            t_fops = OneCfg::Config::FileOperation.new(t_dir)

            if s_files.empty? || t_files.empty?
                raise OneCfg::Config::Exception::FatalError,
                      'No configuration files found for comparison!'
            end

            # generate descriptor
            desc = {}
            desc['patches'] = {} # TODO: drop 'patches' keyword

            (s_files.keys + t_files.keys).uniq.each do |file|
                OneCfg::LOG.debug("Processing file '#{file}'")

                if s_files.key?(file) && t_files.key?(file)
                    if s_files[file]['class'] != t_files[file]['class']
                        # this should never happen
                        raise OneCfg::Config::Exception::FatalError,
                              'Source and target objects are not of same ' \
                              "type for #{file}"
                    end

                    s_file = s_files[file]['ruby_class'].new("#{s_dir}/#{file}")
                    t_file = t_files[file]['ruby_class'].new("#{t_dir}/#{file}")

                    s_file.load
                    t_file.load

                    diff = s_file.diff(t_file)

                    # changed file
                    if diff
                        OneCfg::LOG.ddebug("File '#{file}' has changed")

                        desc['patches'][file] =
                            files.file4desc(s_files[file]).merge(
                                'action'  => 'apply',
                                'change'  => diff,
                                'content' => t_fops.file_read(file)
                            )

                    # same file
                    else
                        OneCfg::LOG.ddebug("File '#{file}' is same")

                        desc['patches'][file] =
                            files.file4desc(s_files[file]).merge(
                                'content' => t_fops.file_read(file)
                            )
                    end

                # deleted file
                elsif s_files.key?(file)
                    OneCfg::LOG.ddebug("File '#{file}' was deleted")

                    desc['patches'][file] =
                        files.file4desc(s_files[file]).merge(
                            'action'  => 'delete',
                            'content' => s_fops.file_read(file) # TODO: unneeded
                        )

                # new file
                else
                    OneCfg::LOG.ddebug("File '#{file}' is new")

                    desc['patches'][file] =
                        files.file4desc(t_files[file]).merge(
                            'action'  => 'create',
                            'content' => t_fops.file_read(file)
                        )
                end
            end

            # write descriptor into file
            if options.key? :descriptor_name
                descriptor_name = options[:descriptor_name]
            else
                descriptor_name = "/tmp/onecfg-#{rand(36**8).to_s(36)}"
            end

            OneCfg::LOG.debug('Writing change desciptor to ' \
                                "'#{descriptor_name}'")

            File.open(descriptor_name, 'w') do |file|
                file.write(desc.to_yaml(:indentation => 4, :line_width => 120))
            end

            OneCfg::LOG.info('Automatic migrator generated')

            descriptor_name
        ensure
            FileUtils.rm_r(s_dir) if defined?(s_dir) && s_dir
            FileUtils.rm_r(t_dir) if defined?(t_dir) && t_dir
        end

        private

        # Install OpenNebula in an specific directory
        #
        # @param git      [Ruby::Git] Git object to manage the repository
        # @param git_path [String]    Path to the git repository
        # @param commit   [String]    Commit to checkout and install from
        # @param          [Ruby::Dir] Directory to install OpenNebula
        def install_one(git, git_path, commit, dir)
            OneCfg::LOG.info("Install OpenNebula (#{commit})")

            OneCfg::LOG.debug("Checking out commit '#{commit}'")
            git.checkout(commit)

            OneCfg::LOG.debug("Installing into '#{dir}'")
            Dir.chdir(git_path) do
                cmd = "./install.sh -d '#{dir}'"

                _, err, rtn = OneCfg::Config::Type::Base
                              .run_shell_command(cmd)

                unless rtn.success?
                    OneCfg::LOG.debug("Installation failure - #{err}")

                    raise OneCfg::Config::Exception::FatalError,
                          'Failed to install OpenNebula'
                end
            end
        end

        # Change directory structure in prefix from local installation
        # specific places (e.g., /etc/oned.conf) to those expected
        # on production deployment (e.g., /etc/one/oned.conf).
        #
        # @param prefix [String] Directory structure to fix
        def fix_installation_paths(prefix)
            if prefix =~ %r{^/*$}
                # this should never happen
                raise OneCfg::Config::Exception::FatalError,
                      "Wrong prefix '#{prefix}' to fix specific local " \
                      'installation directories in!'
            end

            OneCfg::LOG.debug("Changing file paths for #{prefix}")
            f_ops = OneCfg::Config::FileOperation.new(prefix)

            # fix paths to real ones
            OneCfg::CONFIG_LOCAL_FIX_DIRS.each do |i_path, r_path|
                f_ops.mkdir(r_path)
                f_ops.move("/#{i_path}", r_path)
            end

            # remove don't needed directories
            f_ops.glob('**').each do |d|
                f_ops.delete(d) unless OneCfg::CONFIG_LOCAL_FIX_DIRS.key?(d)
            end
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
