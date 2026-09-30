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

    # Virtual machine watchdog for OneKS groups
    class VMWatchdog

        COMP = 'WDT'

        # Hook events
        VM_EVENT_STATE  = 'EVENT STATE VM'
        VM_API_ALLOCATE = 'EVENT API one.vm.allocate 1'

        # Initializes the VM watchdog.
        #
        # @param lcm [GroupLCM] Group lifecycle workflow
        # @param auth [CloudAuth] Authentication source for fresh administrative clients
        def initialize(lcm, auth:)
            @lcm     = lcm
            @auth    = auth
            @tm      = ODS::ThreadManager.instance
            @mutex   = Mutex.new
            @stop    = ODS::CancelFlag.new
            @started = false
        end

        def start(group_pool)
            return true if @started

            rc = group_pool.info
            return rc if OpenNebula.is_error?(rc)

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
            group_pool.vms.each do |obj|
                register_vm(obj[:id], obj[:group_id], obj[:cluster_id])
            end

            Log.info(COMP, 'Starting VM Watchdog')

            @tm.on_stop { stop }
            @tm.start(:wd_vm_allocation)       { watch_vm_allocation }
            @tm.start(:watch_vm_state_changes) { watch_vm_state_changes }

            # TODO: implement once we hace options to filter by label at core level
            # rc = reconcile_vms
            # if OpenNebula.is_error?(rc)
            #     stop
            #     return rc
            # end

            @started = true
            true
        rescue StandardError => e
            stop

            OpenNebula::Error.new(
                "VM watchdog start failed: #{e.class}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def stop
            @stop.cancel!
        end

        #------------------------------------------------------
        # Indexes
        #------------------------------------------------------

        def register_vm(vm_id, group_id, cluster_id)
            return if vm_id.nil? || group_id.nil? || cluster_id.nil?

            vm_id      = vm_id.to_i
            group_id   = group_id.to_i
            cluster_id = cluster_id.to_i

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

            vm_id = vm_id.to_i

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

            vm_id = vm_id.to_i

            @mutex.synchronize do
                @vm_by_id.key?(vm_id)
            end
        end

        #------------------------------------------------------
        # Watchers
        #------------------------------------------------------

        def watch_vm_allocation
            Log.debug(COMP, 'Subscribed to VM allocation events')

            ODS::EventSubscriber.subscribe_for(VM_API_ALLOCATE, :stop_flag => @stop) do |xml|
                event = EventHandler.parse_oneks_body(xml)

                next unless event
                next if vm_registered?(event[:vm_id])

                rc = @lcm.dispatch_event(event[:group_id], :vm_allocated, :event => event)

                if OpenNebula.is_error?(rc)
                    Log.error(
                        COMP, "Failed handling VM allocation: #{rc.message}",
                        event[:cluster_id]
                    )
                    next
                end

                register_vm(event[:vm_id], event[:group_id], event[:cluster_id])
            end
        end

        def watch_vm_state_changes
            Log.debug(COMP, 'Subscribed to VM state events')

            ODS::EventSubscriber.subscribe_for(VM_EVENT_STATE, :stop_flag => @stop) do |xml|
                event = EventHandler.parse_oneks_body(xml)
                next unless event

                should_check = @mutex.synchronize do
                    entry = @vm_by_id[event[:vm_id]]

                    entry&.values_at(:cluster_id, :group_id) ==
                        event.values_at(:cluster_id, :group_id)
                end

                next unless should_check
                next if EventHandler.vm_event_type(event[:state], event[:lcm]) == :ignored

                rc = @lcm.dispatch_event(event[:group_id], :vm_state_changed, :event => event)

                if OpenNebula.is_error?(rc)
                    Log.error(
                        COMP, "Failed handling VM state event: #{rc.message}",
                        event[:cluster_id]
                    )
                    next
                end

                Log.debug(
                    COMP, "VM state event: VM_ID=#{event[:vm_id]} " \
                    "(GROUP_ID=#{event[:group_id]}, TYPE=#{event[:type]}, " \
                    "STATE=#{event[:state]}, LCM_STATE=#{event[:lcm]})",
                    event[:cluster_id]
                )

                unregister_vm(event[:vm_id]) if [:removed, :removed_warning].include?(rc)
            end
        end

        # Replays the current VM pool through the same workflow event entry points.
        # VMs still registered in groups but absent from the live pool are treated as DONE.
        def reconcile_vms
            vm_pool = OpenNebula::VirtualMachinePool.new(@auth.client)

            rc = vm_pool.info_all # TODO: label filter should be here
            raise rc.message if OpenNebula.is_error?(rc)

            vms      = vm_pool.to_a
            live_ids = vms.each_with_object(Set.new) {|vm, ids| ids << vm.id.to_i }

            vms.each do |vm|
                event = EventHandler.parse_oneks_body(Nokogiri::XML(vm.to_xml))
                next unless event

                event[:state] = vm.state_str
                event[:lcm]   = vm.lcm_state_str

                rc = @lcm.dispatch_event(event[:group_id], :vm_allocated, :event => event)

                if OpenNebula.is_error?(rc)
                    Log.error(
                        COMP, "Failed reconciling VM allocation: #{rc.message}",
                        event[:cluster_id]
                    )
                    next
                end

                register_vm(event[:vm_id], event[:group_id], event[:cluster_id])
                next if EventHandler.vm_event_type(event[:state], event[:lcm]) == :ignored

                rc = @lcm.dispatch_event(event[:group_id], :vm_state_changed, :event => event)

                if OpenNebula.is_error?(rc)
                    Log.error(
                        COMP, "Failed reconciling VM state: #{rc.message}",
                        event[:cluster_id]
                    )
                    next
                end

                unregister_vm(event[:vm_id]) if [:removed, :removed_warning].include?(rc)
            end

            registered_vms.each do |entry|
                next if live_ids.include?(entry[:id])

                event = {
                    :cluster_id => entry[:cluster_id],
                    :group_id   => entry[:group_id],
                    :vm_id      => entry[:id],
                    :state      => 'DONE',
                    :lcm        => 'LCM_INIT'
                }

                rc = @lcm.dispatch_event(entry[:group_id], :vm_state_changed, :event => event)

                if OpenNebula.is_error?(rc)
                    Log.error(
                        COMP, "Failed reconciling missing VM: #{rc.message}",
                        entry[:cluster_id]
                    )
                    next
                end

                unregister_vm(entry[:id]) if [:removed, :removed_warning].include?(rc)
            end

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "VM reconciliation failed: #{e.class}: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        private

        def registered_vms
            @mutex.synchronize { @vm_by_id.values.map(&:dup) }
        end

    end

end
