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

	def initialize(directory, options={})

		@options    = options
	    @ssh_stream = options[:ssh_stream]


		initialize_helper("vnet/#{directory}", options)
	end

	def do_action(parameters, aname)
		vm_encoded = Base64.encode64(message.elements['VM'].to_s).delete("\n")

		command = action_command_line(aname, @vm_encoded, options[:script_name])

        if action_is_local? aname
            execution = LocalCommand.run(command, log_method(id))
        else
            execution = @ssh_stream.run(command)
        end

        result, info = get_info_from_execution(command_exe)
	end	
end
