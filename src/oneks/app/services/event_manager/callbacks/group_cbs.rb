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

    # Group Callbacks for LCM
    module GroupCallbacks

        COMP = 'EVT'

        def group_bootstrap_cb(group_id, external_user)
            group = @group_pool.get(group_id, external_user)

            if OpenNebula.is_error?(group)
                Log.error(COMP, "#{__method__}: Failed to get group #{group_id}: #{group.message}")

                trigger_action(
                    :name => :group_bootstrap_failure_cb,
                    :args => [group_id, external_user]
                )

                return
            end

            cluster_id = group.cluster_id
            ready_flag = false

            if group.dependencies.empty?
                Log.info(
                    COMP,
                    "No dependencies found for #{group.type} " \
                    "(ID=#{group.id}), skipping bootstrap",
                    cluster_id
                )

                trigger_action(
                    :name => :group_provision_action,
                    :args => [group_id, external_user]
                )

                return
            end

            on_success = lambda do |dep|
                Log.info(
                    COMP,
                    "Dependency #{dep.name} reached READY state " \
                    "for #{group.type} (ID=#{group.id})",
                    cluster_id
                )

                rc = @group_pool.get(group_id, external_user) do |grp|
                    K8sDependency.notify_ready(grp, dep)
                    ready_flag = K8sDependency.all_ready?(grp.dependencies)

                    grp.update
                end

                if OpenNebula.is_error?(rc)
                    Log.error(
                        COMP,
                        "Error setting dependency #{dep.name} " \
                        "to ready for #{group.type} (ID=#{group.id}): #{rc.message}",
                        cluster_id
                    )
                    return
                end

                unless ready_flag
                    Log.info(
                        COMP,
                        'Waiting for other dependencies for ' \
                        "#{group.type} (ID=#{group.id})...",
                        cluster_id
                    )
                    return
                end

                Log.info(
                    COMP,
                    "All dependencies for #{group.type} (ID=#{group.id}) " \
                    'have successfully reached the READY state',
                    cluster_id
                )

                trigger_action(
                    :name => :group_provision_action,
                    :args => [group_id, external_user]
                )
            end

            on_failure = lambda do |dep, err|
                Log.error(
                    COMP,
                    "Dependency #{dep.name} failed for group #{group.id}: #{err.message}",
                    cluster_id
                )

                trigger_action(
                    :name => :group_bootstrap_failure_cb,
                    :args => [group_id, external_user]
                )
            end

            # Run all dependencies post create methods in parallel
            @tm.run_list_block(
                group.dependencies,
                :on_success => on_success,
                :on_failure => on_failure
            ) do |dep, stop_flag|
                rc = dep.wait_create(group, stop_flag)
                next rc if OpenNebula.is_error?(rc)

                dep.destroy(group) if dep.destroy_on_ready?
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_upgrade_cb(_group_id, _external_user)
            nil
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        #------------------------------------------------------
        # Failures callbacks
        #------------------------------------------------------

        def group_bootstrap_failure_cb(group_id, external_user)
            cluster_id = nil

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id = group.cluster_id
                group.state = :BOOTSTRAPPING_FAILURE
            end

            return if OpenNebula.is_error?(rc)

            notify_cluster_group_failure(cluster_id, external_user)
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_provision_failure_cb(group_id, external_user)
            cluster_id = nil

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id = group.cluster_id
                group.state = :PROVISIONING_FAILURE
            end

            return if OpenNebula.is_error?(rc)

            notify_cluster_group_failure(cluster_id, external_user)
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_scale_failure_cb(group_id, external_user)
            cluster_id = nil

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id  = group.cluster_id
                group.state = :SCALING_FAILURE
            end

            return if OpenNebula.is_error?(rc)

            notify_cluster_group_failure(cluster_id, external_user)
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_upgrade_failure_cb(group_id, external_user)
            cluster_id = nil

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id = group.cluster_id
                group.state = :UPGRADING_FAILURE
            end

            return if OpenNebula.is_error?(rc)

            notify_cluster_group_failure(cluster_id, external_user)
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_deprovision_failure_cb(group_id, external_user)
            cluster_id = nil

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id = group.cluster_id
                group.state = :DEPROVISIONING_FAILURE
            end

            return if OpenNebula.is_error?(rc)

            notify_cluster_group_failure(cluster_id, external_user)
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def notify_cluster_group_failure(cluster_id, external_user)
            return if cluster_id.nil?

            rc = @cluster_pool.get(cluster_id, external_user) do |cluster|
                next unless cluster

                target_state = cluster.group_failure_state
                next unless target_state
                next if cluster.state == target_state

                cluster.state = target_state
            end

            return unless OpenNebula.is_error?(rc)

            Log.error(
                COMP,
                "Failed to update cluster #{cluster_id} after group failure: #{rc.message}",
                cluster_id
            )
        end

    end

end
