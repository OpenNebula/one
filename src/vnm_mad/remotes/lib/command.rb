# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

module VNMMAD

    # Network related commands for VN drivers
    module VNMNetwork

        # Command configuration for common network commands. This CAN be adjust
        # to local installations. Any modification requires to sync the hosts
        # with onehost sync command.
        COMMANDS = {
            :ebtables   => 'sudo -n ebtables --concurrent',
            :iptables   => 'sudo -n iptables -w 3 -W 20000',
            :ip6tables  => 'sudo -n ip6tables -w 3 -W 20000',
            :ip         => 'sudo -n ip',
            :ip_unpriv  => 'ip',
            :virsh      => 'virsh -c qemu:///system',
            :ovs_vsctl  => 'sudo -n ovs-vsctl',
            :ovs_ofctl  => 'sudo -n ovs-ofctl',
            :ovs_appctl => 'sudo -n ovs-appctl',
            :lsmod      => 'lsmod',
            :ipset      => 'sudo -n ipset'
        }

        # Adjust :ip[6]tables commands to work with legacy versions
        begin
            stdout = Open3.capture3('iptables --version')[0]
            regex  = /.*v(?<version>\d+.\d+.\d+)/

            iptables_version = Gem::Version.new(stdout.match(regex)[:version])

            if iptables_version <= Gem::Version.new('1.6.1') ||
                  iptables_version > Gem::Version.new('1.8.7')
                COMMANDS[:iptables]  = 'sudo -n iptables -w 3'
                COMMANDS[:ip6tables] = 'sudo -n ip6tables -w 3'
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

        end

    end

end
