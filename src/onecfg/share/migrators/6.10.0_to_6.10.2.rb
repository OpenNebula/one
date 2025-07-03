# -------------------------------------------------------------------------- #
# Copyright 2019-2025, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

# frozen_string_literal: true

# Migrator
module Migrator

    # Preupgrade steps
    def pre_up; end

    # Upgrade steps
    def up
        ['/etc/one/fireedge/sunstone/admin/service-tab.yaml',
         '/etc/one/fireedge/sunstone/cloud/service-tab.yaml',
         '/etc/one/fireedge/sunstone/groupadmin/service-tab.yaml'].each do |svctab|
            process(svctab, 'Yaml') do |old, new|
                if new['info-tabs']['scheduler_actions']

                    new['info-tabs'].delete('scheduler_actions')
                    new['info-tabs']['sched_actions'] = \
                        {"enabled"=> true,
                         "actions"=> {"sched-add"=>true,
                                      "sched-update"=>false,
                                      "sched-delete"=>false,
                                      "charter_create"=>true,
                                      "perform_action"=>true}}
                end
            end
        end

        process('/var/lib/one/remotes/etc/im/kvm-probes.d/guestagent.conf', 'Yaml') do |old, new|
            if new[:commands][:vm_crash]
                new[:commands].delete(:vm_crash)
                new[:commands][:vm_qemu_ping] = old[:commands][:vm_crash]
            end
        end
    end

end
