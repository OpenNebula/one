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
    def pre_up
        ['/var/lib/one/remotes/etc',
         '/var/lib/one/remotes/etc/datastore',
         '/var/lib/one/remotes/etc/datastore/ceph',
         '/var/lib/one/remotes/etc/vmm',
         '/var/lib/one/remotes/etc/vmm/kvm',
         '/var/lib/one/remotes/etc/vnm',
         '/var/lib/one/remotes/etc/im',
         '/var/lib/one/remotes/etc/im/kvm-probes.d',
         '/etc/one/sunstone-views/kvm',
         '/etc/one/sunstone-views/mixed',
         '/etc/one/sunstone-views/vcenter'].each do |dir|
            @fops.mkdir(dir)
            @fops.chown(dir, 'oneadmin', 'oneadmin')
            @fops.chmod(dir, 0o750)
        end

        files_to_move = {
            '/var/lib/one/remotes/datastore/ceph/ceph.conf' =>
                '/var/lib/one/remotes/etc/datastore/ceph/ceph.conf',
            '/var/lib/one/remotes/vmm/kvm/kvmrc' =>
                '/var/lib/one/remotes/etc/vmm/kvm/kvmrc',
            '/var/lib/one/remotes/vnm/OpenNebulaNetwork.conf' =>
                '/var/lib/one/remotes/etc/vnm/OpenNebulaNetwork.conf',
            '/etc/one/sunstone-views/admin_vcenter.yaml' =>
                '/etc/one/sunstone-views/vcenter/admin.yaml',
            '/etc/one/sunstone-views/cloud_vcenter.yaml' =>
                '/etc/one/sunstone-views/vcenter/cloud.yaml',
            '/etc/one/sunstone-views/groupadmin_vcenter.yaml' =>
                '/etc/one/sunstone-views/vcenter/groupadmin.yaml',
            '/etc/one/sunstone-views/admin.yaml' =>
                '/etc/one/sunstone-views/kvm/admin.yaml',
            '/etc/one/sunstone-views/cloud.yaml' =>
                '/etc/one/sunstone-views/kvm/cloud.yaml',
            '/etc/one/sunstone-views/groupadmin.yaml' =>
                '/etc/one/sunstone-views/kvm/groupadmin.yaml',
            '/etc/one/sunstone-views/user.yaml' =>
                '/etc/one/sunstone-views/kvm/user.yaml'
        }

        files_to_move.each do |src, dst|
            if @fops.exist?(src)
                @fops.move(src, dst)
            end
        end
    end

    # Upgrade steps
    def up
        process('/etc/one/oned.conf', 'Augeas::ONE') do |old, new|
            break unless old && new

            # derive new monitoring intervals
            mi = old.get('MONITORING_INTERVAL[1]').to_i

            if mi > 0 && mi != 60
                new.set('MONITORING_INTERVAL_HOST[1]',      (mi * 3).to_s)
                new.set('MONITORING_INTERVAL_VM[1]',        (mi * 3).to_s)
                new.set('MONITORING_INTERVAL_DATASTORE[1]', (mi * 5).to_s)
                new.set('MONITORING_INTERVAL_MARKET[1]',    (mi * 10).to_s)
            end

            # MySQL DB connection defaults
            # rubocop:disable Style/MultilineIfThen
            if old.get('DB/BACKEND[1]') =~ /mysql/i &&
               !old.get('DB/CONNECTIONS[1]')
            then
                new.set('DB/CONNECTIONS[1]', '50')
            end
            # rubocop:enable Style/MultilineIfThen
        end
    end

end
