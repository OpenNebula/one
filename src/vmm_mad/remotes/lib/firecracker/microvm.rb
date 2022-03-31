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

$LOAD_PATH.unshift File.join(File.dirname(__FILE__), '../..')
$LOAD_PATH.unshift File.dirname(__FILE__)

require 'client'
require 'opennebula_vm'

require 'scripts_common'

# This class interacts with Firecracker
class MicroVM

    CGROUP_DEFAULT_SHARES = 1024

    # rubocop:disable Naming/AccessorMethodName
    # rubocop:disable Layout/LineLength

    #---------------------------------------------------------------------------
    # Class constructors & static methods
    #---------------------------------------------------------------------------
    # Creates the microVM object in memory.
    # Can be later created in Firecracker using create method
    #
    # @param [FirecrackerVM] object containing ONE VM information (XML)
    # @param [FirecrackerClient] client to interact with Firecracker API
    def initialize(one, client)
        @one    = one
        @client = client

        @jailer_command = 'sudo -n jailer'
        @vnc_command    = 'screen -x'

        # Location for maping the context
        @map_location = "#{@one.location}/map_context"

        return if @one.nil?

        @rootfs_dir = "/srv/jailer/firecracker/#{@one.vm_name}/root"
        @context_path = "#{@rootfs_dir}/context"
    end

    class << self

        # Creates microVM from a OpenNebula VM xml description
        def new_from_xml(one_xml, client)
            one = FirecrackerVM.new(one_xml)

            MicroVM.new(one, client)
        end

    end

    #---------------------------------------------------------------------------
    # Container Management & Monitor
    #---------------------------------------------------------------------------

    # Create a microVM
    def create
        cmd = ''
        cmd_params = @one.command_params

        # TODO: make screen oprions configurable to support different versions
        # TODO: make screen configurable to enable use of tmux etc..
        if @one.vnc?
            cmd << "screen -dmS #{@one.vm_name} "
        end

        # Build jailer command params
        cmd << @jailer_command

        cmd_params['jailer'].each do |key, val|
            cmd << " --#{key} #{val}"
        end

        # Build firecracker params
        cmd << ' --'
        cmd_params['firecracker'].each do |key, val|
            cmd << " --#{key} #{val}"
        end

        # Generate files required for the microVM
        File.open("#{@one.location}/deployment.file", 'w+') do |file|
            file.write(@one.to_fc)
        end

        File.open(@one.log_path, 'w') {}
        File.open(@one.metrics_path, 'w') {}

        return false unless prepare_domain

        return false unless map_context

        OpenNebula.log_debug("Creating VM: '#{cmd}'")

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

        cmd = "#{COMMANDS[:clean]} #{params}"

        Command.execute_rc_log(cmd, false)
    end

    #---------------------------------------------------------------------------
    # VNC
    #---------------------------------------------------------------------------

    def vnc(signal)
        @one.vnc(signal, @vnc_command, @one.fcrc[:vnc])
    end

    #---------------------------------------------------------------------------
    # Utils
    #---------------------------------------------------------------------------

    def wait_shutdown
        t_start = Time.now
        timeout = @one.fcrc[:shutdown_timeout]

        next while (Time.now - t_start < timeout) && (get_pid > 0)

        get_pid < 0
    end

    def wait_deploy
        t_start = Time.now
        timeout = 5

        next while (Time.now - t_start < timeout) && (get_pid < 0)

        get_pid > 0
    end

    private

    #---------------------------------------------------------------------------
    #   List of commands executed by the driver.
    #---------------------------------------------------------------------------
    COMMANDS = {
        :clean          => 'sudo -n /usr/sbin/one-clean-firecracker-domain',
        :map_context    => '/var/tmp/one/vmm/firecracker/map_context',
        :prepare_domain => 'sudo -n /usr/sbin/one-prepare-firecracker-domain'
    }

    #---------------------------------------------------------------------------
    # Helpers
    #---------------------------------------------------------------------------
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

    # rubocop:disable Lint/RedundantCopDisableDirective
    # rubocop:disable Lint/SuppressedException
    def wait_cgroup(path)
        t_start = Time.now
        timeout = @one.fcrc[:cgroup_delete_timeout]

        next while !File.read(path).empty? && (Time.now - t_start < timeout)

        File.read(path).empty?
    rescue Errno::ENOENT
    end
    # rubocop:enable Lint/SuppressedException
    # rubocop:enable Lint/RedundantCopDisableDirective

    def prepare_domain
        cgroup_path = @one.fcrc[:cgroup_location]

        if @one.fcrc[:cgroup_cpu_shares] == true
            cpu_val = @one.cpu_shares
        else
            cpu_val = CGROUP_DEFAULT_SHARES
        end

        params = "-c #{cgroup_path} -p #{cpu_val} -s #{@one.sysds_path}"\
                 " -v #{@one.vm_id}"

        cmd = "#{COMMANDS[:prepare_domain]} #{params}"

        Command.execute_rc_log(cmd)
    end

    # rubocop:enable Naming/AccessorMethodName
    # rubocop:enable Layout/LineLength

end
