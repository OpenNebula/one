# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

    DRIVER = "ovswitch"
    XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='ovswitch']"

    def initialize(vm, xpath_filter = nil, deploy_id = nil)
        @locking = false

        xpath_filter ||= XPATH_FILTER
        super(vm, xpath_filter, deploy_id)

        @vm.nics.each do |nic|
            if nic[:bridge_ovs] && !nic[:bridge_ovs].empty?
                nic[:bridge] = nic[:bridge_ovs]
            end
        end
    end

    def activate
        lock

        process do |nic|
            @nic = nic

            if @nic[:tap].nil?
                STDERR.puts "No tap device found for nic #{@nic[:nic_id]}"
                unlock
                exit 1
            end

            # Apply VLAN
            if !@nic[:vlan_id].nil?
                tag_vlan
                tag_trunk_vlans
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
            add_flow("table=10,in_port=#{port}", "resubmit(,20)", 100)
            add_flow("table=20,in_port=#{port}", "normal", 100)

            # MAC-spoofing
            mac_spoofing if nic[:filter_mac_spoofing] =~ /yes/i

            # IP-spoofing
            ip_spoofing if nic[:filter_ip_spoofing] =~ /yes/i
        end

        unlock

        return 0
    end

    def deactivate
        lock

        attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']

        process do |nic|
            if attach_nic_id && attach_nic_id != nic[:nic_id]
                next
            end

            @nic = nic

            # Remove flows
            del_flows
        end

        unlock
    end

    def vlan
        @nic[:vlan_id]
    end

    def tag_vlan
        cmd =  "#{command(:ovs_vsctl)} set Port #{@nic[:tap]} "
        cmd << "tag=#{vlan}"

        run cmd
    end

    def tag_trunk_vlans
        range = @nic[:vlan_tagged_id]
        if range? range
            ovs_vsctl_cmd = "#{command(:ovs_vsctl)} set Port #{@nic[:tap]}"

            cmd = "#{ovs_vsctl_cmd} trunks=#{range}"
            run cmd

            cmd = "#{ovs_vsctl_cmd} vlan_mode=native-untagged"
            run cmd
        end
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
        base="table=20,in_port=#{port}"
        pass="normal"

        ipv4s = Array.new

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
        add_flow("#{base},udp,nw_src=0.0.0.0/32,tp_src=68,nw_dst=255.255.255.255/32,tp_dst=67", pass, 44000)

        ipv6s = Array.new

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
        base="table=10,in_port=#{port}"
        pass="resubmit(,20)"

        if @nic[:conf][:arp_cache_poisoning]
            add_flow("#{base},arp,dl_src=#{@nic[:mac]}", pass, 50000)
        end

        add_flow("#{base},dl_src=#{@nic[:mac]}", pass, 45000)
        add_flow(base, :drop, 40000)
    end

    def del_flows
        the_ports = ports

        in_port = ""

        cmd_flows = "#{command(:ovs_ofctl)} dump-flows #{@nic[:bridge]}"
        out_flows = `#{cmd_flows}`

        # searching for flow just by MAC address is legacy,
        # we preferably look for a flow port with our note
        ["note:#{port_note}", @nic[:mac]].each do |m|
            out_flows.lines do |flow|
                next unless flow.match(m)

                if (m = flow.match(/in_port=(\d+)/))
                    in_port_tmp = m[1]

                    if !the_ports.include?(in_port_tmp)
                        in_port = in_port_tmp
                        break
                    end
                end
            end

            break unless in_port.empty?
        end

        del_flow "in_port=#{in_port}" if !in_port.empty?
    end

    def add_flow(filter,action,priority=nil)
        priority = (priority.to_s.empty? ? "" : "priority=#{priority},")

        run "#{command(:ovs_ofctl)} add-flow " <<
            "#{@nic[:bridge]} '#{filter},#{priority}actions=#{action}'"
    end

    def del_flow(filter)
        filter.gsub!(/priority=(\d+)/,"")
        run "#{command(:ovs_ofctl)} del-flows " <<
            "#{@nic[:bridge]} #{filter}"
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
        !range.to_s.match(/^\d+(,\d+)*$/).nil?
    end
end
