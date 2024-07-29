#!/usr/bin/ruby

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

$LOAD_PATH.unshift File.dirname(__FILE__)

require 'client'
require 'opennebula_vm'

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

        lxcrc = @one.lxcrc
        lxcrc.merge!(:id_map => 0) if @one.privileged?

        @one.disks.each do |disk|
            if disk.mount(lxcrc)
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

        wait_deploy(5)
    end

    def shutdown
        rc = @client.stop(@name)

        return false unless rc

        # Unmount disk, remove folders, containter and destroy
        clean
    end

    def reboot
        rc = @client.stop(@name)

        # Remove nic from ovs-switch if needed
        @one.get_nics.each do |nic|
            del_bridge_port(nic) # network driver matching implemented here
        end

        return false unless rc

        @client.start(@name)
    end

    def clean(ignore_err = false)
        # Unmap storage
        @one.disks.each do |disk|
            rc = disk.umount({ :ignore_err => ignore_err })

            return false if ignore_err != true && !rc
        end

        # Clean bindpoint
        FileUtils.rm_rf(@one.bind_folder) if Dir.exist?(@one.bind_folder)

        # Destroy container
        @client.destroy(@name) if @client.list.include?(@name)
    end

    #---------------------------------------------------------------------------
    # VNC
    #---------------------------------------------------------------------------

    def vnc(signal)
        @one.vnc(signal, @one.lxcrc[:vnc][:command], @one.lxcrc[:vnc])
    end

    private

    # Waits for the container to be RUNNING
    #  @param timeout[Integer] seconds to wait for the conatiner to start
    def wait_deploy(timeout)
        t_start = Time.now

        next while (Time.now - t_start < timeout) && !running?

        running?
    end

    def del_bridge_port(nic)
        return true unless /ovswitch/ =~ nic['VN_MAD']

        cmd = 'sudo -n ovs-vsctl --if-exists del-port '\
        "#{nic['BRIDGE']} #{nic['TARGET']}"

        rc, _o, e = Command.execute(cmd, false, 1)

        return true if rc.zero?

        OpenNebula.log_error "#{__method__}: #{e}"
        false
    end

end
