#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
require 'base64'


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
        register_action(:STOPMONITOR, method("stop_monitor"))
    end

    # Execute the sensor array in the remote host
    def action_monitor(number, host, not_used1, not_used2)
        results =  "HYPERVISOR=dummy\n"
        results << "HOSTNAME=#{host}\n"

        results << "CPUSPEED=2.2GHz\n"

        used_memory = rand(16777216)
        results << "TOTALMEMORY=16777216\n"
        results << "USEDMEMORY=#{used_memory}\n"
        results << "FREEMEMORY=#{16777216-used_memory}\n"

        used_cpu = rand(800)
        results << "TOTALCPU=800\n"
        results << "USEDCPU=#{used_cpu}\n"
        results << "FREECPU=#{800-used_cpu}\n"

        results << "DS_LOCATION_USED_MB=9720\n"
        results << "DS_LOCATION_TOTAL_MB=20480\n"
        results << "DS_LOCATION_FREE_MB=20480\n"

        results = Base64::encode64(results).strip.delete("\n")

        send_message("MONITOR", RESULT[:success], number, results)
    end

    def stop_monitor(number, host)
        send_message("STOPMONITOR", RESULT[:success], number, nil)
    end
end


# Information Manager main program


im = DummyInformationManager.new(15)
im.start_driver
