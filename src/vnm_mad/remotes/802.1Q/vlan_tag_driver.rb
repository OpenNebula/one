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
    XPATH_FILTER = "TEMPLATE/NIC[VLAN='YES']"

    ############################################################################
    # Creatges the driver device operations are not locked
    ############################################################################
    def initialize(vm, deploy_id = nil, hypervisor = nil)
        @locking = false

        super(vm, XPATH_FILTER, deploy_id, hypervisor)
    end

    ############################################################################
    # Activate the driver and creates bridges and tags devices as needed.
    ############################################################################
    def activate
        lock

        vm_id   =  @vm['ID']
        options = Hash.new

        process do |nic|

            options.clear

            options[:bridge]  = nic[:bridge]
            options[:phydev]  = nic[:phydev]
            options[:vlan_id] = nic[:vlan_id]
            options[:network_id] = nic[:network_id]

            return if options[:phydev].nil?

            set_up_vlan(options)
        end

        unlock

        return 0
    end

    ############################################################################
    # This function creates and activate a VLAN device
    ############################################################################
    def create_vlan_dev(options)
        OpenNebula.exec_and_log("#{command(:ip)} link add link"\
            " #{options[:phydev]} name #{options[:vlan_dev]} type vlan id"\
            " #{options[:vlan_id]}")

        OpenNebula.exec_and_log("#{command(:ip)} link set #{options[:vlan_dev]} up")
    end
end
