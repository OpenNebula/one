#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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


$: << File.dirname(__FILE__) + '/..'
$: << File.dirname(__FILE__) + '/../lib'
$: << File.dirname(__FILE__) + '/../../../mad/ruby'

require 'vnmmad'

module VNMMAD
module VNMNetwork
    class Nics < Array
        def initialize(hypervisor)
            @nicClass = NicTest
        end
    end

    class NicTest < Hash
        def initialize
            super(nil)
        end

        def get_info(vm)
        end

        def get_tap(vm)
            self[:tap] = "vnet0"
            self
        end
    end

    class Commands < Array
        def run!
            self.each{ |c| puts "#{c}"}
            clear
            return ""
        end
    end
end
end

vm_xml=<<EOF
<VM>
  <ID>3</ID>
  <TEMPLATE>
    <NIC>
      <AR_ID><![CDATA[0]]></AR_ID>
      <BRIDGE><![CDATA[vbr0]]></BRIDGE>
      <FILTER_IP_SPOOFING><![CDATA[YES]]></FILTER_IP_SPOOFING>
      <FILTER_MAC_SPOOFING><![CDATA[YES]]></FILTER_MAC_SPOOFING>
      <IP><![CDATA[10.0.0.7]]></IP>
      <MAC><![CDATA[02:00:0a:00:00:07]]></MAC>
      <NETWORK><![CDATA[test]]></NETWORK>
      <NETWORK_ID><![CDATA[0]]></NETWORK_ID>
      <NETWORK_UNAME><![CDATA[ruben]]></NETWORK_UNAME>
      <NIC_ID><![CDATA[0]]></NIC_ID>
      <SECURITY_GROUPS><![CDATA[100]]></SECURITY_GROUPS>
      <VLAN><![CDATA[NO]]></VLAN>
    </NIC>
    <SECURITY_GROUP_RULE>
      <PROTOCOL><![CDATA[TCP]]></PROTOCOL>
      <RULE_TYPE><![CDATA[outbound]]></RULE_TYPE>
      <SECURITY_GROUP_ID><![CDATA[100]]></SECURITY_GROUP_ID>
      <SECURITY_GROUP_NAME><![CDATA[Test]]></SECURITY_GROUP_NAME>
    </SECURITY_GROUP_RULE>
    <SECURITY_GROUP_RULE>
      <PROTOCOL><![CDATA[TCP]]></PROTOCOL>
      <RANGE><![CDATA[80,22]]></RANGE>
      <RULE_TYPE><![CDATA[inbound]]></RULE_TYPE>
      <SECURITY_GROUP_ID><![CDATA[100]]></SECURITY_GROUP_ID>
      <SECURITY_GROUP_NAME><![CDATA[Test]]></SECURITY_GROUP_NAME>
    </SECURITY_GROUP_RULE>
    <SECURITY_GROUP_RULE>
      <ICMP_TYPE><![CDATA[8]]></ICMP_TYPE>
      <PROTOCOL><![CDATA[ICMP]]></PROTOCOL>
      <RULE_TYPE><![CDATA[inbound]]></RULE_TYPE>
      <SECURITY_GROUP_ID><![CDATA[100]]></SECURITY_GROUP_ID>
      <SECURITY_GROUP_NAME><![CDATA[Test]]></SECURITY_GROUP_NAME>
    </SECURITY_GROUP_RULE>
    <SECURITY_GROUP_RULE>
      <AR_ID><![CDATA[0]]></AR_ID>
      <ICMP_TYPE><![CDATA[0]]></ICMP_TYPE>
      <IP><![CDATA[10.0.0.7]]></IP>
      <MAC><![CDATA[02:00:0a:00:00:07]]></MAC>
      <NETWORK_ID><![CDATA[0]]></NETWORK_ID>
      <PROTOCOL><![CDATA[ICMP]]></PROTOCOL>
      <RULE_TYPE><![CDATA[outbound]]></RULE_TYPE>
      <SECURITY_GROUP_ID><![CDATA[100]]></SECURITY_GROUP_ID>
      <SECURITY_GROUP_NAME><![CDATA[Test]]></SECURITY_GROUP_NAME>
      <SIZE><![CDATA[27]]></SIZE>
      <TYPE><![CDATA[IP4]]></TYPE>
    </SECURITY_GROUP_RULE>
    <SECURITY_GROUP_RULE>
      <IP><![CDATA[192.168.10.3]]></IP>
      <PROTOCOL><![CDATA[TCP]]></PROTOCOL>
      <RANGE><![CDATA[80:100,22]]></RANGE>
      <RULE_TYPE><![CDATA[inbound]]></RULE_TYPE>
      <SECURITY_GROUP_ID><![CDATA[100]]></SECURITY_GROUP_ID>
      <SECURITY_GROUP_NAME><![CDATA[Test]]></SECURITY_GROUP_NAME>
      <SIZE><![CDATA[23]]></SIZE>
    </SECURITY_GROUP_RULE>
    <SECURITY_GROUP_RULE>
      <AR_ID><![CDATA[0]]></AR_ID>
      <ICMP_TYPE><![CDATA[3]]></ICMP_TYPE>
      <IP><![CDATA[10.0.0.7]]></IP>
      <MAC><![CDATA[02:00:0a:00:00:07]]></MAC>
      <NETWORK_ID><![CDATA[0]]></NETWORK_ID>
      <PROTOCOL><![CDATA[ICMP]]></PROTOCOL>
      <RULE_TYPE><![CDATA[outbound]]></RULE_TYPE>
      <SECURITY_GROUP_ID><![CDATA[100]]></SECURITY_GROUP_ID>
      <SECURITY_GROUP_NAME><![CDATA[Test]]></SECURITY_GROUP_NAME>
      <SIZE><![CDATA[27]]></SIZE>
      <TYPE><![CDATA[IP4]]></TYPE>
    </SECURITY_GROUP_RULE>
    <SECURITY_GROUP_RULE>
      <IP><![CDATA[172.168.0.0]]></IP>
      <PROTOCOL><![CDATA[UDP]]></PROTOCOL>
      <RULE_TYPE><![CDATA[outbound]]></RULE_TYPE>
      <SECURITY_GROUP_ID><![CDATA[100]]></SECURITY_GROUP_ID>
      <SECURITY_GROUP_NAME><![CDATA[Test]]></SECURITY_GROUP_NAME>
      <SIZE><![CDATA[255]]></SIZE>
    </SECURITY_GROUP_RULE>
    <TEMPLATE_ID><![CDATA[0]]></TEMPLATE_ID>
    <VMID><![CDATA[0]]></VMID>
  </TEMPLATE>
</VM>
EOF

one_sg = VNMMAD::SGDriver.new(vm_xml, "one-0", "test")
one_sg.activate
