#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    ETC_LOCATION=ONE_LOCATION+"/etc/"
end

$: << RUBY_LIB_LOCATION

require 'OpenNebulaDriver'
require 'CommandManager'


# The SSH Information Manager Driver
class DummyInformationManager < OpenNebulaDriver

    # Init the driver
    def initialize(num)
        super('',
            :concurrency => num,
            :threaded => true
        )

        # register actions
        register_action(:MONITOR, method("action_monitor"))
    end

    # Execute the sensor array in the remote host
    def action_monitor(number, host, not_used)
        results =  "HYPERVISOR=dummy,"
        results << "HOSTNAME=#{host},"

        results << "TOTALCPU=800,"
        results << "CPUSPEED=2.2GHz,"

        results << "TOTALMEMORY=16777216,"
        results << "USEDMEMORY=0,"
        results << "FREEMEMORY=16777216,"

        results << "FREECPU=800,"
        results << "USEDCPU=0"

        send_message("MONITOR", RESULT[:success], number, results)
    end
end


# Information Manager main program


im = DummyInformationManager.new(15)
im.start_driver
