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

    # Cluster Actions for LCM
    module ClusterActions

        COMP = 'EVT'

        def cluster_provision_action(cluster_id, external_user)
            cplane_id = nil

            rc = @cluster_pool.get(cluster_id, external_user) do |cluster|
                cluster.state = :PROVISIONING
                cplane_id = cluster.control_plane[:id]

                next OpenNebula::Error.new(
                    'Error getting ControlPlane ID', OpenNebula::Error::EACTION
                ) if cplane_id.nil?
            end

            if OpenNebula.is_error?(rc)
                action = :cluster_provision_failure_cb
                args   = [cluster_id, external_user]

                Log.error(
                    COMP, "Cluster #{cluster_id} provision failed: #{rc.message}", cluster_id
                )
            else
                action = :group_bootstrap_action
                args   = [cplane_id, external_user]

                Log.info(
                    COMP, "Cluster #{cluster_id} provision started", cluster_id
                )
            end

            trigger_action(:name => action, :args => args)
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(CLUSTER_ID=#{cluster_id}): #{e.class}: #{e.message}"
            )
        end

        def cluster_create_group_action(cluster_id, group_id, external_user)
            added = false

            rc = @cluster_pool.get(cluster_id, external_user) do |cluster|
                group = @group_pool.get(group_id, external_user)
                next group if OpenNebula.is_error?(group)

                rc = cluster.add_group(group)
                next rc if OpenNebula.is_error?(rc)

                added = true

                if cluster.running?
                    cluster.state = :SCALING
                else
                    rc = cluster.update
                    next rc if OpenNebula.is_error?(rc)
                end
            end

            if OpenNebula.is_error?(rc)
                Log.error(
                    COMP,
                    "Cluster #{cluster_id} create group failed: #{rc.message}",
                    cluster_id
                )

                rollback_created_group(cluster_id, group_id, external_user, added)
                return
            end

            Log.info(
                COMP,
                "Cluster #{cluster_id} group #{group_id} creation started",
                cluster_id
            )

            rc = trigger_action(
                :name => :group_bootstrap_action,
                :args => [group_id, external_user]
            )

            return unless OpenNebula.is_error?(rc)

            Log.error(
                COMP,
                "Cluster #{cluster_id} failed to trigger group " \
                "#{group_id} bootstrap: #{rc.message}",
                cluster_id
            )

            rollback_created_group(cluster_id, group_id, external_user, added)
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(CLUSTER_ID=#{cluster_id}, GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def cluster_deprovision_group_action(cluster_id, group_id, external_user)
            rc = @cluster_pool.get(cluster_id, external_user) do |cluster|
                cluster.state = :SCALING if cluster.running? || cluster.warning?
            end

            if OpenNebula.is_error?(rc)
                Log.error(
                    COMP,
                    "Cluster #{cluster_id} deprovision group #{group_id} failed: #{rc.message}",
                    cluster_id
                )
                return
            end

            Log.info(
                COMP,
                "Cluster #{cluster_id} deprovisioning group #{group_id}",
                cluster_id
            )

            trigger_action(
                :name => :group_deprovision_action,
                :args => [group_id, external_user, false]
            )
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(CLUSTER_ID=#{cluster_id}, GROUP_ID=#{group_id}): #{e.class}: #{e.message}"
            )
        end

        def cluster_deprovision_action(cluster_id, external_user)
            groups = nil

            rc = @cluster_pool.get(cluster_id, external_user) do |cluster|
                cluster.state = :DEPROVISIONING
                groups = cluster.groups
            end

            if OpenNebula.is_error?(rc)
                Log.error(COMP, "Error deprovisioning cluster: #{rc.message}", cluster_id)

                trigger_action(
                    :name => :cluster_deprovision_failure_cb,
                    :args => [cluster_id, external_user]
                )
            else
                Log.info(COMP, 'Deprovisioning cluster', cluster_id)

                if groups.empty?
                    rc = @cluster_pool.get(cluster_id, external_user) do |cluster|
                        cluster.state = cluster.reconciled_state

                        if cluster.state == :DONE
                            rc = cluster.delete
                            next rc if OpenNebula.is_error?(rc)
                        end
                    end

                    if OpenNebula.is_error?(rc)
                        Log.error(
                            COMP,
                            "Error finalizing empty cluster #{cluster_id}: #{rc.message}",
                            cluster_id
                        )

                        trigger_action(
                            :name => :cluster_deprovision_failure_cb,
                            :args => [cluster_id, external_user]
                        )
                    end

                    return
                end

                groups.each do |group|
                    trigger_action(
                        :name => :group_deprovision_action,
                        :args => [group[:id], external_user, true]
                    )
                end
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(CLUSTER_ID=#{cluster_id}): #{e.class}: #{e.message}"
            )
        end

        def cluster_recover_action(cluster_id, external_user)
            recoverable_group_ids = []

            rc = @cluster_pool.get(cluster_id, external_user) do |cluster|
                cluster.groups.each do |group_ref|
                    group_rc = @group_pool.get(group_ref[:id], external_user)
                    next if OpenNebula.is_error?(group_rc)
                    next unless K8sGroup.recovery_for(group_rc.state)

                    recoverable_group_ids << group_rc.id
                end

                next if recoverable_group_ids.empty?

                recover_state = OneKS::Cluster::RECOVER_STATES[cluster.state]
                cluster.state = recover_state if recover_state
            end

            if OpenNebula.is_error?(rc)
                Log.error(COMP, "Error recovering cluster: #{rc.message}", cluster_id)
                return
            end

            if recoverable_group_ids.empty?
                Log.error(
                    COMP,
                    "Cluster #{cluster_id} has no groups in a recoverable state",
                    cluster_id
                )
                return
            end

            Log.info(
                COMP,
                "Recovering cluster #{cluster_id} groups: #{recoverable_group_ids.join(', ')}",
                cluster_id
            )

            recoverable_group_ids.each do |group_id|
                trigger_action(
                    :name => :group_recover_action,
                    :args => [group_id, external_user]
                )
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(CLUSTER_ID=#{cluster_id}): #{e.class}: #{e.message}"
            )
        end

        private

        def rollback_created_group(cluster_id, group_id, external_user, added)
            if added
                @cluster_pool.get(cluster_id, external_user) do |cluster|
                    rc = cluster.del_group(group_id)
                    next rc if OpenNebula.is_error?(rc)

                    rc = cluster.update
                    next rc if OpenNebula.is_error?(rc)

                    cluster.state = cluster.reconciled_state
                end
            end

            @group_pool.get(group_id, external_user) do |group|
                group.delete(:force => true)
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "Failed to rollback created group #{group_id} for cluster #{cluster_id}: " \
                "#{e.class}: #{e.message}",
                cluster_id
            )
        end

    end

end
