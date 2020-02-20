#!/usr/bin/ruby

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

$LOAD_PATH.unshift File.dirname(__FILE__)

require 'client'
require 'opennebula_vm'
require 'command' # TODO, use same class LXD

# This class interacts with Firecracker
class MicroVM

    #---------------------------------------------------------------------------
    # Class constructors & static methods
    #---------------------------------------------------------------------------
    # Creates the microVM object in memory.
    # Can be later created in Firecracker using create method
    def initialize(fc, one, client)
        @client = client

        @fc = fc
        @one = one

        @jailer_command = 'sudo jailer'
        @vnc_command    = 'screen -x'

        # Location for maping the context
        @map_location = "#{@one.sysds_path}/#{@one.vm_id}/map_context"

        if !@one.nil?
            @rootfs_dir = "/srv/jailer/firecracker/#{@one.vm_name}/root"
            @context_path = "#{@rootfs_dir}/context"
        end
    end

    class << self

        # Returns specific container, by its name
        # Params:
        # +name+:: container name
        def get(name, one_xml, client)
            info = client.get("#{CONTAINERS}/#{name}")['metadata']

            one  = nil
            one  = OpenNebulaVM.new(one_xml) if one_xml

            Container.new(info, one, client)
        end

        # Creates container from a OpenNebula VM xml description
        def new_from_xml(one_xml, client)
            one = OpenNebulaVM.new(one_xml)

            MicroVM.new(one.to_fc, one, client)
        end

        # Returns an array of container objects
        def get_all(client)
            containers = []

            container_names = client.get(CONTAINERS)['metadata']
            container_names.each do |name|
                name = name.split('/').last
                containers.push(get(name, nil, client))
            end

            containers
        end

        # Returns boolean indicating the container exists(true) or not (false)
        def exist?(name, client)
            client.get("#{CONTAINERS}/#{name}")
            true
        rescue LXDError => e
            raise e if e.code != 404

            false
        end

    end

    #---------------------------------------------------------------------------
    # Utils
    #---------------------------------------------------------------------------

    def gen_deployment_file
        File.open("#{vm_location}/deployment.file", 'w+') do |file|
            file.write(@fc['deployment-file'].to_json)
        end
    end

    def vm_location
        "#{@one.sysds_path}/#{@one.vm_id}"
    end

    def map_chroot_path
        rc = Command.execute_rc_log("mkdir -p #{@rootfs_dir}")

        return false unless rc

        # TODO, add option for hard links
        Command.execute_rc_log("sudo mount -o bind #{@one.sysds_path}/#{@one.vm_id} #{@rootfs_dir}")
    end

    def get_pid
        pid = `ps auxwww | grep "^.*firecracker.*\\-\\-id=#{@one.vm_name}"`

        if pid.empty? || pid.nil?
            return -1
        end

        Integer(pid.split[1])
    end

    def map_context
        context = {}

        # retrieve context information
        @one.context(context)

        return 0 unless context['context'] # return if there is no context

        context_location = context['context']['source']

        # Create temporary directories
        rc = Command.execute_rc_log("mkdir #{@map_location}")
        rc &= rc && Command.execute_rc_log("mkdir #{@map_location}/context")
        rc &= rc && Command.execute_rc_log("mkdir #{@map_location}/fs")

        # mount rootfs
        rc &= rc && Command.execute_rc_log("sudo mount #{vm_location}/disk.#{@one.rootfs_id} " \
                        "#{@one.sysds_path}/#{@one.vm_id}/map_context/fs")
        # mount context disk
        rc &= rc && Command.execute_rc_log("sudo mount #{context_location} #{@map_location}/context")

        # create "/context" inside rootfs ()
        if !File.directory?("#{@map_location}/fs/context")
            rc &= rc && Command.execute_rc_log("sudo mkdir #{@map_location}/fs/context")
        end

        rc &= rc && Command.execute_rc_log("sudo cp #{@map_location}/context/* #{@map_location}/fs/context")

        # clean temporary directories
        rc &= rc && Command.execute_rc_log("sudo umount #{@map_location}/fs")
        rc &= rc && Command.execute_rc_log("sudo umount #{@map_location}/context")
        rc &= rc && Command.execute_rc_log("rm -rf #{@map_location}")

        rc
    end

    def wait_shutdown
        t_start = Time.now
        timeout = @one.fcrc[:shutdown_timeout]

        next while (Time.now - t_start < timeout) && (get_pid > 0)

        get_pid < 0
    end

    def wait_cgroup(path)
        t_start = Time.now
        timeout = @one.fcrc[:cgroup_delete_timeout]

        next while !File.read(path).empty? && (Time.now - t_start < timeout)

        File.read(path).empty?
    end

    #---------------------------------------------------------------------------
    # VNC
    #---------------------------------------------------------------------------

    # Start the svncterm server if it is down.
    def vnc(signal)
        command = @one.vnc_command(signal, @vnc_command)
        return if command.nil?

        w = @one.fcrc[:vnc][:width]
        h = @one.fcrc[:vnc][:height]
        t = @one.fcrc[:vnc][:timeout]

        vnc_args = "-w #{w} -h #{h} -t #{t}"

        pipe = '/tmp/svncterm_server_pipe'
        bin  = 'svncterm_server'
        server = "#{bin} #{vnc_args}"

        rc, _o, e = Command.execute_once(server, true)

        unless [nil, 0].include?(rc)
            OpenNebula.log_error("#{__method__}: #{e}\nFailed to start vnc")
            return
        end

        lfd = Command.lock

        File.open(pipe, 'a') do |f|
            f.write command
        end
    ensure
        Command.unlock(lfd) if lfd
    end

    #---------------------------------------------------------------------------
    # Container Management & Monitor
    #---------------------------------------------------------------------------

    # Create a microVM
    def create
        cmd = ''

        if @one.vnc?
            cmd << "screen -L -Logfile /tmp/fc-log-#{@one.vm_id} " \
                   "-dmS #{@one.vm_name} "
        end

        # Build jailer command paramas
        cmd << @jailer_command

        @fc['command-params']['jailer'].each do |key, val|
            cmd << " --#{key} #{val}"
        end

        # Build firecracker params
        cmd << ' --'
        @fc['command-params']['firecracker'].each do |key, val|
            cmd << " --#{key} #{val}"
        end

        return false unless map_chroot_path

        return false unless map_context

        Command.execute_rc_log(cmd)
    end

    # Poweroff the microVM by sending CtrlAltSupr signal
    def shutdown
        data = '{"action_type": "SendCtrlAltDel"}'

        @client.put('actions', data)

        return cancel unless wait_shutdown

        true
    end

    # Poweroff hard the microVM by killing the process
    def cancel
        pid = get_pid

        Command.execute_rc_log("kill -9 #{pid}")
    end

    # Clean resources and directories after shuttingdown the microVM
    def clean
        # remove jailer generated files
        rc = Command.execute_rc_log("sudo rm -rf #{@rootfs_dir}/dev/")
        rc &= Command.execute_rc_log("rm -rf #{@rootfs_dir}/api.socket")
        rc &= Command.execute_rc_log("rm -rf #{@rootfs_dir}/firecracker")

        # unmount vm directory
        rc &= `sudo umount #{@rootfs_dir}`

        # remove chroot directory
        rc &= Command.execute_rc_log("rm -rf #{File.expand_path('..', @rootfs_dir)}") if rc

        # remove residual cgroups
        rc &= clean_cgroups

        rc
    end

    # Remove cgroup residual directories
    def clean_cgroups
        cgroup_path = @one.fcrc[:cgroup_location]

        wait_cgroup("#{cgroup_path}/cpu/firecracker/#{@one.vm_name}/tasks")
        rc = Command.execute_rc_log("sudo rmdir #{cgroup_path}/cpu/firecracker/#{@one.vm_name}")

        wait_cgroup("#{cgroup_path}/cpuset/firecracker/#{@one.vm_name}/tasks")
        rc &= Command.execute_rc_log("sudo rmdir #{cgroup_path}/cpuset/firecracker/#{@one.vm_name}")

        wait_cgroup("#{cgroup_path}/pids/firecracker/#{@one.vm_name}/tasks")
        rc &= Command.execute_rc_log("sudo rmdir #{cgroup_path}/pids/firecracker/#{@one.vm_name}")

        rc
    end

end
