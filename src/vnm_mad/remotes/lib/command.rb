# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

    # This module include implementation specific functions. It MUST not be
    # be used in other VNMAD classes.
    module Configuration
        # Return the command to talk to the Xen hypervisor xm or xl for
        # Xen 3 and 4
        def self.get_xen_command
            if system("ps axuww | grep -v grep | grep '\\bxend\\b'")
                "sudo xm"
            else
                "sudo xl"
            end
        end
    end

    # Command configuration for common network commands. This CAN be adjust
    # to local installations. Any modification requires to sync the hosts with
    # onehost sync command.
    COMMANDS = {
      :ebtables => "sudo ebtables",
      :iptables => "sudo iptables",
      :brctl    => "sudo brctl",
      :ip       => "sudo ip",
      :virsh    => "virsh -c qemu:///system",
      :xm       => Configuration::get_xen_command,
      :ovs_vsctl=> "sudo ovs-vsctl",
      :ovs_ofctl=> "sudo ovs-ofctl",
      :lsmod    => "lsmod",
      :ipset    => "sudo ipset"
    }

    # Represents an Array of commands to be executed by the networking drivers
    # The commands
    class Commands < Array

        # Adds a new command to the command array
        #  @param cmd [String] the command, it can be a key defined in COMMANDS
        #  @para args[Array<String>] Arguments for the command
        def add (cmd, *args)
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
            out = ""

            self.each{ |c|
                out << `#{c}`

                raise StandardError, "Command Error: #{c}" if !$?.success?
            }

            clear

            return out
        end
    end
end

end