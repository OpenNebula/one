#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    ETC_LOCATION="/etc/one/"
    PROBE_LOCATION="/usr/lib/one/im_probes/"
    REMOTES_LOCATION="/usr/lib/one/remotes"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    ETC_LOCATION=ONE_LOCATION+"/etc/"
    PROBE_LOCATION=ONE_LOCATION+"/lib/im_probes/"
    REMOTES_LOCATION=ONE_LOCATION+"/lib/remotes/"
end

$: << RUBY_LIB_LOCATION

require 'OpenNebulaDriver'
require 'CommandManager'

#-------------------------------------------------------------------------------
# The Local Information Manager Driver
#-------------------------------------------------------------------------------
class InformationManager < OpenNebulaDriver

    #---------------------------------------------------------------------------
    # Init the driver
    #---------------------------------------------------------------------------
    def initialize(hypervisor, num)
        super(num, true)

        @config     = read_configuration
        @hypervisor = hypervisor

        @cmd_path   = "#{ENV['ONE_LOCATION']}/lib/remotes/im"

        # register actions
        register_action(:MONITOR, method("action_monitor"))
    end

    #---------------------------------------------------------------------------
    # Execute the run_probes in the remote host
    #---------------------------------------------------------------------------
    def action_monitor(number, host, unused)
        log_lambda=lambda do |message|
            log(number, message)
        end

        cmd_string  = "#{@cmd_path}/run_probes #{@hypervisor} #{host}"
        monitor_exe = LocalCommand.run(cmd_string, host, log_method(id))

        if monitor_exe.code == 0
            send_message("MONITOR", RESULT[:success], number, monitor_exe.stdout)
        else
            send_message("MONITOR", RESULT[:failure], number,
                "Could not monitor host #{host}.")
        end
    end

end

#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# Information Manager main program
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------

hypervisor = ARGV[0]
im = InformationManager.new(hypervisor, 15)
im.start_driver
