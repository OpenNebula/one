#!/usr/bin/env ruby

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

require 'json'
require 'open3'
require 'base64'
require 'yaml'

# Virsh Wrapper
module VirshWrapper

    ACTIONS = {
        :apply => 'apply',
        :delete => 'delete'
    }.freeze

    # Execute a command inside a VM using the QEMU guest agent
    #
    # @param vm [String] VM name (one-<ID>)
    # @param path [String] Path to executable inside VM
    # @param args [Array<String>] Arguments for the executable
    # @param input_data [String, nil] Optional base64-encoded string to pass as stdin
    #
    # @return [Integer] PID of the executed process
    #
    def self.guest_exec(vm, path, args = [], input_data: nil)
        cmd = {
            'execute' => 'guest-exec',
            'arguments' => {
                'path' => path,
                'arg' => args,
                'capture-output' => true
            }
        }
        cmd['arguments']['input-data'] = input_data if input_data
        output = virsh_qemu_agent_command(cmd, vm)
        JSON.parse(output)['return']['pid']
    end

    # Get the status of a command previously executed inside a VM
    #
    # @param vm [String] VM name (one-<ID>)
    # @param pid [Integer] Process ID returned by guest_exec
    #
    # @return [Hash] Status information (exitcode, output, etc.)
    #
    def self.guest_exec_status(vm, pid)
        cmd = { 'execute' => 'guest-exec-status', 'arguments' => { 'pid' => pid } }
        result = JSON.parse(virsh_qemu_agent_command(cmd, vm))
        result['return']
    end

    # Send a JSON command to the VM via virsh qemu-agent
    #
    # @param cmd [Hash] Command to send to the VM
    # @param vm [String] VM name (one-<ID>)
    #
    # @return [String] stdout from virsh command
    #
    # @raise [RuntimeError] if virsh command fails
    #
    def self.virsh_qemu_agent_command(cmd, vm)
        full_cmd = "virsh --connect qemu:///system qemu-agent-command #{vm} '#{cmd.to_json}'"
        stdout, stderr, status = Open3.capture3(full_cmd)
        raise "Error executing virsh command: #{stderr}" unless status.success?

        stdout
    end

    # Check if a file exists inside the VM
    #
    # @param vm [String] VM name (one-<ID>)
    # @param path [String] Path to file inside VM
    #
    # @return [Boolean] true if file exists, false otherwise
    #
    def self.file_exists?(vm, path)
        pid = guest_exec(vm, '/usr/bin/test', ['-f', path])
        status = guest_exec_status(vm, pid)
        status['exitcode'] == 0
    end

    # Retrieve and decode a kubeconfig file from the VM
    #
    # @param vm [String] VM name (one-<ID>)
    # @param path [String] Path to kubeconfig inside VM
    # @return [String] Decoded kubeconfig contents
    #
    # @raise [RuntimeError] if command exit code is non-zero
    #
    def self.get_kubeconfig(vm, path)
        pid = guest_exec(vm, '/usr/bin/base64', [path])
        status = guest_exec_status(vm, pid)
        raise "Error: exitcode #{status['exitcode']}" unless status['exitcode'] == 0

        Base64.decode64(Base64.decode64(status['out-data']))
    end

    # Apply a Kubernetes resource inside the VM using kubectl
    #
    # @param vm [String] VM name (one-<ID>)
    # @param action [Symbol] Action to perform (:apply or :delete)
    # @param resource [String] YAML manifest of the Kubernetes resource
    # @param kubeconfig [String] Path to the kubeconfig file inside the VM
    # @param kubectl [String] Path to the kubectl executable inside the VM
    #
    # rubocop:disable Metrics/ParameterLists
    def self.kubectl_resource(vm, resource, action,
                              kubeconfig: '/etc/rancher/rke2/rke2.yaml',
                              kubectl: '/var/lib/rancher/rke2/bin/kubectl')
        raise 'Invalid action, use :apply or :delete.' unless ACTIONS.values.include?(action)

        content_b64 = Base64.strict_encode64(resource)
        guest_exec(
            vm,
            kubectl,
            ['--kubeconfig', kubeconfig, action, '-f', '-'],
            :input_data => content_b64
        )
    end

    # Scale a Kubernetes MachineDeployment inside the VM using kubectl
    #
    # @param vm [String] VM name (one-<ID>)
    # @param name [String] Name of the MachineDeployment to scale
    # @param replicas [Integer] Desired number of replicas
    # @param kubeconfig [String] Path to the kubeconfig file inside the VM
    # @param kubectl [String] Path to the kubectl executable inside the VM
    #
    def self.scale_machine_deployment(vm, name, replicas,
                                      kubeconfig: '/etc/rancher/rke2/rke2.yaml',
                                      kubectl: '/var/lib/rancher/rke2/bin/kubectl')
        guest_exec(
            vm,
            kubectl,
            ['--kubeconfig', kubeconfig,
             'patch', 'md', name,
             '--type', 'merge',
             '-p', "{\"spec\":{\"replicas\": #{replicas}}}"]
        )
    end

    # Reap QEMU Guest Agent processes
    #
    # @param host [String] Host name
    # @param host_id [Integer] Host ID
    #
    # @return [String] QEMU Guest Agent execution string
    def self.qemu_ga_reaper(host, host_id)
        qemu_exec_str = ''

        vms = DomainList.state_info(host, host_id)
        lock_exec do
            vms.each do |_uuid, vm|
                next if vm[:ignore] == true
                next if vm[:id].to_i < 0

                path = "/var/run/one/one-#{vm[:id]}"
                next unless File.exist?(path)

                pid_str = File.read(path).strip
                next if pid_str.empty?

                pid = pid_str.to_i
                status_hash = guest_exec_status("one-#{vm[:id]}", pid)
                next unless status_hash.is_a?(Hash) && status_hash['exited']

                rc = status_hash['exitcode'].to_s
                out_b64 = (status_hash['out-data'] || '').to_s
                err_b64 = (status_hash['err-data'] || '').to_s

                qemu_exec_str << vm_to_exec(vm[:id].to_s, pid, 'DONE', rc, out_b64, err_b64)
                File.delete(path)
            end
        end

        qemu_exec_str
    rescue StandardError => e
        STDERR.puts "qemu_ga_reaper error: #{e.message}"
        qemu_exec_str
    end

    # Build QEMU_GA_EXEC parameters for a VM command execution
    #
    # @param vm     [String] VM info
    # @param status [String] Execution status ("RUNNING", "DONE", "ERROR")
    # @param rc     [String] Return code as string
    # @param out    [String] Base64-encoded stdout
    # @param err    [String] Base64-encoded stderr
    #
    # @return [String] QEMU Guest Agent execution string
    def self.vm_to_exec(vm_id, pid, status, rc, out, err)
        'VM = [' \
        " ID=\"#{vm_id}\"," \
        " PID=\"#{pid}\"," \
        " STATUS=\"#{status}\"," \
        " RETURN_CODE=\"#{rc}\"," \
        " STDOUT=\"#{out}\"," \
        " STDERR=\"#{err}\" ]"
    end

    # Execute code with an exclusive lock.
    def self.lock_exec
        lock_path = '/var/run/one/.exec-lock'
        File.open(lock_path, 'w') do |f|
            f.flock(File::LOCK_EX)
            yield
        ensure
            f.flock(File::LOCK_UN)
        end
    end
    # rubocop:enable Metrics/ParameterLists

end
