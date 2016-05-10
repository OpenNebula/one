# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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
# This driver tag VM traffic with a VLAN_ID using VXLAN protocol. Features:
#   - Creates a bridge and bind phisycal device if not present
#   - Creates a tagged interface for the VM dev.vlan_id
#
# Once activated the VM will be attached to this bridge
################################################################################
class VXLANDriver < VNMMAD::VLANDriver

    # DRIVER name and XPATH for relevant NICs
    DRIVER       = "vxlan"
    XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='vxlan']"

    ############################################################################
    # Create driver device operations are locked
    ############################################################################
    def initialize(vm, xpath_filter = nil, deploy_id = nil)
        @locking = true

        xpath_filter ||= XPATH_FILTER
        super(vm, xpath_filter, deploy_id)
    end

    ############################################################################
    # This function creates and activate a VLAN device
    ############################################################################
    def create_vlan_dev
        mc  = VNMMAD::VNMNetwork::IPv4.to_i(CONF[:vxlan_mc]) + @nic[:vlan_id].to_i
        mcs = VNMMAD::VNMNetwork::IPv4.to_s(mc)
        mtu = @nic[:mtu] ? "mtu #{@nic[:mtu]}" : ""
        ttl = CONF[:vxlan_ttl] ? "ttl #{CONF[:vxlan_ttl]}" : ""

        OpenNebula.exec_and_log("#{command(:ip)} link add #{@nic[:vlan_dev]}"\
            " #{mtu} type vxlan id #{@nic[:vlan_id]} group #{mcs} #{ttl}"\
            " dev #{@nic[:phydev]}")

        OpenNebula.exec_and_log("#{command(:ip)} link set #{@nic[:vlan_dev]} up")
    end
end
