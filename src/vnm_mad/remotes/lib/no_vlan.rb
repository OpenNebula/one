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

module VNMMAD

    # NoVLANDriver class
    class NoVLANDriver< VNMMAD::VLANDriver

        # Attributes that can be updated on update_nic action
        SUPPORTED_UPDATE = [
            :phydev
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

                # Return if vlan device is already in the bridge.
                next if !@nic[:phydev] || @bridges[@nic[:bridge]].include?(@nic[:phydev])

                # Add phydev device to the bridge.
                OpenNebula.exec_and_log("#{command(:ip)} link set " \
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

                    # Return if the bridge doesn't exist because it was already
                    # deleted (handles last vm with multiple nics on the same
                    # vlan)
                    next unless @bridges.include? @nic[:bridge]

                    # Return if we want to keep the empty bridge
                    next if @nic[:conf][:keep_empty_bridge]

                    # Return if the phydev device is not the only left device in
                    # the bridge.A
                    if @nic[:phydev].nil?
                        keep = !@bridges[@nic[:bridge]].empty?
                    else

                        keep = @bridges[@nic[:bridge]].length > 1 ||
                            !@bridges[@nic[:bridge]].include?(@nic[:phydev])
                    end

                    next if keep

                    # Delete the bridge.
                    OpenNebula.exec_and_log("#{command(:ip)} link delete"\
                        " #{@nic[:bridge]}")
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

                return 0 if changes[:phydev].nil?

                @bridges = list_bridges

                process do |nic|
                    @nic = nic

                    next unless Integer(@nic[:network_id]) == vnet_id
                    next if @bridges[@nic[:bridge]].include? @nic[:phydev]

                    # Del old phydev device from the bridge.
                    OpenNebula.exec_and_log("#{command(:ip)} link set " \
                    "nomaster #{changes[:phydev]}")

                    # Add new phydev device to the bridge.
                    OpenNebula.exec_and_log("#{command(:ip)} link set " \
                    "#{@nic[:phydev]} master #{@nic[:bridge]}")

                    return 0
                end
            ensure
                unlock
            end

            0
        end

    end

end
