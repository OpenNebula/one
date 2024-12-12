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

module VNMMAD

    # NoVLANDriver class
    class NoVLANDriver < VNMMAD::VNMDriver

        # Attributes that can be updated on update_nic action
        SUPPORTED_UPDATE = [
            :phydev,
            :vlan_tagged_id
        ]

        def initialize(vm, xpath_filter, deploy_id = nil)
            @locking = true

            super(vm, xpath_filter, deploy_id)
        end

        # Activate the driver and creates bridges and tags devices as needed.
        def activate
            lock

            @bridges = list_bridges

            process do |nic|
                @nic = nic

                # Create the bridge.
                create_bridge(@nic)

                # Setup transparent proxies.
                TProxy.setup_tproxy(@nic, :up)

                # Skip if vlan device is already in the bridge.
                next if !@nic[:phydev] || @nic[:phydev].empty? ||
                        @bridges[@nic[:bridge]].include?(@nic[:phydev])

                # Add phydev device to the bridge.
                LocalCommand.run_sh("#{command(:ip)} link set " \
                    "#{@nic[:phydev]} master #{@nic[:bridge]}")

                @bridges[@nic[:bridge]] << @nic[:phydev]
            end

            unlock

            0
        end

        # Deactivate the driver and delete bridges and tags devices as needed.
        def deactivate
            # NIC_ALIAS are  not processed, skip
            return 0 if @vm['TEMPLATE/NIC_ALIAS[ATTACH="YES"]/NIC_ID']

            lock

            @bridges = list_bridges

            attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']

            if @bridges
                process do |nic|
                    next if attach_nic_id && attach_nic_id != nic[:nic_id]

                    @nic = nic

                    next if @bridges[@nic[:bridge]].nil?

                    # Skip if the bridge doesn't exist because it was already
                    # deleted (handles last vm with multiple nics on the same
                    # vlan)
                    next unless @bridges.include? @nic[:bridge]

                    guests = @bridges[@nic[:bridge]] \
                           - [@nic[:phydev], "#{@nic[:bridge]}b"]

                    # Setup transparent proxies.
                    TProxy.setup_tproxy(@nic, :down) if guests.count < 1

                    # Skip the bridge removal (on demand or when still in use).
                    next if @nic[:conf][:keep_empty_bridge] || guests.count > 0

                    # Delete the bridge.
                    LocalCommand.run_sh("#{command(:ip)} link delete #{@nic[:bridge]}")

                    @bridges.delete(@nic[:bridge])
                end
            end

            unlock

            0
        end

        def update(vnet_id)
            lock

            begin
                changes = @vm.changes.select {|k, _| SUPPORTED_UPDATE.include?(k) }

                return 0 if changes.empty?

                @bridges = list_bridges

                process do |nic|
                    @nic = nic

                    next unless Integer(@nic[:network_id]) == vnet_id

                    if !changes[:phydev].nil?
                        LocalCommand.run_sh("#{command(:ip)} link set " \
                            "nomaster #{changes[:phydev]}") unless changes[:phydev].empty?

                        LocalCommand.run_sh("#{command(:ip)} link set " \
                            "#{@nic[:phydev]} master #{@nic[:bridge]}") unless @nic[:phydev].empty?
                    end

                    if !changes[:vlan_tagged_id].nil?
                        clean_vlan_filters(@nic)

                        @bridges[@nic[:bridge]].each do |dev|
                            set_vlan_filter(dev, nil, @nic.vlan_trunk)
                        end if @nic.vlan_trunk?
                    end

                    return 0
                end
            ensure
                unlock
            end

            0
        end

        # ----------------------------------------------------------------------
        # VLAN filter with trunk VLANs
        # ----------------------------------------------------------------------
        # In this scenario the VM ports are configured to transport the VLAN
        # trunks. Untagged traffic is sent directly through the PHY_DEV interface
        #
        #             +--------------------+
        #             | Port Configuration |
        #             |--------------------|
        #   --(eth0)--+ 200            200 +------ VM (one-20-1)
        #             | 300            300 |
        #             +--------------------+
        #
        # NOTE: **Not implemented** for this driver. In this configuration,
        # untagged traffic can be easily tagged with this bridge vlan configuration:
        #
        #     eth0         100 (VLAN_ID = 100)
        #                  200
        #                  300
        #     one-20-1     100 PVID Egress Untagged
        #                  200
        #                  300
        # ----------------------------------------------------------------------
        def vlan_filter
            lock

            bridge_done = []

            process do |nic|
                @nic = nic

                next if @nic[:phydev].nil? || @nic[:bridge].nil? || !@nic.vlan_trunk?

                vlan_set = @nic.vlan_trunk

                # Configure ports to allow trunk vlans
                set_vlan_filter(@nic[:tap], nil, vlan_set)

                next if bridge_done.include? @nic[:bridge]

                # Configure the Bridge (only once)
                LocalCommand.run_sh("#{command(:ip)} link set dev #{@nic[:bridge]}"\
                    ' type bridge vlan_filtering 1', nil, 2)

                set_vlan_filter(@nic[:phydev], nil, vlan_set)

                bridge_done << @nic[:bridge]
            end

            unlock

            0
        end

    end

end
