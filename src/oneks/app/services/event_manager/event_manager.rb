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

    # Event Manager class. Handles asynchronous events from OpenNebula
    # and triggers LCM actions accordingly
    class EventManager < ODS::EventManager

        COMP = 'EVT'

        # Keys
        CLUSTER_KEY        = 'CLUSTER_ID'
        NODEGROUP_KEY      = 'GROUP_ID'
        TYPE_KEY           = 'TYPE'

        # Actions modules
        require_relative 'actions/cluster_actions'
        require_relative 'actions/group_actions'

        # Callbacks modules
        require_relative 'callbacks/cluster_cbs'
        require_relative 'callbacks/group_cbs'
        require_relative 'callbacks/watchdog_cbs'

        include ClusterActions
        include GroupActions
        include ClusterCallbacks
        include GroupCallbacks
        include WatchdogCallbacks

        ACTIONS = [
            *ClusterActions.instance_methods,
            *GroupActions.instance_methods,
            *ClusterCallbacks.instance_methods,
            *GroupCallbacks.instance_methods,
            *WatchdogCallbacks.instance_methods
        ]

        FAILURE_STATES = [
            'BOOT_FAILURE',
            'BOOT_MIGRATE_FAILURE',
            'PROLOG_MIGRATE_FAILURE',
            'PROLOG_FAILURE',
            'EPILOG_FAILURE',
            'EPILOG_STOP_FAILURE',
            'EPILOG_UNDEPLOY_FAILURE',
            'PROLOG_MIGRATE_POWEROFF_FAILURE',
            'PROLOG_MIGRATE_SUSPEND_FAILURE',
            'PROLOG_MIGRATE_UNKNOWN_FAILURE',
            'BOOT_UNDEPLOY_FAILURE',
            'BOOT_STOPPED_FAILURE',
            'PROLOG_RESUME_FAILURE',
            'PROLOG_UNDEPLOY_FAILURE',
            'UNKNOWN'
        ]

        WARNING_STATES = [
            'STOPPED',
            'POWEROFF',
            'SHUTDOWN',
            'SUSPENDED',
            'UNDEPLOYED',
            'UNKNOWN'
        ]

        def initialize(cloud_auth, opts = {})
            super(cloud_auth, SERVER_CONF.merge(opts))
            @tm = ODS::ThreadManager.instance
        end

        def start(clusters, groups)
            Log.info(COMP, 'Starting Event Manager')

            @cluster_pool = clusters
            @group_pool   = groups

            @am.start_listener
        end

        class << self

            # Extracts OneKS metadata from a VM XML document.
            #
            # Parses the VM USER_TEMPLATE to retrieve the cluster, node group,
            # type and VM identifiers used by OneKS. Returns nil if any required
            # field is missing or invalid.
            #
            # @param xml [Nokogiri::XML::Document] VM XML description
            # @return [Hash, nil]
            def parse_oneks_body(xml)
                base = '//VM/USER_TEMPLATE/ONEKS'

                cluster_id = xml.at_xpath("#{base}/#{CLUSTER_KEY}")&.text
                group_id   = xml.at_xpath("#{base}/#{NODEGROUP_KEY}")&.text
                vm_id      = xml.at_xpath('//VM/ID')&.text
                type       = xml.at_xpath("#{base}/#{TYPE_KEY}")&.text&.strip

                return unless cluster_id&.match?(/\A\d+\z/)
                return unless group_id&.match?(/\A\d+\z/)
                return unless vm_id&.match?(/\A\d+\z/)
                return if type.nil? || type.empty?

                {
                    :cluster_id => cluster_id.to_i,
                    :group_id   => group_id.to_i,
                    :type       => type,
                    :vm_id      => vm_id.to_i
                }
            rescue StandardError => e
                Log.error(COMP, "Failed to parse VM event: #{e.class}: #{e.message}")
            end

            # Extracts OneKS cluster and virtual router identifiers from a vrouter
            # allocate API event
            # @param client [OneKS::K8sGroup] OneKS Group to check
            # @param xml [Nokogiri::XML::Document] vrouter event XML description
            # @return [Hash, nil]
            def parse_vr_event(group, xml)
                vr_id_node = xml.at_xpath("//PARAMETER[TYPE='OUT' and POSITION='2']/VALUE")
                vr_id      = vr_id_node&.text&.strip

                # Fallback to extra if vr_id not present
                if vr_id.nil?
                    vr_id_node = xml.at_xpath('//EXTRA/VROUTER/ID')
                    vr_id      = vr_id_node&.text&.strip
                end

                vr_body_node = xml.at_xpath("//PARAMETER[TYPE='IN' and POSITION='2']/VALUE")
                vr_body      = vr_body_node&.text
                name_match   = vr_body&.match(/NAME\s*=\s*"([^"]+)"/)
                vr_name      = name_match[1] if name_match

                # Fallback to extra if name not present
                if vr_name.nil?
                    vr_name_node = xml.at_xpath('//EXTRA/VROUTER/NAME')
                    vr_name      = vr_name_node&.text&.strip
                end

                return unless vr_id&.match?(/\A\d+\z/)
                return if vr_name.nil?

                cluster = group.parent_cluster
                return if OpenNebula.is_error?(cluster)
                return unless vr_name.include?(cluster.uuid)

                {
                    :vr_id      => vr_id.to_i,
                    :cluster_id => group.cluster_id
                }
            rescue StandardError => e
                Log.error(COMP, "Failed to parse VR event: #{e.class}: #{e.message}")
            end

        end

        # Waits until the given VMs reach the target state/lcm_state, finish (DONE),
        # or enter a failure state.
        #
        # @param vm_ids [Array<Integer>] VM IDs to monitor
        # @param state [String] target VM state
        # @param lcm_state [String] target LCM state
        # @param timeout [Integer] maximum time to wait in seconds
        #
        # @return [Array(Boolean, Hash)] [ok, results] where:
        #   ok      -> true if no failures occurred
        #   results -> { successful: {id => true|false}, failure: {id => reason} }
        def wait_vm_state(vm_ids, state:, lcm_state:, timeout: 300)
            target    = { :state => state, :lcm_state => lcm_state }
            results   = { :successful => {}, :failure => {} }
            remaining = vm_ids.map(&:to_i).uniq

            # Exit if no ids were provided
            return true, results if vm_ids.empty?

            remaining = sweep_vms!(remaining, target, results)
            return [results[:failure].empty?, results] if remaining.empty?

            rc = ODS::EventSubscriber.subscribe_for_state(
                remaining,
                :state     => state,
                :lcm_state => lcm_state,
                :timeout   => timeout
            ) do |key, _content, xml|
                handled_id = handle_vm_event!(key, xml, remaining, target, results)
                next unless handled_id

                raise ODS::EventSubscriber::StopSubscription \
                if remaining.empty? || !results[:failure].empty?
            end

            if OpenNebula.is_error?(rc)
                remaining.each do |vm_id|
                    results[:failure][vm_id] ||= 'TIMEOUT'
                end
            end

            [results[:failure].empty?, results]
        end

        private

        # Retrieves the current VM state and LCM state from OpenNebula.
        #
        # @param vm_id [Integer] VM ID
        # @return [Array(String, String)] [state, lcm_state]
        #
        # @raise [RuntimeError] if the VM info request fails
        def fetch_vm_state(vm_id)
            vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @cloud_auth.client)
            rc = vm.info

            if OpenNebula.is_error?(rc)
                raise "Failed to get VM #{vm_id} info: #{rc.message}"
            end

            state     = OpenNebula::VirtualMachine::VM_STATE[vm.state]
            lcm_state = OpenNebula::VirtualMachine::LCM_STATE[vm.lcm_state]

            [state, lcm_state]
        end

        # Polls the current state of all remaining VMs and resolves those that
        # reached DONE, the target state, or a failure state.
        #
        # @param vm_ids [Array<Integer>] VM IDs still pending
        # @param target [Hash] target state definition {:state, :lcm_state}
        # @param results [Hash] results accumulator
        #
        # @return [Array<Integer>] updated list of remaining VM IDs
        def sweep_vms!(vm_ids, target, results)
            vm_ids.delete_if do |vm_id|
                state, lcm_state = fetch_vm_state(vm_id)
                Log.debug(COMP, "VM #{vm_id} is in (#{state}, #{lcm_state})")

                resolve_vm_state!(
                    :vm_id   => vm_id,
                    :current => { :state => state, :lcm_state => lcm_state },
                    :target  => target,
                    :results => results
                )
            rescue StandardError => e
                Log.error(COMP, "Failed to inspect VM #{vm_id}: #{e.class}: #{e.message}")
                results[:failure][vm_id] = "ERROR: #{e.message}"
                true
            end
        end

        # Processes a received VM state event and updates the tracking results.
        #
        # @param key [String] ZMQ event key
        # @param xml [Nokogiri::XML::Document] parsed event payload
        # @param remaining [Array<Integer>] VM IDs still pending
        # @param target [Hash] target state definition {:state, :lcm_state}
        # @param results [Hash] results accumulator
        #
        # @return [Integer, nil] VM ID if the event resolved the VM, otherwise nil
        def handle_vm_event!(key, xml, remaining, target, results)
            vm_id = retrieve_id(key)
            return unless vm_id
            return unless remaining.include?(vm_id)

            state     = xml.at_xpath('//HOOK_MESSAGE/STATE')&.text
            lcm_state = xml.at_xpath('//HOOK_MESSAGE/LCM_STATE')&.text

            Log.debug(COMP, "VM #{vm_id} reached (#{state}, #{lcm_state})")

            resolved = resolve_vm_state!(
                :vm_id   => vm_id,
                :current => { :state => state, :lcm_state => lcm_state },
                :target  => target,
                :results => results
            )

            return unless resolved

            remaining.delete(vm_id)
            vm_id
        rescue StandardError => e
            Log.error(COMP, "Failed to handle event #{key}: #{e.class}: #{e.message}")
            nil
        end

        # Determines whether a VM reached a terminal, target, or failure state
        # and updates the results structure accordingly.
        #
        # @param vm_id [Integer] VM ID
        # @param current [Hash] current state {:state, :lcm_state}
        # @param target [Hash] target state {:state, :lcm_state}
        # @param results [Hash] results accumulator
        #
        # @return [Boolean] true if the VM is resolved, false otherwise
        def resolve_vm_state!(vm_id:, current:, target:, results:)
            if current[:state] == 'DONE'
                results[:successful][vm_id] = true
                true
            elsif current[:state] == target[:state] && current[:lcm_state] == target[:lcm_state]
                results[:successful][vm_id] = false
                true
            elsif FAILURE_STATES.include?(current[:lcm_state])
                Log.error(COMP, "VM #{vm_id} entered FAILURE state (#{current[:lcm_state]})")
                results[:failure][vm_id] = "FAILURE: #{current[:lcm_state]}"
                true
            else
                false
            end
        end

        # Extracts the VM ID from a ZMQ event key.
        def retrieve_id(key)
            value = key.to_s.split('/').last
            return unless value&.match?(/\A\d+\z/)

            value.to_i
        end

    end

end
