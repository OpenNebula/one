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

    ############################################################################
    # OpenNebula Firewall with Security Groups Based on IPTables (KVM)
    ############################################################################
    class SGDriver < VNMDriver

        DRIVER       = 'sg'
        XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='fw']"

        # Rules that simulate an empty list of Security Groups (allow everything)
        EMPTY_RULES = {
            '0'=> [
                {
                    :protocol  => 'ALL',
                    :rule_type => 'OUTBOUND',
                    :security_group_id   => '0',
                    :security_group_name => 'default'
                },
                {
                    :protocol  => 'ALL',
                    :rule_type => 'INBOUND',
                    :security_group_id   => '0',
                    :security_group_name => 'default'
                }
            ]
        }

        # Attributes that can be updated on update_nic action
        SUPPORTED_UPDATE = [
            :inbound_avg_bw,
            :inbound_peak_bw,
            :inbound_peak_kb,
            :outbound_avg_bw,
            :outbound_peak_bw,
            :outbound_peak_kb
        ]

        # Creates a new SG driver and scans SG Rules
        # @param [String] VM XML base64 encoded
        # @param [String] hypervisor ID for the VM
        # @param [String] hypervisor (e.g. 'kvm' ...)
        # @param [String] Xpath for the NICs using the SG driver
        def initialize(vm_64, xpath_filter = nil, deploy_id = nil, bridged = true)
            @locking = true

            @bridged = bridged

            vm = Base64.decode64(vm_64)

            xpath_filter ||= XPATH_FILTER
            super(vm, xpath_filter, deploy_id)

            @commands = VNMNetwork::Commands.new

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

        # Activate the rules, bootstrap iptables chains and set filter rules for
        # each VM NIC
        def activate(do_all = false)
            deactivate(do_all)
            lock

            # Global Bootstrap
            SGIPTables.global_bootstrap(@bridged)

            unless do_all
                attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']
                attach_nic_id ||= @vm['TEMPLATE/NIC_ALIAS[ATTACH="YES"]/NIC_ID']
            end

            # Process the rules for each NIC
            process do |nic|
                next if attach_nic_id && attach_nic_id != nic[:nic_id]

                # SG not supported for NIC_ALIAS
                if nic[:security_groups].nil?
                    nic[:security_groups] = '0'
                    @security_group_rules = EMPTY_RULES
                end

                SGIPTables.nic_pre(@bridged, @vm, nic)

                sg_ids = nic[:security_groups].split(',')

                sg_ids.each do |sg_id|
                    rules = @security_group_rules[sg_id]

                    sg = SGIPTables::SecurityGroupIPTables.new(@vm, nic, sg_id, rules)

                    begin
                        sg.process_rules
                        sg.run!
                    rescue StandardError => e
                        unlock
                        deactivate(do_all)
                        raise e
                    end
                end

                SGIPTables.nic_post(@vm, nic)
            end

            # Process the rules for each NIC_ALIAS
            process_alias do |nic|
                next if attach_nic_id && attach_nic_id != nic[:nic_id]

                SGIPTables.nic_alias_activate(@vm, nic)
            end

            unlock

            0
        end

        # Clean iptables rules and chains
        def deactivate(do_all = false)
            lock

            begin
                unless do_all
                    attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']
                    attach_nic_id ||= @vm['TEMPLATE/NIC_ALIAS[ATTACH="YES"]/NIC_ID']
                end

                process_alias do |nic|
                    next if attach_nic_id && attach_nic_id != nic[:nic_id]

                    SGIPTables.nic_alias_deactivate(@vm, nic)
                end

                process do |nic|
                    next if attach_nic_id && attach_nic_id != nic[:nic_id]

                    SGIPTables.nic_deactivate(@vm, nic)
                end
            ensure
                unlock
            end

            0
        end

        def update(vnet_id)
            lock

            begin
                if @vm.deploy_id
                    deploy_id = @vm.deploy_id
                else
                    deploy_id = @vm['DEPLOY_ID']
                end

                changes = @vm.changes.select {|k, _| SUPPORTED_UPDATE.include?(k) }

                return 0 if changes.empty?

                process do |nic|
                    next unless Integer(nic[:network_id]) == vnet_id

                    nic.set_qos(deploy_id)
                end
            ensure
                unlock
            end

            0
        end

    end

end
