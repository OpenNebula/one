#!/usr/bin/env ruby

# -----------------------------------------------------------------------------
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs
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


def info_string(dom_info)
    if dom_info
        info=dom_info.map do |key, value|
            "#{key.to_s.upcase}=#{value}"
        end.join(' ')
    else
        ''
    end
end

def vm_info(name, dom_info)
    number = -1

    if (name =~ /^one-\d*$/)
        number = name.split('-').last
    end

    string="VM=[\n"
    string<<"  ID=\"#{number}\",\n"
    string<<"  DEPLOY_ID=#{name},\n"
    string<<"  POLL=\"#{info_string(dom_info)}\" ]"
    string
end


if ARGV.length==1
    host=ARGV[0]
    ALL=true
else
    domain=ARGV[0]
    dom_id=ARGV[2]
    host=ARGV[1]
    ALL=false
end

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

if !ALL
    dom_id=domain.split('-').last

    # Unknown state when the VM is not found
    if !doms_info || !(doms_info[domain] || doms_info[dom_id])
        puts "STATE=d"
        exit(0)
    end

    # Get key one-<vmid> or <vmid> key from the hash
    dom_info=doms_info[domain]
    dom_info=doms_info[dom_id] if !dom_info

    puts info_string(dom_info)
else
    puts "VM_POLL=YES"

    doms_info.each do |name, data|
        puts vm_info(name, data)
    end
end

