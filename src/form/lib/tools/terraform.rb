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

    # Class to operate with Terraform
    class Terraform

        COMP = 'TFR'

        class << self

            #------------------------------------------------------
            # Commands
            #------------------------------------------------------

            # Rebuilds the Terraform workspace and builds its initialization command
            # @param provision [Provision] Provision owning the workspace
            # @param provider [Provider] Provider supplying Terraform configuration
            # @return [ODS::Command, OpenNebula::Error] Command or error
            def init(provision, provider)
                rc = prepare(provision, provider)
                return rc if OpenNebula.is_error?(rc)

                command = ODS::Command.build(
                    ['terraform', 'init', '-no-color'],
                    :owner_id         => provision.id,
                    :operation        => :tf_init,
                    :cwd              => tf_dir(provision),
                    :component        => COMP,
                    :stderr_formatter => method(:stderr_formatter)
                )
                return command if OpenNebula.is_error?(command)

                Log.info(
                    COMP,
                    "Initializing Terraform for provision #{provision.id}. " \
                    'This operation may take several minutes',
                    provision.id
                )

                command
            end

            # Builds Terraform planning for the provision workspace
            # @param provision [Provision] Provision owning the workspace
            # @return [ODS::Command, OpenNebula::Error] Command or error
            def plan(provision)
                command = ODS::Command.build(
                    ['terraform', 'plan', '-input=false', '-no-color'],
                    :owner_id         => provision.id,
                    :operation        => :tf_plan,
                    :cwd              => tf_dir(provision),
                    :component        => COMP,
                    :stderr_formatter => method(:stderr_formatter)
                )
                return command if OpenNebula.is_error?(command)

                Log.info(
                    COMP,
                    "Planning Terraform changes for provision #{provision.id}",
                    provision.id
                )

                command
            end

            # Builds Terraform apply for the provision workspace
            # @param provision [Provision] Provision owning the workspace
            # @return [ODS::Command, OpenNebula::Error] Command or error
            def apply(provision)
                command = ODS::Command.build(
                    ['terraform', 'apply', '-auto-approve', '-no-color'],
                    :owner_id      => provision.id,
                    :operation     => :tf_apply,
                    :cwd           => tf_dir(provision),
                    :component     => COMP,
                    :stderr_formatter => method(:stderr_formatter),
                    :stdout_formatter => method(:stdout_formatter),
                    :cancel_signal => 'INT',
                    :cancel_grace  => SERVER_CONF[:cancel_grace]
                )
                return command if OpenNebula.is_error?(command)

                Log.info(
                    COMP,
                    "Applying Terraform changes for provision #{provision.id}. " \
                    'This operation may take several minutes',
                    provision.id
                )

                command
            end

            # Builds a Terraform destroy operation for selected resources
            # @param provision [Provision] Provision owning the workspace
            # @param uuids [Array<String>] Terraform resource UUIDs, empty for all
            # @return [ODS::Command, OpenNebula::Error, nil] Command, error or no-op
            def destroy(provision, uuids)
                return if provision.tfstate.nil? || provision.tfstate.empty?

                tfstate = JSON.parse(Base64.decode64(provision.tfstate))
                argv    = ['terraform', 'destroy', '-no-color']

                # Every requested UUID must resolve before adding any selective target
                destroy_targets(tfstate, uuids, provision.id).each do |target|
                    argv << "-target=#{target}"
                end

                argv << '-auto-approve'

                command = ODS::Command.build(
                    argv,
                    :owner_id         => provision.id,
                    :operation        => :tf_destroy,
                    :cwd              => tf_dir(provision),
                    :component        => COMP,
                    :stderr_formatter => method(:stderr_formatter),
                    :stdout_formatter => method(:stdout_formatter),
                    :cancel_signal    => 'INT',
                    :cancel_grace     => SERVER_CONF[:cancel_grace]
                )
                return command if OpenNebula.is_error?(command)

                Log.info(
                    COMP,
                    "Destroying Terraform resources for provision #{provision.id}. " \
                    'This operation may take several minutes',
                    provision.id
                )

                command
            rescue StandardError => e
                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            # Builds a Terraform refresh-only apply for the provision workspace
            # @param provision [Provision] Provision owning the workspace
            # @return [ODS::Command, OpenNebula::Error] Command or error
            def refresh(provision)
                command = ODS::Command.build(
                    ['terraform', 'apply', '-refresh-only', '-auto-approve', '-no-color'],
                    :owner_id      => provision.id,
                    :operation     => :tf_refresh,
                    :cwd           => tf_dir(provision),
                    :component     => COMP,
                    :stderr_formatter => method(:stderr_formatter),
                    :cancel_signal => 'INT',
                    :cancel_grace  => SERVER_CONF[:cancel_grace]
                )
                return command if OpenNebula.is_error?(command)

                Log.info(
                    COMP,
                    "Refreshing Terraform state for provision #{provision.id}",
                    provision.id
                )

                command
            end

            #------------------------------------------------------
            # Workspace
            #------------------------------------------------------

            # Rebuilds the Terraform workspace from provider files and stored state
            # @param provision [Provision] Provision owning the workspace
            # @param provider [Provider] Provider supplying Terraform configuration
            # @return [nil, OpenNebula::Error] Terraform initialization result
            def prepare(provision, provider)
                FileUtils.mkdir_p(provision.dir) unless File.exist?(provision.dir)

                # Begin with a new directory so no previous execution data survives
                ddir = tf_dir(provision, true)

                Log.info(
                    COMP,
                    "Gathering Terraform files for provision #{provision.id}",
                    provision.id
                )

                # The driver supplies immutable configuration and supporting files
                FileUtils.cp_r("#{provider.path}/terraform/.", ddir)
                clear_runtime_files(ddir)

                # Variables are regenerated from the latest desired values and provider
                variables = terraform_variables(provision, provider)
                return variables if OpenNebula.is_error?(variables)

                generate_tfvars(File.join(ddir, 'provision.auto.tfvars.json'), variables)

                # The document state is the only durable Terraform runtime artifact
                restore_state(ddir, provision)

                Log.info(
                    COMP,
                    "Terraform workspace prepared for provision #{provision.id}",
                    provision.id
                )
            rescue StandardError => e
                Log.error(
                    COMP,
                    "Error preparing Terraform files: #{e.message} #{e.backtrace}",
                    provision.id
                )
                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            # Removes the Terraform workspace after lifecycle completion
            # @param provision [Provision] Provision owning the workspace
            # @return [true, OpenNebula::Error] Cleanup result
            def cleanup(provision)
                directory = tf_dir(provision)
                FileUtils.rm_rf(directory) if File.exist?(directory)
                true
            rescue StandardError => e
                Log.warn(
                    COMP,
                    "Could not remove Terraform workspace: #{e.message}",
                    provision.id
                )

                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            private :prepare

            #------------------------------------------------------
            # State and outputs
            #------------------------------------------------------

            # Stores the current Terraform state in the provision body
            # @param provision [Provision] Provision owning the Terraform workspace
            # @return [Hash, nil, OpenNebula::Error] Parsed state, no state or error
            def save_state(provision)
                state_path = File.join(tf_dir(provision), 'terraform.tfstate')
                return unless File.exist?(state_path)

                Log.info(COMP, 'Processing terraform state file', provision.id)

                tfstate = JSON.parse(File.read(state_path))
                provision.tfstate = Base64.strict_encode64(tfstate.to_json)

                tfstate
            rescue StandardError => e
                Log.error(
                    COMP,
                    'Error saving Terraform state for provision ' \
                    "#{provision.id}: #{e.message}",
                    provision.id
                )

                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            # Reconciles the provision hosts with its persisted Terraform state
            # @param provision [Provision] Provision receiving the reconciled hosts
            # @return [nil, OpenNebula::Error] Reconciliation result
            def reconcile(provision)
                raise 'Terraform state not found' if provision.tfstate.nil? ||
                                                     provision.tfstate.empty?

                tfstate = JSON.parse(Base64.decode64(provision.tfstate))

                # Validate the complete external payload before changing the provision
                hosts = parse_provisioned_hosts(tfstate)

                # Reconcile by stable Terraform identity while allowing IP changes
                reconcile_host_records(provision, hosts)
            rescue StandardError => e
                Log.error(
                    COMP,
                    'Error getting outputs for Terraform files for ' \
                    "provision #{provision.id}: #{e.message}"
                )
                OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
            end

            private

            # Extracts the actionable message from a Terraform failure
            # @param stdout [String] Terraform standard output
            # @param stderr [String] Terraform standard error
            # @param _exit_code [Integer] Terraform process exit code
            # @return [String, nil] Failure summary or standard error fallback
            def stderr_formatter(stdout, stderr, _exit_code)
                lines = "#{stdout}\n#{stderr}".each_line.map(&:strip)

                local_exec = lines.reverse.find do |line|
                    line.match?(/\(local-exec\): Error:/)
                end
                return local_exec.sub(/^.*\(local-exec\): Error:\s*/, '') if local_exec

                diagnostic = lines.reverse.find do |line|
                    line.match?(/\A(?:│\s*)?Error: /)
                end
                diagnostic&.sub(/\A(?:│\s*)?Error: /, '')
            end

            # Selects Terraform resource progress for the provision log
            # @param line [String] Terraform standard output line
            # @return [Array<Symbol, String>, nil] Log level and message, or default handling
            def stdout_formatter(line)
                return unless line.match?(
                    /:\s+(?:Creating|Still\s+creating|Destroying|Still\s+destroying)\.\.\.|
                    :\s+(?:Creation|Destruction)\s+complete|
                    \A(?:Apply|Destroy)\s+complete!/x
                )

                [:info, line]
            end

            #------------------------------------------------------
            # Workspace helpers
            #------------------------------------------------------

            # Returns the Terraform directory and optionally recreates it
            # @param provision [Provision] Provision owning the workspace
            # @param recreate [Boolean] Remove and recreate the directory
            # @return [String] Terraform workspace path
            def tf_dir(provision, recreate = false)
                dirname = File.join(provision.dir, 'terraform')

                if recreate
                    FileUtils.rm_rf(dirname) if File.exist?(dirname)
                    FileUtils.mkdir_p(dirname)
                end

                dirname
            end

            # Removes execution artifacts copied accidentally with provider files
            # @param directory [String] Rebuilt Terraform workspace
            def clear_runtime_files(directory)
                FileUtils.rm_rf(File.join(directory, '.terraform'))
                FileUtils.rm_f(
                    [
                        File.join(directory, '.terraform.tfstate.lock.info'),
                        File.join(directory, 'terraform.tfstate'),
                        File.join(directory, 'terraform.tfstate.backup')
                    ]
                )
            end

            # Builds the complete Terraform variable set for a provision
            # @param provision [Provision] Provision supplying desired values
            # @param provider [Provider] Provider supplying connection values
            # @return [Hash, OpenNebula::Error] JSON-compatible Terraform variables or error
            def terraform_variables(provision, provider)
                driver = Driver.from_name(provider.driver)
                return driver if OpenNebula.is_error?(driver)

                return OpenNebula::Error.new(
                    "Driver '#{provider.driver}' not found",
                    OpenNebula::Error::ENO_EXISTS
                ) unless driver

                names = (
                    Array(driver.body[:user_inputs]) + Array(driver.body[:connection])
                ).filter_map {|input| input[:name]&.to_s }

                values = stringify_keys(provision.user_inputs_values)

                # Provider connection values take precedence over user inputs
                values.merge!(stringify_keys(provider.connection))
                variables = values.select {|name, _| names.include?(name) }

                # Ownership tags cannot be overridden by custom provision tags
                tags = stringify_keys(provision.values.tags).merge(
                    'provision_id' => provision.id,
                    'provider_id'  => provider.id,
                    'driver'       => provider.driver
                )
                variables['oneform_tags'] = tags if names.include?('oneform_tags')

                variables
            end

            # Converts top-level hash keys to the JSON variable naming format
            # @param values [Hash] Values with String or Symbol keys
            # @return [Hash] Values keyed by String
            def stringify_keys(values)
                values.each_with_object({}) do |(key, value), normalized|
                    normalized[key.to_s] = value
                end
            end

            # Generates the Terraform JSON variables file
            # @param path [String] Destination tfvars path
            # @param variables [Hash] Terraform input variables
            def generate_tfvars(path, variables)
                write_secure_file(path, JSON.pretty_generate(variables))
            end

            # Restores the document Terraform state into a rebuilt workspace
            # @param directory [String] Rebuilt Terraform workspace
            # @param provision [Provision] Provision supplying the durable state
            def restore_state(directory, provision)
                return if provision.tfstate.empty?

                Log.info(
                    COMP,
                    'Restoring Terraform state from provision body',
                    provision.id
                )

                tfstate = JSON.parse(Base64.decode64(provision.tfstate))
                state_path = File.join(directory, 'terraform.tfstate')

                write_secure_file(state_path, JSON.pretty_generate(tfstate))

                Log.info(COMP, 'Terraform state file restored', provision.id)
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

            #------------------------------------------------------
            # Output reconciliation
            #------------------------------------------------------

            # Parses and validates hosts exposed by Terraform outputs
            # @param tfstate [Hash] Parsed Terraform state
            # @return [Array<Hash>] Normalized hosts with UUID and address
            def parse_provisioned_hosts(tfstate)
                output = tfstate.dig('outputs', 'provisioned_hosts', 'value') || []
                raise 'Terraform provisioned_hosts output must be an array' \
                    unless output.is_a?(Array)

                hosts = output.map do |host|
                    raise 'Terraform provisioned_hosts entries must be hashes' \
                        unless host.is_a?(Hash)

                    uuid    = host['instance_id'].to_s
                    address = host['instance_ip'].to_s

                    raise 'Terraform host output is missing instance_id' if uuid.empty?
                    raise "Terraform host #{uuid} is missing instance_ip" if address.empty?

                    { :uuid => uuid, :address => address }
                end

                validate_unique!(
                    hosts.map {|host| host[:uuid] },
                    'Terraform outputs contain duplicate instance IDs'
                )
                validate_unique!(
                    hosts.map {|host| host[:address] },
                    'Terraform outputs contain duplicate instance IPs'
                )

                hosts
            end

            # Reconciles persisted hosts against normalized Terraform outputs
            # @param provision [Provision] Provision owning the host resources
            # @param provisioned_hosts [Array<Hash>] Normalized Terraform hosts
            def reconcile_host_records(provision, provisioned_hosts)
                current_hosts = Array(provision.resources.hosts)
                missing_uuid = current_hosts.find {|host| host.uuid.to_s.empty? }

                raise(
                    "Provision host #{missing_uuid.name} is missing its Terraform UUID"
                ) if missing_uuid

                current_uuids = current_hosts.map {|host| host.uuid.to_s }
                output_uuids  = provisioned_hosts.map {|host| host[:uuid] }

                validate_unique!(
                    current_uuids,
                    'Provision contains duplicate Terraform host UUIDs'
                )

                current_index = current_hosts.to_h {|host| [host.uuid.to_s, host] }

                provisioned_hosts.each do |host|
                    current = current_index[host[:uuid]]

                    if current
                        # The UUID is stable but Terraform may report a new address
                        current.name = host[:address]
                        next
                    end

                    provision.resources.register_host(
                        :id      => nil,
                        :uuid    => host[:uuid],
                        :address => host[:address]
                    )
                end

                # Missing UUIDs represent resources removed by Terraform
                (current_uuids - output_uuids).each do |uuid|
                    provision.resources.unregister_host(uuid)
                end
            end

            # Rejects duplicated identity values with a contextual error
            # @param values [Array<String>] Values expected to be unique
            # @param message [String] Error prefix describing the values
            def validate_unique!(values, message)
                duplicates = values.tally.select {|_, count| count > 1 }.keys
                return if duplicates.empty?

                raise "#{message}: #{duplicates.join(', ')}"
            end

            #------------------------------------------------------
            # State resource lookup
            #------------------------------------------------------

            # Resolves every selective destroy UUID into a Terraform address
            # @param tfstate [Hash] Parsed Terraform state
            # @param uuids [Array<String>] Requested Terraform UUIDs
            # @param provision_id [Integer] Provision identifier used for logging
            # @return [Array<String>] Terraform resource addresses
            def destroy_targets(tfstate, uuids, provision_id)
                resources = uuids.uniq.each_with_object({}) do |uuid, targets|
                    targets[uuid] = get_resource_path(tfstate, uuid, provision_id)
                end

                missing = resources.select {|_, path| path.nil? }.keys
                raise(
                    'Terraform resources not found for UUIDs: ' \
                    "#{missing.join(', ')}"
                ) unless missing.empty?

                resources.values
            end

            # Finds a resource and instance index by UUID in Terraform state
            # @param tfstate [Hash] Parsed Terraform state
            # @param uuid [String] Terraform resource UUID
            # @return [Hash, nil] Matching resource and instance index
            def find_resource_by_uuid(tfstate, uuid)
                Array(tfstate['resources']).each do |resource|
                    Array(resource['instances']).each_with_index do |instance, index|
                        # Null resources expose identity below triggers
                        attributes = instance['attributes'] || {}
                        triggers   = attributes['triggers'] || {}

                        if attributes.value?(uuid) || triggers.value?(uuid)
                            return { 'resource' => resource, 'index' => index }
                        end
                    end
                end

                nil
            end

            # Builds the Terraform address for a resource identified by UUID
            # @param tfstate [Hash] Parsed Terraform state
            # @param uuid [String] Terraform resource UUID
            # @param provision_id [Integer, nil] Provision identifier used for logging
            # @return [String, nil] Terraform resource address
            def get_resource_path(tfstate, uuid, provision_id = nil)
                resource = find_resource_by_uuid(tfstate, uuid)

                unless resource
                    Log.warn(
                        COMP,
                        "Resource (UUID=#{uuid}) not found in tfstate",
                        provision_id
                    )
                    return
                end

                matching_resource = resource['resource']
                resource_index    = resource['index']
                instances         = matching_resource['instances']

                unless instances.is_a?(Array) && !instances.empty?
                    Log.warn(COMP, "No instances found for UUID #{uuid}", provision_id)
                    return
                end

                instance = instances.at(resource_index)
                unless instance
                    Log.warn(
                        COMP,
                        "Instance at index #{resource_index} not found for UUID #{uuid}",
                        provision_id
                    )
                    return
                end

                # Preserve for_each keys and count indexes in the final address
                suffix = resource_index_suffix(
                    instance,
                    resource_index,
                    instances.size
                )
                path = [
                    matching_resource['module'],
                    matching_resource['type'],
                    matching_resource['name']
                ].compact.join('.')

                "#{path}#{suffix}"
            end

            # Builds the optional for_each or count suffix for a resource address
            # @param instance [Hash] Terraform resource instance
            # @param index [Integer] Instance position in the state resource
            # @param count [Integer] Number of instances in the state resource
            # @return [String] Terraform address suffix
            def resource_index_suffix(instance, index, count)
                if instance.key?('index_key')
                    key = instance['index_key']
                    return key.is_a?(String) ? "[#{key.to_json}]" : "[#{key}]"
                end

                count > 1 ? "[#{index}]" : ''
            end

        end

    end

end
