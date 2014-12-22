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

require 'opennebula_network'

module VNMMAD

    ############################################################################
    # OpenNebula Firewall with Security Groups Based on IPTables (KVM and Xen)
    ############################################################################
    class OpenNebulaSG < VNMMAD::OpenNebulaNetwork

        DRIVER = "sg"
        XPATH_FILTER =  "TEMPLATE/NIC"
        
        def initialize(vm, deploy_id = nil, hypervisor = nil)
            super(vm, XPATH_FILTER, deploy_id, hypervisor)
            @locking = true
            @commands = VNMMAD::VNMNetwork::Commands.new

            rules = {}
            @vm.vm_root.elements.each('TEMPLATE/SECURITY_GROUP_RULE') do |r|
                security_group_rule = {}

                r.elements.each do |e|
                    key = e.name.downcase.to_sym
                    security_group_rule[key] = e.text
                end

                id = security_group_rule[:security_group_id]

                rules[id] = [] if rules[id].nil?
                rules[id] << security_group_rule
            end

            @security_group_rules = rules
        end

        def activate
            deactivate
            lock

            # Global Bootstrap
            VNMMAD::SGIPTables.global_bootstrap

            # Process the rules
            @vm.nics.each do |nic|
                next if nic[:security_groups].nil? \
                    && nic[:filter_mac_spoofing] != "YES" \
                    && nic[:filter_ip_spoofing]  != "YES"

                VNMMAD::SGIPTables.nic_pre(@vm, nic)

                sg_ids = nic[:security_groups].split(",")

                sg_ids.each do |sg_id|
                    rules = @security_group_rules[sg_id]

                    sg = VNMMAD::SGIPTables::SecurityGroupIPTables.new(@vm, nic,
                        sg_id, rules)

                    begin
                        sg.process_rules
                        sg.run!
                    rescue Exception => e
                        unlock
                        deactivate
                        raise e
                    end
                end

                VNMMAD::SGIPTables.nic_post(@vm, nic)
            end

            unlock
        end

        def deactivate
            lock

            begin
                @vm.nics.each do |nic|
                    VNMMAD::SGIPTables.nic_deactivate(@vm, nic)
                end
            rescue Exception => e
                raise e
            ensure
                unlock
            end
        end
    end

end
