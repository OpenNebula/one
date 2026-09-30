# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Ap@ache License, Version 2.0 (the "License"); you may    #
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

    # Cluster class
    class Cluster < ODS::Document

        include ODS::StateMachine
        include ODS::Errorable
        include ODS::Jobable
        include ODS::Historyable

        attr_reader :client, :body, :tag

        COMP           = 'CLS'
        RESOURCE_NAME  = 'Kubernetes Cluster'
        TEMPLATE_TAG   = 'CLUSTER_BODY'
        DOCUMENT_TYPE  = 120
        DOCUMENT_ATTRS = [
            :name,
            :description,
            :state,
            :kubernetes_version,
            :target_kubernetes_version,
            :deployment,
            :control_plane,
            :node_groups,
            :features,
            :monitor_key,
            :applications,
            :observations,
            :historic,
            :registration_time
        ]

        # Attributes that can be modified during an user update
        UPDATE_ATTRS = [
            :name,
            :description
        ]

        ATTRIBUTE_CLASSES = {
            :applications => Application
        }

        EVENTS = {
            :change_state          => 'State changed',
            :control_plane_created => 'ControlPlane created',
            :control_plane_removed => 'ControlPlane removed',
            :node_group_added      => 'NodeGroup added',
            :node_group_removed    => 'NodeGroup removed'
        }

        state_machine(
            :initial => :PENDING,
            :transitions => {
                :PENDING      => [:PROVISIONING],
                :PROVISIONING => [:RUNNING, :PROVISIONING_FAILURE],
                :RUNNING      => [
                    :DEPROVISIONING, :SCALING, :UPGRADING,
                    :INSTALLING_APPLICATION, :DELETING_APPLICATION, :WARNING
                ],
                :SCALING                => [:RUNNING, :SCALING_FAILURE],
                :UPGRADING              => [:RUNNING, :UPGRADING_FAILURE],
                :INSTALLING_APPLICATION => [:RUNNING, :INSTALLING_APPLICATION_FAILURE],
                :DELETING_APPLICATION   => [:RUNNING, :DELETING_APPLICATION_FAILURE],
                :DEPROVISIONING         => [:DONE, :DEPROVISIONING_FAILURE],
                :DONE                   => [],
                :PROVISIONING_FAILURE   => [:PROVISIONING],
                :SCALING_FAILURE        => [:SCALING, :RUNNING],
                :UPGRADING_FAILURE      => [:UPGRADING, :RUNNING],
                :DEPROVISIONING_FAILURE => [:DEPROVISIONING],
                :INSTALLING_APPLICATION_FAILURE => [:INSTALLING_APPLICATION, :DELETING_APPLICATION],
                :DELETING_APPLICATION_FAILURE   => [:DELETING_APPLICATION],
                :WARNING => [:RUNNING],
                :ANY     => [:DEPROVISIONING, :DONE]
            }
        )

        RECOVER_STATES = {
            :PROVISIONING_FAILURE    => :PROVISIONING,
            :SCALING_FAILURE         => :SCALING,
            :UPGRADING_FAILURE       => :UPGRADING,
            :INSTALLING_APPLICATION_FAILURE => :INSTALLING_APPLICATION,
            :DELETING_APPLICATION_FAILURE   => :DELETING_APPLICATION,
            :DEPROVISIONING_FAILURE  => :DEPROVISIONING,
            :WARNING                 => :RUNNING
        }

        RECOVER_ACTIONS       = [:retry, :success, :failure, :delete_db]
        GROUP_RECOVER_ACTIONS = [:retry, :success, :failure]

        # Logs state changes validated by ODS::StateMachine
        def state=(new_state)
            previous = state

            super(new_state)
            return if previous == state

            Log.info(COMP, "Cluster #{id} changed state from #{previous} to #{state}", id)

            register_event(
                :change_state, :description => "State changed from #{previous} to #{state}"
            )

            clear_error unless RECOVER_STATES.key?(state)
        end

        # Prevents application passwords and registry tokens from being copied
        # from the private durable job context into the persisted error
        def set_error(message, opts: {}, **context)
            safe_opts = opts.reject {|key, _value| key.to_s == 'user_inputs_values' }
            super(message, :opts => safe_opts, **context)
        end

        # Reconciles the in-memory aggregate state when no lifecycle operation owns it.
        # Loading group documents, locking, persistence, and retries belong to ClusterLCM
        def reconcile_state!(groups:)
            return false if active_job
            return groups if OpenNebula.is_error?(groups)

            next_state = :DONE if groups.empty?
            next_state = :RUNNING if !groups.empty? && K8sGroup.all_running?(groups)

            unless next_state
                details = groups.map do |group|
                    "#{group.type} #{group.id}=#{group.state}"
                end.join(', ')

                message = "Cluster #{id} has group lifecycle state without a parent " \
                          "operation: #{details}"

                if running? || warning?
                    set_error(message, :opts => {}, :step => 'reconcile_state')
                    self.state = :WARNING if running?
                    return true
                end

                return OpenNebula::Error.new(message, OpenNebula::Error::EACTION)
            end

            return false if next_state == state

            self.state = next_state
            true
        end

        #------------------------------------------------------
        # Object, template & schema methods
        #------------------------------------------------------

        def initialize(client, id: nil, xml: nil)
            super(client, :state_path => [:@body, :state], :id => id, :xml => xml)
        end

        def self.create(client, body)
            cp_spec   = ControlPlane.build_spec(body[:spec])
            cp_family = ControlPlane.family_by_name(cp_spec[:family])

            return OpenNebula::Error.new(
                "Control plane family #{cp_spec[:family]} not found",
                OpenNebula::Error::ENO_EXISTS
            ) if cp_family.nil?

            return OpenNebula::Error.new(
                "Kubernetes version #{body[:kubernetes_version]} not valid. " \
                "Valid versions: #{cp_family[:supported_k8s_versions].join(', ')}",
                ODS::ResponseHelper::VALIDATION_EC
            ) unless cp_family[:supported_k8s_versions].include?(body[:kubernetes_version])

            rc = ControlPlane.validate_spec(cp_spec)
            return rc if OpenNebula.is_error?(rc)

            rc = OneKS::ClusterDeployment.validate(client, body[:deployment], cp_family)
            return rc if OpenNebula.is_error?(rc)

            cluster = new(client)
            rc      = cluster.allocate(body, cp_spec)

            if OpenNebula.is_error?(rc)
                rollback = rollback_create(cluster)

                return OpenNebula::Error.new(
                    "Error creating Cluster: #{rc.message}. Rollback failed: #{rollback.message}",
                    OpenNebula::Error::EACTION
                ) if OpenNebula.is_error?(rollback)

                return rc
            end

            cluster
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error creating Cluster: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        def uuid
            return unless control_plane

            if control_plane.respond_to?(:uuid)
                control_plane.uuid
            elsif control_plane.respond_to?(:[])
                control_plane[:uuid]
            end
        end

        def self.schema
            ClusterSchema.new
        end

        # Cluster-wide lifecycle facade used by public cluster operations
        def self.lcm
            OneKS::ClusterLCM.instance
        end

        #------------------------------------------------------
        # Document operations
        #------------------------------------------------------

        # Allocate a new cluster document
        def allocate(body, spec)
            features    = OneKS::Features.enabled
            monitor_key = MonitorPayload.generate_key if features[:monitor]

            template = {
                :state             => 'PENDING',
                :control_plane     => {},
                :node_groups       => [],
                :features          => features,
                :monitor_key       => monitor_key,
                :applications      => [],
                :observations      => [],
                :historic          => [],
                :registration_time => Time.now.to_i
            }.merge(body).merge(:features => features)

            rc = super(template)
            return rc if OpenNebula.is_error?(rc)

            # Avoid duplicate name and description in cp
            cplane_spec = spec.dup
            cplane_spec.delete(:description)
            cplane_spec.delete(:name)

            cplane = K8sGroup.create(
                :type    => OneKS::ControlPlane,
                :cluster => self,
                :spec    => cplane_spec
            )

            return cplane if OpenNebula.is_error?(cplane)

            self.control_plane = K8sGroup.basic_attrs(cplane)
            register_event(
                :control_plane_created,
                :description => "ControlPlane #{cplane.name} created"
            )
            update
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error allocating Cluster: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        def info(raw: false)
            # Skip dynamic definitions for attributes with custom accessors.
            super(:skip_methods => [:state, :features], :raw => raw)
        end

        # Optional features persisted for this Cluster. Missing keys and the
        # complete field in legacy documents both resolve to disabled
        def features
            persisted = @body&.fetch(:features, nil)
            persisted = {} unless persisted.is_a?(Hash)
            defaults  = OneKS::Features::DEFAULTS

            defaults.merge(persisted.transform_keys(&:to_sym)).slice(*defaults.keys)
        end

        def feature_enabled?(feature)
            features[feature.to_sym] == true
        end

        # Expand cluster references to include control plane and groups
        def expand_references!(plain: true)
            documents = group_documents
            return documents if OpenNebula.is_error?(documents)

            control_plane, node_groups = documents

            self.control_plane = plain ? control_plane&.plain_body : control_plane
            self.node_groups   = if plain
                                     node_groups.map(&:plain_body)
                                 else
                                     node_groups
                                 end
        rescue StandardError => e
            Log.error(COMP, "Error expanding Cluster elements: #{e.message}")
        end

        # Delete the cluster document
        def delete(force: false)
            references = groups

            return OpenNebula::Error.new(
                'Cannot delete a Cluster with existing groups', OpenNebula::Error::EACTION
            ) unless force || references.empty?

            if force
                references.each do |ref|
                    group = K8sGroup.new_from_id(@client, ref[:id])

                    if OpenNebula.is_error?(group)
                        next if group.errno == OpenNebula::Error::ENO_EXISTS

                        return group
                    end

                    rc = group.delete(:force => true)
                    return rc if OpenNebula.is_error?(rc)
                end
            end

            super()
        end

        # Change the owner and/or group of the cluster and its group documents
        def chown(uid, gid)
            rc = super(uid, gid)
            return rc if OpenNebula.is_error?(rc)

            groups.each do |ref|
                group = K8sGroup.new_from_id(@client, ref[:id])
                return group if OpenNebula.is_error?(group)

                rc = group.chown(uid, gid)
                return rc if OpenNebula.is_error?(rc)
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error changing Cluster ownership: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        # Change the group of the cluster and its group documents
        def chgrp(gid)
            chown(-1, gid)
        end

        # Change the permissions of the cluster and its group documents
        def chmod_octet(octet)
            rc = super(octet)
            return rc if OpenNebula.is_error?(rc)

            groups.each do |ref|
                group = K8sGroup.new_from_id(@client, ref[:id])
                return group if OpenNebula.is_error?(group)

                group_rc = group.chmod_octet(octet)
                return group_rc if OpenNebula.is_error?(group_rc)
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error changing Cluster permissions: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        #------------------------------------------------------
        # Cluster actions
        #------------------------------------------------------

        # Provision a cluster, which implies the CP provisioning
        def provision(actor:)
            result = self.class.lcm.request(id, actor) do |cluster|
                cplane_id = cluster.control_plane&.dig(:id)

                next OpenNebula::Error.new(
                    'Error getting ControlPlane ID', OpenNebula::Error::EACTION
                ) unless cplane_id

                next OpenNebula::Error.new(
                    "Cluster #{cluster.id} cannot be provisioned in state #{cluster.state}",
                    OpenNebula::Error::EACTION
                ) unless cluster.state == :PENDING

                Log.info(COMP, 'Starting Cluster provisioning', cluster.id)
                ODS::Job.request(:provisioning)
            end

            return result if OpenNebula.is_error?(result)

            rc = info
            return rc if OpenNebula.is_error?(rc)

            result
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error requesting Cluster provisioning: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        # Upgrade K8s spec of the entire cluster
        def upgrade(target_version, actor:)
            result = self.class.lcm.request(id, actor) do |cluster|
                next OpenNebula::Error.new(
                    "Cluster #{cluster.id} cannot be upgraded in state #{cluster.state}",
                    OpenNebula::Error::EACTION
                ) unless cluster.running?

                next OpenNebula::Error.new(
                    'Control plane group not found', OpenNebula::Error::EACTION
                ) unless cluster.control_plane

                unsupported = cluster.groups.find do |reference|
                    klass = reference[:type].to_s == 'ControlPlane' ? ControlPlane : NodeGroup
                    family = klass.family_by_name(reference[:family])

                    family.nil? ||
                        !family[:supported_k8s_versions].include?(target_version)
                end

                next OpenNebula::Error.new(
                    "Group #{unsupported[:id]} does not support Kubernetes " \
                    "#{target_version}",
                    ODS::ResponseHelper::VALIDATION_EC
                ) if unsupported

                current_version = Gem::Version.new(cluster.kubernetes_version.delete_prefix('v'))
                next_version    = Gem::Version.new(target_version.delete_prefix('v'))

                next OpenNebula::Error.new(
                    "Cluster is already in #{target_version}", OpenNebula::Error::EACTION
                ) if next_version == current_version

                next OpenNebula::Error.new(
                    "Cannot downgrade Cluster from #{cluster.kubernetes_version} " \
                    "to #{target_version}", OpenNebula::Error::EACTION
                ) if next_version < current_version

                Log.info(
                    COMP,
                    "Starting Cluster upgrade from #{cluster.kubernetes_version} " \
                    "to #{target_version}",
                    cluster.id
                )

                ODS::Job.request(
                    :upgrading,
                    :args => { :k8s_version => target_version }
                )
            end

            return result if OpenNebula.is_error?(result)

            rc = info
            return rc if OpenNebula.is_error?(rc)

            result
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error requesting Cluster upgrade: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        # Renders all resources required to upgrade the cluster. NodeGroups are
        # placed first so their changes are submitted before the ControlPlane
        # starts its rolling update.
        def render_upgrade(k8s_version:)
            documents = group_documents
            return documents if OpenNebula.is_error?(documents)

            control_plane, node_groups = documents

            specs = node_groups.map do |group|
                group.render_upgrade(:k8s_version => k8s_version)
            end

            error = specs.find {|spec| OpenNebula.is_error?(spec) }
            return error if error

            control_plane_spec = control_plane.render_upgrade(
                :k8s_version => k8s_version
            )
            return control_plane_spec if OpenNebula.is_error?(control_plane_spec)

            specs.push(control_plane_spec).join
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error rendering Cluster upgrade: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Deprovision the cluster (delete flow)
        def deprovision(actor:, force: false)
            return self.class.lcm.delete_done(id, :actor => actor) if state == :DONE

            if force && RECOVER_STATES.key?(state) && active_job&.children&.any?
                cleanup = self.class.lcm.discard_failed_composition(id, actor)
                return cleanup if OpenNebula.is_error?(cleanup)

                if cleanup.is_a?(ODS::ExecResult) && !cleanup.ok?
                    return cleanup.value if OpenNebula.is_error?(cleanup.value)

                    return OpenNebula::Error.new(
                        "Cluster #{id} failed to discard its previous operation " \
                        "(#{cleanup.state}); retry deletion",
                        OpenNebula::Error::EACTION
                    )
                end
            end

            result = self.class.lcm.request(id, actor) do |cluster|
                next OpenNebula::Error.new(
                    "Kubernetes Cluster #{cluster.id} deletion is already in progress",
                    OpenNebula::Error::EACTION
                ) if cluster.state == :DEPROVISIONING

                next OpenNebula::Error.new(
                    "Kubernetes Cluster #{cluster.id} has a failed operation " \
                    'pending cleanup. Retry deletion with force option',
                    OpenNebula::Error::EACTION
                ) if cluster.active_job&.children&.any? &&
                      RECOVER_STATES.key?(cluster.state) && !force

                next OpenNebula::Error.new(
                    "Kubernetes Cluster #{cluster.id} has an unfinished operation. " \
                    'Resolve it with recover failure option before deleting the cluster',
                    OpenNebula::Error::EACTION
                ) if cluster.active_job && !RECOVER_STATES.key?(cluster.state)

                ODS::Job.request(
                    :deprovisioning,
                    :args    => { :force => force },
                    :replace => RECOVER_STATES.key?(cluster.state)
                )
            end

            return result if OpenNebula.is_error?(result)

            Log.info(COMP, 'Starting Cluster deprovisioning', id)
            result
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error requesting Cluster deprovisioning: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        # Recovers, resolves, or administratively removes the current lifecycle
        def recover(actor:, action: :retry)
            action = action.to_s.tr('-', '_').to_sym
            return OpenNebula::Error.new(
                "Invalid Cluster recovery action #{action}",
                OpenNebula::Error::EACTION
            ) unless RECOVER_ACTIONS.include?(action)

            return self.class.lcm.delete_from_db(id, :actor => actor) if action == :delete_db

            if warning? && !active_job
                return OpenNebula::Error.new(
                    'Only retry is supported for an ownerless WARNING state',
                    OpenNebula::Error::EACTION
                ) unless action == :retry

                return self.class.lcm.reconcile_cluster(id)
            end

            self.class.lcm.request_recovery(id, actor) do |cluster|
                recover_state = RECOVER_STATES[cluster.state]

                if action != :retry && ClusterLCM.failure_states.key?(cluster.state)
                    recover_state = cluster.state
                end

                next OpenNebula::Error.new(
                    "Cluster #{cluster.id} is not in a recoverable state: #{cluster.state}",
                    OpenNebula::Error::EACTION
                ) unless recover_state

                next OpenNebula::Error.new(
                    "Cluster #{cluster.id} has no lifecycle operation to recover",
                    OpenNebula::Error::EACTION
                ) unless cluster.active_job

                Log.info(COMP, "Starting Cluster recovery action #{action}", cluster.id)
                ODS::Job.recover(action, :state => recover_state)
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error requesting Cluster recovery: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        # Recovers the active cluster operation involving a specific NodeGroup.
        # The cluster remains the lifecycle owner; this is a constrained alias
        # of Cluster recovery rather than an independent GroupLCM operation.
        def recover_group(group_id, actor:, action: :retry)
            action = action.to_s.tr('-', '_').to_sym
            return OpenNebula::Error.new(
                "Invalid NodeGroup recovery action #{action}",
                OpenNebula::Error::EACTION
            ) unless GROUP_RECOVER_ACTIONS.include?(action)

            return OpenNebula::Error.new(
                "NodeGroup #{group_id} not found in Cluster #{id}",
                OpenNebula::Error::ENO_EXISTS
            ) unless Array(node_groups).any? {|group| group[:id].to_i == group_id.to_i }

            self.class.lcm.request_child_recovery(
                id,
                actor,
                :child  => { :workflow => :k8s_group, :owner_id => group_id },
                :action => action
            )
        end

        #------------------------------------------------------
        # Application actions and runtime state
        #------------------------------------------------------

        # Installs a public catalogue chart as a managed application.
        def install_application(attributes, actor:)
            chart = Chart.get(attributes[:application_id])
            return chart if OpenNebula.is_error?(chart)

            defaults         = chart.install_defaults
            release_name     = attributes[:release_name]     || defaults['releaseName']
            target_namespace = attributes[:target_namespace] || defaults['targetNamespace']
            create_namespace =
                if attributes.key?(:create_namespace)
                    attributes[:create_namespace]
                else
                    defaults.fetch('createNamespace', false)
                end

            user_inputs_values = chart.user_input_values(attributes[:user_input_values] || {})
            return user_inputs_values if OpenNebula.is_error?(user_inputs_values)

            installation = {
                :release_name       => release_name,
                :target_namespace   => target_namespace,
                :create_namespace   => create_namespace,
                :user_inputs_values => user_inputs_values
            }

            self.class.lcm.request(id, actor) do |cluster|
                next OpenNebula::Error.new(
                    "Cluster #{cluster.id} cannot install an application in " \
                    "state #{cluster.state}",
                    OpenNebula::Error::EACTION
                ) unless cluster.running?

                documents = cluster.group_documents
                next documents if OpenNebula.is_error?(documents)

                _control_plane, node_groups = documents
                next OpenNebula::Error.new(
                    'Cluster has no NodeGroup with VMs', OpenNebula::Error::EACTION
                ) unless Array(node_groups).any? do |group|
                    !Array(group.vms).empty?
                end

                validations = Applications::Validations.run(cluster, chart)
                next validations if OpenNebula.is_error?(validations)

                next OpenNebula::Error.new(
                    validations[:reasons].join('; '), OpenNebula::Error::EACTION
                ) unless validations[:installable]

                validation = ApplicationPlan.validate(
                    :chart        => chart,
                    :installation => installation
                )
                next validation if OpenNebula.is_error?(validation)

                applications = Application.entries(
                    :chart            => chart,
                    :release_name     => release_name,
                    :target_namespace => target_namespace
                )
                existing_release = Application.conflicting_release(
                    applications, cluster.applications
                )

                next OpenNebula::Error.new(
                    "Application release name #{existing_release} already exists",
                    OpenNebula::Error::EACTION
                ) if existing_release

                ODS::Job.request(
                    :applying_application,
                    :args => { :chart_id => chart.id, **installation }
                )
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error requesting application installation: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Deletes a root application through the shared lifecycle pipeline.
        def delete_application(release_name, actor:)
            self.class.lcm.request(id, actor) do |cluster|
                application_steps =
                    case cluster.state
                    when :INSTALLING_APPLICATION_FAILURE
                        [:applying_application, :evaluate_app_install]
                    when :DELETING_APPLICATION_FAILURE
                        [:deleting_application, :evaluate_app_delete]
                    end

                next OpenNebula::Error.new(
                    "Application release #{release_name} cannot be deleted while " \
                    "Cluster #{cluster.id} is in state #{cluster.state}",
                    OpenNebula::Error::EACTION
                ) unless cluster.running? || application_steps

                job            = cluster.active_job
                job_args       = job&.args || {}
                failed_release = job_args[:release_name] || job_args['release_name']

                next OpenNebula::Error.new(
                    "Cluster #{cluster.id} has no matching failed application " \
                    "operation for state #{cluster.state}",
                    OpenNebula::Error::EACTION
                ) if application_steps && (
                    !application_steps.include?(job&.step) || failed_release.to_s.empty?
                )

                next OpenNebula::Error.new(
                    "Cluster #{cluster.id} has a failed application operation for " \
                    "release #{failed_release}, release #{release_name} cannot be " \
                    "deleted until #{failed_release} is deleted",
                    OpenNebula::Error::EACTION
                ) if application_steps && failed_release.to_s != release_name.to_s

                application = Application.by_release(cluster.applications, release_name)

                next OpenNebula::Error.new(
                    "Application release #{release_name} is a dependency " \
                    'and cannot be deleted directly',
                    OpenNebula::Error::EACTION
                ) if application&.parent

                chart_id = application&.id || job_args[:chart_id] || job_args['chart_id']

                next OpenNebula::Error.new(
                    "Application release #{release_name} not found in Cluster #{cluster.id}",
                    OpenNebula::Error::ENO_EXISTS
                ) if chart_id.to_s.empty?

                ODS::Job.request(
                    :deleting_application,
                    :args => {
                        :chart_id     => chart_id,
                        :release_name => release_name
                    },
                    :replace => !application_steps.nil?
                )
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error requesting application deletion: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        #------------------------------------------------------
        # NodeGroups actions
        #------------------------------------------------------

        # Creates a new group, scaling up the number of groups from
        # the cluster perspective
        def create_group(spec, actor:)
            spec = OneKS::NodeGroup.build_spec(spec)

            rc = OneKS::NodeGroup.validate_spec(spec)
            return rc if OpenNebula.is_error?(rc)

            self.class.lcm.request(id, actor) do |cluster|
                next OpenNebula::Error.new(
                    "Cluster #{cluster.id} cannot add a NodeGroup in state #{cluster.state}",
                    OpenNebula::Error::EACTION
                ) unless cluster.running?

                family = NodeGroup.family_by_name(spec[:family])
                next OpenNebula::Error.new(
                    "NodeGroup family #{spec[:family]} not found",
                    OpenNebula::Error::ENO_EXISTS
                ) unless family

                next OpenNebula::Error.new(
                    "NodeGroup family #{spec[:family]} does not support " \
                    "Kubernetes #{cluster.kubernetes_version}",
                    ODS::ResponseHelper::VALIDATION_EC
                ) unless family[:supported_k8s_versions].include?(
                    cluster.kubernetes_version
                )

                ODS::Job.request(
                    :adding_group,
                    :args => { :spec => spec }
                )
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error creating NodeGroup: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        # Set a new VM target to the group
        def scale_group(group_id, target, actor:)
            return OpenNebula::Error.new(
                'NodeGroup target must be a non-negative integer',
                ODS::ResponseHelper::VALIDATION_EC
            ) unless target.is_a?(Integer) && !target.negative?

            self.class.lcm.request(id, actor) do |cluster|
                next OpenNebula::Error.new(
                    "NodeGroup #{group_id} does not belong to Cluster #{id}",
                    OpenNebula::Error::EACTION
                ) unless cluster.node_groups.any? {|ref| ref[:id].to_i == group_id.to_i }

                next OpenNebula::Error.new(
                    "Cluster #{cluster.id} cannot scale a NodeGroup in state #{cluster.state}",
                    OpenNebula::Error::EACTION
                ) unless cluster.running?

                ODS::Job.request(
                    :scaling_group,
                    :args => {
                        :group_id  => group_id,
                        :target    => target
                    }
                )
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error requesting NodeGroup scaling: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        # Removes a group, scaling down the number of groups from the cluster perspective
        def delete_group(group_id, actor:)
            return OpenNebula::Error.new(
                "Group (ID=#{group_id}) is the control plane of Cluster #{id} and " \
                'cannot be deleted directly because it is managed by the Cluster',
                OpenNebula::Error::EACTION
            ) if control_plane && group_id.to_i == control_plane[:id].to_i

            self.class.lcm.request(id, actor) do |cluster|
                next OpenNebula::Error.new(
                    "Group (ID=#{group_id}) not found in Cluster #{id}",
                    OpenNebula::Error::EACTION
                ) unless cluster.node_groups.any? {|ref| ref[:id].to_i == group_id.to_i }

                next OpenNebula::Error.new(
                    "Cluster #{cluster.id} cannot delete a NodeGroup in state #{cluster.state}",
                    OpenNebula::Error::EACTION
                ) unless cluster.running?

                ODS::Job.request(
                    :deleting_group,
                    :args => { :group_id => group_id }
                )
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error requesting NodeGroup deletion: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        #------------------------------------------------------
        # NodeGroups accessors
        #------------------------------------------------------

        # Retrieve the leader VM of the cluster
        def leader
            return OpenNebula::Error.new(
                'Control plane group not found',
                OpenNebula::Error::EACTION
            ) unless control_plane

            cplane = ControlPlane.new_from_id(@client, control_plane[:id])
            return cplane if OpenNebula.is_error?(cplane)

            leader = Array(cplane.vms).find do |record|
                next false unless record[:ready]

                vm = OneHelper::VirtualMachine.get(@client, record[:id])
                next false if OpenNebula.is_error?(vm)

                vm.state_str == 'ACTIVE' && vm.lcm_state_str == 'RUNNING'
            end

            return leader[:id] if leader

            OpenNebula::Error.new(
                'No ready VMs are currently available in the control plane',
                OpenNebula::Error::EACTION
            )
        end

        # Retrieve all VM groups (control plane + node groups)
        def groups
            [control_plane].compact + Array(node_groups)
        end

        def node_group(group_id)
            groups.find {|group| group[:id].to_i == group_id.to_i }
        end

        #------------------------------------------------------
        # NodeGroups operations
        #------------------------------------------------------

        # Adds a VM group to the current cluster
        # @param group [K8sGroup] The Kubernetes Group to add
        # @return [nil, OpenNebula::Error]
        def add_group(group)
            Log.info(COMP, "Adding #{group.type} (ID=#{group.id}) to the Cluster", id)
            node_groups << K8sGroup.basic_attrs(group)
            register_event(
                :node_group_added,
                :description => "NodeGroup #{group.name} added"
            )
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error adding group to Cluster: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        def del_group(group_id)
            group = groups.find {|g| g[:id].to_i == group_id.to_i }

            return OpenNebula::Error.new(
                "Group (ID=#{group_id}) not found in Cluster #{id}",
                OpenNebula::Error::EACTION
            ) unless group

            if control_plane && control_plane[:id].to_i == group_id.to_i
                self.control_plane = nil
                event = :control_plane_removed
            else
                node_groups.reject! {|g| g[:id].to_i == group_id.to_i }
                event = :node_group_removed
            end

            Log.info(COMP, "#{group[:type]} (ID=#{group[:id]}) removed", id)

            resource_name = group[:name] || group[:id]
            register_event(
                event,
                :description => "#{self.class::EVENTS[event].delete_suffix(' removed')} " \
                                "#{resource_name} removed"
            )

            group
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error deleting group: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        #------------------------------------------------------
        # Deployment configuration
        #------------------------------------------------------

        def deployment_cluster
            OneHelper::Cluster.body(@client, deployment_cluster_id)
        end

        def deployment_networks
            deployment[:networks].each_with_object({}) do |(role, network), acc|
                network_body = OneHelper::VirtualNetwork.body(@client, network[:id])
                return network_body if OpenNebula.is_error?(network_body)

                acc[role] = network_body.deep_merge(network)
            end
        end

        def public_network
            OneHelper::VirtualNetwork.get(@client, public_network_id)
        end

        def private_network
            OneHelper::VirtualNetwork.get(@client, private_network_id)
        end

        def deployment_cluster_id
            deployment.dig(:cluster, :id)
        end

        def public_network_id
            deployment.dig(:networks, :public, :id)
        end

        def private_network_id
            deployment.dig(:networks, :private, :id)
        end

        def sched_requirements
            "CLUSTER_ID = #{deployment_cluster_id}"
        end

        def deployment_info
            target_cluster = deployment_cluster
            return target_cluster if OpenNebula.is_error?(target_cluster)

            target_networks = deployment_networks
            return target_networks if OpenNebula.is_error?(target_networks)

            deployment.merge(
                :cluster  => target_cluster.deep_merge(deployment[:cluster]),
                :networks => target_networks,
                :sched_requirements => sched_requirements
            )
        end

        #------------------------------------------------------
        # Kubernetes information
        #------------------------------------------------------

        def kubeconfig
            cplane = control_plane_document
            return cplane if OpenNebula.is_error?(cplane)

            cplane.kubeconfig
        end

        def replace_observations(snapshot)
            pool   = ClusterDocumentPool.new(:client => @client)
            result = pool.get(id) do |cluster|
                cluster.observations = snapshot
                cluster.update
            end

            return result if OpenNebula.is_error?(result)
        end

        def replace_pods(snapshot)
            group_ids = groups.map {|group| group[:id].to_i }

            snapshot.each_key do |group_id|
                next if group_ids.include?(group_id.to_s.to_i)

                return OpenNebula::Error.new(
                    "NodeGroup #{group_id} not found in Cluster #{id}",
                    OpenNebula::Error::ENO_EXISTS
                )
            end

            pool = K8sGroupDocumentPool.new(:client => @client)

            snapshot.each do |group_id, vm_snapshots|
                result = pool.get(group_id.to_s.to_i) do |group|
                    next OpenNebula::Error.new(
                        "NodeGroup #{group_id} not found in Cluster #{id}",
                        OpenNebula::Error::ENO_EXISTS
                    ) unless group.cluster_id.to_i == id.to_i

                    unknown_vm_id = vm_snapshots.each_key.find do |vm_id|
                        !group.vm_registered?(vm_id.to_s.to_i)
                    end

                    next OpenNebula::Error.new(
                        "VM #{unknown_vm_id} is not registered in Group #{group.id}",
                        OpenNebula::Error::ENO_EXISTS
                    ) if unknown_vm_id

                    vm_snapshots.each do |vm_id, pods|
                        group.update_vm_pods(vm_id.to_s.to_i, pods)
                    end

                    group.update
                end

                return result if OpenNebula.is_error?(result)
            end

            nil
        end

        #------------------------------------------------------
        # Serialization
        #------------------------------------------------------

        # Builds the persistable Cluster body with flat application records.
        # @return [Hash] Serializable Cluster attributes
        def plain_body
            body = super
            body[:applications] = Array(body[:applications]).map(&:to_h)
            body
        end

        # Builds the public cluster representation
        def to_h(opts = {})
            document = super(opts)
            body     = document['DOCUMENT']['TEMPLATE'][TEMPLATE_TAG]

            body.delete(:json_class)
            body.delete(:user_inputs)
            body.delete(:monitor_key)
            body.delete(:observations)
            body.delete(:historic)
            body.delete(:active_job)
            body.dig(:error, :opts)&.delete(:user_inputs_values)

            [body[:control_plane], *Array(body[:node_groups])].compact.each do |group|
                next unless group.is_a?(Hash)

                group.delete(:historic)
            end

            document
        end

        # Transforms the public cluster representation to JSON
        def to_json(opts = {})
            to_h(opts).to_json
        end

        # Builds a filtered and ordered view over the histories of the Cluster
        # and each currently attached Kubernetes group
        def historic_events
            documents = group_documents
            return documents if OpenNebula.is_error?(documents)

            control_plane, node_groups = documents
            resources = [[self, 'Cluster']]
            resources << [control_plane, 'ControlPlane'] if control_plane
            resources.concat(Array(node_groups).map {|group| [group, 'NodeGroup'] })

            sequence = 0
            events = resources.flat_map do |resource, kind|
                Array(resource.historic).map do |event|
                    normalized = event.each_with_object({}) do |(key, value), result|
                        result[key.to_sym] = value
                    end

                    normalized.merge(
                        :kind          => kind,
                        :resource_id   => resource.id,
                        :resource_name => resource.name,
                        :_sequence     => sequence.tap { sequence += 1 }
                    )
                end
            end

            events.sort_by! {|event| [-event[:time].to_i, event[:_sequence]] }
            events.each {|event| event.delete(:_sequence) }

            events
        end

        # Builds a view over the pods stored by every group in the Cluster
        def pods
            documents = group_documents
            return documents if OpenNebula.is_error?(documents)

            control_plane, node_groups = documents
            groups = []
            groups << [control_plane, 'controlplane'] if control_plane
            groups.concat(Array(node_groups).map {|group| [group, 'nodegroup'] })

            groups.flat_map do |group, role|
                group.pods.map do |pod|
                    pod.merge(:role => role, :group_id => group.id)
                end
            end
        end

        # Loads the documents for every group owned by the cluster
        def group_documents
            control_plane = control_plane_document

            return OpenNebula::Error.new(
                "Could not load ControlPlane for Cluster #{id}: #{control_plane.message}",
                OpenNebula::Error::EACTION
            ) if OpenNebula.is_error?(control_plane)

            node_groups = Array(self.node_groups).map do |reference|
                group = node_group_document(reference[:id])

                return OpenNebula::Error.new(
                    "Could not load NodeGroup #{reference[:id]} for Cluster #{id}: " \
                    "#{group.message}", OpenNebula::Error::EACTION
                ) if OpenNebula.is_error?(group)

                group
            end

            [control_plane, node_groups]
        end

        private

        def node_group_document(group_id)
            group = node_group(group_id)

            return OpenNebula::Error.new(
                "NodeGroup #{group_id} not found in Cluster #{id}",
                OpenNebula::Error::ENO_EXISTS
            ) unless group

            group = OneKS::NodeGroup.new_from_id(@client, group_id)
            return group if OpenNebula.is_error?(group)

            group
        end

        def control_plane_document
            return unless control_plane

            OneKS::ControlPlane.new_from_id(@client, control_plane[:id])
        end

        def self.rollback_create(cluster)
            rc = cluster.delete(:force => true)
            return rc if OpenNebula.is_error?(rc)
        end

        private_class_method :rollback_create

    end

end
