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

module VNMMAD

    ############################################################################
    # Module to use as mixin for implementing  VLAN drivers based on special 
    # link devices though the Linux kernel features and bridges. It provides
    # common functionality to handle bridges
    ############################################################################
    class VLANDriver < VNMMAD::VNMDriver

        def initialize(vm_tpl, xpath_filter, deploy_id = nil, hypervisor = nil)
            super(vm_tpl, xpath_filter, deploy_id, hypervisor)

            lock
            @bridges = get_bridges
            unlock
        end

        # Activate the driver and creates bridges and tags devices as needed.
        def activate
            lock

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

        # Set ups the VLAN for the VMs. 
        #   @param options [Hash] including
        #   - :phydev Physical Device to bind the VLAN traffic to
        #   - :bridge Name of the bridge to attach the VMs and VLAN dev to
        #   - :network_id 
        def set_up_vlan(options)

            if options[:vlan_id].nil?
                options[:vlan_id] = CONF[:start_vlan] + options[:network_id].to_i 
            end

            options[:vlan_dev] = "#{options[:phydev]}.#{options[:vlan_id]}"

            create_bridge(options[:bridge])

            return if @bridges[options[:bridge]].include? options[:vlan_dev]

            create_vlan_dev(options)

            OpenNebula.exec_and_log("#{command(:brctl)} addif"\
                " #{options[:bridge]} #{options[:vlan_dev]}")

            @bridges[options[:bridge]] << options[:vlan_dev]
        end

        # This function needs to be implemented by any VLAN driver to
        # create the VLAN device. The device MUST be set up by this function
        # Options is a driver specific hash. It includes
        #   :vlan_dev the name for the VLAN device
        #   :phydev Physical Device to bind the VLAN traffic to
        #   :vlan_id the VLAN ID
        #   : additional driver specific parameters
        def create_vlan_dev(options)
            OpenNebula.log_error("create_vlan_dev function not implemented.")

            exit -1
        end
            
    private
        # Creates a bridge if it does not exists, and brings it up. 
        # This function IS FINAL, exits if action cannot be completed
        #   @param bridge [String] the bridge name
        def create_bridge(bridge)
            return if @bridges.keys.include? bridge

            OpenNebula.exec_and_log("#{command(:brctl)} addbr #{bridge}")

            @bridges[bridge] = Array.new

            OpenNebula.exec_and_log("#{command(:ip)} link set #{bridge} up")
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
