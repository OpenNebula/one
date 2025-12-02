#!/usr/bin/ruby

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

$LOAD_PATH.unshift File.dirname(__FILE__)

require 'client'
require 'opennebula_vm'
require 'tempfile'

# LXC Container abstraction. Handles container native and added
# operations. Allows to gather container config and status data
class Container

    #-----------------------------------------------------------------------
    # Class constructors & static methods
    #-----------------------------------------------------------------------
    # @param [LXCVM] ONE VM information (XML), LXC specilization
    # @param [LXCClient] client to interact with LXC (command line)
    # @param [name] container name to interact with LXC (command line)

    attr_reader :name

    def initialize(one, client)
        @one    = one
        @client = client

        @name = @one.vm_name

        @driver_config = @one.lxcrc
        @driver_config.merge!(:id_map => 0) if @one.privileged?
    end

    class << self

        # Creates container from a OpenNebula VM xml description
        def new_from_xml(one_xml, client)
            one = LXCVM.new(one_xml)

            Container.new(one, client)
        end

    end

    #-----------------------------------------------------------------------
    # Monitoring
    #-----------------------------------------------------------------------

    STATES = {
        :running => 'RUNNING',
        :stopped => 'STOPPED'
    }

    # Get container config
    # -c, --config=KEY    show configuration variable KEY from running container

    # TODO: Validate, LXC doesn't correctly put exit status
    # root@ubuntu1804-lxc-lvm-ssh-6-3-QQ57P-1:~# lxc-info ubuntu -c arch
    # arch invalid
    # root@ubuntu1804-lxc-lvm-ssh-6-3-QQ57P-1:~# echo $?
    # 0

    def config(config_str)
        @client.info(@name, { :c => config_str })
    end

    def state
        @client.info(@name, { :s => nil })['State']
    end

    def running?
        state == STATES[:running]
    end

    def stopped?
        state == STATES[:stopped]
    end

    #-----------------------------------------------------------------------
    # Life Cycle Operations
    #-----------------------------------------------------------------------

    # Creates container in Linux
    def create(options = {})
        # Map storage
        error   = false
        mounted = []

        @one.disks.each do |disk|
            if disk.mount(@driver_config)
                mounted << disk
            else
                error = true
                break
            end
        end

        # Rollback if error
        if error
            mounted.each {|d| d.umount }
            return false
        end

        # write container config file
        options[:config] = "#{@one.location}/deployment.file"
        File.write(options[:config], @one.to_lxc)

        @client.create(@name, options)
    end

    # Remove container in Linux
    def cancel
        options = { :kill => nil }
        rc = @client.stop(@name, options)

        return false unless rc

        # Unmount disk, remove folders, containter and destroy
        clean
    end

    def start
        rc = @client.start(@name)

        # Clean if container fails to start
        if !rc
            clean(true) # Unmount disk, remove folders, containter and destroy
            return false
        end

        return true if wait_deploy(5) && configure_pci_nics

        clean(true)
        return false
    end

    def shutdown
        rc = @client.stop(@name)

        return false unless rc

        # Unmount disk, remove folders, containter and destroy
        clean
    end

    def reboot
        rc = @client.stop(@name)

        # # avoid bind mounts on new container restart
        # @one.disks.each {|d| return false unless d.clean_live }

        # lxc-stop doesn't remove ovs host side nic
        @one.nics.each {|n| @one.del_bridge_port(n) }

        return false unless rc

        # Make sure container starts with an updated configuration file
        file = Tempfile.new
        file.write(@one.to_lxc)
        file.flush
        file.rewind

        # starting without ovs host side nic removal results in error
        @client.start(@name, { :rcfile => file.path })
        wait_deploy(5)
    end

    #---------------------------------------------------------------------------
    # Storage
    #---------------------------------------------------------------------------

    def clean(ignore_err = false)
        disks = @one.disks

        # sort disks so rootfs is last during cleanup operations
        disks.each do |disk|
            next unless disk.rootfs?

            disks << disks.delete(disk)
            break
        end

        # rubocop:disable Style/CombinableLoops
        # Unmap storage
        disks.each do |disk|
            rc = disk.umount({ :ignore_err => ignore_err })

            return false if ignore_err != true && !rc
        end
        # rubocop:enable Style/CombinableLoops

        # Clean bindpoint
        FileUtils.rm_rf(@one.bind_folder) if Dir.exist?(@one.bind_folder)

        # Destroy container
        @client.destroy(@name) if @client.list.include?(@name)
    end

    def attach_disk(id = nil, guest_path = nil)
        id ||= @one.hotplug_disk_id
        guest_path ||= "/#{@driver_config[:mountopts][:mountpoint].gsub('$id', id.to_s)}"

        disk = @one.disk(id)
        container_path = @one.bind_mount_path(guest_path)

        disk.mount(@driver_config)
        disk.pass_mount(container_path)
    end

    def detach_disk(id = nil)
        id ||= @one.hotplug_disk_id
        disk = @one.disk(id)

        # umount the entry inside the container
        cmd = "umount #{disk.mountpoint}"
        return false unless execute(cmd)

        disk.umount
    end

    def attach_context
        return true unless @one.has_context?

        id = @one.context_id
        guest_path = '/context'

        attach_disk(id, guest_path)
    end

    def detach_context
        return true unless @one.has_context?

        detach_disk(@one.context_id)
    end

    #---------------------------------------------------------------------------
    # Network
    #---------------------------------------------------------------------------

    def attach_nic(mac)
        if @one.pci_attach?
            nic     = @one.hotplug_pci
            pci_nic = @one.nic_name_by_address(nic['ADDRESS'])

            @client.attach_device(@name, pci_nic)
        else
            nic = @one.nic_by_mac(mac)

            veth_peer = @one.create_veth_pair(nic)
            return false unless veth_peer

            if !@one.add_bridge_port(nic)
                @one.delete_nic(nic['TARGET'])
                return false
            end

            return true if @client.attach_device(@name, LXCVM.veth_peer(nic),
                                                 LXCVM.nic_guest(nic))

            @one.del_bridge_port(nic)
            @one.delete_nic(nic['TARGET'])
            false
        end
    end

    def detach_nic(mac)
        if @one.pci_attach?
            nic     = @one.hotplug_pci
            pci_nic = nic_name_by_short_address(nic['SHORT_ADDRESS'])

            @client.detach_device(@name, pci_nic)
        else
            nic = @one.nic_by_mac(mac)

            return false unless @client.detach_device(@name, LXCVM.nic_guest(nic),
                                                      LXCVM.veth_peer(nic))

            return true if !@one.del_bridge_port(nic)

            @one.delete_nic(nic['TARGET'])
            true
        end
    end

    #---------------------------------------------------------------------------
    # VNC
    #---------------------------------------------------------------------------

    def vnc(signal)
        @one.vnc(signal, @one.lxcrc[:vnc][:command], @one.lxcrc[:vnc])
    end

    #---------------------------------------------------------------------------
    # Command Injection
    #---------------------------------------------------------------------------

    def restart_context
        cmd = 'service one-context-reconfigure restart'
        execute(cmd, true)

        configure_pci_nics
    end

    # Trigger context pci configuration script without translated PCI device address
    # one-context will fail to setup device due to VM_ADDRESS
    def configure_pci_nics
        pci_nics = @one.pci_nics

        return true if pci_nics.empty?

        cmd = 'set -a; source /context/context.sh;'
        pci_nics.each do |nic|
            # override VM_ADDRESS
            id = nic['NIC_ID']
            address = nic['SHORT_ADDRESS']

            cmd << " export PCI#{id}_ADDRESS=#{address};"
        end
        # find -lname fails on alpine. -lname not an option
        cmd << ' /etc/one-context.d/loc-10-network-pci local'

        bash(cmd)
        true
    end

    def execute(cmd, detach = false)
        @client.attach(@name, cmd, {}, detach)
    end

    def bash(cmd)
        @client.bash(@name, cmd, {})
    end

    private

    def get_pci_nic_name_by_short_address(address)
        # find -lname fails on alpine. -lname not an option
        cmd = "find /sys/class/net/*/device -lname *#{address}" # same as loc-10-network-pci lookup

        rc, o, _e = bash(cmd)

        if rc != 0
            msg = "#{__method__} PCI Device #{address} not found inside container"
            OpenNebula::DriverLogger msg
            return false
        end

        o.split('/')[4] # /sys/class/net/dev159/device
    end

    # Waits for the container to be RUNNING
    #  @param timeout[Integer] seconds to wait for the conatiner to start
    def wait_deploy(timeout)
        t_start = Time.now

        sleep(0.1) while (Time.now - t_start < timeout) && !running?

        # Container can power off right away after starting due to init problems
        # Ensure it remains running
        sleep(1)
        running?
    end

end
