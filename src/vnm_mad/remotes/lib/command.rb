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

require 'open3'
require 'DriverLogger'

module VNMMAD

    # Network related commands for VN drivers
    module VNMNetwork

        # Command configuration for common network commands. This CAN be adjust
        # to local installations. Any modification requires to sync the hosts
        # with onehost sync command.
        COMMANDS = {
            :iptables      => 'sudo -n iptables -w 3',
            :ip6tables     => 'sudo -n ip6tables -w 3',
            :ip            => 'sudo -n ip',
            :ip_unpriv     => 'ip',
            :virsh         => 'virsh -c qemu:///system',
            :ovs_vsctl     => 'sudo -n ovs-vsctl',
            :ovs_ofctl     => 'sudo -n ovs-ofctl',
            :ovs_appctl    => 'sudo -n ovs-appctl',
            :lsmod         => 'lsmod',
            :ipset         => 'sudo -n ipset',
            :nft           => 'sudo -n nft',
            :tproxy        => 'sudo -n /var/tmp/one/vnm/tproxy',
            :ip_netns_exec => 'sudo -nE /var/tmp/one/vnm/ip_netns_exec',
            :bridge        => 'sudo -n bridge'
        }

        # Adjust :ip[6]tables commands to work with legacy versions.
        #
        # Background:
        #
        # iptables has two flags to control concurrency:
        # * -w / --wait <n>: how much time to wait to acquire lock
        # * -W / --wait-interval <n>: combined with `-w`, check the lock in the specified interval
        #
        # Iptables versions prior to 1.6.1 only provided the `-w` flag, which, if the DB was
        # initially locked, just made the process sleep during some period of time and try again to
        # acquire the lock at the end. This made the process wait for the whole period even if the
        # lock were to be released earlier.
        # The wait-interval flag was introduced in version 1.6.1, so starting from that one, it was
        # recommended to use both flags as it greatly improved latency.
        # Then, starting from version 1.8.8, a new scheduling mechanism was introduced which made
        # the wait interval obsolete, as the process will take the lock as soon as it's available
        # just using the wait flag.
        #
        # So, the ideal iptables usage by version range is:
        # - Up to 1.6.0: iptables -w 3
        # - From 1.6.1 to 1.8.7: iptables -w 3 -W 20000
        # - From 1.8.8: iptables -w 3
        begin
            stdout = Open3.capture3('iptables --version')[0]
            regex  = /.*v(?<version>\d+.\d+.\d+)/

            iptables_version = Gem::Version.new(stdout.match(regex)[:version])

            if Gem::Version.new('1.6.1') <= iptables_version &&
                  iptables_version < Gem::Version.new('1.8.8')
                COMMANDS[:iptables]  = 'sudo -n iptables -w 3 -W 20000'
                COMMANDS[:ip6tables] = 'sudo -n ip6tables -w 3 -W 20000'
            end
        rescue StandardError
        end

        # Represents an Array of commands to be executed by the networking
        # drivers # The commands
        class Commands < Array

            # Adds a new command to the command array
            #  @param cmd [String] the command,
            #         it can be a key defined in COMMANDS
            #  @para args[Array<String>] Arguments for the command
            def add(cmd, *args)
                if COMMANDS.keys.include?(cmd.to_sym)
                    cmd_str = "#{COMMANDS[cmd.to_sym]} #{args.join(' ')}"
                else
                    cmd_str = "#{cmd} #{args.join(' ')}"
                end

                self << cmd_str
            end

            # Executes the commands array
            #   @return [String] the output of the commands
            def run!
                out = ''

                each do |c|
                    out << `#{c}`

                    # rubocop:disable Style/SpecialGlobalVars
                    raise StandardError, "Command Error: #{c}" \
                        unless $?.success?
                    # rubocop:enable Style/SpecialGlobalVars
                end

                clear

                out
            end

            # Executes the commands array on given ssh stream
            #   @return [String] the output of the commands
            def run_remote(ssh_stream)
                out = ''
                each do |c|
                    cmd = ssh_stream.run(c)
                    out << cmd.stdout

                    raise StandardError,
                          "Command Error: '#{c}' " <<
                          "rc: #{cmd.code} err: #{cmd.stderr}" \
                        if cmd.code != 0
                end

                clear

                out
            end

        end

        # Command helper class
        class Command

            # Executes a command
            #   @return [String, String, Process::Status] the standard output,
            #                                             standard error and
            #                                             status returned by
            #                                             Open3.capture3
            def self.run(cmd, *args)
                if COMMANDS.keys.include?(cmd.to_sym)
                    cmd_str = "#{COMMANDS[cmd.to_sym]} #{args.join(' ')}"
                else
                    cmd_str = "#{cmd} #{args.join(' ')}"
                end

                Open3.capture3(cmd_str)
            end

            # Executes a command (paranoid version)
            #   @return [String, String, Process::Status] the standard output,
            #                                             standard error and
            #                                             status returned by
            #                                             Open3.capture3
            def self.no_shell(sym, *args, **opts)
                terminate = (t = opts.delete(:term)).nil? ? true : t

                if args[0].is_a?(Hash)
                    env = args[0]
                    cmd = COMMANDS[sym].split(' ') + args[1..(-1)].to_a
                else
                    env = {}
                    cmd = COMMANDS[sym].split(' ') + args[0..(-1)].to_a
                end

                o, e, s = Open3.capture3(env, *cmd, **opts)

                env = env.empty? ? '' : env.map {|k, v| "#{k}='#{v}' " }.join
                cmd = cmd.join(' ')

                if s.success?
                    OpenNebula::DriverLogger.log_info "Executed \"#{env}#{cmd}\"."

                    OpenNebula::DriverLogger.log_info Base64.strict_encode64(opts[:stdin_data]) \
                        unless opts[:stdin_data].nil?
                else
                    if terminate
                        OpenNebula::DriverLogger.log_error "Command \"#{env}#{cmd}\" failed."

                        OpenNebula::DriverLogger.log_error \
                            Base64.strict_encode64(opts[:stdin_data]) unless opts[:stdin_data].nil?

                        OpenNebula::DriverLogger.log_error e

                        exit(s.exitstatus)
                    else
                        OpenNebula::DriverLogger.log_error \
                            "Command \"#{env}#{cmd}\" failed (recovered)."

                        OpenNebula::DriverLogger.log_error \
                            Base64.strict_encode64(opts[:stdin_data]) unless opts[:stdin_data].nil?

                        OpenNebula::DriverLogger.log_error e
                    end
                end

                [o, e, s]
            end

        end

    end

end
