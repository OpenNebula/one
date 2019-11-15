#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    VMDIR             = '/var/lib/one'
    CONFIG_FILE       = '/var/lib/one/config'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    VMDIR             = ONE_LOCATION + '/var'
    CONFIG_FILE       = ONE_LOCATION + '/var/config'
end

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'opennebula'
require 'vcenter_driver'
require 'base64'
require 'nsx_driver'

# Changes due to new hooks
#arguments_raw = Base64.decode64(STDIN.read)
arg = "PFBBUkFNRVRFUlM+CiAgPFBBUkFNRVRFUj4KICAgIDxQT1NJVElPTj4xPC9QT1NJVElPTj4KICAgIDxUWVBFPklOPC9UWVBFPgogICAgPFZBTFVFPioqKio8L1ZBTFVFPgogIDwvUEFSQU1FVEVSPgogIDxQQVJBTUVURVI+CiAgICA8UE9TSVRJT04+MjwvUE9TSVRJT04+CiAgICA8VFlQRT5JTjwvVFlQRT4KICAgIDxWQUxVRT5OQU1FPSJhbGxfdHlwZXMiCkRFU0NSSVBUSU9OPSJhbGxfdHlwZXMgZGVzYyIKUlVMRT1bCiAgUFJPVE9DT0w9IlRDUCIsCiAgUlVMRV9UWVBFPSJpbmJvdW5kIiwKICBSQU5HRT0iNDQiCl0KUlVMRT1bCiAgUFJPVE9DT0w9IlVEUCIsCiAgUlVMRV9UWVBFPSJvdXRib3VuZCIsCiAgUkFOR0U9IjE6MiIsCiAgSVA9IjIuMi4yLjIiLAogIFNJWkU9IjEwIgpdClJVTEU9WwogIFBST1RPQ09MPSJJQ01QIiwKICBSVUxFX1RZUEU9ImluYm91bmQiLAogIE5FVFdPUktfSUQ9IjAiCl0KUlVMRT1bCiAgUFJPVE9DT0w9IklDTVB2NiIsCiAgUlVMRV9UWVBFPSJvdXRib3VuZCIKXQpSVUxFPVsKICBQUk9UT0NPTD0iSVBTRUMiLAogIFJVTEVfVFlQRT0iaW5ib3VuZCIKXQpSVUxFPVsKICBQUk9UT0NPTD0iQUxMIiwKICBSVUxFX1RZUEU9ImluYm91bmQiLAogIE5FVFdPUktfSUQ9IjEiCl0KPC9WQUxVRT4KICA8L1BBUkFNRVRFUj4KICA8UEFSQU1FVEVSPgogICAgPFBPU0lUSU9OPjE8L1BPU0lUSU9OPgogICAgPFRZUEU+T1VUPC9UWVBFPgogICAgPFZBTFVFPnRydWU8L1ZBTFVFPgogIDwvUEFSQU1FVEVSPgogIDxQQVJBTUVURVI+CiAgICA8UE9TSVRJT04+MjwvUE9TSVRJT04+CiAgICA8VFlQRT5PVVQ8L1RZUEU+CiAgICA8VkFMVUU+MTE2PC9WQUxVRT4KICA8L1BBUkFNRVRFUj4KICA8UEFSQU1FVEVSPgogICAgPFBPU0lUSU9OPjM8L1BPU0lUSU9OPgogICAgPFRZUEU+T1VUPC9UWVBFPgogICAgPFZBTFVFPjA8L1ZBTFVFPgogIDwvUEFSQU1FVEVSPgo8L1BBUkFNRVRFUlM+"
arguments_raw = Base64.decode64(arg)
arguments_xml = Nokogiri::XML(arguments_raw)

# Required to construct security group object
id = arguments_xml.xpath('//PARAMETER[TYPE="OUT" and POSITION="2"]/VALUE').text

# Creates the object representing security group id
one_sg = OpenNebula::SecurityGroup.new_with_id(id, OpenNebula::Client.new)
rc = one_sg.info
if OpenNebula.is_error?(rc)
    STDERR.puts rc.message
    exit 1
end

one_sg_xml = one_sg.instance_variable_get(:@xml)
one_sg_xml.xpath('//NAME').text
one_sg_xml.xpath('//DESCRIPTION').text
# Security group rules
rules = one_sg_xml.xpath('//RULE')
rules.each do |rule|
    # TCP | UDP | ICMP | ICMPv6 | IPSEC | ALL
    protocol = rule.xpath('PROTOCOL').text
    # OpenNebula network ID
    network_id = rule.xpath('NETWORK_ID').text
    # Format from:to
    range_port = rule.xpath('RANGE').text
    range_port = range_port.index(':')
    if range_port?
        port_from = range_port[0..range_port.index(':')-1]
        port_to = range_port[range_port.index(':')+1,range_port.length]
    else
        port_from = port_to = range_port
    end
    # inbound | outbound
    rule_type = rule.xpath('RULE_TYPE').text
    rule_ip = rule.xpath('IP').text
    rule_size = rule.xpath('SIZE').text
end
