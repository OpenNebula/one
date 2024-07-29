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

################################################################################
# This driver tag VM traffic with a VLAN_ID using 802.1Q protocol. Features:
#   - Creates a bridge and bind phisycal device if not present
#   - Creates a tagged interface for the VM dev.vlan_id
#
# Once activated the VM will be attached to this bridge
################################################################################
class VLANTagDriver < VNMMAD::VLANDriver

    # DRIVER name and XPATH for relevant NICs
    DRIVER       = '802.1Q'
    XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='802.1Q']"

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
        mtu = ''

        if @nic[:mtu]
            mtu = "mtu #{@nic[:mtu]}"
        else
            mtu = "mtu #{CONF[:vlan_mtu]}"
        end

        ip_link_conf = ''

        @nic[:ip_link_conf].each do |option, value|
            case value
            when true
                value = 'on'
            when false
                value = 'off'
            end

            ip_link_conf << "#{option} #{value} "
        end

        # Do not fail if the device exists to prevent race conditions.
        # ip link add returns 2 on "RTNETLINK answers: File exists"
        OpenNebula.exec_and_log("#{command(:ip)} link add link"\
            " #{@nic[:phydev]} name #{@nic[:vlan_dev]} #{mtu} type vlan id"\
            " #{@nic[:vlan_id]} #{ip_link_conf}", nil, 2)

        OpenNebula.exec_and_log("#{command(:ip)} link set #{@nic[:vlan_dev]} up")
    end

    def delete_vlan_dev
        OpenNebula.exec_and_log("#{command(:ip)} link delete"\
            " #{@nic[:vlan_dev]}") if @nic[:vlan_dev] != @nic[:phydev]
    end

    def list_interface_vlan(name)
        text = %x(#{command(:ip_unpriv)} -d link show #{name})
        return nil if $?.exitstatus != 0

        text.each_line do |line|
            m = line.match(/vlan protocol 802.1Q id (\d+)/)

            return m[1] if m
        end

        nil
    end
end
