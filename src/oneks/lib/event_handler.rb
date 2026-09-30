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

    # Parses and applies OpenNebula events relevant to OneKS resources.
    module EventHandler

        extend self

        COMP = 'EVH'

        CLUSTER_KEY   = 'CLUSTER_ID'
        NODEGROUP_KEY = 'GROUP_ID'
        TYPE_KEY      = 'TYPE'

        VM_FAILURE_STATES = [
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

        VM_WARNING_STATES = [
            'STOPPED',
            'POWEROFF',
            'SHUTDOWN',
            'SUSPENDED',
            'UNDEPLOYED',
            'UNKNOWN'
        ]

        # Adds an allocated VM to its locked workflow owner.
        def add_vm(group, event:, **_opts)
            validate_vm_event!(group, event)
            return ODS::EventResult.ignore(:registered) \
                if group.vm_registered?(event[:vm_id])

            Log.info(
                K8sGroup::COMP,
                "Adding VM #{event[:vm_id]} " \
                "(TYPE=#{group.type}, GROUP_ID=#{group.id})",
                event[:cluster_id]
            )

            group.add_vm(event[:vm_id])
            ODS::EventResult.handled(:registered)
        end

        # Applies an OpenNebula state change to a locked group.
        def update_vm_state(group, event:, **_opts)
            validate_vm_event!(group, event)
            event_type = vm_event_type(event[:state], event[:lcm])

            return apply_vm_done(group, event) if event_type == :done
            return ODS::EventResult.ignore unless group.vm_registered?(event[:vm_id])

            case event_type
            when :failure
                apply_vm_failure(group, event)
            when :warning
                apply_vm_warning(group, event)
            when :running
                apply_vm_running(group, event)
            else
                ODS::EventResult.ignore
            end
        end

        # Classifies a VM state change by its effect on a OneKS group lifecycle.
        def vm_event_type(state, lcm)
            return :failure if VM_FAILURE_STATES.include?(state) ||
                               VM_FAILURE_STATES.include?(lcm)
            return :warning if VM_WARNING_STATES.include?(state) ||
                               VM_WARNING_STATES.include?(lcm)
            return :done    if state == 'DONE'
            return :running if lcm == 'RUNNING'

            :ignored
        end

        # Extracts OneKS metadata and available state from a VM XML document.
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

            event = {
                :cluster_id => cluster_id.to_i,
                :group_id   => group_id.to_i,
                :type       => type,
                :vm_id      => vm_id.to_i
            }

            state = xml.at_xpath('/HOOK_MESSAGE/STATE')&.text
            lcm   = xml.at_xpath('/HOOK_MESSAGE/LCM_STATE')&.text

            event[:state] = state unless state.nil? || state.empty?
            event[:lcm]   = lcm unless lcm.nil? || lcm.empty?

            event
        rescue StandardError => e
            Log.error(COMP, "Failed to parse VM event: #{e.class}: #{e.message}")
        end

        # Extracts the virtual router identifiers from an allocate API event.
        def parse_vr_event(group, xml)
            vr_id_node = xml.at_xpath("//PARAMETER[TYPE='OUT' and POSITION='2']/VALUE")
            vr_id      = vr_id_node&.text&.strip

            if vr_id.nil?
                vr_id_node = xml.at_xpath('//EXTRA/VROUTER/ID')
                vr_id      = vr_id_node&.text&.strip
            end

            vr_body_node = xml.at_xpath("//PARAMETER[TYPE='IN' and POSITION='2']/VALUE")
            vr_body      = vr_body_node&.text
            name_match   = vr_body&.match(/NAME\s*=\s*"([^"]+)"/)
            vr_name      = name_match[1] if name_match

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

        private

        def validate_vm_event!(group, event)
            valid = event.is_a?(Hash) && [:cluster_id, :group_id, :vm_id].all? do |key|
                event[key].is_a?(Integer) && event[key] >= 0
            end

            raise ArgumentError,
                  'Invalid VM event: cluster_id, group_id and vm_id must be integers' \
                unless valid

            raise ArgumentError, "Event group #{event[:group_id]} does not match #{group.id}" \
                unless group.id.to_i == event[:group_id]

            raise ArgumentError,
                  "Group #{group.id} does not belong to Cluster #{event[:cluster_id]}" \
                unless group.cluster_id.to_i == event[:cluster_id]
        end

        def apply_vm_failure(group, event)
            active_failure = [:PROVISIONING, :SCALING].include?(group.state) &&
                             !group.active_job.nil?

            return apply_vm_warning(group, event) unless active_failure

            failure_state = [event[:state], event[:lcm]].find do |state|
                VM_FAILURE_STATES.include?(state)
            end

            ODS::EventResult.fail(
                "VM #{event[:vm_id]} entered #{failure_state} while " \
                "#{group.state.to_s.downcase} #{group.type} #{group.id}"
            )
        end

        def apply_vm_warning(group, event)
            return ODS::EventResult.ignore unless group.running? && group.active_job.nil?

            Log.error(
                K8sGroup::COMP,
                "VM #{event[:vm_id]} entered WARNING state " \
                "(TYPE=#{group.type}, GROUP_ID=#{group.id})",
                event[:cluster_id]
            )

            group.state = :WARNING
            ODS::EventResult.handled(:warning)
        end

        def apply_vm_running(group, event)
            return ODS::EventResult.ignore unless group.warning? &&
                                            group.ready? &&
                                            group.active_job.nil?

            Log.info(
                K8sGroup::COMP,
                "#{group.type} (ID=#{group.id}) recovered from WARNING",
                event[:cluster_id]
            )

            group.state = :RUNNING
            ODS::EventResult.handled(:running)
        end

        def apply_vm_done(group, event)
            removed = group.del_vm(event[:vm_id])
            return ODS::EventResult.ignore(:removed) unless removed

            Log.info(
                K8sGroup::COMP,
                "Removing VM #{event[:vm_id]} " \
                "(TYPE=#{group.type}, GROUP_ID=#{group.id})",
                event[:cluster_id]
            )

            if group.running? && group.active_job.nil? && !group.provisioned?
                Log.error(
                    K8sGroup::COMP,
                    "VM #{event[:vm_id]} disappeared unexpectedly; " \
                    "#{group.type} (ID=#{group.id}) entered WARNING",
                    event[:cluster_id]
                )

                group.state = :WARNING
                return ODS::EventResult.handled(:removed_warning)
            end

            ODS::EventResult.handled(:removed)
        end

    end

end
