# frozen_string_literal: true

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

require 'one_helper'
require 'one_helper/onehost_helper'
require 'open3'
require 'socket'
require 'shellwords'

# Helper class to manage fabric operations like package installation,
# removal, and host execution for OpenNebula.
class OneFabricHelper < OpenNebulaHelper::OneHelper

    # User for SSH connection
    ONE_USER = 'oneadmin'
    # Path to the remote command on the KVM host (sudoers)
    REMOTE_CMD_PATH = '/usr/lib/one/opennebula-fabricmanager.rb'
    # Max concurrent SSH connections
    MAX_THREADS = 15

    attr_reader :client

    def initialize
        super
        @host_helper = OneHostHelper.new
        @local_hostname = Socket.gethostname.split('.').first
    end

    # Called by CommandParser to set up the OpenNebula client
    def one_client(options)
        @client = OpenNebula::Client.new(nil, options[:endpoint])
    end

    # Main method to perform actions on selected hosts
    def perform_on_hosts(host_ids, cluster_id, command_args)
        target_hosts = get_target_hosts(host_ids, cluster_id)
        return if target_hosts.empty?

        path_escaped = Shellwords.escape(REMOTE_CMD_PATH)
        run_cmd      = Shellwords.join([REMOTE_CMD_PATH, *command_args])
        combined_cmd = "if [ -f #{path_escaped} ]; then #{run_cmd}; " \
                       "else echo 'Fabric Manager not installed or missing script.' 1>&2; " \
                       'exit 127; fi'

        puts "Executing on #{target_hosts.length} host(s)."
        puts "Command: #{run_cmd}\n\n"

        results = parallel_execute(target_hosts) do |host, is_local|
            cmd = if is_local
                      ['bash', '-c', combined_cmd]
                  else
                      ['ssh', '-T', "#{ONE_USER}@#{host['NAME']}", combined_cmd]
                  end

            stdout_str, stderr_str, status = Open3.capture3(*cmd)
            raise "Remote command failed: #{stderr_str}" unless status.success?

            stdout_str
        end

        display_results(target_hosts, results)
    end

    private

    # Queries OpenNebula for a list of hosts and filters them based on
    # user-provided IDs or a cluster ID.
    def get_target_hosts(host_ids, cluster_id)
        pool = OpenNebula::HostPool.new(@client)
        rc = pool.info_all
        if OpenNebula.is_error?(rc)
            warn "Error getting host list: #{rc.message}"
            exit(-1)
        end

        target_hosts = []
        pool.each do |host|
            host_id_int = host['ID'].to_i
            cluster_id_int = host['CLUSTER_ID'].to_i

            next if host['STATE'].to_i == OpenNebula::Host::HOST_STATES.index('OFFLINE')

            if !host_ids.empty?
                target_hosts << host if host_ids.include?(host_id_int)
            elsif cluster_id
                target_hosts << host if cluster_id_int == cluster_id
            else
                target_hosts << host
            end
        end

        puts 'No matching hosts found or specified.' if target_hosts.empty?

        target_hosts
    end

    # Executes a block of code in parallel for each target host.
    def parallel_execute(target_hosts, &block)
        threads = []
        results = {}
        mutex = Mutex.new

        target_hosts.each do |host|
            threads << Thread.new do
                hostname = host['NAME']
                is_local = (hostname.split('.').first == @local_hostname)

                result_hash = { :out => '', :err => '', :rc => -1, :local => is_local }

                begin
                    result_hash[:out] = block.call(host, is_local)
                    result_hash[:rc] = 0
                rescue StandardError => e
                    result_hash[:err] = "Execution failed: #{e.message}"
                    result_hash[:rc] = 255
                end

                mutex.synchronize do
                    results[hostname] = result_hash
                end
            end

            if threads.size >= MAX_THREADS
                threads.each(&:join)
                threads = []
            end
        end

        threads.each(&:join)
        results
    end

    # Prints the results from the parallel execution to the console.
    def display_results(target_hosts, results)
        total_rc = 0
        target_hosts.sort_by {|h| h['ID'].to_i }.each do |host|
            hostname = host['NAME']
            result = results[hostname]
            local_tag = result[:local] ? '(local)' : '(remote)'

            puts "--- [Host #{host['ID']}: #{hostname}] #{local_tag} ---"
            puts result[:out] unless result[:out].empty?
            warn result[:err] unless result[:err].empty?

            if result[:rc] != 0
                warn "[ERROR] Command failed on #{hostname} with exit code #{result[:rc]}"
                total_rc = 1
            end
            puts
        end

        exit total_rc
    end

end
