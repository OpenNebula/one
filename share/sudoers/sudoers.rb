# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

    NODECMDS = [:NET, :OVS, :LVM, :LXC, :MEM, :VGPU]

    attr_accessor :cmds

    def initialize(lib_location)
        # Commands required to be used as root, without password, by oneadmin
        @cmds = {
            :NET => [
                'ebtables',
                'iptables',
                'ip6tables',
                'ipset',
                'ip link *',
                'ip neighbour *',
                'ip route *',
                'ip rule *',
                'ip tuntap *'
            ],
            :LVM    => [
                'lvcreate', 'lvremove', 'lvs', 'vgdisplay', 'lvchange', 'lvscan', 'lvextend'
            ],
            :OVS    => ['ovs-ofctl', 'ovs-vsctl'],
            :CEPH   => ['rbd'],
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
                'lxc-console', 'e2fsck', 'resize2fs', 'xfs_growfs', 'rbd-nbd'
            ],
            :MARKET => ["#{lib_location}/sh/create_container_image.sh"],
            :MEM    => ['sysctl vm.drop_caches=3 vm.compact_memory=1'],
            :VGPU   => ['sudo', '/var/tmp/one/vgpu']
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
