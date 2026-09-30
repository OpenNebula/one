# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
#--------------------------------------------------------------------------- #

module OneKS

    # Compiles an immutable catalogue chart into one VM-executed HelmChart plan.
    class ApplicationPlan

        # Validates the effective coordinates used to build an application plan.
        class InstallationSchema < Dry::Validation::Contract

            params do
                required(:release_name).filled(:string)
                required(:target_namespace).filled(:string)
                required(:create_namespace).filled(:bool)
                optional(:user_inputs_values).hash
            end

            rule(:release_name) do
                next unless key?
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

            rule(:target_namespace) do
                next unless key?
                next if ODS::RequestHelper.rfc1123_name?(value)

                key.failure(ODS::RequestHelper::RFC1123_ERROR)
            end

        end

        NAMESPACE     = 'kube-system'
        HELM_TIMEOUT  = '1800s'
        BACKOFF_LIMIT = 3

        class << self

            # Compiles every Kubernetes resource required to submit an application.
            # @param chart [Chart] Resolved root chart definition
            # @param installation [Hash] Release coordinates and validated input values
            # @return [Hash, OpenNebula::Error] Compiled application and resources
            def compile(chart:, installation:)
                values = safe_values(chart['defaultValuesContent'].to_s)
                return values if OpenNebula.is_error?(values)

                dependency_plans = compile_dependencies(chart)
                return dependency_plans if OpenNebula.is_error?(dependency_plans)

                root_plan = build_root_plan(chart, installation, values)

                { :script => compile_apply_script(root_plan, dependency_plans) }
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Invalid application plan: cannot compile application: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Resolves one immutable chart with the installation coordinates and inputs.
            # @param chart [Chart] Immutable root chart definition
            # @param installation [Hash] Release coordinates and validated input values
            # @return [Chart, OpenNebula::Error] Resolved chart or validation error
            def resolve(chart:, installation:)
                chart.resolve(
                    installation.fetch(:user_inputs_values, {}).merge(
                        :chartId => chart.id,
                        :releaseName => installation.fetch(:release_name),
                        :targetNamespace => installation.fetch(:target_namespace),
                        :createNamespace => installation.fetch(:create_namespace)
                    )
                )
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Invalid application plan: cannot resolve application: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Resolves an installation and verifies that its execution plan compiles.
            # @param chart [Chart] Immutable root chart definition
            # @param installation [Hash] Release coordinates and validated input values
            # @return [true, OpenNebula::Error] true when the installation is valid
            def validate(chart:, installation:)
                validation = InstallationSchema.new.call(installation)
                return OpenNebula::Error.new(
                    {
                        'message' => 'Invalid application installation',
                        'context' => validation.errors.to_h
                    },
                    OpenNebula::Error::EACTION
                ) if validation.failure?

                resolved_chart = resolve(:chart => chart, :installation => installation)
                return resolved_chart if OpenNebula.is_error?(resolved_chart)

                result = compile(
                    :chart => resolved_chart,
                    :installation => installation
                )
                return result if OpenNebula.is_error?(result)

                true
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Invalid application plan: cannot validate application: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Builds the one-shot deletion plan from the current chart catalogue.
            def delete_script(release_name:, chart_id:, target_namespace:)
                chart = Chart.get(chart_id)
                return chart if OpenNebula.is_error?(chart)

                dependency_plans = compile_dependencies(chart)
                return dependency_plans if OpenNebula.is_error?(dependency_plans)

                chart = chart.resolve(
                    {
                        :releaseName     => release_name,
                        :targetNamespace => target_namespace
                    },
                    :strict => false
                )

                root_plan = {
                    'release'      => { 'releaseName' => release_name },
                    'preInstall'   => chart['preInstall'],
                    'postInstall'  => chart['postInstall'],
                    'preUninstall' => chart['preUninstall']
                }
                steps = []
                (dependency_plans + [root_plan]).reverse_each do |plan|
                    append_plan_delete(steps, plan)
                end
                render_script(steps, :install => false)
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Invalid application plan: cannot compile deletion: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            private

            def helm_chart_manifest(release, parent)
                release_name = release.fetch('releaseName')
                repository = release['repositoryURL'].to_s
                repository = nil if repository.empty?

                {
                    'apiVersion' => 'helm.cattle.io/v1',
                    'kind' => 'HelmChart',
                    'metadata' => {
                        'name' => release_name,
                        'namespace' => NAMESPACE,
                        'labels' => { 'oneks.opennebula.io/managed' => 'true' },
                        'annotations' => {
                            'oneks.opennebula.io/release-name' => release_name,
                            'oneks.opennebula.io/state' => 'installing',
                            'oneks.opennebula.io/parent' => parent
                        }.compact
                    },
                    'spec' => {
                        'chart' => release.fetch('chart'),
                        'version' => release.fetch('version'),
                        'targetNamespace' => release.fetch('targetNamespace'),
                        'createNamespace' => release.fetch('createNamespace'),
                        'valuesContent' => release.fetch('valuesContent'),
                        'repo' => repository,
                        'authSecret' => release['authSecret'],
                        'backOffLimit' => BACKOFF_LIMIT,
                        'failurePolicy' => 'abort'
                    }.compact
                }
            end

            def compile_apply_script(root_plan, dependency_plans)
                steps = []
                parent = root_plan.fetch('release').fetch('releaseName')

                dependency_plans.each do |plan|
                    append_plan_install(steps, plan, parent)
                end
                append_plan_install(steps, root_plan, nil)

                render_script(steps, :install => true)
            end

            def append_plan_install(steps, plan, parent)
                manifest = helm_chart_manifest(plan.fetch('release'), parent)
                release_name = manifest.dig('metadata', 'name')

                append_operation_start(steps, release_name, parent)
                append_steps(steps, plan['preInstall'])
                steps << "CURRENT_STEP=#{shell("Install Helm chart #{release_name}")}"
                steps << manifest_command(
                    "apply_chart #{shell(release_name)} #{HELM_TIMEOUT}",
                    manifest
                )
                append_steps(steps, plan['postInstall'])
                append_operation_end(steps)
            end

            def append_operation_start(steps, release_name, parent)
                name = operation_name(release_name)
                marker = {
                    'apiVersion' => 'v1',
                    'kind' => 'ConfigMap',
                    'metadata' => {
                        'name' => name,
                        'namespace' => NAMESPACE,
                        'labels' => {
                            'oneks.opennebula.io/managed' => 'true',
                            'oneks.opennebula.io/operation' => 'application'
                        },
                        'annotations' => {
                            'oneks.opennebula.io/release-name' => release_name,
                            'oneks.opennebula.io/parent' => parent,
                            'oneks.opennebula.io/state' => 'installing'
                        }.compact
                    }
                }

                steps << "CURRENT_OPERATION=#{shell(name)}\n" \
                         "CURRENT_RELEASE=#{shell(release_name)}"
                steps << manifest_command('k apply -f -', marker)
            end

            def append_operation_end(steps)
                steps << 'k -n "$HELM_NAMESPACE" delete "configmap/$CURRENT_OPERATION" ' \
                         '--ignore-not-found=true --wait=false || true'
                steps << "CURRENT_OPERATION=\nCURRENT_RELEASE=\nCURRENT_STEP="
            end

            def render_script(steps, install:)
                template = Chart.script_content('helmchart-plan.sh.erb')
                ERB.new(template, :trim_mode => '-').result_with_hash(
                    :install        => install,
                    :helm_namespace => shell(NAMESPACE),
                    :steps          => steps.join("\n")
                )
            end

            # Appends install actions without reordering them.
            def append_steps(steps, actions)
                Array(actions).each do |action|
                    steps << "CURRENT_STEP=#{shell(action.fetch('name'))}"
                    action_type = ['apply', 'wait', 'patch', 'delete', 'shell'].find do |type|
                        action[type]
                    end

                    case action_type
                    when 'apply'
                        steps << manifest_command('k apply -f -', action.fetch('apply'))
                    when 'wait'
                        steps << wait_command(action.fetch('wait'))
                    when 'patch'
                        steps << patch_command(action.fetch('patch'))
                    when 'delete'
                        steps << delete_command(action.fetch('delete'))
                    when 'shell'
                        steps << action.fetch('shell')
                    else
                        raise KeyError, "unknown install step #{action.fetch('name').inspect}"
                    end
                end
            end

            def wait_command(wait)
                condition = wait.fetch('condition', '').to_s
                condition = condition.empty? ? 'create' : "condition=#{shell(condition)}"

                "k #{namespace_option(wait)}wait --for=#{condition} " \
                    "#{resource_reference(wait)} --timeout=#{shell(wait.fetch('timeout'))}"
            end

            def patch_command(patch)
                content = patch.fetch('content')
                content = JSON.generate(content) unless content.is_a?(String)

                "k #{namespace_option(patch)}patch #{resource_reference(patch)} " \
                    "--type=#{shell(patch.fetch('type', 'merge'))} -p #{shell(content)}"
            end

            def delete_command(resource)
                timeout = resource['timeout']
                timeout = timeout ? " --timeout=#{shell(timeout)}" : ''

                "k #{namespace_option(resource)}delete #{resource_reference(resource)} " \
                    "--ignore-not-found=#{resource.fetch('ignoreNotFound', true)} " \
                    "--wait=#{resource.fetch('wait', true)}#{timeout}"
            end

            def namespace_option(resource)
                namespace = resource.fetch('metadata').fetch('namespace', '').to_s
                namespace.empty? ? '' : "-n #{shell(namespace)} "
            end

            def resource_reference(resource)
                name = resource.fetch('metadata').fetch('name')
                "#{shell(resource.fetch('kind'))}/#{shell(name)}"
            end

            def append_plan_delete(steps, plan)
                release_name = plan.fetch('release').fetch('releaseName')

                steps << "k -n #{NAMESPACE} delete " \
                         "configmap/#{shell(operation_name(release_name))} " \
                         '--ignore-not-found=true --wait=true'
                append_apply_cleanup(steps, plan['postInstall'])
                append_steps(steps, plan['preUninstall'])
                append_chart_delete(steps, release_name)
                append_apply_cleanup(steps, plan['preUninstall'])
                append_apply_cleanup(steps, plan['preInstall'])
            end

            def operation_name(release_name)
                "oneks-op-#{Chart.resource_name_prefix(release_name)}"
            end

            def append_apply_cleanup(steps, actions)
                Array(actions).reverse_each do |action|
                    next unless action['apply']
                    next if action['retain']

                    resource = action.fetch('apply')
                    steps << delete_command(
                        resource.merge(
                            'ignoreNotFound' => true,
                            'wait' => false
                        )
                    )
                end
            end

            def append_chart_delete(steps, release)
                chart = "helmchart/#{shell(release)}"

                steps << <<~SH.chomp
                    if k -n #{NAMESPACE} get #{chart} >/dev/null 2>&1; then
                        k -n #{NAMESPACE} annotate --overwrite #{chart} \\
                            oneks.opennebula.io/state=deleting >/dev/null
                        k -n #{NAMESPACE} delete #{chart} \\
                            --wait=true --timeout=#{HELM_TIMEOUT}
                    fi
                SH
            end

            # Emits one quoted heredoc so Kubernetes manifests remain readable
            # and are never interpreted by the shell.
            def manifest_command(command, resource)
                yaml = resource.to_yaml
                delimiter = "ONEKS_MANIFEST_#{Digest::SHA256.hexdigest(yaml)[0, 16].upcase}"
                delimiter = "#{delimiter}_" while yaml.each_line.any? do |line|
                    line.chomp == delimiter
                end

                "#{command} <<'#{delimiter}'\n#{yaml}#{delimiter}"
            end

            def shell(value)
                Shellwords.escape(value.to_s)
            end

            # Builds the internal root execution specification.
            # @param chart [Chart] Resolved root chart definition
            # @param installation [Hash] Root installation coordinates
            # @param values [Hash] Parsed Helm values
            # @return [Hash] Root execution specification
            def build_root_plan(chart, installation, values)
                release = release_spec(chart, installation, values)
                if chart['authSecret']
                    release['authSecret'] = { 'name' => chart['authSecret'] }
                end

                plan = {
                    'release' => release
                }
                plan['preInstall'] = chart['preInstall'] if chart['preInstall']
                plan['postInstall'] = chart['postInstall'] if chart['postInstall']
                plan
            end

            # Builds the Helm release part of an application plan.
            # @param chart [Chart] Chart definition to translate
            # @param installation [Hash] Release coordinates
            # @param values [Hash] Parsed Helm values
            # @return [Hash] Helm release specification
            def release_spec(chart, installation, values)
                {
                    'repositoryURL'   => chart['repo'].to_s,
                    'chart'           => chart['chart'],
                    'version'         => chart['version'],
                    'releaseName'     => installation.fetch(:release_name),
                    'targetNamespace' => installation.fetch(:target_namespace),
                    'createNamespace' => installation.fetch(:create_namespace),
                    'valuesContent'   => serialize_values(values)
                }
            end

            # Compiles every transitive dependency in installation order.
            # @param root [Chart] Root application definition
            # @return [Array<Hash>, OpenNebula::Error] Ordered dependency plans
            def compile_dependencies(root)
                root.dependencies_in_installation_order.map do |chart|
                    plan = build_dependency_plan(chart)
                    return plan if OpenNebula.is_error?(plan)

                    plan
                end
            rescue KeyError => e
                OpenNebula::Error.new(
                    "Invalid application plan: invalid dependency plan: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Compiles one dependency after all the charts it requires.
            def build_dependency_plan(chart)
                defaults = chart.install_defaults
                installation = {
                    :release_name => defaults.fetch('releaseName'),
                    :target_namespace => defaults.fetch('targetNamespace'),
                    :create_namespace => defaults.fetch('createNamespace'),
                    :user_inputs_values => defaults
                }
                resolved_chart = resolve(
                    :chart => chart,
                    :installation => installation
                )
                return resolved_chart if OpenNebula.is_error?(resolved_chart)

                values = safe_values(resolved_chart['defaultValuesContent'].to_s)
                return values if OpenNebula.is_error?(values)

                release = release_spec(resolved_chart, installation, values)
                plan = {
                    'release' => release
                }
                if resolved_chart['preInstall']
                    plan['preInstall'] = resolved_chart['preInstall']
                end
                if resolved_chart['postInstall']
                    plan['postInstall'] = resolved_chart['postInstall']
                end
                if resolved_chart['preUninstall']
                    plan['preUninstall'] = resolved_chart['preUninstall']
                end
                plan
            end

            # Parses catalogue Helm values as a YAML mapping.
            # @param content [String] YAML values content
            # @return [Hash, OpenNebula::Error] Parsed values or validation error
            def safe_values(content)
                return {} if content.strip.empty?

                values = YAML.safe_load(content, :aliases => false) || {}
                return values if values.is_a?(Hash)

                OpenNebula::Error.new(
                    'Invalid application plan: valuesContent must contain an object',
                    OpenNebula::Error::EACTION
                )
            rescue Psych::Exception => e
                OpenNebula::Error.new(
                    "Invalid application plan: valuesContent must be valid YAML: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Serializes parsed Helm values without a YAML document marker.
            # @param values [Hash] Parsed Helm values
            # @return [String] Controller valuesContent
            def serialize_values(values)
                return '' if values.empty?

                YAML.dump(values).delete_prefix("---\n")
            end

        end

    end

end
