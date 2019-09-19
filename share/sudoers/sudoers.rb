#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

    # Commands required to be used as root, without password, by oneadmin
    NET    = %w[ebtables iptables ip6tables ip ipset arping]
    LVM    = %w[lvcreate lvremove lvs vgdisplay lvchange lvscan lvextend]
    OVS    = %w[ovs-ofctl ovs-vsctl]
    LXD    = %w[
        lxc mount umount mkdir catfstab lsblk losetup kpartx qemu-nbd
        blkid e2fsck resize2fs xfs_growfs rbd-nbd xfs_admin tune2fs
    ]

    CEPH = %w[rbd]
    HA = [
        'systemctl start opennebula-flow',
        'systemctl stop opennebula-flow',
        'systemctl start opennebula-gate',
        'systemctl stop opennebula-gate',
        'service opennebula-flow start',
        'service opennebula-flow stop',
        'service opennebula-gate start',
        'service opennebula-gate stop'
    ]

    NODECMDS = [:NET, :OVS, :LVM, :LXD]

    attr_accessor :cmds

    def initialize(lib_location)
        @cmds = {
            :NET    => NET,
            :LVM    => LVM,
            :OVS    => OVS,
            :LXD    => LXD,
            :CEPH   => CEPH,
            :HA     => HA,
            :MARKET => %W[#{lib_location}/sh/create_container_image.sh]
        }

        @default_cmds = nil

        case distro
        when 'ubuntu'
            @distro = Ubuntu.new
        when 'debian'
            @distro = Debian.new
        when 'centos'
            @distro = Centos.new
        when 'manjaro'
            @distro = Manjaro.new
        end
    end

    # find cmd location for distro
    def command_path(cmd)
        @distro.which(cmd)
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
                cmd_parts[0] = command_path(cmd_parts[0])

                cmd_path << cmd_parts.join(' ')
            end

            cmnd_aliases["ONE_#{label}"] = cmd_path
        end

        cmnd_aliases
    end

    private

    def distro
        release = File.read('/etc/os-release').split("\n")
        release.select! {|e| /ID=/ =~ e }
        release.reject! {|e| e.include? 'VERSION' }

        release[0].partition('=').last
    end

end

# Read which
# TODO: Hardcoded locations, ideally use package manager
class Distro

    def initialize
        @cmds = %w[
            /sbin/ebtables /sbin/iptables /sbin/ip6tables /sbin/ip
            /sbin/lvcreate /sbin/lvremove /sbin/lvs /sbin/vgdisplay
            /sbin/lvchange /sbin/lvscan /sbin/lvextend
            /usr/bin/ovs-ofctl /usr/bin/ovs-vsctl
            /usr/bin/rbd
            /bin/systemctl /usr/sbin/service
            /usr/sbin/arping
        ]
    end

    # What `which $cmd` should return if ran on the particular distro
    def which(cmd)
        location = `which #{cmd} 2>/dev/null`.strip
        return location unless location.empty?

        location = @cmds.select {|e| e.split('/').last == cmd }
        location[0]
    end

end

class Ubuntu < Distro

    CMDS = %w[
        /sbin/ipset

        /snap/bin/lxc /bin/lsblk /sbin/losetup /bin/mount /bin/umount
        /sbin/kpartx /usr/bin/qemu-nbd /bin/mkdir /usr/bin/catfstab /sbin/blkid
        /sbin/e2fsck /sbin/resize2fs /usr/sbin/xfs_growfs /usr/bin/rbd-nbd
        /usr/sbin/xfs_admin /sbin/tune2fs

    ]
    def initialize
        super
        @cmds += CMDS
    end

end

class Centos < Distro

    CMDS = %w[
        /usr/sbin/ipset
    ]

    def initialize
        super
        @cmds += CMDS
    end

end

Debian = Ubuntu
