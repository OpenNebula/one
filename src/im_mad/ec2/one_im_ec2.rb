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
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'pp'
require 'OpenNebulaDriver'

# The EC2 Information Manager Driver
class EC2InformationManagerDriver < OpenNebulaDriver
    # Init the driver, and compute the predefined maximum capacity for this
    # EC2 cloud
    def initialize()
        super('',
            :concurrency => 1,
            :threaded => false
        )

        register_action(:MONITOR, method("action_monitor"))

        sinst  = ENV["SMALL_INSTANCES"].to_i
        linst  = ENV["LARGE_INSTANCES"].to_i
        xlinst = ENV["EXTRALARGE_INSTANCES"].to_i

        smem  = 1048576 * 1.7 * sinst
        scpu  = 100 * sinst

        lmem  = 1048576 * 7.5 * linst
        lcpu  = 400 * linst

        xlmem = 1048576 * 15 * xlinst
        xlcpu = 800 * xlinst

        totalmemory = smem + lmem + xlmem
        totalcpu    = scpu + lcpu + xlcpu

        @info="HYPERVISOR=ec2,TOTALMEMORY=#{totalmemory},"<<
            "TOTALCPU=#{totalcpu},CPUSPEED=1000,FREEMEMORY=#{totalmemory},"<<
            "FREECPU=#{totalcpu}"
    end

    # The monitor action, just print the capacity info and hostname
    def action_monitor(num, host, not_used)
        send_message("MONITOR", RESULT[:success], num,
            "HOSTNAME=#{host},#{@info}")
    end
end

# The EC2 Information Driver main program
im = EC2InformationManagerDriver.new
im.start_driver
