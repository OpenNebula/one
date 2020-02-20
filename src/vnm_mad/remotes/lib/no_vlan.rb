# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

        def initialize(vm, xpath_filter, deploy_id = nil)
            @locking = true

            super(vm, xpath_filter, deploy_id)
        end

        def create_vlan_dev
            true
        end

        def delete_vlan_dev
            true
        end

        # Activate the driver and creates bridges and tags devices as needed.
        def activate
            lock

            @bridges = list_bridges

            process do |nic|
                @nic = nic

                # Create the bridge.
                create_bridge
            end

            unlock

            0
        end

        # Deactivate the driver and delete bridges and tags devices as needed.
        def deactivate
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

                    # Return if the bridge is not empty
                    next unless @bridges[@nic[:bridge]].empty?

                    # Delete the bridge.
                    OpenNebula.exec_and_log("#{command(:ip)} link delete"\
                        " #{@nic[:bridge]}")
                    @bridges.delete(@nic[:bridge])
                end
            end

            unlock

            0
        end

        private

        def gen_vlan_dev_name
            @nic[:vlan_dev] = @nic[:phydev] if @nic[:phydev]
        end

        def validate_vlan_id
            true
        end

    end

end
