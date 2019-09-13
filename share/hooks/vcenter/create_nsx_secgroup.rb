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
arguments_raw = Base64.decode64(STDIN.read)
arguments_xml = Nokogiri::XML(arguments_raw)

rule = arguments_xml.xpath('//PARAMETER[TYPE="IN" and POSITION="2"]/VALUE').text


# parameters = arguments_xml.xpath("//PARAMETER")
# success = arguments_xml.xpath('//PARAMETER[TYPE="OUT" and POSITION="1"]/VALUE').text
id = arguments_xml.xpath('//PARAMETER[TYPE="OUT" and POSITION="2"]/VALUE').text

File.open('/tmp/hook_sec_arg_raw', 'w'){|f| f.write(arguments_raw)}
# File.open('/tmp/hook_sec_arg_xml', 'w'){|f| f.write(arguments_xml)}
# File.open('/tmp/hook_sec_parameters', 'w'){|f| f.write(parameters)}
# File.open('/tmp/hook_sec_success', 'w'){|f| f.write(success)}
# File.open('/tmp/hook_sec_resp_id', 'w'){|f| f.write(response_id)}
File.open('/tmp/hook_sec_rule', 'w'){|f| f.write(rule)}

one_sg = OpenNebula::SecurityGroup.new_with_id(id, OpenNebula::Client.new)

rule_name = one_sg['NAME']
rule_desc = one_sg['TEMPLATE/DESCRIPTION']
rule_proto = one_sg['TEMPLATE/RULE/PROTOCOL']
rule_type = one_sg['TEMPLATE/RULE/RULE_TYPE']
rule_net_id = one_sg['TEMPLATE/RULE/NETWORK_ID']

File.open('/tmp/hook_sec_sg', 'w'){|f| f.write(one_sg.inspect)}
File.open('/tmp/hook_sec_rule_name', 'w'){|f| f.write(rule_name)}
File.open('/tmp/hook_sec_rule_desc', 'w'){|f| f.write(rule_desc)}
File.open('/tmp/hook_sec_rule_proto', 'w'){|f| f.write(rule_proto)}
File.open('/tmp/hook_sec_rule_type', 'w'){|f| f.write(rule_type)}
File.open('/tmp/hook_sec_rule_net_id', 'w'){|f| f.write(rule_net_id)}

