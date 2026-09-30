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

    # Owns cluster domain ordering while ODS coordinates child workflows.
    class ClusterLCM < ODS::JobWorkflow

        include Singleton

        workflow_id :cluster

        step :provisioning,
             :state   => :PROVISIONING,
             :success => ODS::Job.next(:running),
             :failure => :PROVISIONING_FAILURE

        step :running,
             :state   => :RUNNING,
             :success => ODS::Job.complete(:RUNNING),
             :failure => :WARNING

        # Application steps

        step :applying_application,
             :state   => :INSTALLING_APPLICATION,
             :success => ODS::Job.next(:evaluate_app_install),
             :failure => :INSTALLING_APPLICATION_FAILURE

        step :evaluate_app_install,
             :state   => :INSTALLING_APPLICATION,
             :success => ODS::Job.next(:running),
             :failure => :INSTALLING_APPLICATION_FAILURE,
             :recover => :applying_application

        step :deleting_application,
             :state   => :DELETING_APPLICATION,
             :success => ODS::Job.next(:evaluate_app_delete),
             :failure => :DELETING_APPLICATION_FAILURE

        step :evaluate_app_delete,
             :state   => :DELETING_APPLICATION,
             :success => ODS::Job.next(:running),
             :failure => :DELETING_APPLICATION_FAILURE,
             :recover => :deleting_application

        # Scaling steps

        step :adding_group,
             :state   => :SCALING,
             :success => ODS::Job.next(:running),
             :failure => :SCALING_FAILURE

        step :scaling_group,
             :state   => :SCALING,
             :success => ODS::Job.next(:running),
             :failure => :SCALING_FAILURE

        step :deleting_group,
             :state     => :SCALING,
             :success   => ODS::Job.next(:detach_group),
             :failure   => :SCALING_FAILURE

        step :detach_group,
             :state     => :SCALING,
             :success   => ODS::Job.next(:running),
             :failure   => :SCALING_FAILURE

        # Upgrading steps

        step :upgrading,
             :state     => :UPGRADING,
             :success   => ODS::Job.next(:running),
             :failure   => :UPGRADING_FAILURE

        # Deprovisioning steps

        step :deprovisioning,
             :state     => :DEPROVISIONING,
             :success   => ODS::Job.next(:cleanup_cluster),
             :failure   => :DEPROVISIONING_FAILURE

        step :cleanup_cluster,
             :state     => :DEPROVISIONING,
             :success   => ODS::Job.next(:done),
             :failure   => :DEPROVISIONING_FAILURE

        step :done,
             :success => ODS::Job.complete(:DONE, :owner_deleted => true),
             :failure => :DEPROVISIONING_FAILURE

        event :app_state_changed,
              :handler => :update_app_state

        event :app_failed,
              :handler => :update_app_state

        # Events accepted through the OneKS API.
        API_EVENTS = {
            'app_state_changed' => :app_state_changed,
            'app_failed'        => :app_failed
        }

        FAILURE_STATES = {
            :PROVISIONING   => :PROVISIONING_FAILURE,
            :RUNNING        => :WARNING,
            :SCALING        => :SCALING_FAILURE,
            :UPGRADING      => :UPGRADING_FAILURE,
            :INSTALLING_APPLICATION => :INSTALLING_APPLICATION_FAILURE,
            :DELETING_APPLICATION   => :DELETING_APPLICATION_FAILURE,
            :DEPROVISIONING => :DEPROVISIONING_FAILURE
        }

        stable_states :RUNNING, :DONE
        failure_states FAILURE_STATES

        # Reconstructs lifecycle jobs and then reconciles ownerless aggregate state.
        # Returning any state-reconciliation error lets the scheduler retry the
        # complete startup operation through its reconciliation queue.
        def reconcile_startup
            result = super
            return result if OpenNebula.is_error?(result)

            reconcile_cluster_states
        end

        # Reconciles one Cluster after a stable Group state change.
        def reconcile_cluster(cluster_id)
            snapshot = nil
            rc = pool.get(cluster_id) {|cluster| snapshot = cluster }
            return rc if OpenNebula.is_error?(rc)

            reconcile_cluster_state(snapshot)
        end

        # Starts the control plane bootstrapping workflow.
        def provisioning(cluster, **_opts)
            control_plane = cluster.control_plane
            return ODS::Job.fail('Control plane group not found') unless control_plane

            Log.debug(
                Cluster::COMP,
                "Scheduling ControlPlane #{control_plane[:id]} " \
                'bootstrapping',
                cluster.id
            )

            ODS::Job.children(
                [child(control_plane[:id], :bootstrapping)],
                :wait => :control_plane_ready
            )
        end

        # Completes the current operation with the cluster in its stable state.
        def running(cluster, **_opts)
            Log.debug(
                Cluster::COMP,
                'Cluster lifecycle action reached its stable state',
                cluster.id
            )

            ODS::Job.success
        end

        # Persists the runtime release map before sending one root application
        def applying_application(cluster, chart_id:, release_name:, **opts)
            chart = Chart.get(chart_id)
            return ODS::Job.fail(chart.message) if OpenNebula.is_error?(chart)

            target_namespace   = opts.fetch(:target_namespace)
            create_namespace   = opts.fetch(:create_namespace)
            user_inputs_values = opts.fetch(:user_inputs_values, {})
            installation = {
                :release_name       => release_name,
                :target_namespace   => target_namespace,
                :create_namespace   => create_namespace,
                :user_inputs_values => user_inputs_values
            }

            applications = Application.release_group(cluster.applications, release_name)

            # Persists new releases or resets failed ones before retrying the installation
            if applications.empty?
                applications = Application.entries(
                    :chart            => chart,
                    :release_name     => release_name,
                    :target_namespace => target_namespace
                )
                cluster.applications = Array(cluster.applications) + applications

                rc = cluster.update
                return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)
            else
                failed = applications.select(&:failed?)
                failed.each(&:retrying!)

                unless failed.empty?
                    rc = cluster.update
                    return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)
                end
            end

            resolved_chart = ApplicationPlan.resolve(:chart => chart, :installation => installation)
            return fail_application_install(
                cluster, applications, resolved_chart.message
            ) if OpenNebula.is_error?(resolved_chart)

            rc = K8s.apply_application(
                cluster,
                :chart => resolved_chart,
                :installation => installation
            )
            return fail_application_install(
                cluster, applications, rc.message
            ) if OpenNebula.is_error?(rc)

            ODS::Job.wait(
                :events => [:app_state_changed, :app_failed],
                :check  => :app_ready
            )
        end

        # Evaluates a terminal installation wait after application events.
        def evaluate_app_install(cluster, release_name:, **_opts)
            apps   = Application.release_group(cluster.applications, release_name)
            failed = Application.failed_entry(apps)

            return ODS::Job.fail(
                failed.error_msg || 'Application installation failed'
            ) if failed

            ODS::Job.success
        end

        # Starts the common explicit-delete and recovery-cleanup protocol.
        def deleting_application(cluster, chart_id:, release_name:, **_opts)
            return ODS::Job.success if
                Application.release_group(cluster.applications, release_name).empty?

            rc = K8s.delete_application(
                cluster, :chart_id => chart_id, :release_name => release_name
            )
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            if rc == :not_found
                cluster.applications = Array(cluster.applications).reject do |application|
                    application.release_name == release_name || application.parent == release_name
                end

                rc = cluster.update
                return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

                return ODS::Job.success
            end

            changed = Application.mark_deleting(cluster.applications, release_name)

            if changed
                rc = cluster.update
                return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)
            end

            ODS::Job.wait(
                :events => [:app_state_changed, :app_failed],
                :check  => :app_deleted
            )
        end

        # Evaluates a terminal deletion wait after events or recovery cleanup.
        def evaluate_app_delete(cluster, release_name:, **_opts)
            failed = Application.failed_entry(cluster.applications, release_name)

            return ODS::Job.fail(
                failed.error_msg || 'Application deletion failed'
            ) if failed

            ODS::Job.success
        end

        # Creates or resumes a NodeGroup and starts its bootstrapping workflow.
        def adding_group(cluster, spec: nil, group_id: nil, **_opts)
            if group_id
                return ODS::Job.fail(
                    "NodeGroup #{group_id} does not belong to Cluster #{cluster.id}"
                ) unless cluster.node_group(group_id)

                Log.debug(
                    Cluster::COMP,
                    "Resuming NodeGroup #{group_id} provisioning",
                    cluster.id
                )
            else
                return ODS::Job.fail('NodeGroup specification is required') unless spec.is_a?(Hash)

                Log.debug(
                    Cluster::COMP,
                    'Creating and attaching a new NodeGroup',
                    cluster.id
                )

                group = K8sGroup.create(
                    :type    => OneKS::NodeGroup,
                    :cluster => cluster,
                    :spec    => spec
                )

                return ODS::Job.fail(group.message) if OpenNebula.is_error?(group)

                rc = cluster.add_group(group)
                return fail_create(cluster, group, rc) if OpenNebula.is_error?(rc)

                rc = cluster.update
                return fail_create(cluster, group, rc) if OpenNebula.is_error?(rc)

                group_id = group.id

                Log.debug(
                    Cluster::COMP,
                    "NodeGroup #{group_id} attached",
                    cluster.id
                )
            end

            Log.debug(
                Cluster::COMP,
                "Scheduling NodeGroup #{group_id} bootstrapping",
                cluster.id
            )

            ODS::Job.children(
                [child(group_id, :bootstrapping)],
                :args => { :group_id => group_id },
                :wait => :group_running
            )
        end

        # Starts the scaling workflow for a NodeGroup owned by the cluster.
        def scaling_group(cluster, group_id:, target: nil, **_opts)
            return ODS::Job.fail(
                "NodeGroup #{group_id} does not belong to Cluster #{cluster.id}"
            ) unless cluster.node_group(group_id)

            Log.debug(
                Cluster::COMP,
                "Scheduling NodeGroup #{group_id} scaling " \
                "to #{target.to_i} nodes",
                cluster.id
            )

            ODS::Job.children(
                [child(group_id, :scaling, :target => target.to_i)],
                :wait => :group_scaled
            )
        end

        # Starts the deprovisioning workflow for a NodeGroup.
        def deleting_group(cluster, group_id:, **_opts)
            return ODS::Job.fail(
                "NodeGroup #{group_id} does not belong to Cluster #{cluster.id}"
            ) unless cluster.node_group(group_id)

            Log.debug(
                Cluster::COMP,
                "Scheduling NodeGroup #{group_id} deprovisioning",
                cluster.id
            )

            ODS::Job.children(
                [child(group_id, :deprovisioning, :force => false)],
                :wait => :group_deleted
            )
        end

        # Removes a deleted NodeGroup reference from the cluster.
        def detach_group(cluster, group_id:, **_opts)
            if cluster.node_group(group_id)
                Log.debug(
                    Cluster::COMP,
                    "Removing NodeGroup #{group_id} reference",
                    cluster.id
                )

                rc = cluster.del_group(group_id)
                return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

                rc = cluster.update
                return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)
            else
                Log.debug(
                    Cluster::COMP,
                    "NodeGroup #{group_id} is already detached",
                    cluster.id
                )
            end

            ODS::Job.success
        end

        # Applies the Kubernetes upgrade for every cluster group
        def upgrading(cluster, k8s_version:, **_opts)
            Log.debug(
                Cluster::COMP,
                "Persisting target Kubernetes #{k8s_version}",
                cluster.id
            )

            cluster.target_kubernetes_version = k8s_version

            rc = cluster.update
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            spec = cluster.render_upgrade(:k8s_version => k8s_version)
            return ODS::Job.fail(spec.message) if OpenNebula.is_error?(spec)

            Log.debug(
                Cluster::COMP,
                "Applying cluster upgrade to #{k8s_version}",
                cluster.id
            )

            leader = cluster.leader
            return ODS::Job.fail(leader.message) if OpenNebula.is_error?(leader)

            rc = K8s.upgrade(cluster.client, leader, spec)
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            Log.debug(
                Cluster::COMP,
                "Setting Kubernetes version to #{k8s_version}",
                cluster.id
            )

            cluster.kubernetes_version        = k8s_version
            cluster.target_kubernetes_version = nil

            rc = cluster.update
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            ODS::Job.success
        end

        # Starts forced deprovisioning for every group in the cluster.
        def deprovisioning(cluster, **_opts)
            children = cluster.groups.map do |ref|
                child(ref[:id], :deprovisioning, :force => true)
            end

            if children.empty?
                Log.debug(
                    Cluster::COMP,
                    'No groups remain to deprovision',
                    cluster.id
                )

                return ODS::Job.success
            end

            Log.debug(
                Cluster::COMP,
                'Scheduling forced deprovisioning for groups ' \
                "#{children.map {|item| item[:owner_id] }.join(', ')}",
                cluster.id
            )

            ODS::Job.children(children, :wait => :groups_deprovisioned)
        end

        # Clears group references and transient upgrade data after deprovisioning.
        def cleanup_cluster(cluster, **_opts)
            Log.debug(
                Cluster::COMP,
                "Removing #{cluster.groups.size} group references",
                cluster.id
            )

            cluster.groups.dup.each do |reference|
                rc = cluster.del_group(reference[:id])
                return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)
            end

            cluster.target_kubernetes_version = nil

            rc = cluster.update
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            ODS::Job.success
        end

        # Deletes the cluster document after lifecycle cleanup completes.
        def done(cluster, **_opts)
            Log.debug(
                Cluster::COMP,
                'Deleting the Cluster document',
                cluster.id
            )

            rc = cluster.delete
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            ODS::Job.success
        end

        # Deletes a completed cluster without scheduling a workflow.
        def delete_done(cluster_id, actor:)
            result = pool.get(cluster_id, actor) do |cluster|
                next OpenNebula::Error.new(
                    "Cannot delete Cluster in state #{cluster.state_str}",
                    OpenNebula::Error::EACTION
                ) unless cluster.state == :DONE

                done(cluster)
            end

            return result if OpenNebula.is_error?(result)

            true
        end

        # Abandons all durable executions owned by a cluster and removes its
        # cluster/group documents without touching external infrastructure.
        def delete_from_db(cluster_id, actor:)
            group_workflow = scheduler.workflow_for_id(:k8s_group)
            group_pool     = group_workflow.pool
            group_ids      = []

            rc = pool.get(cluster_id, actor) do |cluster|
                group_ids = cluster.groups.map {|reference| reference[:id] }
            end
            return rc if OpenNebula.is_error?(rc)

            rc = abandon_operation(cluster_id, actor)
            return rc if OpenNebula.is_error?(rc)

            group_ids.each do |group_id|
                rc = group_workflow.abandon_operation(group_id, actor)
                return rc if OpenNebula.is_error?(rc)

                rc = group_pool.get(group_id, actor) do |group|
                    group.delete(:force => true)
                end

                next if OpenNebula.is_error?(rc) && rc.errno == OpenNebula::Error::ENO_EXISTS
                return rc if OpenNebula.is_error?(rc)
            end

            rc = pool.get(cluster_id, actor) do |cluster|
                cluster.delete(:force => true)
            end

            return rc if OpenNebula.is_error?(rc) && rc.errno != OpenNebula::Error::ENO_EXISTS

            Log.warn(
                Cluster::COMP,
                "Cluster #{cluster_id} and group documents #{group_ids.join(', ')} " \
                'were deleted directly from the database',
                cluster_id
            )

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error deleting Cluster #{cluster_id} from the database: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        #------------------------------------------------------
        # Event callbacks
        #------------------------------------------------------

        # Applies monotonic state and failure events to one runtime application.
        def update_app_state(cluster, **event)
            failure          = event.key?(:error_msg)
            state            = failure ? 'error' : event.fetch(:state)
            release_name     = event.fetch(:release_name)
            resource_version = event.fetch(:resource_version)
            parent           = event[:parent]

            result = Application.apply_event(
                cluster.applications,
                :state            => state,
                :error_msg        => event[:error_msg],
                :release_name     => release_name,
                :resource_version => resource_version,
                :parent           => parent
            )

            return ODS::EventResult.ignore(result) unless [:updated, :removed].include?(result)

            ODS::EventResult.handled
        end

        #------------------------------------------------------
        # Wait checks
        #------------------------------------------------------

        # Checks whether every release is ready or one has failed.
        def app_ready(cluster, release_name:, **_opts)
            Application.install_complete?(cluster.applications, release_name)
        end

        # Checks whether every release was removed or one has failed.
        def app_deleted(cluster, release_name:, **_opts)
            Application.delete_complete?(cluster.applications, release_name)
        end

        # Checks whether the control plane child workflow reached RUNNING.
        def control_plane_ready(cluster, children:, **_opts)
            group = children.first
            ready = !group.nil? && group.running?

            Log.debug(
                Cluster::COMP,
                "ControlPlane #{group&.id || 'missing'} " \
                "state=#{group&.state || 'missing'}, " \
                "ready=#{ready}",
                cluster.id
            )

            ready
        end

        # Checks whether the NodeGroup child workflow reached RUNNING.
        def group_running(cluster, children:, **_opts)
            group = children.first
            ready = !group.nil? && group.running?

            Log.debug(
                Cluster::COMP,
                "NodeGroup #{group&.id || 'missing'} " \
                "state=#{group&.state || 'missing'}, " \
                "ready=#{ready}",
                cluster.id
            )

            ready
        end

        # Checks whether the NodeGroup reached its requested size.
        def group_scaled(cluster, target:, children:, **_opts)
            group = children.first
            ready = !group.nil? && group.running? && group.expected_size == target.to_i

            Log.debug(
                Cluster::COMP,
                "NodeGroup #{group&.id || 'missing'} " \
                "state=#{group&.state || 'missing'}, " \
                "size=#{group&.expected_size || 'unknown'}, target=#{target.to_i}, " \
                "ready=#{ready}",
                cluster.id
            )

            ready
        end

        # Checks whether the NodeGroup child workflow completed deletion.
        def group_deleted(cluster, children:, **_opts)
            group = children.first
            ready = group.nil? || group.state == :DONE

            Log.debug(
                Cluster::COMP,
                "NodeGroup #{group&.id || 'missing'} " \
                "state=#{group&.state || 'missing'}, " \
                "ready=#{ready}",
                cluster.id
            )

            ready
        end

        # Checks whether every group completed deprovisioning.
        def groups_deprovisioned(cluster, children:, **_opts)
            pending = children.compact.reject {|group| group.state == :DONE }

            Log.debug(
                Cluster::COMP,
                'Pending groups=' \
                "#{pending.map(&:id).join(', ')}, ready=#{pending.empty?}",
                cluster.id
            )

            pending.empty?
        end

        private

        # Reconciles the aggregate state of every cluster without an active job.
        def reconcile_cluster_states
            rc = pool.info

            if OpenNebula.is_error?(rc)
                Log.error(
                    Cluster::COMP,
                    "Could not load #{pool.class} for state reconciliation: #{rc.message}"
                )
                return rc
            end

            failure = nil

            pool.each do |cluster|
                Log.debug(Cluster::COMP, 'Reconciling persisted Cluster state', cluster.id)

                result = reconcile_cluster_state(cluster)
                next unless OpenNebula.is_error?(result)

                failure ||= result

                Log.error(
                    Cluster::COMP,
                    "Could not reconcile Cluster #{cluster.id}: #{result.message}",
                    cluster.id
                )
            rescue StandardError => e
                failure ||= OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
                Log.error(
                    Cluster::COMP,
                    "Could not reconcile Cluster #{cluster.id}: #{e.message}",
                    cluster.id
                )
            end

            failure || true
        end

        # Loads group state without holding the Cluster lock, then rechecks its
        # ownership and references before applying one atomic document update.
        def reconcile_cluster_state(snapshot)
            return true if snapshot.active_job

            references = snapshot.groups.map {|reference| reference.dup }
            documents  = snapshot.group_documents
            return documents if OpenNebula.is_error?(documents)

            control_plane, node_groups = documents
            groups = [control_plane, *node_groups].compact
            result = true

            rc = pool.get(snapshot.id) do |cluster|
                next if cluster.active_job || cluster.groups != references

                changed = cluster.reconcile_state!(:groups => groups)

                if OpenNebula.is_error?(changed)
                    result = changed
                    next
                end

                next unless changed

                update = cluster.update
                result = update if OpenNebula.is_error?(update)
            end

            return rc if OpenNebula.is_error?(rc)

            result
        end

        # Rolls back a failed NodeGroup creation and returns the combined failure.
        def fail_create(cluster, group, error)
            rollback = rollback_create(cluster, group.id)
            message  = "Failed to create NodeGroup #{group.id}: #{error.message}"
            message += "; rollback failed: #{rollback.message}" if OpenNebula.is_error?(rollback)

            ODS::Job.fail(message)
        end

        # Persists local failures for releases the monitor has not updated yet.
        def fail_application_install(cluster, applications, message)
            pending = applications.select {|application| application.state == 'installing' }
            pending.each {|application| application.fail_locally!(message) }
            return ODS::Job.fail(message) if pending.empty?

            rc = cluster.update
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            ODS::Job.fail(message)
        end

        # Builds a child GroupLCM request for an ODS composition.
        def child(owner_id, step, args = {})
            {
                :workflow => :k8s_group,
                :owner_id => owner_id,
                :step     => step,
                :args     => args
            }
        end

    end

end
