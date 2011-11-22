# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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


# This module provides an abstraction to generate an execution context for
# OpenNebula Drivers

class VirtualNetworkDriver
    include DriverExecHelper

    # Inits the VNET Driver
    # @param [String] name of the vnet driver to use, as listed in remotes/vnet
    # @option ops [String] :ssh_stream to be used for command execution
    # @option ops [String] :message from ONE
    def initialize(directory, options={})

        @options    = options
        @ssh_stream = options[:ssh_stream]
        @message    = options[:message]

        @vm_encoded = Base64.encode64(@message.elements['VM'].to_s).delete("\n")

        initialize_helper("vnet/#{directory}", options)
    end

    # Calls remotes or local action checking the action name and
    # @local_actions. Optional arguments can be specified as a hash
    #
    # @param [Number, String] id action identifier
    # @param [String, Symbol] aname name of the action
    # @param [Hash] ops extra options for the command
    # @option ops [String] :stdin text to be writen to stdin
    def do_action(id, aname, ops = {})
        options={
            :stdin => nil,
        }.merge(ops)

        command = action_command_line(aname, @vm_encoded)

        if action_is_local? aname
            execution = LocalCommand.run(command, log_method(id))
        else
            if options[:stdin]
                command = "cat << EOT | #{command}"
                stdin   = "#{options[:stdin]\nEOT\n}"
            else
                stdin   = nil
            end

            execution = @ssh_stream.run(command,stdin)
        end

        result, info = get_info_from_execution(execution)
    end
end