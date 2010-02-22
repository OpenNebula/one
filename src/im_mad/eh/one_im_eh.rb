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
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'pp'
require 'one_mad'

################
# EC2 IM MAD #
################

class IM < ONEMad

    def initialize(sensors=nil)
        super(3, 4)
    end
        
    def action_init(args)
        STDOUT.puts "INIT SUCCESS"
        STDOUT.flush
    end
    
    def action_monitor(args)

        totalmemory = ENV["TOTAL_MEMORY"].to_i
        totalcpu    = 100 * ENV["TOTAL_CPU"].to_i


        STDOUT.puts "MONITOR SUCCESS " + args[1].to_s + 
                    "HOSTNAME=#{args[2]},TOTALMEMORY=#{totalmemory},TOTALCPU=#{totalcpu},CPUSPEED=1000,FREEMEMORY=#{totalmemory},FREECPU=#{totalcpu}"
        STDOUT.flush
    end
    
end

im=IM.new(nil)
im.loop
