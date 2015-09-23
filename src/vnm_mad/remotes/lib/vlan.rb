# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

    ############################################################################
    # Module to use as mixin for implementing  VLAN drivers based on special
    # link devices though the Linux kernel features and bridges. It provides
    # common functionality to handle bridges
    ############################################################################
    class VLANDriver < VNMMAD::VNMDriver

        def initialize(vm_tpl, xpath_filter, deploy_id = nil, hypervisor = nil)
            @locking = true

            super(vm_tpl, xpath_filter, deploy_id, hypervisor)
        end

        # Activate the driver and creates bridges and tags devices as needed.
        def activate
            lock

            @bridges = get_bridges

            process do |nic|
                @nic = nic

                next if @nic[:phydev].nil?

                # Get the name of the vlan device.
                get_vlan_dev_name

                # Create the bridge.
                create_bridge

                # Return if vlan device is already in the bridge.
                next if @bridges[@nic[:bridge]].include? @nic[:vlan_dev]

                # Create vlan device.
                create_vlan_dev

                # Add vlan device to the bridge.
                OpenNebula.exec_and_log("#{command(:brctl)} addif"\
                    " #{@nic[:bridge]} #{@nic[:vlan_dev]}")

                @bridges[@nic[:bridge]] << @nic[:vlan_dev]
            end

            unlock

            return 0
        end

        # This function needs to be implemented by any VLAN driver to
        # create the VLAN device. The device MUST be set up by this function
        def create_vlan_dev
            OpenNebula.log_error("create_vlan_dev function not implemented.")

            exit -1
        end

        # Deactivate the driver and delete bridges and tags devices as needed.
        def deactivate
            lock

            @bridges = get_bridges

            attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']

            process do |nic|
                next if attach_nic_id && attach_nic_id != nic[:nic_id]

                @nic = nic

                next if @nic[:phydev].nil?

                # Get the name of the vlan device.
                get_vlan_dev_name

                # Return if the vlan device is not the only left device in the bridge.
                next if @bridges[@nic[:bridge]].length > 1 or !@bridges[@nic[:bridge]].include? @nic[:vlan_dev]

                # Delete the vlan device.
                OpenNebula.exec_and_log("#{command(:ip)} link delete"\
                    " #{@nic[:vlan_dev]}")
                @bridges[@nic[:bridge]].delete(@nic[:vlan_dev])

                # Delete the bridge.
                OpenNebula.exec_and_log("#{command(:ip)} link delete"\
                    " #{@nic[:bridge]}")
                @bridges.delete(@nic[:bridge])
            end

            unlock
        end

    private
        # Generate the name of the vlan device which will be added to the bridge.
        def get_vlan_dev_name
            if @nic[:vlan_id].nil?
                @nic[:vlan_id] = CONF[:start_vlan] + @nic[:network_id].to_i
            end

            @nic[:vlan_dev] = "#{@nic[:phydev]}.#{@nic[:vlan_id]}"
        end

        # Creates a bridge if it does not exists, and brings it up.
        # This function IS FINAL, exits if action cannot be completed
        def create_bridge
            return if @bridges.keys.include? @nic[:bridge]

            OpenNebula.exec_and_log("#{command(:brctl)} addbr #{@nic[:bridge]}")

            @bridges[@nic[:bridge]] = Array.new

            OpenNebula.exec_and_log("#{command(:ip)} link set #{@nic[:bridge]} up")
        end

        # Get hypervisor bridges
        #   @return [Hash<String>] with the bridge names
        def get_bridges
            bridges    = Hash.new
            brctl_exit =`#{VNMNetwork::COMMANDS[:brctl]} show`

            cur_bridge = ""

            brctl_exit.split("\n")[1..-1].each do |l|
                l = l.split

                if l.length > 1
                    cur_bridge = l[0]

                    bridges[cur_bridge] = Array.new
                    bridges[cur_bridge] << l[3] if l[3]
                else
                    bridges[cur_bridge] << l[0]
                end
            end

            bridges
        end
    end
end
