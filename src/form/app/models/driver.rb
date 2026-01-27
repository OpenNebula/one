# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

    # OneForm Driver class
    class Driver

        attr_reader :body

        DRIVER_ATTRS = [
            'name',
            'description',
            'source',
            'state',
            'version',
            'fireedge',
            'connection',
            'connection_values',
            'user_inputs',
            'user_inputs_values',
            'deployment_confs'
        ]

        MERGE_ATTRS = [
            'name',
            'description',
            'connection_values',
            'user_inputs_values'
        ]

        STR_STATES = {
            :enabled  => 'ENABLED',
            :disabled => 'DISABLED',
            :error    => 'ERROR',
            :unknown  => 'UNKNOWN'
        }

        def initialize(body)
            @body = body.transform_keys(&:to_s)

            @body.each do |key, _|
                next unless DRIVER_ATTRS.include?(key)

                self.class.define_method(key) do
                    @body[key]
                end

                self.class.define_method("#{key}=") do |new_value|
                    @body[key] = new_value
                end
            end
        end

        def to_json(opts = {})
            @body.to_json(opts)
        end

        def enable?
            state == STR_STATES[:enabled]
        end

        # Merges the provided attributes into the current driver body.
        # Only attributes listed in MERGE_ATTRS are considered; all others
        # are ignored.
        #
        # @param [Hash] merge_body a hash of attributes to merge into the driver
        def merge(merge_body)
            merge_body.each do |key, value|
                next unless MERGE_ATTRS.include?(key)

                @body[key] = value
            end
        end

        # Adds default values to user inputs if not already set.
        #
        # @param [Array<Hash>] inputs list of input definitions
        # @param [Hash] values user-provided values keyed by input name
        # @return [Hash, OpenNebula::Error] updated values hash or an error if values is not a Hash
        def add_defaults(inputs, values)
            return if inputs.nil? || inputs.empty?

            return OpenNebula::Error.new(
                'User input values must be a Hash',
                OpenNebula::Error::EINTERNAL
            ) unless values.is_a?(Hash)

            inputs.each do |input|
                if input.key?(:default)
                    values[input[:name]] ||= input[:default]
                end
            end

            values
        end

        # Builds the body for provider creation.
        # Merges connection defaults with user values and extracts the
        # required provider attributes from the driver definition.
        #
        # @return [Hash, OpenNebula::Error] provider body, or an
        #   OpenNebula::Error if defaults could not be applied
        def connection_body
            connection        = @body['connection'] || {}
            connection_values = @body['connection_values'] || {}

            rc = add_defaults(connection, connection_values)
            return rc if OpenNebula.is_error?(rc)

            body = OneForm::Provider::PROVIDER_ATTRS.each_with_object({}) do |attr, hash|
                value = case attr
                        when 'driver'
                            File.basename(@body['source'])
                        when 'connection'
                            @body['connection_values']
                        else
                            @body[attr]
                        end

                hash[attr] = value if value
            end

            body['user_inputs']        = connection
            body['user_inputs_values'] = connection_values

            body
        end

        # Builds the provision body for creating a provision.
        # Looks up the deployment configuration by name, applies default
        # values to user inputs, and extracts the required provision
        # attributes from the driver definition.
        #
        # @param [String] deployment_name the name of the deployment inventory
        # @return [Hash, OpenNebula::Error] provision body, or an
        #   OpenNebula::Error if the deployment is not found or defaults
        #   cannot be applied
        def deployment_body(deployment_name)
            deployment_conf = @body['deployment_confs'].find do |conf|
                conf[:inventory] == deployment_name
            end

            return OpenNebula::Error.new(
                "Deployment '#{deployment_name}' not found in driver configuration",
                OpenNebula::Error::ENOTDEFINED
            ) if deployment_conf.nil?

            deployment_inputs  = @body['user_inputs'] + (deployment_conf&.dig(:user_inputs) || [])
            user_inputs_values = @body['user_inputs_values'] || {}

            rc = add_defaults(deployment_inputs, user_inputs_values)
            return rc if OpenNebula.is_error?(rc)

            OneForm::Provision::PROVISION_ATTRS.each_with_object({}) do |attr, hash|
                value = case attr
                        when 'driver'
                            File.basename(@body['source'])
                        when 'deployment_file'
                            deployment_conf[:inventory]
                        when 'user_inputs'
                            deployment_inputs
                        when 'user_inputs_values'
                            user_inputs_values
                        when 'one_objects'
                            self.class.send(:deployment_objects,
                                            deployment_conf[:template_path],
                                            user_inputs_values)
                        when 'onedeploy_tags'
                            deployment_conf[:onedeploy_tags]
                        else
                            @body[attr]
                        end

                hash[attr] = value if value
            end
        end

        class << self

            # Returns all driver names, optionally filtered by state.
            #
            # @param [Symbol, nil] state to filter drivers
            # @return [Array<String>, OpenNebula::Error]
            def names(state = nil)
                ddir = Pathname.new(DRIVERS_PATH)
                return [] unless ddir.directory?

                ddir.children
                    .select(&:directory?)
                    .map(&:basename)
                    .map(&:to_s)
                    .select do |dname|
                        next true unless state

                        begin
                            get_driver_state(dname) == state
                        rescue StandardError
                            false
                        end
                    end
            rescue StandardError => e
                error_msg = "Error retrieving driver names: #{e.message}"

                Log.error(error_msg)
                return OpenNebula::Error.new(error_msg)
            end

            # Checks if a driver exists by name.
            #
            # @param [String] name driver name
            # @return [Boolean, OpenNebula::Error]
            def exists?(name)
                names.include?(name)
            rescue StandardError => e
                error_msg = "Error checking available drivers: #{e.message}"

                Log.error(error_msg)
                return OpenNebula::Error.new(error_msg)
            end

            # Returns the metadata for a specific driver by its name.
            #
            # @param [String] driver_name the name of the driver
            # @return [Hash, OpenNebula::Error, nil] the driver data, an OpenNebula error
            #                                        if something goes wrong, or nil if the
            #                                        driver is in unknown state
            def from_name(driver_name)
                driver_dir  = File.join(DRIVERS_PATH, driver_name)
                driver_file = File.join(driver_dir, 'driver.conf')

                return OpenNebula::Error.new(
                    "Error getting #{driver_name} OneForm driver",
                    OpenNebula::Error::ENO_EXISTS
                ) unless Dir.exist?(driver_dir)

                state = get_driver_state(driver_name)

                case state
                when :unknown
                    # Ignoring driver if we don't have state for it
                    return
                when :error
                    return error_body(driver_name)
                when :enabled, :disabled
                    raise "Driver configuration file #{driver_file} does not exist" \
                    unless File.exist?(driver_file)

                    conf = YAML.load_file(driver_file, :symbolize_names => true)

                    body = {
                        :name             => conf[:name],
                        :description      => conf[:description],
                        :source           => driver_dir,
                        :state            => STR_STATES[state],
                        :version          => conf[:version],
                        :fireedge         => conf[:fireedge],
                        :connection       => tf_inputs(driver_name, 'provider'),
                        :user_inputs      => tf_inputs(driver_name, 'variables'),
                        :deployment_confs => deployment_list(driver_name)
                    }

                    Driver.new(body)
                else
                    raise "Driver #{driver_name} is in an invalid state (#{state})"
                end
            rescue StandardError => e
                error_msg = "Error getting driver body: #{e.message}"
                Log.error(error_msg)

                return OpenNebula::Error.new(error_msg)
            end

            # Returns a list of all available drivers.
            #
            # @return [Array<Hash>, OpenNebula::Error] list of drivers, OpenNebula error otherwise
            def list
                ddir = Pathname.new(DRIVERS_PATH)
                return [] unless ddir.directory?

                ddir.children
                    .select(&:directory?)
                    .map    {|dir|   File.basename(dir.to_s) }
                    .map    {|dname| Driver.from_name(dname) }
                    .compact
            rescue StandardError => e
                error_msg = "Error listing drivers: #{e.message}"

                Log.error(error_msg)
                return OpenNebula::Error.new(error_msg)
            end

            # Tries to validate and enable all drivers from the local drivers path.
            #   - Iterates through each driver directory in DRIVERS_PATH.
            #   - Verifies each driver using `verify_driver`.
            #   - Sets the state to `:enabled` if valid, or `:error` otherwise.
            #   - Writes the state to a `.state` file using `set_driver_state`.
            #   - Logs and collects any verification or state write errors in `.error` file
            #
            # @return [Hash] Result of the sync operation:
            #   {
            #     :success => [Array<String>] names of successfully verified drivers,
            #     :failed  => [Array<Hash>]   failed drivers with :name and :error keys
            #   }
            #   or an OpenNebula::Error if a top-level error occurs
            def sync
                ddir    = Pathname.new(DRIVERS_PATH)
                results = { :success => [], :failed => [] }

                return results unless ddir.directory?

                ddir.children
                    .select(&:directory?)
                    .each do |dir|
                        dname = dir.basename.to_s

                        rc    = verify_driver(dname)
                        state = OpenNebula.is_error?(rc) ? :error : :enabled

                        if OpenNebula.is_error?(rc)
                            results[:failed] << { :name => dname, :error => rc.message }
                        else
                            results[:success] << dname
                        end

                        begin
                            # Avoid to enable disabled drivers
                            next if get_driver_state(dname) == :disabled && state == :enabled

                            set_driver_state(dname, state, true)
                        rescue StandardError => e
                            Log.error(
                                "Failed to write .state file for driver '#{dname}': #{e.message}"
                            )
                        end
                    end

                results
            rescue StandardError => e
                error_msg = "Error syncing drivers: #{e.message}"

                Log.error(error_msg)
                return OpenNebula::Error.new(error_msg)
            end

            # Enables the given driver by name if it exists in the drivers directory.
            # Sets the driver's state to `:enabled`.
            #
            # @param [String] driver_name the name of the driver to enable
            # @return [nil, OpenNebula::Error] nil on success, OpenNebula::Error otherwise
            def enable(driver_name)
                driver_dir = File.join(DRIVERS_PATH, driver_name)

                return OpenNebula::Error.new(
                    "Error getting #{driver_name} OneForm driver",
                    OpenNebula::Error::ENO_EXISTS
                ) unless Dir.exist?(driver_dir)

                set_driver_state(driver_name, :enabled)
            end

            # Disables the given driver by name if it exists in the drivers directory.
            # Sets the driver's state to `:disabled`.
            #
            # @param [String] driver_name the name of the driver to disable
            # @return [nil, OpenNebula::Error] nil on success, OpenNebula::Error otherwise
            def disable(driver_name)
                driver_dir = File.join(DRIVERS_PATH, driver_name)

                return OpenNebula::Error.new(
                    "Error getting #{driver_name} OneForm driver",
                    OpenNebula::Error::ENO_EXISTS
                ) unless Dir.exist?(driver_dir)

                set_driver_state(driver_name, :disabled)
            end

            private

            # --------------------------------------------------------
            # Driver file management
            # --------------------------------------------------------

            # Lists all deployment inventories for the given driver
            def deployment_list(driver_name)
                tmpl_dir = Pathname.new(
                    File.join(DRIVERS_PATH, driver_name, 'ansible', 'templates')
                )

                raise "Driver '#{driver_name}' does not exist or is missing 'ansible/templates'" \
                unless tmpl_dir.exist? && tmpl_dir.directory?

                tmpl_dir.children
                        .select {|file| file.file? && file.extname == '.j2' }
                        .map    {|file| deployment_info(file.to_s) }
            end

            # Parses metadata from a single deployment inventory file
            def deployment_info(inventory_path)
                raise "Deployment inventory '#{inventory_path}' does not exist" \
                unless File.exist?(inventory_path)

                inventory = File.read(inventory_path)

                # Extract the first yaml comment from the inventory
                yaml_block = inventory.match(/(?<=\{#).+?(?=\#\})/m)
                raise "OneForm metadata not found in #{inventory_path} file" if yaml_block.nil?

                content = yaml_block[0].strip
                conf    = YAML.safe_load(content, :symbolize_names => true)

                {
                    :name           => conf[:name],
                    :description    => conf[:description],
                    :inventory      => File.basename(inventory_path, '.*'),
                    :onedeploy_tags => conf[:onedeploy_tags],
                    :user_inputs    => conf[:user_inputs],
                    :template_path  => inventory_path,
                    :one_objects    => deployment_objects(inventory_path, nil)
                }.compact
            end

            # Extracts OpenNebula objects from a Jinja2 inventory deployment template
            def deployment_objects(inventory_path, user_inputs)
                raise "Inventory file '#{inventory_path}' does not exist" \
                unless File.exist?(inventory_path)

                template = File.read(inventory_path)

                # Remove comments and jinja tags
                template.gsub!(/\{#.*?#\}/m, '')
                template.gsub!(/^\s*#.*$/, '')
                template.gsub!(/{{.*?}}/, 'null') unless user_inputs
                template.gsub!(/\{%\s*.*?%\}/m, '')

                # Tries to load the file as yaml
                begin
                    data = YAML.safe_load(template, :symbolize_names => true)
                rescue Psych::SyntaxError => e
                    raise "Invalid YAML in inventory: #{e.message}"
                end

                # Extract templates for opennebula objects
                networks   = data.dig(:all, :vars, :vn)
                datastores = data.dig(:all, :vars, :ds, :config)

                raise 'Networks template definition not found' if networks.nil?
                raise 'Datastores template definition not found' if datastores.nil?

                {
                    :cluster => {},
                    :hosts => [],
                    :networks => networks.map do |name, config|
                        {
                            :id => nil,
                            :name => name,
                            :template => replace_user_inputs!(config[:template], user_inputs)
                        }
                    end,
                    :datastores => (datastores || {}).flat_map do |_, ds_info|
                        ds_info.map do |name, config|
                            {
                                :id => nil,
                                :name => name,
                                :template => replace_user_inputs!(config[:template], user_inputs)
                            }
                        end
                    end
                }
            end

            def replace_user_inputs!(template, user_inputs)
                return {} unless template
                return template unless user_inputs

                token_regexp = /\{\{\s*user_inputs\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/

                iterator = lambda do |element|
                    case element
                    when Hash
                        element.each { |k,v| element[k] = iterator.call(v) }
                    when Array
                        element.map! { |v| iterator.call(v) }
                    when String
                        element.gsub(token_regexp) do
                            key = Regexp.last_match(1)
                            user_inputs.key?(key) ? user_inputs[key].to_s : "null"
                        end
                    else # Integers,...
                        element
                    end
                end

                iterator.call(template)
                template
            end

            # Extracts user input variables from Terraform files,
            # including any associated validation rules
            def tf_inputs(driver_name, vars_path, keys = nil)
                keys            = ['variable'] if keys.nil? || keys.empty?
                tf_dir          = File.join(DRIVERS_PATH, driver_name, 'terraform')
                vars_file       = File.join(tf_dir, "#{vars_path}.tf")
                validators_file = File.join(tf_dir, 'validators.tf')

                raise "Driver '#{driver_name}' does not exist or is missing " \
                    "terraform/#{vars_path}.tf" unless File.exist?(vars_file)

                vars       = load_hcl_file(vars_file, keys)
                validators = load_hcl_file(validators_file, ['locals', 'validators'])

                vars.map do |var_name, values|
                    normalized_values = normalize_variable_type(values)
                    match = (validators[var_name] || {}).dup

                    {
                        :name        => var_name,
                        :description => normalized_values['description'] || nil,
                        :type        => normalized_values['type'].to_s.downcase,
                        :default     => normalized_values['default'],
                        :mandatory   => normalized_values['default'].nil?,
                        :match       => match.empty? ? nil : match
                    }.compact
                end
            end

            # Loads and parses specific keys from a HCL file
            def load_hcl_file(path, keys)
                return {} unless File.exist?(path)

                content = File.read(path)
                content = content.lines.reject {|line| line.include?('var.') }.join

                HclParser.load(content).dig(*keys) || {}
            rescue StandardError => e
                Log.error("Error loading HCL file #{path}: #{e.message}")
                {}
            end

            # Converts variable types and normalizes default values
            def normalize_variable_type(value)
                case value['type']
                when 'number'
                    if value['default'].is_a?(String)
                        value['default'] = value['default'].to_i
                    end
                when 'bool'
                    if value['default'].is_a?(String)
                        value['default'] = value['default'].downcase == 'true'
                    end
                end

                value
            end

            # --------------------------------------------------------
            # Driver states and verifications
            # --------------------------------------------------------

            # Returns the path to the driver's .state file.
            def state_file(driver_name)
                File.join(DRIVERS_PATH, driver_name, '.state')
            end

            # Returns the path to the driver's .error file.
            def error_file(driver_name)
                File.join(DRIVERS_PATH, driver_name, '.error')
            end

            # Retrieves the current state of the driver as a symbol
            def get_driver_state(driver_name)
                if File.exist?(state_file(driver_name))
                    state_str = File.read(state_file(driver_name)).strip

                    raise "Invalid state '#{state_str}' found for driver '#{driver_name}'" \
                    unless STR_STATES.values.include?(state_str)

                    STR_STATES.key(state_str)
                else
                    :unknown
                end
            end

            # Sets the driver's state, optionally forcing the update
            def set_driver_state(driver_name, new_state, force = false)
                raise "State '#{new_state}' does not match any valid state for drivers" \
                unless STR_STATES.keys.include?(new_state)

                # Force state when sync / verifying the driver
                return File.write(state_file(driver_name), STR_STATES[new_state]) if force

                state     = get_driver_state(driver_name)
                alt_state = new_state == :enabled ? :disabled : :enabled

                case state
                when alt_state
                    File.write(state_file(driver_name), STR_STATES[new_state])
                when new_state
                    OpenNebula::Error.new("Driver #{driver_name} is already #{new_state}")
                when :unknown, :error
                    OpenNebula::Error.new(
                        "Drivers in #{STR_STATES[state]} state cannot be changed. Please sync " \
                        "OneForm drivers before changing the state of the #{driver_name} driver"
                    )
                else
                    OpenNebula::Error.new(
                        "Drivers in #{STR_STATES[state]} state cannot be " \
                        "changed to #{STR_STATES[new_state]}"
                    )
                end
            rescue StandardError => e
                OpenNebula::Error.new("Error updating driver state: #{e.message}")
            end

            # Write an error message to the driver's .error file
            def set_driver_error(driver_name, error_msg)
                File.write(error_file(driver_name), error_msg)
            end

            # Return the error message from the driver's .error file, or nil if not present
            def get_driver_error(driver_name)
                return unless File.exist?(error_file(driver_name))

                File.read(error_file(driver_name)).strip
            end

            # Builds a hash representing the driver's error state and message
            def error_body(driver_name)
                ddir  = File.join(DRIVERS_PATH, driver_name)
                error = File.read(error_file(driver_name)) if File.exist?(error_file(driver_name))

                {
                    :name      => driver_name,
                    :source    => ddir,
                    :state     => STR_STATES[:error],
                    :error_msg => error
                }.compact
            end

            # Verifies that the required files and structure exist for a driver
            def verify_driver(driver_name)
                path = File.join(DRIVERS_PATH, driver_name)

                raise "Path '#{path}' does not exist or is not a directory" \
                unless File.directory?(path)

                # === Required: driver.conf
                assert_file_exists(File.join(path, 'driver.conf'))

                # === Required: terraform files
                terraform_dir = File.join(path, 'terraform')
                assert_dir_exists(terraform_dir)

                [
                    'main.tf',
                    'outputs.tf',
                    'provider.tf',
                    'variables.tf'
                ].each do |fname|
                    assert_file_exists(File.join(terraform_dir, fname))
                end

                # === Required: ansible files
                ansible_dir = File.join(path, 'ansible')
                assert_dir_exists(ansible_dir)

                [
                    'ansible.cfg',
                    'inventory.yaml',
                    'site.yaml'
                ].each do |fname|
                    assert_file_exists(File.join(ansible_dir, fname))
                end

                templates_dir = File.join(ansible_dir, 'templates')

                assert_dir_exists(templates_dir)
                raise "'ansible/templates' must not be empty" if Dir.empty?(templates_dir)

                # === Validate templates metadata
                Dir.glob(File.join(templates_dir, '*.j2')).each do |template_path|
                    template = File.read(template_path)

                    # Get YAML block from template between `{# ... #}`
                    yaml_block = template.match(/(?<=\{#).+?(?=\#\})/m)

                    raise "OneForm metadata block not found in template: #{template_path}" \
                        if yaml_block.nil?
                end

                # === Optional: elastic
                elastic_dir = File.join(path, 'elastic')

                if File.directory?(elastic_dir) && Dir.empty?(elastic_dir)
                    raise "'elastic' directory must not be empty"
                end

                # === Optional: ipam
                ipam_dir = File.join(path, 'ipam')

                if File.directory?(ipam_dir)
                    [
                        'allocate_address',
                        'free_address',
                        'get_address',
                        'register_address_range',
                        'unregister_address_range'
                    ].each do |script|
                        assert_file_exists(File.join(ipam_dir, script))
                    end

                    # Create symlinks to ipam remotes folder
                    create_symlinks(driver_name)
                end

                # Try to generate the driver body
                rc = from_name(driver_name)
                raise rc if OpenNebula.is_error?(rc)

                # Passed all checks
                true
            rescue StandardError => e
                set_driver_state(driver_name, :error, true)
                set_driver_error(driver_name, e.message)
                return OpenNebula::Error.new(e.message)
            end

            # Creates symbolic links for the driver's IPAM files
            def create_symlinks(driver_name)
                ipam_path  = File.join(DRIVERS_PATH, driver_name, 'ipam')
                target_dir = File.join(VAR_LOCATION, 'remotes', 'ipam', driver_name)

                return unless Dir.exist?(ipam_path)

                FileUtils.mkdir_p(target_dir)

                Dir.glob("#{ipam_path}/*").each do |file|
                    file_name   = File.basename(file)
                    target_link = File.join(target_dir, file_name)

                    # Clean directory
                    FileUtils.rm(target_link) \
                    if File.symlink?(target_link) || File.exist?(target_link)

                    FileUtils.ln_s(file, target_link)

                    Log.debug("Created symlink: #{target_link} -> #{file}")
                end
            end

            # Ensures the given file exists, raises error if missing
            def assert_file_exists(file)
                raise "Missing file: #{file}" unless File.file?(file)
            end

            # Ensures the given directory exists, raises error if missing.
            def assert_dir_exists(dir)
                raise "Missing directory: #{dir}" unless File.directory?(dir)
            end

        end

    end

end
