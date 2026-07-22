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

    # Watchdog Callbacks for LCM
    module WatchdogCallbacks

        COMP = 'EVT'

        #------------------------------------------------------
        # Event object creation callbacks
        #------------------------------------------------------

        # Triggered when a new VM is allocated for a group.
        # Registers the VM and updates the group state for provisioning or scaling.
        def new_vm_wd_cb(cluster_id, group_id, vm_id, external_user)
            return unless require_params(cluster_id, group_id, vm_id)

            rc = @group_pool.get(group_id, external_user) do |group|
                next if group.vms.include?(vm_id)

                Log.info(
                    COMP, "Adding VM #{vm_id} (TYPE=#{group.type}, GROUP_ID=#{group.id}) " \
                    'to the cluster', cluster_id
                )

                group.add_vm(vm_id)

                case group.state
                when :PENDING
                    group.state = :PROVISIONING
                when :RUNNING
                    group.state = :SCALING
                end

                group.update
            end

            if OpenNebula.is_error?(rc)
                Log.error(
                    COMP, "#{__method__}: Failed updating group: #{rc.message}",
                    cluster_id
                )
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}, VM_ID=#{vm_id}): #{e.class}: #{e.message}",
                cluster_id
            )
        end

        #------------------------------------------------------
        # State callbacks
        #------------------------------------------------------

        # Triggered when a VM reaches RUNNING state.
        # Moves the group to :RUNNING once all its VMs are running.
        def running_wd_cb(cluster_id, group_id, vm_id, external_user)
            return unless require_params(cluster_id, group_id, vm_id)

            prev_state    = nil
            enter_running = false

            rc = @group_pool.get(group_id, external_user) do |group|
                next if group.state == :RUNNING

                prev_state = group.state

                case group.state
                when :PROVISIONING
                    next unless group.ready?

                    Log.info(
                        COMP,
                        "#{group.type} (ID=#{group.id}) provisioned successfully",
                        cluster_id
                    )
                when :SCALING
                    next unless group.ready?

                    Log.info(
                        COMP,
                        "#{group.type} (ID=#{group.id}) reached expected size",
                        cluster_id
                    )
                when :WARNING
                    next unless group.ready?

                    Log.info(
                        COMP,
                        "#{group.type} (ID=#{group.id}) recovered from WARNING",
                        cluster_id
                    )
                else
                    next
                end

                Log.info(
                    COMP, "#{group.type} (ID=#{group.id}) is now RUNNING",
                    cluster_id
                )

                group.state = :RUNNING

                upd_rc = group.update
                next upd_rc if OpenNebula.is_error?(upd_rc)

                enter_running = true
            end

            if OpenNebula.is_error?(rc)
                Log.error(
                    COMP, "#{__method__}: Failed updating group: #{rc.message}", cluster_id
                )

                action =
                    case prev_state
                    when :PROVISIONING
                        :group_provision_failure_cb
                    when :SCALING
                        :group_scale_failure_cb
                    end

                if action
                    trigger_action(
                        :name => action,
                        :args => [group_id, external_user]
                    )
                end
            end

            return unless enter_running

            trigger_action(
                :name => :group_running_action,
                :args => [group_id, external_user]
            )
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}, VM_ID=#{vm_id}): #{e.class}: #{e.message}",
                cluster_id
            )
        end

        # Triggered when a VM enters a warning or failure state.
        # Marks the group as :WARNING if it is not already.
        def warning_wd_cb(cluster_id, group_id, vm_id, external_user)
            return unless require_params(cluster_id, group_id, vm_id)
            return unless ClusterWD.group_exists?(@group_pool, group_id)

            enter_warning = false

            rc = @group_pool.get(group_id, external_user) do |group|
                next if group.state != :RUNNING
                next if group.state == :WARNING

                Log.error(
                    COMP, "VM #{vm_id} entered WARNING state " \
                    "(TYPE=#{group.type}, GROUP_ID=#{group.id} )", cluster_id
                )

                group.state = :WARNING
                group.update

                enter_warning = true
            end

            if OpenNebula.is_error?(rc)
                Log.error(
                    COMP, "#{__method__}: Failed processing warning callback: #{rc.message}",
                    cluster_id
                )
                return
            end

            # Notify cluster only if the group actually changed state
            return unless enter_warning

            trigger_action(
                :name => :notify_cluster_group_failure,
                :args => [cluster_id, external_user]
            )
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}, VM_ID=#{vm_id}): #{e.class}: #{e.message}",
                cluster_id
            )
        end

        # Triggered when a VM reaches DONE state.
        # Removes the VM from the group and updates the group state if needed.
        def done_wd_cb(cluster_id, group_id, vm_id, external_user)
            return unless require_params(cluster_id, group_id, vm_id)
            return unless ClusterWD.group_exists?(@group_pool, group_id)

            prev_state    = nil
            enter_done    = false
            enter_running = false

            rc = @group_pool.get(group_id, external_user) do |group|
                next unless group.vms.include?(vm_id)

                prev_state = group.state

                Log.info(
                    COMP, "Removing VM #{vm_id} (TYPE=#{group.type}, GROUP_ID=#{group.id})",
                    cluster_id
                )

                group.del_vm(vm_id)

                case group.state
                when :DEPROVISIONING
                    if group.empty?
                        Log.info(
                            COMP, "#{group.type} #{group.id} is empty",
                            cluster_id
                        )

                        group.state = :DONE
                        enter_done  = true
                    end
                when :SCALING
                    if group.expected_size == group.vms.size
                        Log.info(
                            COMP,
                            "#{group.type} (ID=#{group.id}) reached expected size",
                            cluster_id
                        )

                        group.state     = :RUNNING
                        enter_running   = true
                    end
                end

                upd_rc = group.update
                next upd_rc if OpenNebula.is_error?(upd_rc)
            end

            if OpenNebula.is_error?(rc)
                Log.error(
                    COMP, "#{__method__}: Failed updating group: #{rc.message}",
                    cluster_id
                )

                action =
                    case prev_state
                    when :DEPROVISIONING
                        :group_deprovision_failure_cb
                    when :SCALING
                        :group_scale_failure_cb
                    end

                if action
                    trigger_action(
                        :name => action,
                        :args => [group_id, external_user]
                    )
                end

                return
            end

            if enter_done
                trigger_action(
                    :name => :group_done_action,
                    :args => [group_id, external_user]
                )
            end

            if enter_running
                trigger_action(
                    :name => :group_running_action,
                    :args => [group_id, external_user]
                )
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(GROUP_ID=#{group_id}, VM_ID=#{vm_id}): #{e.class}: #{e.message}",
                cluster_id
            )
        end

        # Checks that any param is nil
        def require_params(*params)
            missing = params.each_index.select {|i| params[i].nil? }
            return true if missing.empty?

            caller = caller_locations(1, 1)[0].label
            Log.error(COMP, "#{caller}: Missing parameters at positions: #{missing.join(', ')}")

            false
        end

    end

end
