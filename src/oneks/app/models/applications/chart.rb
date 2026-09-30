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

module OneKS

    # Chart definition loaded from the filesystem catalogue.
    class Chart

        COMP         = 'CHT'
        CHARTS_DIR   = File.join(ONEKS_SPEC_DIR, 'charts')
        CATEGORIES   = ['applications', 'components']
        RELEASE_NAME = /\A[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\z/

        attr_reader :attributes, :category, :source

        class << self

            # Reserve 23 characters for resource suffixes within
            # Kubernetes' 63-character resource-name limit.
            def resource_name_prefix(release_name)
                return release_name if release_name.length <= 40

                "#{release_name[0, 29]}-#{Digest::SHA256.hexdigest(release_name)[0, 10]}"
            end

            # Atomically loads every valid chart definition into the catalogue
            # @param directory [String] Root directory containing chart definitions
            # @return [true, OpenNebula::Error] true when the catalogue is loaded
            def load!(directory: CHARTS_DIR)
                paths = Dir.glob(File.join(directory, '**', '*.yaml')).sort

                return OpenNebula::Error.new(
                    "Charts location '#{directory}' not found", OpenNebula::Error::EACTION
                ) unless Dir.exist?(directory)

                return OpenNebula::Error.new(
                    "No charts found in #{directory}", OpenNebula::Error::EACTION
                ) if paths.empty?

                charts = paths.filter_map do |path|
                    chart = load_file(path, directory)
                    next chart unless OpenNebula.is_error?(chart)

                    Log.warn(COMP, "Ignoring invalid chart definition: #{chart.message}")
                    nil
                end

                charts     = valid_catalogue(charts)
                @catalogue = charts.to_h {|chart| [chart.id, chart] }
                @catalogue_directory = directory

                true
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error loading charts from #{directory}: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Returns all valid definitions, including private components
            # @return [Array<Chart>, OpenNebula::Error] Loaded chart definitions
            def all
                catalogue = loaded_catalogue
                return catalogue if OpenNebula.is_error?(catalogue)

                catalogue.values
            end

            # Returns applications that may be selected directly through the API
            # @return [Array<Chart>, OpenNebula::Error] Public application definitions
            def list
                charts = all
                return charts if OpenNebula.is_error?(charts)

                charts.select(&:application?)
            end

            # Finds an application or component in the catalogue
            # @param id [String] Catalogue chart identifier
            # @return [Chart, OpenNebula::Error] Matching definition or not-found error
            def find(id)
                catalogue = loaded_catalogue
                return catalogue if OpenNebula.is_error?(catalogue)

                catalogue[id.to_s] || OpenNebula::Error.new(
                    "Chart #{id} not found", OpenNebula::Error::ENO_EXISTS
                )
            end

            # Finds an application that may be installed directly
            # @param id [String] Catalogue chart identifier
            # @return [Chart, OpenNebula::Error] Matching application or not-found error
            def get(id)
                chart = find(id)
                return chart if OpenNebula.is_error?(chart)
                return chart if chart.application?

                OpenNebula::Error.new("Chart #{id} not found", OpenNebula::Error::ENO_EXISTS)
            end

            # Clears the in-memory catalogue, primarily for isolated tests
            def reset!
                @catalogue = nil
                @catalogue_directory = nil
            end

            # Reads one executable template distributed with the chart catalogue.
            def script_content(name)
                raise "Invalid chart script name #{name.inspect}" unless
                    File.basename(name) == name

                directory = @catalogue_directory || CHARTS_DIR
                path = File.join(directory, 'scripts', name)
                raise "Chart script not found: #{path}" unless File.file?(path)

                File.read(path, :encoding => 'UTF-8')
            end

            private

            # Returns the loaded catalogue, loading it on first access
            # @return [Hash<String, Chart>, OpenNebula::Error] Catalogue indexed by chart ID
            def loaded_catalogue
                return @catalogue if @catalogue

                result = load!
                return result if OpenNebula.is_error?(result)

                @catalogue
            end

            # Reads, validates, and builds one chart definition
            # @param path [String] YAML definition path
            # @param directory [String] Root charts directory
            # @return [Chart, OpenNebula::Error] Parsed chart or validation error
            def load_file(path, directory)
                attributes = YAML.safe_load(
                    File.read(path, :encoding => 'UTF-8'), :aliases => false
                )

                return OpenNebula::Error.new(
                    "Invalid chart '#{path}': root must be an object", OpenNebula::Error::EACTION
                ) unless attributes.is_a?(Hash)

                validation = validate_attributes(attributes, path)
                return validation if OpenNebula.is_error?(validation)

                category = chart_category(path, directory)
                return category if OpenNebula.is_error?(category)

                new(attributes, :category => category.to_sym, :source => path)
            rescue Psych::Exception => e
                OpenNebula::Error.new(
                    "YAML error in chart '#{path}': #{e.message}", OpenNebula::Error::EACTION
                )
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error reading chart '#{path}': #{e.message}", OpenNebula::Error::EACTION
                )
            end

            # Determines whether a definition is an application or component
            # @param path [String] YAML definition path
            # @param directory [String] Root charts directory
            # @return [String, OpenNebula::Error] Category name or placement error
            def chart_category(path, directory)
                root     = File.expand_path(directory) + File::SEPARATOR
                relative = File.expand_path(path).delete_prefix(root)
                category = relative.split(File::SEPARATOR).first
                return category if CATEGORIES.include?(category)

                OpenNebula::Error.new(
                    "Invalid chart '#{path}': charts must be stored under " \
                    'applications or components',
                    OpenNebula::Error::EACTION
                )
            end

            # Validates one chart schema and its embedded declarative content
            # @param attributes [Hash] Parsed chart attributes
            # @param path [String] YAML definition path used in error messages
            # @return [true, OpenNebula::Error] true when the definition is valid
            def validate_attributes(attributes, path)
                schema = ChartSchema.new.call(attributes)

                return OpenNebula::Error.new(
                    "Invalid chart '#{path}' schema: #{schema.errors.to_h}",
                    OpenNebula::Error::EACTION
                ) if schema.failure?

                values = attributes.fetch('defaultValuesContent', '')

                unless values.strip.empty?
                    parsed_values = YAML.safe_load(values, :aliases => false)

                    return OpenNebula::Error.new(
                        "Invalid chart '#{path}': defaultValuesContent must contain an object",
                        OpenNebula::Error::EACTION
                    ) unless parsed_values.is_a?(Hash)
                end

                inputs = validate_user_inputs(attributes, path)
                return inputs if OpenNebula.is_error?(inputs)

                placeholders = placeholders_in(
                    attributes.reject {|key, _value| key.to_s == 'metadata' }
                )
                allowed      = ['chartId', 'releaseName', 'resourceNamePrefix',
                                'targetNamespace', 'createNamespace'] +
                               Array(attributes['userInputs']).map {|input| input['name'] }
                unknown      = placeholders - allowed

                return OpenNebula::Error.new(
                    "Invalid chart '#{path}': unknown placeholders #{unknown.join(', ')}",
                    OpenNebula::Error::EACTION
                ) unless unknown.empty?

                true
            rescue Psych::Exception => e
                OpenNebula::Error.new(
                    "Invalid chart '#{path}' embedded YAML: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Validates user input declarations with the common ODS schema
            # @param attributes [Hash] Parsed chart attributes
            # @param path [String] YAML definition path used in error messages
            # @return [true, OpenNebula::Error] true when every input is valid
            def validate_user_inputs(attributes, path)
                inputs = Array(attributes['userInputs'])
                schema = ODS::UserInputSchema.new
                names  = []

                inputs.each do |input|
                    return OpenNebula::Error.new(
                        "Invalid chart '#{path}': userInputs must contain objects",
                        OpenNebula::Error::EACTION
                    ) unless input.is_a?(Hash)

                    validation = schema.call(input)

                    return OpenNebula::Error.new(
                        "Invalid chart '#{path}' user input #{input['name']}: " \
                        "#{validation.errors.to_h}",
                        OpenNebula::Error::EACTION
                    ) unless validation.success?

                    name = input['name']

                    return OpenNebula::Error.new(
                        "Invalid chart '#{path}': duplicate user input #{name}",
                        OpenNebula::Error::EACTION
                    ) if names.include?(name)

                    names << name
                end

                true
            end

            # Recursively extracts placeholder names from a chart value
            # @param value [Object] Value or nested collection to inspect
            # @return [Array<String>] Unique placeholder names
            def placeholders_in(value)
                case value
                when Hash
                    value.flat_map do |key, item|
                        placeholders_in(key) + placeholders_in(item)
                    end.uniq
                when Array
                    value.flat_map {|item| placeholders_in(item) }.uniq
                when String
                    value.scan(/\$\{([^}]+)\}/).flatten.uniq
                else
                    []
                end
            end

            # Removes duplicate definitions and charts with invalid dependency graphs
            # @param charts [Array<Chart>] Individually valid chart definitions
            # @return [Array<Chart>] Definitions safe to expose through the catalogue
            def valid_catalogue(charts)
                duplicate_ids = charts.group_by(&:id).select do |_id, definitions|
                    definitions.size > 1
                end.keys

                duplicate_ids.each do |id|
                    sources = charts.select {|chart| chart.id == id }.map(&:source)

                    Log.warn(
                        COMP,
                        'Ignoring invalid chart definition: Duplicate chart id ' \
                        "#{id} in #{sources.join(', ')}"
                    )
                end

                charts = charts.reject {|chart| duplicate_ids.include?(chart.id) }

                loop do
                    index   = charts.to_h {|chart| [chart.id, chart] }
                    invalid = charts.filter_map do |chart|
                        reason = catalogue_error(chart, index)
                        [chart, reason] if reason
                    end

                    unless invalid.empty?
                        invalid.each do |_chart, reason|
                            Log.warn(COMP, "Ignoring invalid chart definition: #{reason}")
                        end

                        invalid_ids = invalid.map {|chart, _reason| chart.id }
                        charts = charts.reject {|chart| invalid_ids.include?(chart.id) }
                        next
                    end

                    cycle = dependency_cycle(index)

                    if cycle
                        cycle_ids = cycle.uniq

                        Log.warn(
                            COMP,
                            'Ignoring invalid chart definition: Chart dependency ' \
                            "cycle detected: #{cycle.join(' -> ')}"
                        )

                        charts = charts.reject {|chart| cycle_ids.include?(chart.id) }
                        next
                    end

                    invalid = charts.filter_map do |chart|
                        reason = dependency_release_error(chart, index)
                        [chart, reason] if reason
                    end

                    break if invalid.empty?

                    invalid.each do |_chart, reason|
                        Log.warn(COMP, "Ignoring invalid chart definition: #{reason}")
                    end

                    invalid_ids = invalid.map {|chart, _reason| chart.id }
                    charts = charts.reject {|chart| invalid_ids.include?(chart.id) }
                end

                charts
            end

            # Finds the first dependency validation error for a chart
            # @param chart [Chart] Definition whose dependencies are checked
            # @param index [Hash<String, Chart>] Definitions indexed by chart ID
            # @return [String, nil] Validation error or nil when dependencies are valid
            def catalogue_error(chart, index)
                chart.dependency_ids.each do |dependency_id|
                    dependency = index[dependency_id]
                    return "Chart #{chart.id} has unknown dependency #{dependency_id}" \
                        unless dependency

                    return "Chart #{chart.id} depends on application chart #{dependency_id}" \
                        if dependency.application?

                    defaults     = dependency.install_defaults
                    release_name = defaults['releaseName']

                    next if release_name.is_a?(String) &&
                            release_name.match?(RELEASE_NAME) &&
                            release_name.length <= 53 &&
                            defaults['targetNamespace'].is_a?(String) &&
                            [true, false].include?(defaults['createNamespace'])

                    return "Chart dependency #{dependency_id} requires " \
                           'valid installDefaults coordinates'
                end

                nil
            end

            # Finds a cycle in the dependency graph
            # @param index [Hash<String, Chart>] Definitions indexed by chart ID
            # @return [Array<String>, nil] Cycle path or nil when the graph is acyclic
            def dependency_cycle(index)
                visited = {}
                stack   = []

                visit = lambda do |chart|
                    return stack.drop_while {|id| id != chart.id } + [chart.id] \
                        if visited[chart.id] == :visiting
                    return if visited[chart.id] == :done

                    visited[chart.id] = :visiting
                    stack << chart.id

                    chart.dependency_ids.each do |dependency_id|
                        cycle = visit.call(index.fetch(dependency_id))
                        return cycle if cycle
                    end

                    stack.pop
                    visited[chart.id] = :done

                    nil
                end

                index.each_value do |chart|
                    cycle = visit.call(chart)
                    return cycle if cycle
                end

                nil
            end

            # Finds duplicate dependency release names in one transitive graph
            # @param chart [Chart] Root definition whose graph is checked
            # @param index [Hash<String, Chart>] Definitions indexed by chart ID
            # @return [String, nil] Validation error or nil when releases are unique
            def dependency_release_error(chart, index)
                releases = chart.ordered_dependencies(:catalogue => index).group_by do |dependency|
                    dependency.install_defaults.fetch('releaseName')
                end

                duplicate = releases.find {|_release_name, dependencies| dependencies.size > 1 }
                return unless duplicate

                "Chart #{chart.id} has duplicate dependency releaseName #{duplicate.first}"
            end

        end

        # Creates a chart definition from a detached copy of its attributes
        # @param attributes [Hash] Parsed declarative chart attributes
        # @param category [Symbol] Catalogue category
        # @param source [String, nil] Source YAML path
        def initialize(attributes, category:, source: nil)
            @attributes = Marshal.load(Marshal.dump(attributes))
            @category   = category
            @source     = source
        end

        # Returns the stable catalogue identifier
        # @return [String] Chart identifier
        def id
            attributes['id']
        end

        # Returns the human-readable chart name
        # @return [String] Name stored in chart metadata
        def name
            metadata['name']
        end

        # Returns presentation and descriptive chart metadata
        # @return [Hash] Metadata attributes
        def metadata
            attributes['metadata']
        end

        # Checks whether the chart can be selected through the public API
        # @return [Boolean] true for applications and false for components
        def application?
            category == :applications
        end

        # Reads a raw declarative chart attribute
        # @param key [String, Symbol] Attribute name
        # @return [Object, nil] Attribute value or nil when it is not defined
        def [](key)
            attributes[key.to_s]
        end

        # Returns the identifiers declared as direct dependencies
        # @return [Array<String>] Direct dependency chart IDs
        def dependency_ids
            Array(attributes['dependencies']).map {|dependency| dependency['chartId'] }
        end

        # Resolves direct dependency definitions from the global catalogue
        # @return [Array<Chart>] Direct dependency definitions
        def dependencies
            dependency_ids.map do |dependency_id|
                dependency = self.class.find(dependency_id)
                return dependency if OpenNebula.is_error?(dependency)

                dependency
            end
        end

        # Returns deduplicated transitive dependencies in installation order
        # @param catalogue [Hash<String, Chart>, nil] Optional catalogue used during loading
        # @return [Array<Chart>] Dependencies ordered before the charts that require them
        def dependencies_in_installation_order(catalogue: nil)
            visited = {}
            order   = []

            visit = lambda do |chart|
                chart.dependency_ids.each do |dependency_id|
                    next if visited[dependency_id]

                    dependency = catalogue&.fetch(dependency_id) || self.class.find(dependency_id)
                    visit.call(dependency)
                    visited[dependency_id] = true
                    order << dependency
                end
            end

            visit.call(self)
            order
        end

        alias ordered_dependencies dependencies_in_installation_order

        # Returns the internal installation coordinates for a component
        # @return [Hash] Installation defaults or an empty hash
        def install_defaults
            attributes.fetch('installDefaults', {})
        end

        # Returns cluster requirements declared by the chart.
        # @return [Array<String>] Deployment constraint identifiers
        def deployment_constraints
            attributes.fetch('deploymentConstraints', [])
        end

        # Returns the chart user input declarations
        # @return [Array<Hash>] User input definitions or an empty array
        def user_inputs
            attributes.fetch('userInputs', [])
        end

        # Applies catalogue defaults and validates values with ODS user-input rules
        # @param values [Hash] User-provided values indexed by input name
        # @return [Hash, OpenNebula::Error] Validated values or validation error
        def user_input_values(values)
            return OpenNebula::Error.new(
                {
                    'message' => 'Error validating chart user inputs',
                    'context' => 'user_input_values must be an object'
                },
                OpenNebula::Error::ENOTDEFINED
            ) unless values.is_a?(Hash)

            effective = values.to_h do |key, value|
                [key.to_sym, Marshal.load(Marshal.dump(value))]
            end

            user_inputs.each do |input|
                key = input.fetch('name').to_sym
                effective[key] = input['default'] if input.key?('default') && !effective.key?(key)
            end

            # ODS validates every declaration it receives. Optional inputs with
            # no value are therefore omitted from the validation view, while
            # mandatory, defaulted and explicitly supplied inputs keep using
            # the common ODS rules unchanged.
            validated_inputs = user_inputs.select do |input|
                key = input.fetch('name').to_sym

                input.fetch('mandatory', false) || effective.key?(key)
            end

            validation = ChartUserInputsSchema.new.call(
                :user_inputs => validated_inputs,
                :user_inputs_values => effective
            )

            return OpenNebula::Error.new(
                {
                    'message' => 'Error validating chart user inputs',
                    'context' => validation.errors.to_h
                },
                OpenNebula::Error::ENOTDEFINED
            ) if validation.failure?

            validation.to_h.fetch(:user_inputs_values)
        end

        # Returns the catalogue representation used by collection endpoints.
        # Arbitrary metadata is flattened into the public object while chart
        # identity fields remain authoritative on key collisions.
        # @return [Hash] Public catalogue summary
        def public_summary
            summary = metadata.merge(attributes.slice('id', 'repo', 'chart', 'version'))
            summary['user_inputs'] = user_inputs unless user_inputs.empty?

            summary
        end

        # Returns the compact identity embedded for one resolved dependency.
        # @return [Hash] Dependency identity
        def dependency_summary
            metadata.slice('name').merge(attributes.slice('id', 'repo', 'chart', 'version'))
        end

        # Returns the complete public chart definition. Internal dependency IDs
        # and userInputs are translated without mutating the loaded catalogue.
        # @return [Hash, OpenNebula::Error] Complete public definition
        def public_definition
            definition  = to_h
            metadata    = definition.delete('metadata')
            user_inputs = definition.delete('userInputs')
            definition.delete('dependencies')
            definition.delete('preInstall')
            definition.delete('postInstall')
            definition.delete('preUninstall')

            resolved_dependencies = dependencies
            return resolved_dependencies if OpenNebula.is_error?(resolved_dependencies)

            definition = metadata.merge(definition)
            definition['user_inputs']  = user_inputs
            definition['dependencies'] = resolved_dependencies.map(&:dependency_summary)
            definition
        end

        # Resolves coordinates and validated inputs
        # @param replacements [Hash] Placeholder names and replacement values
        # @return [Chart] Resolved chart definition
        def resolve(replacements, strict: true)
            values = replacements.to_h {|key, value| [key.to_s, value] }
            values['resourceNamePrefix'] = self.class.resource_name_prefix(
                values.fetch('releaseName').to_s
            ) if values.key?('releaseName')

            definition = to_h
            metadata   = definition.delete('metadata')
            definition = resolve_value(definition, values, strict)
            definition['metadata'] = metadata if metadata

            self.class.new(definition, :category => category, :source => source)
        end

        # Returns a mutable copy of the declarative attributes
        # @return [Hash] Deep copy of the chart definition
        def to_h
            Marshal.load(Marshal.dump(attributes))
        end

        private

        # Recursively replaces placeholders in a chart value
        # @param value [Object] Value or nested collection to resolve
        # @param replacements [Hash<String, Object>] Placeholder replacement values
        # @return [Object] Resolved copy of the value
        def resolve_value(value, replacements, strict)
            case value
            when Hash
                value.to_h do |key, nested|
                    [
                        resolve_value(key, replacements, strict),
                        resolve_value(nested, replacements, strict)
                    ]
                end
            when Array
                value.map {|nested| resolve_value(nested, replacements, strict) }
            when String
                match = value.match(/\A\$\{([^}]+)\}\z/)
                if match
                    return value unless strict || replacements.key?(match[1])

                    return Marshal.load(Marshal.dump(replacements.fetch(match[1])))
                end

                value.gsub(/\$\{([^}]+)\}/) do |placeholder|
                    key = Regexp.last_match(1)
                    next placeholder unless strict || replacements.key?(key)

                    replacements.fetch(key).to_s
                end
            else
                value
            end
        end

    end

end
