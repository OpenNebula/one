# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

################################################################################
# This driver tag VM traffic with a VLAN_ID using 802.1Q protocol. Features:
#   - Creates a bridge and bind phisycal device if not present
#   - Creates a tagged interface for the VM dev.vlan_id
#
# Once activated the VM will be attached to this bridge
################################################################################
class VLANTagDriver < VNMMAD::VLANDriver

    # DRIVER name and XPATH for relevant NICs
    DRIVER       = "802.1Q"
    XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='802.1Q']"

    ############################################################################
    # Create driver device operations are locked
    ############################################################################
    def initialize(vm, deploy_id = nil, hypervisor = nil)
        @locking = true

        super(vm, XPATH_FILTER, deploy_id, hypervisor)
    end

    ############################################################################
    # This function creates and activate a VLAN device
    ############################################################################
    def create_vlan_dev
        mtu = @nic[:mtu] ? "mtu #{@nic[:mtu]}" : ""

        OpenNebula.exec_and_log("#{command(:ip)} link add link"\
            " #{@nic[:phydev]} name #{@nic[:vlan_dev]} #{mtu} type vlan id"\
            " #{@nic[:vlan_id]}")

        OpenNebula.exec_and_log("#{command(:ip)} link set #{@nic[:vlan_dev]} up")
    end
end
