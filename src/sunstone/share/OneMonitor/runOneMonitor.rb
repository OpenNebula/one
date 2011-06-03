#!/usr/bin/env ruby

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

$: << File.dirname(__FILE__)

require 'HostMonitor.rb'
require 'VMMonitor.rb'

DEFAULT_INTERVAL= 600 #secs
DEFAULT_HOST_LOG_FOLDER = "#{ENV['ONE_LOCATION']}/logs/host/"
DEFAULT_VM_LOG_FOLDER = "#{ENV['ONE_LOCATION']}/logs/vm/"


#ARG0=interval, ARG1=hostfolder, ARG2=vmfolder
MONITOR_INTERVAL= ARGV[0]? ARGV[0].to_i : DEFAULT_INTERVAL #secs
HOST_LOG_FOLDER= ARGV[1]? ARGV[1]: DEFAULT_HOST_LOG_FOLDER
VM_LOG_FOLDER=ARGV[2] ? ARGV[2] :  DEFAULT_VM_LOG_FOLDER

hostm = HostMonitor.new(HOST_LOG_FOLDER)
vmm = VMMonitor.new(VM_LOG_FOLDER)

while true do
    hostm.snapshot
    vmm.snapshot
    sleep MONITOR_INTERVAL
end
