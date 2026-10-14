#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
#----------------------------------------------------------------------------- #

# frozen_string_literal: true

require 'open3'
require 'json'
require 'base64'
require 'getoptlong'

# ##############################################################################
# CONFIGURATION
# - SERVICE_NAME: systemd service
# - VM_DOMAIN:    VM domain name deployed by one-ee-tools. Same as in probe
#
# REQUIREMENTS
# - opennebula-node-kvm package, installs libvirt and KVM/Qemu dependencies
# ##############################################################################
VM_DOMAIN    = 'one-fabricmanager'
SERVICE_NAME = 'opennebula-fabricmanager.service'

# Execute command in the VM_DOMAIN
def ga_cmd(command)
    Open3.capture3('virsh', '-c', 'qemu:///system', 'qemu-agent-command',
                   VM_DOMAIN, command)
end

# Execute command in the VM
def vm_exec(command_string)
    puts "Executing inside FabricManager VM: #{command_string}"

    start_cmd = {
        :execute => 'guest-exec',
        :arguments => {
            :path => '/bin/sh',
            :arg => ['-c', command_string],
            :"capture-output" => true
        }
    }.to_json

    stdout, stderr, status = ga_cmd(start_cmd)

    unless status.success?
        warn "Error starting command: #{stderr}"
        warn "Response from VM: #{stdout}"
        exit 1
    end

    pid = JSON.parse(stdout).dig('return', 'pid')

    unless pid
        warn "Failed to get PID from VM: #{stdout}"
        exit 1
    end

    status_cmd = {
        :execute   => 'guest-exec-status',
        :arguments => { :pid => pid }
    }.to_json

    response   = {}
    timeout    = 30 # seconds
    start_time = Time.now

    loop do
        if Time.now - start_time > timeout
            warn "Error: Command in VM timed out after #{timeout} seconds."
            exit 1
        end

        sleep 0.5
        stdout, stderr, status = ga_cmd(status_cmd)

        unless status.success?
            warn "Error checking command status: #{stderr}"
            break
        end

        response = JSON.parse(stdout).fetch('return', {})
        break if response.fetch('exited', false)
    end

    if response.fetch('exited', false)
        out_data = response.fetch('out-data', '')
        err_data = response.fetch('err-data', '')

        puts Base64.decode64(out_data) unless out_data.empty?
        warn Base64.decode64(err_data) unless err_data.empty?

        exit response.fetch('exitcode', 0)
    else
        warn "Failed to get final status for PID #{pid}"
        exit 1
    end
end

def update_fabric_info
    pid_file = '/var/lib/one-remotes-db/.monitor_client.pid'

    return unless File.exist?(pid_file) && !File.empty?(pid_file)

    pid = File.read(pid_file).strip.to_i
    return unless pid > 0

    begin
        Process.kill('USR1', pid)
    rescue Errno::ESRCH, Errno::EPERM
    end
end

################################################################################
# MAIN PROGRAM & OPTIONS
################################################################################

opts = GetoptLong.new(
    ['--status',      GetoptLong::NO_ARGUMENT],
    ['--list',        GetoptLong::NO_ARGUMENT],
    ['--csv',         GetoptLong::NO_ARGUMENT],
    ['--activate',    GetoptLong::REQUIRED_ARGUMENT],
    ['--deactivate',  GetoptLong::REQUIRED_ARGUMENT],
    ['--audit',       GetoptLong::NO_ARGUMENT],
    ['--exec',        GetoptLong::REQUIRED_ARGUMENT],
    ['--help',        GetoptLong::NO_ARGUMENT]
)

def print_usage
    puts <<~USAGE
        Usage: #{$PROGRAM_NAME} [OPTIONS] COMMAND [ARGS]

        Commands:
          --status                 Show systemd and FabricManager VM status
          --list [--csv]           List NVSwitch partitions (CSV optional)
          --activate <id>          Activate NVSwitch partition by ID
          --deactivate <id>        Deactivate NVSwitch partition by ID
          --audit                  Run nvswitch audit
          --exec "<cmd>"           Execute a command inside VM

        Options:
          --help                   Show this help message
    USAGE
end

if ARGV.empty?
    print_usage
    exit 1
end

begin
    opts.each do |opt, arg|
        case opt
        when '--help'
            print_usage

        when '--status'
            puts 'Systemd service status:'
            puts `/usr/bin/systemctl status #{SERVICE_NAME} 2>&1`

            out, err, rc = Open3.capture3("virsh -c qemu:///system domstate #{VM_DOMAIN}")

            if rc.success?
                puts
                puts "VM state (libvirt): #{out.strip}"
            else
                warn "Could not get VM state: #{err.strip}"
            end

        when '--list'
            cmd = if ARGV.include?('--csv')
                      'nv-partitioner -o 0 -f csv'
                  else
                      'nv-partitioner -o 0'
                  end
            vm_exec(cmd)

        when '--activate'
            begin
                partition_id = Integer(arg)
                vm_exec("nv-partitioner -o 1 -p '#{partition_id}'")
                update_fabric_info
            rescue ArgumentError
                warn "Error: Invalid partition ID '#{arg}'."
                exit 1
            end

        when '--deactivate'
            begin
                partition_id = Integer(arg)
                vm_exec("nv-partitioner -o 2 -p '#{partition_id}'")
                update_fabric_info
            rescue ArgumentError
                warn "Error: Invalid partition ID '#{arg}'."
                exit 1
            end

        when '--audit'
            vm_exec('nvswitch-audit')

        when '--exec'
            if arg.nil? || arg.strip.empty?
                warn "Error: '--exec' requires a command argument."
                exit 1
            end
            vm_exec(arg)
        end
    end
rescue StandardError
    puts
    print_usage
    exit 1
end
