# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'vnmmad'
require 'ovswitch/OpenvSwitch'
require 'vxlan/vxlan'

class OpenvSwitchVXLAN < OpenvSwitchVLAN
    include VXLAN

    # VXLAN orrides
    ATTR_VLAN_ID  = :outer_vlan_id

    # DRIVER name and XPATH for relevant NICs
    DRIVER = "ovswitch_vxlan"
    XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='ovswitch_vxlan']"

    def initialize(vm, xpath_filter = nil, deploy_id = nil)
        @attr_vlan_id  = ATTR_VLAN_ID
        @attr_vlan_dev = ATTR_VLAN_DEV

        xpath_filter ||= XPATH_FILTER
        super(vm, xpath_filter, deploy_id)
    end

private
    # Generate the name of the vlan device which will be added to the bridge.
    def gen_vlan_dev_name
        @nic[:vlan_dev] = "#{@nic[:phydev]}.#{@nic[@attr_vlan_id]}"
    end
end
