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

class OpenvSwitchVLAN < VNMMAD::VNMDriver

    DRIVER       = 'ovswitch'
    XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='ovswitch']"

    SUPPORTED_UPDATE = [
        :vlan_id,
        :mtu,
        :vlan_tagged_id,
        :cvlans,
        :qinq_type,
        :inbound_avg_bw,
        :inbound_peak_bw,
        :inbound_peak_kb,
        :outbound_avg_bw,
        :outbound_peak_bw,
        :outbound_peak_kb,
        :outer_vlan_id,
        :phydev
    ]

    def initialize(vm, xpath_filter = nil, deploy_id = nil)
        @locking = false

        xpath_filter ||= XPATH_FILTER
        super(vm, xpath_filter, deploy_id)
    end

    def activate
        lock

        @bridges = list_bridges

        process do |nic|
            @nic = nic

            # Get the name of the link vlan device.
            gen_vlan_dev_name

            # Create the bridge.
            create_bridge

            # Check that no other vlans are connected to this bridge
            validate_vlan_id if @nic[:conf][:validate_vlan_id]

            if @nic[:vlan_dev]
                unless @bridges[@nic[:bridge]].include? @nic[:vlan_dev]
                    create_vlan_dev

                    add_bridge_port(@nic[:vlan_dev], nil)
                end
            elsif @nic[:phydev]
                add_bridge_port(@nic[:phydev], nil)
            end

            add_bridge_port(nic[:target], dpdk_vm(@nic[:target])) if dpdk?

            if @nic[:tap].nil?
                # In net/pre action, we just need to ensure the bridge is
                # created so the libvirt/QEMU can add VM interfaces into that.
                # Any other driver actions are done in net/post action.
                next if VNMMAD.pre_action?

                STDERR.puts "No tap device found for nic #{@nic[:nic_id]}"
                unlock
                exit 1
            end

            if !@nic[:mtu].nil?
                cmd = "#{command(:ovs_vsctl)} set int #{@nic[:tap]} "\
                      "mtu_request=#{@nic[:mtu]}"
                run cmd
            end

            # Apply VLAN
            if !@nic[:vlan_id].nil?
                if !@nic[:cvlans].nil?
                    tag_qinq
                else
                    tag_vlan
                    tag_trunk_vlans
                end
            end

            # Delete any existing flows on port
            del_flow "in_port=#{port}"

            # We are using the flow table hierarchy to create a set of rules
            # which must be satisfied. The packet flows through the tables,
            # from to another. Any rule can stop the flow and drop the packet,
            # but if the lucky packet reaches the end, it's accepted.
            #
            # If the OpenNebula virtual network has any IP/MAC-spoofing filter
            # enabled, the additional table rules are generated. Otherwise,
            # the tables are left empty and only pass the packet to another
            # table, or finally accepts the packet.
            #
            #   +---------+          +------------+          +-----------+
            #   | Table 0 | resubmit |  Table 10  | resubmit |  Table 20 |
            #   |  Main   |--------->| MAC-spoof. |--------->| IP-spoof. |--> NORMAL
            #   |         |          |   rules    |          |   rules   |
            #   +---------+          +------------+          +-----------+
            #        |                    |                       |
            #        +-> DROP             +-> DROP                +-> DROP
            #
            # Tables are defined by following base rules:
            # in_port=<PORT>,table=0,priority=100,actions=note:VV.VV.VV.VV.NN.NN,resubmit(,10)
            # in_port=<PORT>,table=10,priority=100,actions=resubmit(,20)
            # in_port=<PORT>,table=20,priority=100,actions=NORMAL
            add_flow("table=0,in_port=#{port}", "note:#{port_note},resubmit(,10)", 100)
            add_flow("table=10,in_port=#{port}", 'resubmit(,20)', 100)
            add_flow("table=20,in_port=#{port}", 'normal', 100)

            # MAC-spoofing
            mac_spoofing if nic[:filter_mac_spoofing] =~ /yes/i

            # IP-spoofing
            ip_spoofing if nic[:filter_ip_spoofing] =~ /yes/i
        end

        # MAC-spoofing & IP-spoofing for NIC ALIAS
        process_alias do |nalias|
            nparent = @vm.parent(nalias)

            next unless nparent

            nalias[:port] = nparent[:port]

            @nic = nalias

            mac_spoofing if nalias[:filter_mac_spoofing] =~ /yes/i

            ip_spoofing if nalias[:filter_ip_spoofing] =~ /yes/i
        end

        unlock

        0
    end

    def deactivate
        # NIC_ALIAS are  not processed, skip
        return 0 if @vm['TEMPLATE/NIC_ALIAS[ATTACH="YES"]/NIC_ID']

        lock

        @bridges = list_bridges

        attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']

        process do |nic|
            if attach_nic_id && attach_nic_id != nic[:nic_id]
                next
            end

            @nic = nic

            # Remove flows
            del_flows

            # delete port from bridge if exists. Some virtualization
            # technologies might clean the port itselves.
            del_bridge_port(@nic[:target])

            next if @nic[:phydev].nil?
            next if @bridges[@nic[:bridge]].nil?

            # Get the name of the vlan device.
            gen_vlan_dev_name

            # Return if the bridge doesn't exist because it was already deleted
            # (handles last vm with multiple nics on the same vlan)
            next unless @bridges.include?(@nic[:bridge])

            # Return if we want to keep the empty bridge
            next if @nic[:conf][:keep_empty_bridge]

            # Return if the vlan device is not the only left device in the bridge.
            next if @bridges[@nic[:bridge]].length > 1 ||
                (@nic[:vlan_dev] && !@bridges[@nic[:bridge]].include?(@nic[:vlan_dev]))

            if @nic[:vlan_dev]
                delete_vlan_dev
                @bridges[@nic[:bridge]].delete(@nic[:vlan_dev])
            end

            delete_bridge
        end

        unlock

        0
    end

    def update(vnet_id)
        lock

        begin
            changes = @vm.changes.select {|k, _| SUPPORTED_UPDATE.include?(k) }

            return 0 if changes.empty?

            process do |nic|
                next unless Integer(nic[:network_id]) == vnet_id

                @nic = nic

                # Get the name of the link vlan device.
                gen_vlan_dev_name

                if changes[:vlan_id] && !@nic[:vlan_id].nil? && !@nic[:vlan_id].empty?
                    tag_vlan
                end

                if changes[:mtu]
                    cmd = "#{command(:ovs_vsctl)} set int #{@nic[:tap]} "\
                          "mtu_request=#{@nic[:mtu]}"
                    run cmd
                end

                if changes[:vlan_tagged_id]
                    tag_trunk_vlans
                end

                if !changes[:cvlans].nil? || !changes[:qinq_type].nil?
                    tag_qinq
                end

                qos = changes.each do |c, _|
                    break true if c.to_s.match?(/inbound/) || c.match?(/outbound/)
                end

                if qos
                    if @vm.deploy_id
                        deploy_id = @vm.deploy_id
                    else
                        deploy_id = @vm['DEPLOY_ID']
                    end

                    @nic.set_qos(deploy_id)
                end

                @bridges = list_bridges
                phydev   = @nic[:vlan_dev] || @nic[:phydev]

                next if @bridges[@nic[:bridge]].include? phydev

                if (!changes[:outer_vlan_id].nil? || !changes[:phydev].nil?) &&
                      !@nic[:vlan_dev].nil?
                    ####################################################
                    # Remove old VXLAN device
                    ####################################################
                    @nic = nic.merge(changes)
                    gen_vlan_dev_name

                    if @bridges[@nic[:bridge]].include? @nic[:vlan_dev]
                        del_bridge_port(@nic[:vlan_dev])
                        delete_vlan_dev
                    end

                    ####################################################
                    # Add new link to the BRIDGE
                    ####################################################
                    @nic = nic
                    gen_vlan_dev_name

                    create_vlan_dev
                    add_bridge_port(@nic[:vlan_dev], nil)
                elsif !changes[:phydev].nil?
                    if !@bridges[@nic[:bridge]].include?(@nic[:phydev])
                        del_bridge_port(changes[:phydev])
                        add_bridge_port(@nic[:phydev])
                    end
                end
            end
        rescue StandardError => e
            raise e
        ensure
            unlock
        end

        0
    end

    def tag_vlan
        cmd =  "#{command(:ovs_vsctl)} set Port #{@nic[:tap]} "
        cmd << "tag=#{@nic[:vlan_id]}"

        run cmd
    end

    def tag_trunk_vlans
        range = @nic[:vlan_tagged_id]

        return unless range?(range)

        ovs_vsctl_cmd = "#{command(:ovs_vsctl)} set Port #{@nic[:tap]}"

        # Open vSwitch 2.7.0+ allows range intervals (x-y), but
        # we need to support even older versions. We expand the
        # intervals into the list of values [x,x+1,...,y-1,y],
        # which should work for all.
        cmd = "#{ovs_vsctl_cmd} trunks='#{expand_range(range)}'"
        run cmd

        cmd = "#{ovs_vsctl_cmd} vlan_mode=native-untagged"
        run cmd
    end

    def tag_qinq
        range = @nic[:cvlans]

        set_vlan_limit(2)

        cmd =  "#{command(:ovs_vsctl)} set Port #{@nic[:tap]} "
        cmd << "vlan_mode=dot1q-tunnel tag=#{@nic[:vlan_id]} "
        cmd << "cvlans=#{expand_range(range)}"

        run cmd

        qinq_type = @nic[:qinq_type]
        qinq_type ||= '802.1q'

        cmd =  "#{command(:ovs_vsctl)} set Port #{@nic[:tap]} "
        cmd << "other_config:qinq-ethtype=#{qinq_type}"

        run cmd
    end

    # Following IP-spoofing rules may be created:
    # (if ARP Cache Poisoning) in_port=<PORT>,table=20,arp,arp_spa=<IP>,priority=50000,actions=NORMAL
    # (if ARP Cache Poisoning) in_port=<PORT>,table=20,arp,priority=49000,actions=drop
    # in_port=<PORT>,table=20,ip,nw_src=<IP>,priority=45000,actions=NORMAL
    # in_port=<PORT>,table=20,ipv6,ipv6_src=<IP6>,priority=45000,actions=NORMAL
    # in_port=<PORT>,table=20,udp,nw_src=0.0.0.0,nw_dst=255.255.255.255,tp_src=68,tp_dst=67,priority=44000,actions=NORMAL
    # in_port=<PORT>,table=20,icmp6,ipv6_src=::,icmp_type=133,priority=44000,actions=NORMAL
    # in_port=<PORT>,table=20,icmp6,ipv6_src=::,icmp_type=135,priority=44000,actions=NORMAL
    # in_port=<PORT>,table=20,ip,priority=40000,actions=drop
    # in_port=<PORT>,table=20,ipv6,priority=40000,actions=drop
    #
    # The particular table also contains the base rule created before:
    # in_port=<PORT>,table=20,priority=100,actions=NORMAL
    def ip_spoofing
        base = "table=20,in_port=#{port}"
        pass = 'normal'

        ipv4s = []

        [:ip, :vrouter_ip].each do |key|
            ipv4s << @nic[key] if !@nic[key].nil? && !@nic[key].empty?
        end

        if !ipv4s.empty?
            ipv4s.each do |ip|
                if @nic[:conf][:arp_cache_poisoning]
                    add_flow("#{base},arp,nw_src=#{ip}", pass, 50000)
                end

                add_flow("#{base},ip,nw_src=#{ip}", pass, 45000)
            end
        end

        if @nic[:conf][:arp_cache_poisoning]
            add_flow("#{base},arp", :drop, 49000)
        end

        # BOOTP
        add_flow("#{base},udp,nw_src=0.0.0.0/32,tp_src=68,nw_dst=255.255.255.255/32,tp_dst=67",
                 pass, 44000)

        ipv6s = []

        [:ip6, :ip6_global, :ip6_link, :ip6_ula].each do |key|
            ipv6s << @nic[key] if !@nic[key].nil? && !@nic[key].empty?
        end

        if !ipv6s.empty?
            ipv6s.each do |ip|
                add_flow("#{base},ipv6,ipv6_src=#{ip}", pass, 45000)
            end
        end

        # ICMPv6 Neighbor Discovery Protocol (ARP replacement for IPv6)
        add_flow("#{base},icmp6,icmp_type=133,ipv6_src=::", pass, 44000)
        add_flow("#{base},icmp6,icmp_type=135,ipv6_src=::", pass, 44000)

        add_flow("#{base},ip", :drop, 40000)
        add_flow("#{base},ipv6", :drop, 40000)
    end

    # Following MAC-spoofing rules may be created:
    # (if ARP Cache Poisoning) in_port=<PORT>,table=10,arp,dl_src=<MAC>,priority=50000,actions=resubmit(,20)
    # in_port=<PORT>,table=10,dl_src=<MAC>,priority=45000,actions=resubmit(,20)
    # in_port=<PORT>,table=10,priority=40000,actions=drop
    #
    # The particular table also contains the base rule created before:
    # in_port=<PORT>,table=10,priority=100,actions=resubmit(,20)
    def mac_spoofing
        base = "table=10,in_port=#{port}"
        pass = 'resubmit(,20)'

        if @nic[:conf][:arp_cache_poisoning]
            add_flow("#{base},arp,dl_src=#{@nic[:mac]}", pass, 50000)
        end

        add_flow("#{base},dl_src=#{@nic[:mac]}", pass, 45000)
        add_flow(base, :drop, 40000)
    end

    def del_flows
        the_ports = ports
        in_port   = ''

        cmd_flows = "#{command(:ovs_ofctl)} dump-flows #{@nic[:bridge]}"
        out_flows = `#{cmd_flows}`

        # searching for flow just by MAC address is legacy,
        # we preferably look for a flow port with our note
        ["note:#{port_note}", @nic[:mac]].each do |flow_matching|
            out_flows.lines do |flow|
                next unless flow.match(flow_matching)

                if (port_match = flow.match(/in_port=(\d+)/))
                    in_port_tmp = port_match[1]

                    if !the_ports.include?(in_port_tmp)
                        in_port = in_port_tmp
                        break
                    end
                end
            end

            break unless in_port.empty?
        end

        del_flow "in_port=#{in_port}" unless in_port.empty?
    end

    def add_flow(filter, action, priority = nil)
        priority = (priority.to_s.empty? ? '' : "priority=#{priority},")

        run "#{command(:ovs_ofctl)} add-flow " <<
            "#{@nic[:bridge]} '#{filter},#{priority}actions=#{action}'"
    end

    def del_flow(filter)
        filter.gsub!(/priority=(\d+)/, '')
        run "#{command(:ovs_ofctl)} del-flows #{@nic[:bridge]} #{filter}"
    end

    def run(cmd)
        OpenNebula.exec_and_log(cmd)
    end

    def ports
        dump_ports = `#{command(:ovs_ofctl)} \
                      dump-ports #{@nic[:bridge]} #{@nic[:tap]}`

        dump_ports.scan(/^\s*port\s*(\d+):/).flatten
    end

    def port
        if @nic[:port]
            @nic[:port]
        else
            @nic[:port] = ports.first
        end
    end

    def port_note
        # dot separated hexadecimal VM_ID, NIC_ID twins,
        # e.g. for VM_ID=1, NIC_ID=1: "00.00.00.01.00.01"
        ("%08x%04x" % [@vm['ID'], @nic[:nic_id]]).gsub(/(..)(?=.)/, '\1.')
    end

    def range?(range)
        !range.to_s.match(/^\d+([,-]\d+)*$/).nil?
    end

    def expand_range(range)
        items = []

        range.split(',').each do |i|
            l, r = i.split('-')

            l = l.to_i
            r = r.to_i unless r.nil?

            if r.nil?
                items << l
            elsif r >= l
                items.concat((l..r).to_a)
            else
                items.concat((r..l).to_a)
            end
        end

        items.uniq.join(',')
    end

    private

    # Generate the name of the vlan device which will be added to the bridge.
    def gen_vlan_dev_name
        nil
    end

    # Create a VLAN device.
    # NEEDS to be implemented by the subclass.
    def create_vlan_dev
        nil
    end

    # Delete a VLAN device
    # NEEDS to be implemented by the subclass.
    def delete_vlan_dev
        nil
    end

    # Return true when usgin dpdk
    def dpdk?
        @nic[:bridge_type] == 'openvswitch_dpdk'
    end

    # Path to the vm port socket /var/lib/one/datastores/0/23/one-23-0
    def dpdk_vm(port)
        "#{@vm.system_dir(@nic[:conf][:datastore_location])}/#{port}"
    end

    # Path to  bridge folder for non VM links
    def dpdk_br
        "#{@nic[:conf][:datastore_location]}/ovs-#{@nic[:bridge]}"
    end

    # Creates an OvS bridge if it does not exists, and brings it up.
    # This function IS FINAL, exits if action cannot be completed
    def create_bridge
        return if @bridges.keys.include? @nic[:bridge]

        if @nic[:bridge_type] == 'openvswitch_dpdk'
            @nic[:ovs_bridge_conf] = {} unless @nic[:ovs_bridge_conf]
            @nic[:ovs_bridge_conf]['datapath_type'] = 'netdev'
        end

        OpenNebula.exec_and_log("#{command(:ovs_vsctl)} --may-exist add-br #{@nic[:bridge]}")

        set_bridge_options

        @bridges[@nic[:bridge]] = []

        OpenNebula.exec_and_log("#{command(:ip)} link set #{@nic[:bridge]} up")
    end

    # Delete OvS bridge
    def delete_bridge
        OpenNebula.exec_and_log("#{command(:ovs_vsctl)} del-br #{@nic[:bridge]}")

        @bridges.delete(@nic[:bridge])
    end

    # Add port into OvS bridge
    def add_bridge_port(port, dpdk_path = nil)
        return if @bridges[@nic[:bridge]].include? port

        ovs_cmd = "#{command(:ovs_vsctl)} add-port #{@nic[:bridge]} #{port}"

        if dpdk_path && dpdk?
            ovs_cmd << " -- set Interface #{port} type=dpdkvhostuserclient"\
                       " options:vhost-server-path=#{dpdk_path}"
        end

        OpenNebula.exec_and_log(ovs_cmd)

        @bridges[@nic[:bridge]] << port
    end

    # Delete port from OvS bridge
    def del_bridge_port(port)
        OpenNebula.exec_and_log("#{command(:ovs_vsctl)} --if-exists del-port " \
                                "#{@nic[:bridge]} #{port}")

        @bridges[@nic[:bridge]].delete(port)
    end

    # Calls ovs-vsctl set bridge to set options stored in ovs_bridge_conf
    def set_bridge_options
        @nic[:ovs_bridge_conf].each do |option, value|
            cmd = "#{command(:ovs_vsctl)} set bridge " <<
                    "#{@nic[:bridge]} #{option}=#{value}"

            OpenNebula.exec_and_log(cmd)
        end
    end

    # Get hypervisor bridges
    #   @return [Hash<String>] with the bridge names
    def list_bridges
        bridges = {}

        list_br =`#{command(:ovs_vsctl)} list-br`
        list_br.split.each do |bridge|
            bridge = bridge.strip

            if bridge
                list_ports =`#{command(:ovs_vsctl)} list-ports #{bridge}`
                bridges[bridge] = list_ports.split("\n")
            end
        end

        bridges
    end

    def validate_vlan_id
        OpenNebula.log_error('VLAN ID validation not supported for OpenvSwitch, skipped.')
    end

    def set_vlan_limit(limit)
        vl = `#{command(:ovs_vsctl)} get Open_vSwitch . other_config:vlan-limit`

        vl_limit = 0

        begin
            vl_limit = Integer(vl.tr("\"\n", ''))
        rescue ArgumentError
        end

        return if vl_limit == limit

        cmd = "#{command(:ovs_vsctl)} set Open_vSwitch . "\
            "other_config:vlan-limit=#{limit}"
        run cmd

        cmd = "#{command(:ovs_appctl)} revalidator/purge"
        run cmd
    end

end
