# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

# Holds configuration about sudoers requirements for OpeNebula
class Sudoers

    NODECMDS = [:NET, :NETNS, :OVS, :LVM, :LXC, :MEM, :VGPU, :VTPM, :NFS, :NETAPP, :FABRIC]

    attr_accessor :cmds

    def initialize(lib_location)
        # Commands required to be used as root, without password, by oneadmin
        @cmds = {
            :NET => [
                'iptables',
                'ip6tables',
                'ipset',
                'ip link *',
                'ip neighbour *',
                'ip route *',
                'ip rule *',
                'ip tuntap *',
                'nft',
                '/var/tmp/one/vnm/tproxy',
                'bridge'
            ],
            :NETNS => [
                'ip netns add *',
                'ip netns delete *',
                'ip netns pids *',
                '/var/tmp/one/vnm/ip_netns_exec ip address *',
                '/var/tmp/one/vnm/ip_netns_exec ip link *',
                '/var/tmp/one/vnm/ip_netns_exec ip -j link show *',
                '/var/tmp/one/vnm/ip_netns_exec ip route *'
            ],
            :LVM => [
                'lvcreate', 'lvremove', 'lvs', 'vgdisplay', 'lvchange', 'lvscan', 'lvextend',
                'dmsetup'
            ],
            :OVS => ['ovs-ofctl', 'ovs-vsctl'],
            :CEPH => ['rbd'],
            :HA => [
                'systemctl start opennebula-flow',
                'systemctl stop opennebula-flow',
                'systemctl start opennebula-gate',
                'systemctl stop opennebula-gate',
                'systemctl start opennebula-hem',
                'systemctl stop opennebula-hem',
                'systemctl start opennebula-showback.timer',
                'systemctl stop opennebula-showback.timer',
                'service opennebula-flow start',
                'service opennebula-flow stop',
                'service opennebula-gate start',
                'service opennebula-gate stop',
                'service opennebula-hem start',
                'service opennebula-hem stop',
                'arping',
                'ip address *'
            ],
            :LXC => [
                'mount', 'umount', 'bindfs', 'losetup', 'qemu-nbd', 'lxc-attach', 'lxc-config',
                'lxc-create', 'lxc-destroy', 'lxc-info', 'lxc-ls', 'lxc-start', 'lxc-stop',
                'lxc-console', 'e2fsck', 'resize2fs', 'xfs_growfs', 'rbd-nbd', 'lxc-device'
            ],
            :MARKET => ["#{lib_location}/sh/create_container_image.sh"],
            :MEM => ['sysctl vm.drop_caches=3 vm.compact_memory=1'],
            :VGPU => ['sudo', '/var/tmp/one/vgpu'],
            :VTPM => ['sudo', '/var/tmp/one/vtpm_setup'],
            :NFS => ['mount', 'umount', '/usr/bin/sed -i -f /proc/self/fd/0 /etc/fstab'],
            :NETAPP => ['blockdev', 'multipath', 'multipathd', 'iscsiadm', 'tee', 'find'],
            :FABRIC => ['dmidecode']
        }
    end

    # Return a list of commands full path
    def aliases
        cmnd_aliases = {}

        cmds.keys.each do |label|
            cmd_path = []

            cmds[label].each do |cmd|
                if cmd[0] == '/'
                    cmd_path << cmd
                    next
                end

                cmd_parts = cmd.split
                cmd_parts[0] = which(cmd_parts[0])

                if cmd_parts[0].empty?
                    STDERR.puts "command not found: #{cmd}"
                    exit 1
                end

                cmd_path << cmd_parts.join(' ')
            end

            cmnd_aliases["ONE_#{label}"] = cmd_path
        end

        cmnd_aliases
    end

    def which(cmd)
        `which #{cmd} 2>/dev/null`.strip
    end

end
