# -------------------------------------------------------------------------- #
# Copyright 2019-2022, OpenNebula Systems S.L.                               #
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

    def remove_license_header(s)
        s.gsub(/# ----.*Copyright.*--- #\n*/m, '')
    end

    # Preupgrade steps
    def pre_up
        ['/etc/one/defaultrc',
         '/etc/one/guacd',
         '/etc/one/auth/ldap_auth.conf',
         '/var/lib/one/remotes/etc/datastore/ceph/ceph.conf',
         '/var/lib/one/remotes/etc/datastore/datastore.conf',
         '/var/lib/one/remotes/etc/datastore/fs/fs.conf',
         '/etc/one/fireedge/sunstone/admin/backup-tab.yaml',
         '/etc/one/fireedge/sunstone/admin/file-tab.yaml',
         '/etc/one/fireedge/sunstone/admin/host-tab.yaml',
         '/etc/one/fireedge/sunstone/admin/image-tab.yaml',
         '/etc/one/fireedge/sunstone/admin/marketplace-app-tab.yaml',
         '/etc/one/fireedge/sunstone/admin/sec-group-tab.yaml',
         '/etc/one/fireedge/sunstone/admin/vm-tab.yaml',
         '/etc/one/fireedge/sunstone/admin/vm-template-tab.yaml',
         '/etc/one/fireedge/sunstone/admin/vnet-tab.yaml',
         '/etc/one/fireedge/sunstone/sunstone-views.yaml',
         '/etc/one/fireedge/sunstone/user/backup-tab.yaml',
         '/etc/one/fireedge/sunstone/user/file-tab.yaml',
         '/etc/one/fireedge/sunstone/user/image-tab.yaml',
         '/etc/one/fireedge/sunstone/user/marketplace-app-tab.yaml',
         '/etc/one/fireedge/sunstone/user/vm-tab.yaml',
         '/etc/one/fireedge/sunstone/user/vm-template-tab.yaml',
         '/etc/one/fireedge/sunstone/user/vnet-tab.yaml',
         '/etc/one/oneflow-server.conf',
         '/etc/one/onehem-server.conf',
         '/etc/one/hm/hmrc',
         '/var/lib/one/remotes/etc/im/kvm-probes.d/probe_db.conf',
         '/var/lib/one/remotes/etc/im/qemu-probes.d/probe_db.conf',
         '/var/lib/one/remotes/etc/im/lxc-probes.d/probe_db.conf',
         '/var/lib/one/remotes/etc/im/lxd-probes.d/probe_db.conf',
         '/var/lib/one/remotes/etc/im/firecracker-probes.d/probe_db.conf',
         '/var/lib/one/remotes/etc/im/kvm-probes.d/pci.conf',
         '/var/lib/one/remotes/etc/im/qemu-probes.d/pci.conf',
         '/var/lib/one/remotes/etc/im/lxd-probes.d/pci.conf',
         '/var/lib/one/remotes/etc/market/http/http.conf',
         '/var/lib/one/remotes/etc/onegate-proxy.conf',
         '/etc/one/onegate-server.conf',
         '/etc/one/sunstone-server.conf',
         '/etc/one/fireedge/sunstone/sunstone-server.conf',
         '/var/lib/one/remotes/etc/tm/fs_lvm/fs_lvm.conf',
         '/var/lib/one/remotes/etc/tm/ssh/sshrc',
         '/etc/one/tmrc',
         '/etc/one/vmm_exec/vmm_exec_kvm.conf',
         '/etc/one/vmm_exec/vmm_execrc',
         '/etc/one/az_driver.default',
         '/etc/one/ec2_driver.default',
         '/var/lib/one/remotes/etc/vmm/firecracker/firecrackerrc',
         '/var/lib/one/remotes/etc/vmm/kvm/kvmrc',
         '/var/lib/one/remotes/etc/vmm/lxc/lxcrc',
         '/var/lib/one/remotes/etc/vmm/lxd/lxdrc',
         '/var/lib/one/remotes/etc/vmm/vcenter/vcenterrc',
         '/var/lib/one/remotes/etc/vnm/OpenNebulaNetwork.conf',
        ].each do |f|
            if @read_from
                next unless File.exist?(File.join(@read_from, f))
            else
                next unless File.exist?(File.join(@prefix, f))
            end

            @fops.file_write(f, remove_license_header(@fops.file_read(f)))
        end
    end

    # Upgrade steps
    def up; end

end
