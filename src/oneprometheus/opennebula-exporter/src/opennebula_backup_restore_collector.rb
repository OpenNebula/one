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

require 'json'

# Exposes backup and restore status metrics from hook-generated state.json.
class OpenNebulaBackupRestoreCollector

    LABELS = [:one_vm_id, :one_vm_name].freeze

    METRICS = {
        'vm_backup_last_status' => {
            :type   => :gauge,
            :docstr => 'Last backup result for VM (1=success, 0=failed)',
            :labels => LABELS
        },
        'vm_backup_last_timestamp' => {
            :type   => :gauge,
            :docstr => 'Unix timestamp of last backup event for VM',
            :labels => LABELS
        },
        'vm_restore_last_status' => {
            :type   => :gauge,
            :docstr => 'Last restore result for VM (1=success, 0=failed)',
            :labels => LABELS
        },
        'vm_restore_last_timestamp' => {
            :type   => :gauge,
            :docstr => 'Unix timestamp of last restore event for VM',
            :labels => LABELS
        }
    }.freeze

    def initialize(registry, _client, namespace,
                   state_file = '/var/lib/one/state.json')
        @state_file = state_file
        @metrics = {}

        METRICS.each do |name, conf|
            @metrics[name] = registry.method(conf[:type]).call(
                "#{namespace}_#{name}".to_sym,
                :docstring => conf[:docstr],
                :labels    => conf[:labels]
            )
        end
    end

    def collect
        return unless File.file?(@state_file)

        raw = File.read(@state_file)
        return if raw.nil? || raw.strip.empty?

        state = JSON.parse(raw)
        return unless state.is_a?(Hash)

        state.each_value do |vm|
            next unless vm.is_a?(Hash)

            vm_id   = vm['vm_id'] || vm[:vm_id]
            vm_name = vm['vm_name'] || vm[:vm_name] || 'unknown'

            next if vm_id.nil? || vm_id.to_s.empty?

            labels = {
                :one_vm_id   => vm_id.to_i,
                :one_vm_name => vm_name.to_s
            }

            if vm.key?('backup_status') || vm.key?(:backup_status)
                @metrics['vm_backup_last_status'].set(
                    (vm['backup_status'] || vm[:backup_status]).to_i,
                    :labels => labels
                )
            end

            if vm.key?('backup_ts') || vm.key?(:backup_ts)
                @metrics['vm_backup_last_timestamp'].set(
                    (vm['backup_ts'] || vm[:backup_ts]).to_i,
                    :labels => labels
                )
            end

            if vm.key?('restore_status') || vm.key?(:restore_status)
                @metrics['vm_restore_last_status'].set(
                    (vm['restore_status'] || vm[:restore_status]).to_i,
                    :labels => labels
                )
            end

            next unless vm.key?('restore_ts') || vm.key?(:restore_ts)

            @metrics['vm_restore_last_timestamp'].set(
                (vm['restore_ts'] || vm[:restore_ts]).to_i,
                :labels => labels
            )
        end
    rescue JSON::ParserError
        nil
    end

end
