#!/usr/bin/env ruby

# -----------------------------------------------------------------------------
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# -----------------------------------------------------------------------------

# Adds current directory to the library search path (make the script
# compatible with ruby 1.9.2)
$: << '.'

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'socket'
require 'pp'
require 'rexml/document'
require 'Ganglia'

#############################
## CONFIGURATION GOES HERE ##
#############################

# host and port where to get monitoring information
GANGLIA_HOST='localhost'
GANGLIA_PORT=8649

# If this variable is set the the information will be read from that file
# otherwise it will get information from the ganglia endpoint
# defined previously
#GANGLIA_FILE='data.xml'


domain=ARGV[0]
dom_id=ARGV[2]
host=ARGV[1]

# Gets monitoring data from ganglia or file
begin
    if defined?(GANGLIA_FILE)
        ganglia=GangliaHost.new_from_file(host, GANGLIA_FILE)
    else
        ganglia=GangliaHost.new_from_ganglia(host, GANGLIA_HOST, GANGLIA_PORT)
    end
rescue
    STDERR.puts "Error reading ganglia data"
    exit -1
end

doms_info=ganglia.get_vms_information
dom_id=domain.split('-').last

# Unknown state when the VM is not found
if !doms_info || !(doms_info[domain] || doms_info[dom_id])
    puts "STATE=d"
    exit(0)
end

# Get key one-<vmid> or <vmid> key from the hash
dom_info=doms_info[domain]
dom_info=doms_info[dom_id] if !dom_info

if dom_info
    info=dom_info.map do |key, value|
        "#{key.to_s.upcase}=#{value}"
    end.join(' ')
    
    puts info
end


