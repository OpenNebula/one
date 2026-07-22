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

    # Group Actions for LCM
    module GroupActions

        COMP = 'EVT'

        def group_bootstrap_action(group_id, external_user)
            cluster_id = nil
            group_type = nil

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id  = group.cluster_id
                group_type  = group.type
                group.state = :BOOTSTRAPPING

                next if SKIP_DEPENDENCIES

                rc = K8sGroup.build_dependencies(group)
                next rc if OpenNebula.is_error?(rc)

                rc = group.update
                next rc if OpenNebula.is_error?(rc)

                rc = group.bootstrap_dependencies
                next rc if OpenNebula.is_error?(rc)

                group.update
            end

            if OpenNebula.is_error?(rc)
                action = :group_bootstrap_failure_cb
                Log.error(
                    COMP,
                    "#{group_type} (ID=#{group_id}) bootstrap failed: #{rc.message}",
                    cluster_id
                )
            else
                action = :group_bootstrap_cb
                Log.info(
                    COMP,
                    "#{group_type} (ID=#{group_id}) bootstrap successfully",
                    cluster_id
                )
            end

            trigger_action(:name => action, :args => [group_id, external_user])
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_provision_action(group_id, external_user)
            cluster_id = nil
            group_type = nil

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id  = group.cluster_id
                group_type  = group.type
                group.state = :PROVISIONING

                group.provision
            end

            if OpenNebula.is_error?(rc)
                action = :group_provision_failure_cb
                Log.error(
                    COMP,
                    "#{group_type} (ID=#{group_id}) provision failed: #{rc.message}",
                    cluster_id
                )
            else
                action = :group_running_action
            end

            trigger_action(:name => action, :args => [group_id, external_user])
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_running_action(group_id, external_user)
            cluster_id = nil
            group_type = nil
            running    = false

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id = group.cluster_id
                group_type = group.type
                next unless group.ready?

                running = true
                group.state = :RUNNING
            end

            if OpenNebula.is_error?(rc)
                Log.error(
                    COMP,
                    "#{group_type} (ID=#{group_id}) running action failed: #{rc.message}",
                    cluster_id
                )

                return
            end

            unless running
                Log.info(
                    COMP,
                    "#{group_type} (ID=#{group_id}) is waiting to become ready",
                    cluster_id
                )
                return
            end

            rc = @cluster_pool.get(cluster_id, external_user) do |cluster|
                cluster.state = cluster.reconciled_state
            end

            return unless OpenNebula.is_error?(rc)

            Log.error(
                COMP,
                "Cluster (ID=#{cluster_id}) state reconciliation failed: #{rc.message}",
                cluster_id
            )
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_scale_action(group_id, target, external_user)
            cluster_id = nil
            group_type = nil
            skipped    = false

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id = group.cluster_id
                group_type = group.type

                case group.state
                when :SCALING
                    Log.warn(
                        COMP,
                        "#{group_type} (ID=#{group_id}) is already scaling " \
                        "to target #{group.expected_size}, skipping scale",
                        cluster_id
                    )

                    skipped = true
                    next
                when :SCALING_FAILURE
                    unless target == group.expected_size
                        Log.warn(
                            COMP,
                            "#{group_type} (ID=#{group_id}) cannot retry scale " \
                            "to target #{target}; expected target is #{group.expected_size}",
                            cluster_id
                        )

                        skipped = true
                        next
                    end
                else
                    if target == group.expected_size
                        Log.info(
                            COMP,
                            "#{group_type} (ID=#{group_id}) already has target " \
                            "#{target}, skipping scale",
                            cluster_id
                        )

                        skipped = true
                        next
                    end
                end

                group.state = :SCALING
                rc = group.scale(target)
                next rc if OpenNebula.is_error?(rc)

                group.update
            end

            return if skipped

            if OpenNebula.is_error?(rc)
                Log.error(
                    COMP,
                    "#{group_type} (ID=#{group_id}) scale failed: #{rc.message}",
                    cluster_id
                )

                trigger_action(
                    :name => :group_scale_failure_cb,
                    :args => [group_id, external_user]
                )
                return
            else
                Log.info(
                    COMP,
                    "#{group_type} (ID=#{group_id}) scaling requested " \
                    "(target=#{target})",
                    cluster_id
                )
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_upgrade_action(group_id, external_user)
            cluster_id = nil
            group_type = nil

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id  = group.cluster_id
                group_type  = group.type
                group.state = :UPGRADING

                group.upgrade
            end

            if OpenNebula.is_error?(rc)
                Log.error(
                    COMP,
                    "#{group_type} (ID=#{group_id}) upgrade failed: #{rc.message}",
                    cluster_id
                )

                trigger_action(
                    :name => :group_upgrade_failure_cb,
                    :args => [group_id, external_user]
                )
            else
                Log.info(
                    COMP,
                    "#{group_type} (ID=#{group_id}) upgrading started",
                    cluster_id
                )

                # TODO: monitor upgrade progress from K8s cluster
                trigger_action(
                    :name => :group_running_action,
                    :args => [group_id, external_user]
                )
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_deprovision_action(group_id, external_user, force = false)
            cluster_id = nil
            group_type = nil
            finalize   = false

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id  = group.cluster_id
                group_type  = group.type
                group.state = :DEPROVISIONING

                rc = group.deprovision(:force => force)
                next rc if OpenNebula.is_error?(rc)

                rc = group.cleanup_dependencies
                next rc if OpenNebula.is_error?(rc)

                finalize = group.empty?
            end

            unless OpenNebula.is_error?(rc)
                trigger_action(
                    :name => :group_done_action,
                    :args => [group_id, external_user]
                ) if finalize

                return
            end

            Log.error(
                COMP,
                "#{group_type} (ID=#{group_id}) deprovision failed: #{rc.message}",
                cluster_id
            )

            trigger_action(
                :name => :group_deprovision_failure_cb,
                :args => [group_id, external_user]
            )
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_done_action(group_id, external_user)
            cluster_id = nil

            rc = @group_pool.get(group_id, external_user) do |group|
                cluster_id  = group.cluster_id
                group.state = :DONE
                group.delete
            end

            if OpenNebula.is_error?(rc)
                Log.error(
                    COMP, "#{__method__}: Failed to finalize group #{group_id}: #{rc.message}"
                )
                return
            end

            rc = @cluster_pool.get(cluster_id, external_user) do |cluster|
                rc = cluster.del_group(group_id)
                next rc if OpenNebula.is_error?(rc)

                rc = cluster.update
                next rc if OpenNebula.is_error?(rc)

                cluster.state = cluster.reconciled_state

                if cluster.state == :DONE
                    rc = cluster.delete
                    next rc if OpenNebula.is_error?(rc)
                end
            end

            return unless OpenNebula.is_error?(rc)

            Log.error(
                COMP,
                "#{__method__}: Failed to detach group #{group_id} " \
                "from cluster #{cluster_id}: #{rc.message}"
            )
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def group_recover_action(group_id, external_user)
            group = @group_pool.get(group_id, external_user)

            if OpenNebula.is_error?(group)
                Log.error(COMP, "Failed to get group #{group_id}: #{group.message}")
                return
            end

            cluster_id = group.cluster_id
            group_type = group.type
            state      = group.state

            action = K8sGroup.recovery_for(state)

            unless action
                Log.error(
                    COMP,
                    "#{group_type} (ID=#{group_id}) cannot be recovered from state #{state}",
                    cluster_id
                )
                return
            end

            case action
            when :group_bootstrap_action
                rc = @group_pool.get(group_id, external_user) do |grp|
                    recover_rc = grp.recover_dependencies
                    next recover_rc if OpenNebula.is_error?(recover_rc)

                    grp.update
                end

                # Ensure group is in failure if recover dependency fails
                if OpenNebula.is_error?(rc)
                    Log.error(
                        COMP,
                        "#{group_type} (ID=#{group_id}) dependency " \
                        "recovery failed: #{rc.message}",
                        cluster_id
                    )

                    trigger_action(
                        :name => :group_bootstrap_failure_cb,
                        :args => [group_id, external_user]
                    )
                    return
                end

                Log.info(
                    COMP,
                    "Recovering #{group_type} (ID=#{group_id}) from state #{state} " \
                    "by retrying #{action}",
                    cluster_id
                )

                trigger_action(
                    :name => action,
                    :args => [group_id, external_user]
                )
            when :group_scale_action
                target = group.expected_size

                Log.info(
                    COMP,
                    "Recovering #{group_type} (ID=#{group_id}) from state #{state} " \
                    "by retrying #{action} with target #{target}",
                    cluster_id
                )

                trigger_action(
                    :name => action,
                    :args => [group_id, target, external_user]
                )
            else
                Log.info(
                    COMP,
                    "Recovering #{group_type} (ID=#{group_id}) from state #{state} " \
                    "by retrying #{action}",
                    cluster_id
                )

                trigger_action(
                    :name => action,
                    :args => [group_id, external_user]
                )
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

    end

end
