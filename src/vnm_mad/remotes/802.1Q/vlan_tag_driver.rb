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

    SUPPORT_UPDATE_802_1Q = [:vlan_id, :cvlans]

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

    # rubocop:disable Style/CommandLiteral
    # rubocop:disable Style/SpecialGlobalVars
    def list_interface_vlan(name)
        text = %x(#{command(:ip_unpriv)} -d link show #{name})
        return if $?.exitstatus != 0

        text.each_line do |line|
            m = line.match(/vlan protocol 802.1Q id (\d+)/)

            return m[1] if m
        end

        nil
    end
    # rubocop:enable Style/SpecialGlobalVars
    # rubocop:enable Style/CommandLiteral

    # --------------------------------------------------------------------------
    # Bridge Configuration (QinQ)
    # --------------------------------------------------------------------------
    # QinQ **IS NOT** a full implementation (compared with open vSwtich) as there
    # is no native support in the Linux bridge, limitations:
    #     - S-VLAN cannot be preserved in the VMs,
    #     - Full bridge configuration based on both VLAN tags is not possible.
    #
    #  However for common scenarios this configurations produces the double tag
    #  and filters out VLANs not included in the CVLAN set.
    #
    #  Example:
    #   - Transport / outer / S-VLAN: 100
    #   - Customer / inner /C-VLAN: 200,300
    #
    #                       +--------------------+
    #                       | Port Configuration |
    #                       |--------------------|
    #   --(eth0)--eth0.100--+ 100 pvid untagged  +------ VM (one-20-1)
    #                       | 200                |
    #                       | 300        onebr.23|
    #                       +--------------------+
    #
    #  Bridge Configuration:
    #     ip link set dev onebr.23 type bridge vlan_filtering 1
    #
    #  VM port configuration (and uplink eth0.100):
    #     bridge vlan add dev one-20-1 vid 100 pvid untagged
    #     bridge vlan add dev one-20-1 vid 200
    #     bridge vlan add dev one-20-1 vid 300
    # --------------------------------------------------------------------------
    def vlan_filter
        lock

        bridge_done = []
        bridges     = list_bridges

        process do |nic|
            @nic  = nic
            brdev = bridges[@nic[:bridge]]

            next if @nic[:phydev].nil? || @nic[:bridge].nil? || !@nic.cvlans?

            vlan_set = @nic.cvlans

            # Configure ports to allow trunk vlans
            set_vlan_filter(@nic[:tap], @nic[:vlan_id], vlan_set)

            next if bridge_done.include? @nic[:bridge]

            # Configure the bridge, TProxy veth and vlan dev
            gen_vlan_dev_name

            tpdev = VNMMAD::TProxy.veth(@nic)

            OpenNebula.exec_and_log("#{command(:ip)} link set dev #{@nic[:bridge]}"\
                ' type bridge vlan_filtering 1', nil, 2)

            set_vlan_filter(tpdev, @nic[:vlan_id], []) if brdev.include? tpdev

            set_vlan_filter(@nic[:vlan_dev], @nic[:vlan_id], vlan_set)

            bridge_done << @nic[:bridge]
        end

        unlock

        0
    end

    # Bridge has been updated (vlan_id / phydev) interfaces. This function
    # re-do the vlan filters
    def update_vlan_filter(vnet_id)
        lock

        changes = @vm.changes.select do |k, _|
            SUPPORT_UPDATE_802_1Q.include?(k)
        end

        return 0 if changes.empty?

        @bridges = list_bridges

        return 0 unless @bridges

        process do |nic|
            next unless Integer(nic[:network_id]) == vnet_id

            @nic  = nic
            brdev = @bridges[@nic[:bridge]]

            next if @nic[:phydev].nil? || @nic[:bridge].nil? || !@nic.cvlans?

            clean_vlan_filters(@nic)

            tpdev = VNMMAD::TProxy.veth(@nic)

            if brdev.include? tpdev
                set_vlan_filter(tpdev, @nic[:vlan_id], [])
                brdev -= tpdev
            end

            brdev.each do |dev|
                set_vlan_filter(dev, @nic[:vlan_id], @nic.cvlans)
            end
        end

        0
    ensure
        unlock
    end

end
