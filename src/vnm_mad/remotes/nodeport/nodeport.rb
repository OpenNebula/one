# rubocop:disable Naming/FileName
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

# Node Port Forwarding Driver
class NodePortDriver < VNMMAD::VNMDriver

    # Driver name
    DRIVER = 'nodeport'

    # Filter to look for NICs managed by this diver
    XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='nodeport']"

    # Class constructor
    def initialize(vm)
        @locking = true

        super(Base64.decode64(vm), XPATH_FILTER, nil)
    end

    # Adds the following elements:
    #
    #   - Route to the bridge
    #   - ARP proxy
    #   - PREROUTING rule
    #   - POSTROUTING rule
    def activate
        cmds = VNMMAD::VNMNetwork::Commands.new

        attach_nic_id   = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']
        attach_nic_id ||= @vm['TEMPLATE/NIC_ALIAS[ATTACH="YES"]/NIC_ID']

        rc = process do |nic|
            next if attach_nic_id && attach_nic_id != nic[:nic_id]

            unless check_nic(nic)
                OpenNebula.log_error('NIC information is wrong')
                break false
            end

            cmds.add :ip, "route add #{nic[:ip]}/32 dev #{nic[:bridge]}"
            cmds.add :ip,
                     "neighbour add proxy #{nic[:gateway]} " \
                     "dev #{nic[:bridge]}"
            cmds.add :iptables, '-t nat -I PREROUTING -p tcp --dport ' \
                                "#{nic[:external_port_range]} -j DNAT --to " \
                                "#{nic[:ip]}:#{nic[:internal_port_range]}"
            cmds.add :iptables, '-t nat -A POSTROUTING -j MASQUERADE ' \
                                "-s #{nic[:ip]}"
        end

        if rc != false
            cmds.run!

            0
        else
            -1
        end
    end

    # Deletes the following elements:
    #
    #   - Route to the bridge
    #   - ARP proxy
    #   - PREROUTING rule
    #   - POSTROUTING rule
    def deactivate
        cmds = VNMMAD::VNMNetwork::Commands.new

        attach_nic_id   = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']
        attach_nic_id ||= @vm['TEMPLATE/NIC_ALIAS[ATTACH="YES"]/NIC_ID']

        rc = process do |nic|
            next if attach_nic_id && attach_nic_id != nic[:nic_id]

            unless check_nic(nic)
                OpenNebula.log_error('NIC information is wrong')
                break false
            end

            cmds.add :ip,
                     "route del #{nic[:ip]}/32 dev #{nic[:bridge]} | true"
            cmds.add :ip,
                     "neighbour del proxy #{nic[:gateway]} dev " \
                     "#{nic[:bridge]} | true"
            cmds.add :iptables, '-t nat -D PREROUTING -p tcp --dport ' \
                                "#{nic[:external_port_range]} -j DNAT --to " \
                                "#{nic[:ip]}:#{nic[:internal_port_range]} " \
                                '| true'
            cmds.add :iptables, '-t nat -D POSTROUTING -j MASQUERADE ' \
                                "-s #{nic[:ip]} | true"
        end

        if rc != false
            cmds.run!

            0
        else
            -1
        end
    end

    private

    # Check if nic has all the port range information
    #
    # @param nic[Hash] NIC information
    def check_nic(nic)
        !nic[:external_port_range].nil? && !nic[:internal_port_range].nil?
    end

end
# rubocop:enable Naming/FileName
