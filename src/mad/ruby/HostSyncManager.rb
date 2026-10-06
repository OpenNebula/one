# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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
# -------------------------------------------------------------------------- #

# rubocop:disable Lint/MissingCopEnableDirective
# rubocop:disable Layout/FirstArgumentIndentation
# rubocop:disable Layout/FirstHashElementIndentation
# rubocop:disable Layout/HashAlignment
# rubocop:disable Layout/HeredocIndentation
# rubocop:disable Layout/IndentationWidth
# rubocop:disable Style/HashSyntax
# rubocop:disable Style/ParallelAssignment

require 'CommandManager'
require 'shellwords'

# This helper module introduces a common routine that synchronizes
# the "remotes".
class HostSyncManager

    def initialize
        one_location = ENV['ONE_LOCATION']&.delete("'")
        if one_location.nil?
            @local_scripts_base_path = '/var/lib/one/remotes'
        else
            @local_scripts_base_path = one_location + '/var/remotes'
        end

        @remote_scripts_base_path = '/var/lib/one-remotes'
    end

    def update_remotes(hostname, logger = nil, copy_method = :rsync, subset = nil)
        sources = '.'

        if subset && copy_method == :rsync
            # Make sure all files in the subset exist (and are relative).
            subset.each do |path|
                File.realpath path, @local_scripts_base_path
            end

            sources = subset.join(' ')
        end

        case copy_method
        when :ssh
            # Empty the directory instead of recreating it; removing it
            # would fail as its parent is not writable by oneadmin
            mkdir_cmd = assemble_cmd [
                "mkdir -p '#{@remote_scripts_base_path}'/",
                "find '#{@remote_scripts_base_path}'/ -mindepth 1 -delete"
            ]

            sync_cmd = assemble_cmd [
                "cd '#{@local_scripts_base_path}'/",
                "scp -rp #{sources} " \
                    "'#{hostname}':'#{@remote_scripts_base_path}'/"
            ]
        when :rsync
            mkdir_cmd = assemble_cmd [
                "mkdir -p '#{@remote_scripts_base_path}'/"
            ]

            sync_cmd = assemble_cmd [
                "cd '#{@local_scripts_base_path}'/",
                "rsync -LRaz --delete #{sources} " \
                    "'#{hostname}':'#{@remote_scripts_base_path}'/"
            ]
        end

        # Escape the command so it fully runs on the remote side. Otherwise
        # the local shell would interpret the metacharacters (';', '&&') and
        # run all but the first command locally.
        cmd = SSHCommand.run(mkdir_cmd.shellescape, hostname, logger)

        if error?(cmd)
            STDERR.puts "Could not create '#{@remote_scripts_base_path}' " \
                        "on host '#{hostname}'. The directory is created " \
                        'by the OpenNebula node packages; make sure they ' \
                        'are installed and up to date on the host.'
            return cmd.code
        end

        cmd = LocalCommand.run(sync_cmd, logger)
        return cmd.code if error?(cmd)

        0
    end

    # Stops the monitord clients of the host that are not running from the
    # remotes directory, i.e. that were started from the directory used
    # before 7.5 (/var/tmp/one). Such a client keeps running the old probes
    # after a sync, as the directory it reads them from is no longer
    # updated. monitord restarts the client, from the synced remotes, once
    # it misses the host beacons (MONITORING_INTERVAL_HOST seconds at most).
    #
    # @param hostname [String] host to connect to
    # @return [Array] exit code and the PIDs of the stopped clients
    def stop_stale_monitord_clients(hostname, logger = nil)
        stale_cmd = assemble_cmd [
            "pids=$(pgrep -af '/monitord-client\\.rb ' | " \
                "grep -v ' #{@remote_scripts_base_path}/' | cut -d ' ' -f 1)",
            'if [ -n "$pids" ]; then kill -9 $pids && echo $pids; fi'
        ]

        cmd = SSHCommand.run(stale_cmd.shellescape, hostname, logger)

        return [cmd.code, []] if error?(cmd)

        [0, cmd.stdout.split]
    end

    def assemble_cmd(steps)
        "exec 2>/dev/null; #{steps.join(' && ')}"
    end

    def error?(cmd)
        return false if cmd.code == 0

        STDERR.puts cmd.stderr
        STDOUT.puts cmd.stdout
        true
    end

end
