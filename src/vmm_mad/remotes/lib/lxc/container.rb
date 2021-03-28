#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                #
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
    def initialize(one, client)
        @one    = one
        @client = client
    end

    class << self

        # Creates container from a OpenNebula VM xml description
        def new_from_xml(one_xml, client)
            one = LXCVM.new(one_xml)

            Container.new(one, client)
        end

    end

    #-----------------------------------------------------------------------
    # Life Cycle Operations
    #-----------------------------------------------------------------------

    # Creates container in Linux
    def create(options = {})
        options[:config] = "#{@one.location}/deployment.file"

        File.open(options[:config], 'w+') do |file|
            file.write(@one.to_lxc)
        end

        # Map storage
        error   = false
        mounted = []

        @one.disks.each do |disk|
            if disk.mount(@one.lxcrc)
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

        @client.create(@one.vm_name, options)
    end

    # Remove container in Linux
    def cancel
        options = { :kill => nil }
        rc = @client.stop(@one.vm_name, options)

        return false unless rc

        # Unmount disk, remove folders, containter and destroy
        clean
    end

    def start
        rc = @client.start(@one.vm_name)

        # Clean if container fails to start
        if !rc
            clean(true) # Unmount disk, remove folders, containter and destroy
            return false
        end

        wait_deploy(5)
    end

    def shutdown
        rc = @client.stop(@one.vm_name)

        return false unless rc

        # Unmount disk, remove folders, containter and destroy
        clean
    end

    def reboot
        rc = @client.stop(@one.vm_name)

        return false unless rc

        @client.start(@one.vm_name)
    end

    def clean(ignore_err = false)
        # Unmap storage
        @one.disks.each do |disk|
            rc = disk.umount({ :ignore_err => ignore_err })

            return false if ignore_err != true && !rc
        end

        # Clean bindpoint
        FileUtils.rm_rf(@one.bind_folder)

        # Destroy container
        @client.destroy(@one.vm_name)
    end

    #---------------------------------------------------------------------------
    # VNC
    #---------------------------------------------------------------------------

    def vnc(signal)
        @one.vnc(signal, @one.lxcrc[:vnc][:command], @one.lxcrc[:vnc])
    end

    private

    STATES = {
        :running => 'RUNNING',
        :stopped => 'STOPPED'
    }

    # Waits for the container to be RUNNING
    #  @param timeout[Integer] seconds to wait for the conatiner to start
    def wait_deploy(timeout)
        t_start = Time.now

        next while (Time.now - t_start < timeout) &&
                   (@client.info(@one.vm_name)['State'] != STATES[:running])

        @client.info(@one.vm_name)['State'] == STATES[:running]
    end

end
