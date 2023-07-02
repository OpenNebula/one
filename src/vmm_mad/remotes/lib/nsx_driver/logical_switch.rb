# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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
    class LogicalSwitch < NSXComponent

        # ATTRIBUTES
        attr_reader :ls_id
        attr_reader :tz_id
        attr_reader :replication_mode
        attr_reader :display_name
        attr_reader :description

        def ls?; end

        # Get logical switch's name
        def ls_name; end

        # Get logical switch's vni
        def ls_vni; end

        # Get the Transport Zone of the logical switch
        def ls_tz; end

        # Create a new logical switch
        def new_logical_switch(ls_data); end

        # Delete a logical switch
        def delete_logical_switch; end

        # Update a logical switch
        def update_logical_switch; end

        # Return nsx nics of type NSX-V and NSX-T
        # If only_new_attached = true --> Only returns new attached nsx nics
        def self.nsx_nics(template_xml, only_new_attached = true)
            if only_new_attached == true
                nics = template_xml.xpath('//TEMPLATE/NIC[ATTACH="YES"]')
            else
                nics = template_xml.xpath('//TEMPLATE/NIC')
            end
            nics_array = []
            nics.each do |nic|
                network_id = nic.xpath('NETWORK_ID').text
                # Check Networks exists
                one_vnet = VCenterDriver::VIHelper
                           .one_item(OpenNebula::VirtualNetwork, network_id)
                rc = one_vnet.info
                if OpenNebula.is_error?(rc)
                    err_msg = rc.message
                    raise err_msg
                end
                pg_type = one_vnet['TEMPLATE/VCENTER_PORTGROUP_TYPE']
                nics_array << nic if [NSXConstants::NSXV_LS_TYPE,
                                      NSXConstants::NSXT_LS_TYPE]
                                     .include?(pg_type)
            end
            nics_array
        end

    end

end
