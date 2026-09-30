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

    # Durable lifecycle workflow for ControlPlane and NodeGroup documents.
    class GroupLCM < ODS::JobWorkflow

        include Singleton
        include EventHandler

        workflow_id :k8s_group

        step :bootstrapping,
             :state   => :BOOTSTRAPPING,
             :success => ODS::Job.next(:provisioning),
             :failure => :BOOTSTRAPPING_FAILURE,
             :recover => :recover_dependencies

        step :provisioning,
             :state   => :PROVISIONING,
             :success => ODS::Job.next(:running),
             :failure => :PROVISIONING_FAILURE,
             :recover => :recover_dependencies

        step :running,
             :state   => :RUNNING,
             :success => ODS::Job.complete(:RUNNING),
             :failure => :WARNING

        step :scaling,
             :state   => :SCALING,
             :success => ODS::Job.next(:running),
             :failure => :SCALING_FAILURE

        step :deprovisioning,
             :state   => :DEPROVISIONING,
             :success => ODS::Job.next(:wait_deprovisioning),
             :failure => :DEPROVISIONING_FAILURE

        step :wait_deprovisioning,
             :state   => :DEPROVISIONING,
             :success => ODS::Job.next(:cleanup_deprovisioning),
             :failure => :DEPROVISIONING_FAILURE

        step :cleanup_deprovisioning,
             :state   => :DEPROVISIONING,
             :success => ODS::Job.next(:done),
             :failure => :DEPROVISIONING_FAILURE

        step :done,
             :success => ODS::Job.complete(:DONE, :owner_deleted => true),
             :failure => :DEPROVISIONING_FAILURE

        event :vm_allocated,
              :handler => :add_vm

        event :vm_state_changed,
              :handler => :update_vm_state

        event :node_ready,
              :handler => :update_node_readiness

        # Events accepted through the OneKS API.
        API_EVENTS = {
            'node_ready' => :node_ready
        }

        AGGREGATE_STATE_RESULTS = [:warning, :running, :removed_warning]

        FAILURE_STATES = {
            :BOOTSTRAPPING  => :BOOTSTRAPPING_FAILURE,
            :PROVISIONING   => :PROVISIONING_FAILURE,
            :SCALING        => :SCALING_FAILURE,
            :DEPROVISIONING => :DEPROVISIONING_FAILURE,
            :RUNNING        => :WARNING
        }

        stable_states :RUNNING, :DONE
        failure_states FAILURE_STATES

        # Connects the workflow to its group pool and scheduler.
        def configure(group_pool, scheduler, cluster_lcm: ClusterLCM.instance)
            super(group_pool, scheduler)
            @cluster_lcm = cluster_lcm

            self
        end

        # Dispatches the group event first, then refreshes the owning Cluster
        # aggregate after the group lock has been released.
        def dispatch_event(owner_id, name, **args)
            result = super
            return result if OpenNebula.is_error?(result)
            return result unless AGGREGATE_STATE_RESULTS.include?(result)

            cluster_id = args.dig(:event, :cluster_id)

            unless cluster_id
                rc = pool.get(owner_id) {|group| cluster_id = group.cluster_id }
                return rc if OpenNebula.is_error?(rc)
            end

            reconciled = @cluster_lcm.reconcile_cluster(cluster_id)
            return reconciled if OpenNebula.is_error?(reconciled)

            result
        end

        # Builds and prepares the external dependencies required by the group.
        def bootstrapping(group, **_opts)
            Log.debug(
                K8sGroup::COMP,
                "Starting #{group.type} (ID=#{group.id}) bootstrapping",
                group.cluster_id
            )

            if SKIP_DEPENDENCIES
                Log.debug(
                    K8sGroup::COMP,
                    'Dependency handling is disabled',
                    group.cluster_id
                )

                return ODS::Job.success
            end

            # Persisted dependencies mean a previous bootstrap was interrupted.
            # Their resources cannot be adopted safely because the Seed VM runs
            # processes outside OneKS control, so restart from a clean slate
            unless group.dependencies.empty?
                Log.debug(
                    K8sGroup::COMP,
                    'Cleaning persisted dependencies ' \
                    "#{group.dependencies.map(&:name).join(', ')}",
                    group.cluster_id
                )

                rc = group.recover_dependencies
                return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

                rc = group.update
                return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)
            end

            rc = K8sGroup.build_dependencies(group)
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            rc = group.update
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            dependency_names = group.dependencies.map(&:name)
            dependencies_log = dependency_names.empty? ? 'none' : dependency_names.join(', ')

            Log.debug(
                K8sGroup::COMP,
                "Built dependencies: #{dependencies_log}",
                group.cluster_id
            )

            if K8sDependency.all_ready?(group.dependencies)
                message =
                    if group.dependencies.empty?
                        'No dependencies need to be prepared'
                    else
                        'All dependencies are ready'
                    end

                Log.debug(
                    K8sGroup::COMP,
                    message,
                    group.cluster_id
                )

                return ODS::Job.success
            end

            group.dependencies.reject(&:ready?).each do |dependency|
                Log.debug(
                    K8sGroup::COMP,
                    "Creating dependency #{dependency.name}",
                    group.cluster_id
                )

                rc = dependency.create(group)
                return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

                # Persist external IDs so recovery can destroy every resource
                # created before a failure or process restart.
                rc = group.update
                return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)
            end

            if K8sDependency.all_ready?(group.dependencies)
                Log.debug(
                    K8sGroup::COMP,
                    'Dependency creation completed synchronously',
                    group.cluster_id
                )

                return ODS::Job.success
            end

            Log.debug(
                K8sGroup::COMP,
                'Waiting for dependencies ' \
                "#{group.dependencies.reject(&:ready?).map(&:name).join(', ')}",
                group.cluster_id
            )

            ODS::Job.thread_pool(
                group.dependencies.reject(&:ready?),
                :task   => :wait_dependency,
                :commit => :commit_dependency,
                :args   => {
                    :group         => group,
                    :external_user => group.active_job.external_user
                },
                :result => ODS::Job.success
            )
        end

        # Provisions the group and waits until all registered nodes are ready.
        def provisioning(group, **_opts)
            Log.debug(
                K8sGroup::COMP,
                "Provisioning #{group.type} (ID=#{group.id}), " \
                "registered VMs=#{group.vms.size}/#{group.expected_size}",
                group.cluster_id
            )

            rc = group.provision
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            rc = group.update
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            if group.ready?
                Log.debug(
                    K8sGroup::COMP,
                    'Group is ready without waiting for VM events',
                    group.cluster_id
                )

                return ODS::Job.success
            end

            Log.debug(
                K8sGroup::COMP,
                'Waiting for VM allocation, state, or readiness events',
                group.cluster_id
            )

            ODS::Job.wait(
                :events => [:vm_allocated, :vm_state_changed, :node_ready],
                :check  => :group_ready
            )
        end

        # Completes the current operation with the group in its stable state.
        def running(group, **_opts)
            Log.debug(
                K8sGroup::COMP,
                'Group lifecycle action reached its stable state',
                group.cluster_id
            )

            ODS::Job.success
        end

        # Resizes the group and waits until the requested size is ready.
        def scaling(group, target:, **_opts)
            Log.debug(
                K8sGroup::COMP,
                "Scaling #{group.type} (ID=#{group.id}) from " \
                "#{group.vms.size} to #{target.to_i} nodes",
                group.cluster_id
            )

            rc = group.scale(target)
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            rc = group.update
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            if group.ready?
                Log.debug(
                    K8sGroup::COMP,
                    'Scaling target reached without waiting for VM events',
                    group.cluster_id
                )

                return ODS::Job.success
            end

            Log.debug(
                K8sGroup::COMP,
                'Waiting for VM allocation, state, or readiness events',
                group.cluster_id
            )

            ODS::Job.wait(
                :events => [:vm_allocated, :vm_state_changed, :node_ready],
                :check  => :group_ready
            )
        end

        # Requests removal of the group resources.
        def deprovisioning(group, force: false, **_opts)
            Log.debug(
                K8sGroup::COMP,
                "Requesting deprovisioning of #{group.type} (ID=#{group.id}), " \
                "force=#{force}, VMs=#{group.vm_ids.join(', ')}",
                group.cluster_id
            )

            rc = group.deprovision(:force => force)

            if OpenNebula.is_error?(rc)
                message = "Failed requesting #{group.type} (ID=#{group.id}) " \
                          "deprovisioning: #{rc.message}"
                Log.error(K8sGroup::COMP, message, group.cluster_id)

                return ODS::Job.fail(message)
            end

            rc = group.update

            if OpenNebula.is_error?(rc)
                message = "Failed persisting #{group.type} (ID=#{group.id}) " \
                          "deprovisioning request: #{rc.message}"
                Log.error(K8sGroup::COMP, message, group.cluster_id)

                return ODS::Job.fail(message)
            end

            ODS::Job.success
        end

        # Waits until no VMs remain registered in the group.
        def wait_deprovisioning(group, **_opts)
            if group.empty?
                Log.debug(
                    K8sGroup::COMP,
                    'No registered VMs remain',
                    group.cluster_id
                )

                return ODS::Job.success
            end

            Log.debug(
                K8sGroup::COMP,
                "Waiting for VMs #{group.vm_ids.join(', ')} to disappear",
                group.cluster_id
            )

            ODS::Job.wait(
                :events => [:vm_state_changed],
                :check  => :group_empty
            )
        end

        # Removes dependencies and templates after every group VM has disappeared.
        def cleanup_deprovisioning(group, **_opts)
            Log.debug(
                K8sGroup::COMP,
                "Cleaning deprovisioned #{group.type} (ID=#{group.id}) resources",
                group.cluster_id
            )

            rc = group.cleanup_dependencies

            if OpenNebula.is_error?(rc)
                message = "Failed cleaning #{group.type} (ID=#{group.id}) " \
                          "dependencies: #{rc.message}"
                Log.error(K8sGroup::COMP, message, group.cluster_id)

                return ODS::Job.fail(message)
            end

            rc = group.update

            if OpenNebula.is_error?(rc)
                message = "Failed persisting #{group.type} (ID=#{group.id}) " \
                          "dependency cleanup: #{rc.message}"
                Log.error(K8sGroup::COMP, message, group.cluster_id)

                return ODS::Job.fail(message)
            end

            ODS::Job.success
        end

        # Deletes the group document after deprovisioning completes.
        def done(group, **_opts)
            Log.debug(
                K8sGroup::COMP,
                "Deleting #{group.type} (ID=#{group.id}) document",
                group.cluster_id
            )

            rc = group.delete
            if OpenNebula.is_error?(rc)
                message = "Failed deleting #{group.type} (ID=#{group.id}) " \
                          "document: #{rc.message}"
                Log.error(K8sGroup::COMP, message, group.cluster_id)

                return ODS::Job.fail(message)
            end

            ODS::Job.success
        end

        #------------------------------------------------------
        # Group dependencies
        #------------------------------------------------------

        # Recreates a clean dependency state before retrying bootstrapping.
        def recover_dependencies(group, **_opts)
            Log.debug(
                K8sGroup::COMP,
                'Recovering dependencies ' \
                "#{group.dependencies.map(&:name).join(', ')}",
                group.cluster_id
            )

            rc = group.recover_dependencies
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            rc = group.update
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            ODS::Job.success
        end

        # Waits for one dependency creation task to finish.
        def wait_dependency(dependency, group:, external_user:, cancel_flag:)
            Log.debug(
                K8sGroup::COMP,
                "Waiting for dependency #{dependency.name} " \
                "(ID=#{dependency.id || 'pending'})",
                group.cluster_id
            )

            client_provider = -> { pool.impersonate(external_user) }
            rc = dependency.wait_create(
                group, cancel_flag, :client_provider => client_provider
            )
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            Log.debug(
                K8sGroup::COMP,
                "Dependency #{dependency.name} completed " \
                "(ID=#{dependency.id || 'removed'})",
                group.cluster_id
            )

            dependency
        end

        # Marks a completed dependency as ready and persists the group.
        def commit_dependency(group, _item, dependency, **_opts)
            Log.debug(
                K8sGroup::COMP,
                "Marking dependency #{dependency.name} ready " \
                "(ID=#{dependency.id || 'none'})",
                group.cluster_id
            )

            rc = K8sDependency.notify_ready(group, dependency)
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            rc = group.update
            return ODS::Job.fail(rc.message) if OpenNebula.is_error?(rc)

            true
        end

        #------------------------------------------------------
        # Event checks and callbacks
        #------------------------------------------------------

        # Applies a node readiness event and updates the stable group state.
        def update_node_readiness(group, vm_id:, ready:, **_opts)
            raise ArgumentError, "VM #{vm_id} is not registered in Group #{group.id}" \
                unless group.vm_registered?(vm_id)

            changed = group.update_vm_ready(vm_id, ready)

            if group.running? && !ready && group.active_job.nil?
                Log.error(
                    K8sGroup::COMP,
                    "VM #{vm_id} is not Kubernetes ready; " \
                    "#{group.type} (ID=#{group.id}) entered WARNING",
                    group.cluster_id
                )

                group.state = :WARNING
                return ODS::EventResult.handled(:warning)
            end

            if group.warning? && ready && group.ready? && group.active_job.nil?
                Log.info(
                    K8sGroup::COMP,
                    "#{group.type} (ID=#{group.id}) recovered from WARNING",
                    group.cluster_id
                )

                group.state = :RUNNING
                return ODS::EventResult.handled(:running)
            end

            return ODS::EventResult.handled(:readiness_updated) if changed

            ODS::EventResult.ignore(:readiness_unchanged)
        end

        # Checks whether all expected nodes in the group are ready.
        def group_ready(group, **_opts)
            ready = group.ready?

            Log.debug(
                K8sGroup::COMP,
                "Registered VMs=#{group.vms.size}/" \
                "#{group.expected_size}, ready=#{ready}",
                group.cluster_id
            )

            ready
        end

        # Checks whether the group has no registered VMs left.
        def group_empty(group, **_opts)
            empty = group.empty?

            Log.debug(
                K8sGroup::COMP,
                "Remaining VMs=#{group.vm_ids.join(', ')}, empty=#{empty}",
                group.cluster_id
            )

            empty
        end

    end

end
