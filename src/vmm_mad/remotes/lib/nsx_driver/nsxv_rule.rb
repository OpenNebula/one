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
module NSXDriver

    # Class Logical Switch
    class NSXVRule < NSXDriver::NSXRule

        # ATTRIBUTES

        # CONSTRUCTOR

        def initialize(nsx_client)
            super(nsx_client)
            @base_url = NSXDriver::NSXConstants::NSXV_RULE_BASE
        end

        def create_rule_spec(rule, vm_data, nic_data)

            virtual_wire_spec =
            "<virtualWireCreateSpec>\
                <name>#{ls_name}</name>\
                <description>#{ls_description}</description>\
                <tenantId>virtual wire tenant</tenantId>\
                <controlPlaneMode>#{replication_mode}</controlPlaneMode>\
                <guestVlanAllowed>false</guestVlanAllowed>\
            </virtualWireCreateSpec>"

                rule_spec =

                "<rule disabled=\"false\" logged=\"false\">\
                    <name>#{rule[:id]}-#{rule[:name]}-#{vm_data[:id]}-#{vm_data[:deploy_id]}-#{nic_data[:id]}</name>\
                    <action>allow</action>\
                    <appliedToList>\
                        <appliedTo>\
                            <name>#{nic_data[:name]}</name>\
                            <value>#{nic_data[:lp]}</value>\
                            <type>Vnic</type>\
                            <isValid>true</isValid>\
                        </appliedTo>\
                    </appliedToList>\
                <sectionId>1023</sectionId>
                <sources excluded="false">
                    <source>
                        <name>app</name>
                        <value>virtualwire-6</value>
                        <type>VirtualWire</type>
                        <isValid>true</isValid>
                    </source>
                </sources>
                <services>
                    <service>
                        <isValid>true</isValid>
                        <sourcePort>80</sourcePort>
                        <destinationPort>80</destinationPort>
                        <protocol>6</protocol>
                        <protocolName>TCP</protocolName>
                    </service>
                </services>
                <direction>inout</direction>
                <packetType>any</packetType>
            </rule>

        end

    end

end
