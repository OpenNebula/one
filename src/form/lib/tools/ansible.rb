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

module OneForm

    # Builds and cleans isolated Ansible executions for provisions
    class Ansible

        COMP = 'ANS'

        ONEDEPLOY_TAGS = SERVER_CONF[:onedeploy_tags]
        FORM_SERVER    = "http://#{SERVER_CONF[:server][:bind]}:" \
                         "#{SERVER_CONF[:server][:port]}"
        ONE_SERVER     = URI.parse(SERVER_CONF[:one_xmlrpc]).host
        VENV_PATH      = '/usr/share/one/one-deploy/python-venv/'

        ANSIBLE_PLAYBOOK = File.join(VENV_PATH, 'bin', 'ansible-playbook')
        EXTRA_VARS_FILE   = '.oneform-extra-vars.json'
        REQUIRED_FILES    = ['ansible.cfg', 'inventory.yaml', 'site.yaml']

        class << self

            #------------------------------------------------------
            # Commands
            #------------------------------------------------------

            # Prepares the workspace and builds Ansible configuration
            # @param provider [Provider] Provision provider
            # @param provision [Provision] Provision owning the workspace
            # @return [ODS::Command, OpenNebula::Error] Command or error
            def configure(provider, provision)
                # Every execution starts from the current driver configuration
                directory = prepare_workspace(provider, provision)

                # The token is generated for the provision owner at execution time
                auth = ODS::AuthController.user_auth(provision.client)
                return auth if OpenNebula.is_error?(auth)

                # Authentication is kept outside argv and restricted to the owner
                extra_vars_path = File.join(directory, EXTRA_VARS_FILE)
                write_secure_file(
                    extra_vars_path,
                    JSON.generate(extra_vars(provision, auth))
                )

                hosts = provision.resources.hosts.map(&:name)
                tags  = provision.onedeploy_tags || ONEDEPLOY_TAGS

                command = ODS::Command.build(
                    [
                        ANSIBLE_PLAYBOOK,
                        '-i',
                        'inventory.yaml',
                        'site.yaml',
                        '--tags',
                        tags.to_s,
                        '-e',
                        "@#{extra_vars_path}"
                    ],
                    :owner_id        => provision.id,
                    :operation       => :ansible_playbook,
                    :cwd             => directory,
                    :component       => COMP,
                    :stderr_formatter => lambda do |stdout, stderr, exit_code|
                        stderr_formatter(stdout, stderr, exit_code, hosts)
                    end,
                    :stdout_formatter => method(:stdout_formatter),
                    :env           => {
                        'LANG'   => 'C.UTF-8',
                        'LC_ALL' => 'C.UTF-8'
                    },
                    :cancel_signal => 'TERM',
                    :cancel_grace  => SERVER_CONF[:cancel_grace]
                )
                return command if OpenNebula.is_error?(command)

                Log.info(
                    COMP,
                    "Running Ansible playbook for provision #{provision.id}. " \
                    'This operation may take several minutes',
                    provision.id
                )

                command
            rescue StandardError => e
                Log.error(
                    COMP,
                    "Error preparing Ansible files: #{e.message} #{e.backtrace}",
                    provision.id
                )
                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            #------------------------------------------------------
            # Workspace
            #------------------------------------------------------

            # Removes the Ansible workspace after command consumption
            # @param provision [Provision] Provision owning the workspace
            # @return [true, OpenNebula::Error] Cleanup result
            def cleanup(provision)
                directory = ansible_dir(provision)
                FileUtils.rm_rf(directory) if File.exist?(directory)
                true
            rescue StandardError => e
                Log.warn(
                    COMP,
                    "Could not remove Ansible workspace: #{e.message}",
                    provision.id
                )

                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            private

            #------------------------------------------------------
            # Input helpers
            #------------------------------------------------------

            # Extracts the actionable message from an Ansible failure
            # @param stdout [String] Ansible standard output
            # @param stderr [String] Ansible standard error
            # @param _exit_code [Integer] Ansible process exit code
            # @param hosts [Array<String>] Provision hosts ordered as the Ansible inventory
            # @return [String, nil] Failure summary or standard error fallback
            def stderr_formatter(stdout, stderr, _exit_code, hosts)
                lines = stdout.each_line.map(&:strip)
                index = lines.rindex do |line|
                    line.match?(/fatal:|FAILED!|UNREACHABLE!/)
                end
                return stderr unless index

                failure = lines[index]
                payload = failure[/=>\s*(\{.*\})\z/, 1]
                return stderr unless payload

                error = JSON.parse(payload)
                message = error.is_a?(Hash) ? error['msg'].to_s.strip : ''
                return stderr if message.empty?

                node = failure[/fatal:\s*\[n(\d+)\]/, 1]
                host = hosts[node.to_i - 1] if node
                return message if host.nil? || host.empty?

                "#{message} (affected host: #{host})"
            rescue JSON::ParserError
                stderr
            end

            # Selects Ansible execution progress for the provision log
            # @param line [String] Ansible standard output line
            # @return [Array<Symbol, String>, nil] Log level and message, or default handling
            def stdout_formatter(line)
                return unless line.start_with?('TASK ')
                return if line.start_with?('TASK [Gathering Facts]')

                task = line[/\ATASK \[(.*)\]/, 1]
                return unless task

                [:info, task]
            end

            # Builds the values consumed by OneDeploy playbooks
            # @param provision [Provision] Provision supplying deployment values
            # @param auth [String] Authentication token for the provision owner
            # @return [Hash] JSON-compatible Ansible extra variables
            def extra_vars(provision, auth)
                # Ensure one published release
                one_version = OpenNebula::VERSION
                version_parts = one_version.split('.', 3)

                if version_parts[1]&.match?(/\A\d+\z/) && version_parts[1].to_i.odd?
                    one_version = "#{version_parts[0]}.#{version_parts[1].to_i - 1}"
                end

                vars = {
                    :provision_id => provision.id,
                    :form_server  => FORM_SERVER,
                    :version      => one_version,
                    :one_server   => ONE_SERVER,
                    :one_auth     => auth,
                    :user_inputs  => provision.values
                }

                ee_token = SERVER_CONF[:ee_token]
                vars[:one_token] = ee_token if ee_token && !ee_token.empty?

                vars
            end

            #------------------------------------------------------
            # Workspace helpers
            #------------------------------------------------------

            # Rebuilds and validates the Ansible workspace from driver files
            # @param provider [Provider] Provider supplying Ansible configuration
            # @param provision [Provision] Provision owning the workspace
            # @return [String] Prepared Ansible workspace
            def prepare_workspace(provider, provision)
                FileUtils.mkdir_p(provision.dir) unless File.exist?(provision.dir)

                directory = ansible_dir(provision, true)
                Log.debug(
                    COMP,
                    "Gathering Ansible files for provision #{provision.id}",
                    provision.id
                )

                FileUtils.cp_r("#{provider.path}/ansible/.", directory)
                validate_workspace!(directory)

                directory
            end

            # Returns the Ansible directory and optionally recreates it
            # @param provision [Provision] Provision owning the workspace
            # @param recreate [Boolean] Remove and recreate the directory
            # @return [String] Ansible workspace path
            def ansible_dir(provision, recreate = false)
                dirname = File.join(provision.dir, 'ansible')

                if recreate
                    FileUtils.rm_rf(dirname) if File.exist?(dirname)
                    FileUtils.mkdir_p(dirname)
                end

                dirname
            end

            # Validates all files required to start an Ansible execution
            # @param directory [String] Prepared Ansible workspace
            # @raise [RuntimeError] If a required file or executable is missing
            def validate_workspace!(directory)
                REQUIRED_FILES.each do |filename|
                    path = File.join(directory, filename)
                    raise "#{filename} not found in #{directory}" \
                        unless File.file?(path)
                end

                templates = File.join(directory, 'templates')
                raise "templates directory not found in #{directory}" \
                    unless Dir.exist?(templates)
                raise "templates directory is empty in #{directory}" \
                    if Dir.empty?(templates)

                return if File.file?(ANSIBLE_PLAYBOOK) &&
                          File.executable?(ANSIBLE_PLAYBOOK)

                raise "ansible-playbook is not executable at #{ANSIBLE_PLAYBOOK}"
            end

            # Atomically writes a sensitive file with owner-only permissions
            # @param path [String] Destination path
            # @param content [String] File contents
            def write_secure_file(path, content)
                temporary = File.join(
                    File.dirname(path),
                    ".#{File.basename(path)}.#{SecureRandom.hex(8)}.tmp"
                )

                File.open(
                    temporary,
                    File::WRONLY | File::CREAT | File::EXCL,
                    0o600
                ) do |file|
                    file.write(content)
                    file.flush
                    file.fsync
                end

                File.rename(temporary, path)
            ensure
                File.delete(temporary) \
                    if temporary && File.exist?(temporary)
            end

        end

    end

end
