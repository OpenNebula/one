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

require 'ffi-rzmq'
require 'set'

module OneKS

    # Cluster watchdog class
    class ClusterWD

        COMP = 'WDT'

        # Hook events
        VM_EVENT_STATE     = 'EVENT STATE VM'
        VM_API_ALLOCATE    = 'EVENT API one.vm.allocate 1'

        # Initializes the EventManager.
        # Sets up ZMQ context, configuration, and cluster tracking.
        #
        # @param cloud_auth [CloudAuth] authentication handler
        # @param am [ActionManager] action manager instance
        # @param opts [Hash] optional configuration overrides
        def initialize(cloud_auth, event_manager, opts = {})
            @cloud_auth = cloud_auth
            @em         = event_manager
            @conf       = SERVER_CONF.merge(opts)

            # Array of running cluster to watch
            @tm            = ODS::ThreadManager.instance
            @mutex         = Mutex.new
            @clusters      = []
        end

        def start(cluster_pool, group_pool)
            @cluster_pool = cluster_pool
            @group_pool   = group_pool

            # Hash keyed by vm_id -> VM hash
            # Ensures uniqueness and search by VM O(1)
            @vm_by_id = {}
            # Hash keyed by cluster_id -> Set of vm_id
            # Fast search of VMs per cluster O(1)
            @vm_ids_by_cluster = Hash.new {|h, k| h[k] = Set.new }
            # Hash keyed by nodegroup_id -> Set of vm_id
            # Fast search of VMs per nodegroup O(1)
            @vm_ids_by_group = Hash.new {|h, k| h[k] = Set.new }

            # Init VM indexes
            @group_pool.vms.each do |obj|
                register_vm(obj[:id], obj[:group_id], obj[:cluster_id])
            end

            Log.info(COMP, 'Starting Cluster Watchdog')

            @tm.start(:wd_vm_allocation)       { watch_vm_allocation }
            @tm.start(:watch_vm_state_changes) { watch_vm_state_changes }
        rescue StandardError => e
            Log.error(COMP, "Cluster watchdog start crashed: #{e.class}: #{e.message}")
        end

        #------------------------------------------------------
        # Indexes
        #------------------------------------------------------

        def register_vm(vm_id, group_id, cluster_id)
            return if vm_id.nil? || group_id.nil? || cluster_id.nil?

            @mutex.synchronize do
                return if @vm_by_id.key?(vm_id)

                entry = { :id => vm_id, :group_id => group_id, :cluster_id => cluster_id }

                # Update indexes
                @vm_by_id[vm_id] = entry
                @vm_ids_by_cluster[cluster_id] << vm_id
                @vm_ids_by_group[group_id]     << vm_id
            end

            Log.debug(
                COMP,
                "Registered VM_ID=#{vm_id} (GROUP_ID=#{group_id}) for monitoring", cluster_id
            )
        end

        def unregister_vm(vm_id)
            return if vm_id.nil?

            removed    = nil
            group_id   = nil
            cluster_id = nil

            @mutex.synchronize do
                removed = @vm_by_id.delete(vm_id)
                return unless removed

                group_id   = removed[:group_id]
                cluster_id = removed[:cluster_id]

                @vm_ids_by_cluster[cluster_id].delete(vm_id)
                @vm_ids_by_cluster.delete(cluster_id) if @vm_ids_by_cluster[cluster_id].empty?

                @vm_ids_by_group[group_id].delete(vm_id)
                @vm_ids_by_group.delete(group_id) if @vm_ids_by_group[group_id].empty?
            end

            Log.debug(
                COMP,
                "Unregistered VM_ID=#{vm_id} (GROUP_ID=#{group_id}) from monitoring",
                cluster_id
            )
        end

        def vm_registered?(vm_id)
            return false if vm_id.nil?

            @mutex.synchronize do
                @vm_by_id.key?(vm_id)
            end
        end

        #------------------------------------------------------
        # Watchers
        #------------------------------------------------------

        def watch_vm_allocation
            Log.debug(COMP, 'Subscribed to VM allocation events')

            ODS::EventSubscriber.subscribe_for(VM_API_ALLOCATE) do |xml|
                # If event nil, is not an event related to OneKS
                event = OneKS::EventManager.parse_oneks_body(xml)
                next unless event

                next if vm_registered?(event[:vm_id])

                register_vm(event[:vm_id], event[:group_id], event[:cluster_id])

                @em.trigger_action(
                    :name => :new_vm_wd_cb,
                    :args => [event[:cluster_id], event[:group_id], event[:vm_id], nil]
                )
            end
        rescue StandardError => e
            Log.error(COMP, "watch_vm_allocation loop crashed: #{e.class}: #{e.message}")
        end

        def watch_vm_state_changes
            Log.debug(COMP, 'Subscribed to VM state events')

            ODS::EventSubscriber.subscribe_for(VM_EVENT_STATE) do |xml|
                # If event nil, is not an event related to OneKS
                event = OneKS::EventManager.parse_oneks_body(xml)
                next unless event

                vm_state = xml.xpath('/HOOK_MESSAGE/STATE').text
                vm_lcm   = xml.xpath('/HOOK_MESSAGE/LCM_STATE').text

                should_check = false

                # Only check the VM if we have an entry for it
                @mutex.synchronize do
                    entry = @vm_by_id[event[:vm_id]]
                    should_check = entry && entry[:cluster_id] == event[:cluster_id]
                end

                next unless should_check

                Log.debug(
                    COMP, "VM state event: VM_ID=#{event[:vm_id]} " \
                    "(STATE=#{vm_state}, LCM_STATE=#{vm_lcm})", event[:cluster_id]
                )

                check_vm_state(event, :state => vm_state, :lcm => vm_lcm)
            end
        rescue StandardError => e
            Log.error(COMP, "watch_vm_state_changes loop crashed: #{e.class}: #{e.message}")
        end

        #------------------------------------------------------
        # State Helpers
        #------------------------------------------------------

        def check_vm_state(event, state: nil, lcm: nil)
            cluster_id = event[:cluster_id]
            vm_id      = event[:vm_id]
            group_id   = event[:group_id]

            if state.nil? || lcm.nil?
                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @cloud_auth.client)
                rc = vm.info

                if OpenNebula.is_error?(rc)
                    Log.error(
                        COMP, "Failed to info VM #{vm_id}: #{rc.message}", cluster_id
                    )
                    return
                end

                state = OpenNebula::VirtualMachine::VM_STATE[vm.state]
                lcm   = OpenNebula::VirtualMachine::LCM_STATE[vm.lcm_state]
            end

            action =
                if EventManager::FAILURE_STATES.include?(state) ||
                   EventManager::FAILURE_STATES.include?(lcm)
                    :warning_wd_cb
                elsif EventManager::WARNING_STATES.include?(state) ||
                      EventManager::WARNING_STATES.include?(lcm)
                    :warning_wd_cb
                elsif state == 'DONE'
                    :done_wd_cb
                elsif lcm == 'RUNNING'
                    :running_wd_cb
                end

            return unless action

            unregister_vm(vm_id) if action == :done_wd_cb

            Log.debug(
                COMP, "Triggering #{action} for VM_ID=#{vm_id} " \
                "(STATE=#{state}, LCM_STATE=#{lcm}) in GROUP_ID=#{group_id}", cluster_id
            )

            @em.trigger_action(
                :name => action,
                :args => [cluster_id, group_id, vm_id, nil]
            )
        rescue StandardError => e
            Log.error(
                COMP, "Failed to check VM #{vm_id} state: #{e.class}: #{e.message}", cluster_id
            )
        end

        class << self

            def group_registered?(cluster_pool, cluster_id, group_id)
                cluster = cluster_pool.get(cluster_id)
                return cluster if OpenNebula.is_error?(cluster)

                cluster.groups.any? {|group| group[:id].to_i == group_id.to_i }
            end

            def group_exists?(group_pool, group_id)
                return false if group_pool.nil? || group_id.nil?

                rc = group_pool.get(group_id)
                !OpenNebula.is_error?(rc)
            end

        end

    end

end
