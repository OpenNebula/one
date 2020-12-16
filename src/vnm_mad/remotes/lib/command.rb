# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

module VNMMAD

    module VNMNetwork

        # Command configuration for common network commands. This CAN be adjust
        # to local installations. Any modification requires to sync the hosts
        # with onehost sync command.
        COMMANDS = {
            :ebtables => 'sudo -n ebtables',
            :iptables => 'sudo -n iptables',
            :ip6tables=> 'sudo -n ip6tables',
            :ip       => 'sudo -n ip',
            :ip_unpriv=> 'ip',
            :virsh    => 'virsh -c qemu:///system',
            :ovs_vsctl=> 'sudo -n ovs-vsctl',
            :ovs_ofctl=> 'sudo -n ovs-ofctl',
            :lsmod    => 'lsmod',
            :ipset    => 'sudo -n ipset'
        }

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

                each  do |c|
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

    end

end
