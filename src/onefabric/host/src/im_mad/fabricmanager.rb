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

require 'csv'
require 'open3'
require 'json'
require 'base64'

# ##############################################################################
# CONFIGURATION
# - ALL_PARTITIONS: Report all partitions available, not just ACTIVE ones.
# - VM_DOMAIN:             VM domain name deployed by one-ee-tools
#
# REQUIREMENTS
# - opennebula-node-kvm package, installs libvirt and KVM/Qemu dependencies
# - FabricManager appliance running in the host with name one-fabricmanager
# ##############################################################################
ALL_PARTITIONS = false
VM_DOMAIN      = 'one-fabricmanager'

#
# Helper functions
#

#
# Maps NVIDIA SXM (System on Module) IDs to their corresponding PCI addresses.
# It looks for specific DMI types (9 and 41) to establish a mapping between SXM IDs,
# GPU reference designations, and PCI bus addresses.
# The ID of the SXM module corresponds to the ID of the GPUs in the partition
#
# Returns:
#   Hash: A hash where keys are SXM IDs (String) and values are PCI addresses (String).
#
def sxm_map
    sxm_to_gpu_ref = {}
    gpu_ref_to_pci = {}
    sxm_to_pci = {}

    # Execute dmidecode to get DMI information
    begin
        dmi_data = `sudo dmidecode -t 9,41`
    rescue Errno::ENOENT
        # dmidecode not found
        return sxm_to_pci
    end

    unless $CHILD_STATUS.success?
        return sxm_to_pci
    end

    current_type = nil
    current_gpu_ref = nil

    # Parse dmidecode output line by line
    dmi_data.each_line do |line|
        # Start of a new entry/type
        if line =~ /^Handle\ (0x[0-9A-F]+),\ DMI\ type\ ([0-9]+),/
            current_type = Regexp.last_match(2)
            current_gpu_ref = nil # Reset for new entry
            next
        end

        case current_type
        when '41' # Type 41: Onboard Devices Extended Information
            # Extract GPU Reference Designation (e.g., "GPU0")
            if line =~ /Reference\ Designation:\ (GPU[0-9]+)/
                current_gpu_ref = Regexp.last_match(1)
            # Extract PCI Bus Address and map it to the current GPU Reference
            elsif line =~ /Bus\ Address:\ ([0-9a-f]{4}:[0-9a-f]{2}:[0-9a-f]{2}\.[0-9])/ &&
                              current_gpu_ref
                gpu_ref_to_pci[current_gpu_ref] = Regexp.last_match(1)
                current_type = nil # Done with this entry
            end

        when '9' # DMI Type 9: System Slot
            # Extract SXM ID and its corresponding GPU Reference Designation
            if line =~ /Designation:\ GPU\ ([0-9]+),\ SXM\ ([0-9]+)/
                sxm_to_gpu_ref[Regexp.last_match(2)] = "GPU#{Regexp.last_match(1)}"
                current_type = nil # Done with this entry
            end
        end
    end

    # Combine mappings to get SXM ID -> PCI Address
    sxm_to_gpu_ref.each do |sxm_id, gpu_ref|
        pci_addr = gpu_ref_to_pci[gpu_ref]
        sxm_to_pci[sxm_id] = pci_addr if pci_addr
    end

    return sxm_to_pci
end

# Execute command in the VM_DOMAIN
def ga_cmd(command)
    Open3.capture3('virsh', '-c', 'qemu:///system', 'qemu-agent-command',
                   VM_DOMAIN, command)
end

# Asynchronous command execution function for QEMU guest agent
#   command_string [:String]:
#   timpout [:Integer]:
def execute_in_vm(command, timeout = 30)
    start = {
        :execute => 'guest-exec',
        :arguments => {
            :path => '/bin/sh',
            :arg  => ['-c', command],
            :"capture-output" => true
        }
    }.to_json

    stdout, stderr, rc = ga_cmd(start)

    return [nil, stderr, 1] unless rc.success?

    begin
        pid = JSON.parse(stdout).dig('return', 'pid')
    rescue JSON::ParserError
        pid = nil
    end

    return [nil, "Failed to get PID from VM: #{stdout}", 1] unless pid

    response   = {}
    start_time = Time.now
    status     = {
        :execute => 'guest-exec-status',
        :arguments => { :pid => pid }
    }.to_json

    loop do
        # Timeout - Attempt to kill the process (best effort)
        if Time.now - start_time > timeout
            kill_json = {
                :execute   => 'guest-kill',
                :arguments => {
                    :pid    => pid,
                    :signal => 9
                }
            }.to_json

            ga_cmd(kill_json)

            return [nil, 'Command timed out', 1]
        end

        sleep 0.5

        stdout, stderr, rc = ga_cmd(status)

        return [nil, stderr, 1] unless rc.success?

        begin
            response = JSON.parse(stdout).fetch('return', {})
            break if response.fetch('exited', false)
        rescue JSON::ParserError
            next
        end
    end

    return [nil, 'Failed to get command status', 1] unless response.fetch('exited', false)

    out_data  = response.fetch('out-data', '')
    err_data  = response.fetch('err-data', '')
    exit_code = response.fetch('exitcode', 0)

    return [Base64.decode64(out_data), Base64.decode64(err_data), exit_code]
end

################################################################################
# MAIN PROGRAM
################################################################################

stdout, _, status = Open3.capture3("virsh -c qemu:///system domstate #{VM_DOMAIN}")

exit 0 if !status.success? || stdout.strip != 'running'

# Get the PCI Address -> SXM ID map from the host
sxm_to_pci_map = sxm_map

# Gather partitions from FabricManager VM
out, _err, rc = execute_in_vm('nv-partitioner -o 0 -f csv')

exit 0 if rc != 0 || out.nil? || out.empty?

# parse CSV
partitions = []

begin
    CSV.parse(out, :headers => true, :skip_blanks => true) do |row|
        status = row['Status']&.strip

        # Report all partitions if the flag is set, otherwise only ACTIVE ones
        if ALL_PARTITIONS || status == 'ACTIVE'
            partitions << {
                :id      => row['Partition_ID']&.strip,
                :gpus    => row['Num_GPUs']&.strip,
                :modules => row['GPU_Module_IDs']&.strip,
                :status  => status
            }
        end
    end
rescue CSV::MalformedCSVError => _e
    exit 0
end

# print the final output
partitions.each do |partition|
    # partition[:modules] is "6 8"
    gpu_ids = partition[:modules].split

    # Map IDs to PCI addresses using the host's map
    gpu_addrs = gpu_ids.map do |id|
        sxm_to_pci_map[id] || 'UNKNOWN_PCI'
    end.join(' ')

    puts 'NVSWITCH_PARTITION = ['
    puts " PARTITION_ID = \"#{partition[:id]}\" ,"
    puts " NUM_GPUS = \"#{partition[:gpus]}\" ,"
    puts " PARTITION_GPU_IDS = \"#{partition[:modules]}\" ,"
    puts " PARTITION_GPU_ADDR = \"#{gpu_addrs}\" ,"
    puts " PARTITION_STATUS = \"#{partition[:status]}\""
    puts ']'
end
