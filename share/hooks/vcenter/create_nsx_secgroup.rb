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

# GETTING DATA

# Changes due to new hooks
# arguments_raw = Base64.decode64(STDIN.read)
arguments_raw = Base64.decode64(text)
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
sg_name = one_sg_xml.xpath('//NAME').text
sg_description = one_sg_xml.xpath('//DESCRIPTION').text
# Security group rules
rules = one_sg_xml.xpath('//RULE')
rules.each do |rule|
    # TCP | UDP | ICMP | ICMPv6 | IPSEC | ALL
    sg_protocol = rule.xpath('PROTOCOL').text
    # OpenNebula network ID
    sg_network_id = rule.xpath('NETWORK_ID').text
    # Format from:to
    sg_range_port = rule.xpath('RANGE').text
    sg_range_port = sg_range_port.index(':')
    if sg_range_port
        sg_port_from = sg_range_port[0..sg_range_port.index(':')-1]
        sg_port_to = sg_range_port[sg_range_port.index(':')+1,sg_range_port.length]
    else
        sg_port_from = sg_port_to = sg_range_port
    end
    # inbound | outbound
    rule_type = rule.xpath('RULE_TYPE').text
    rule_ip = rule.xpath('IP').text
    rule_size = rule.xpath('SIZE').text
end


# NSX

