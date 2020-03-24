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

# This class interacts with Firecracker
class MicroVM

    #---------------------------------------------------------------------------
    #   List of commands executed by the driver.
    #---------------------------------------------------------------------------
    COMMANDS = {
        :clean       => 'sudo /var/tmp/one/vmm/firecracker/clean_fc',
        :map_context => '/var/tmp/one/vmm/firecracker/map_context'
    }

    # rubocop:disable Naming/AccessorMethodName
    # rubocop:disable Layout/LineLength

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

        return if @one.nil?

        @rootfs_dir = "/srv/jailer/firecracker/#{@one.vm_name}/root"
        @context_path = "#{@rootfs_dir}/context"
    end

    class << self

        # Creates microVM from a OpenNebula VM xml description
        def new_from_xml(one_xml, client)
            one = OpenNebulaVM.new(one_xml)

            MicroVM.new(one.to_fc, one, client)
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

    def gen_logs_files
        path_log = "#{vm_location}/#{@fc['deployment-file']['logger']['log_fifo']}"
        path_metrics = "#{vm_location}/#{@fc['deployment-file']['logger']['metrics_fifo']}"

        File.open(path_log, 'w') {}
        File.open(path_metrics, 'w') {}
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
        rc, stdout, = Command.execute('ps auxwww | grep ' \
            "\"^.*firecracker.*--id['\\\"=[[:space:]]]*#{@one.vm_name}\" " \
            '| grep -v grep', false)

        if !rc.zero? || stdout.nil?
            return -1
        end

        Integer(stdout.split[1])
    end

    def map_context
        context = {}

        # retrieve context information
        @one.context(context)

        return 0 unless context['context'] # return if there is no context

        context_location = context['context']['source']

        params = " #{context_location} #{context_location}"

        cmd = "#{COMMANDS[:map_context]} #{params}"

        Command.execute_rc_log(cmd, false)
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
    rescue Errno::ENOENT # rubocop:disable Lint/SuppressedException
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

        # TODO: make screen oprions configurable to support different versions
        # TODO: make screen configurable to enable use of tmux etc..
        if @one.vnc?
            cmd << "screen -dmS #{@one.vm_name} "
        end

        # Build jailer command params
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

        Command.execute_detach(cmd)
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

        return true if pid < 0 # The vm is not running (no pid found)

        Command.execute_rc_log("kill -9 #{pid}")
    end

    # Clean resources and directories after shuttingdown the microVM
    def clean(delete = true)
        cgroup_path = @one.fcrc[:cgroup_location]
        timeout = Integer(@one.fcrc[:cgroup_delete_timeout])

        params = "-c #{cgroup_path} -v #{@one.vm_name} -t #{timeout}"
        params << '  -o' unless delete

        cmd = "sudo #{COMMANDS[:clean]} #{params}"

        Command.execute_rc_log(cmd, false)
    end

    # rubocop:enable Naming/AccessorMethodName
    # rubocop:enable Layout/LineLength

end
