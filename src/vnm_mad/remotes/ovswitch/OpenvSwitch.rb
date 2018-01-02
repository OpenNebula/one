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
    FIREWALL_PARAMS =  [:black_ports_tcp,
                        :black_ports_udp,
                        :icmp]

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

            # Prevent ARP Cache Poisoning
            if @nic[:conf][:arp_cache_poisoning] && @nic[:ip]
                arp_cache_poisoning
            end

            # Prevent Mac-spoofing
            mac_spoofing if nic[:filter_mac_spoofing] =~ /yes/i

            # Apply Firewall
            configure_fw if FIREWALL_PARAMS & @nic.keys != []
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

    def arp_cache_poisoning
        add_flow("in_port=#{port},arp,dl_src=#{@nic[:mac]}",:drop,45000)
        add_flow("in_port=#{port},arp,dl_src=#{@nic[:mac]},nw_src=#{@nic[:ip]}",:normal,46000)
    end

    def mac_spoofing
        add_flow("in_port=#{port},dl_src=#{@nic[:mac]}",:normal,40000)
        add_flow("in_port=#{port}",:drop,39000)
    end

    def configure_fw
        # TCP
        if range = @nic[:black_ports_tcp]
            if range? range
                range.split(",").each do |p|
                    base_rule = "tcp,dl_dst=#{@nic[:mac]},tp_dst=#{p}"
                    base_rule << ",dl_vlan=#{vlan}" if !@nic[:vlan_id].nil?

                    add_flow(base_rule,:drop)
                end
            end
        end

        # UDP
        if range = @nic[:black_ports_udp]
            if range? range
                range.split(",").each do |p|
                    base_rule = "udp,dl_dst=#{@nic[:mac]},tp_dst=#{p}"
                    base_rule << ",dl_vlan=#{vlan}" if !@nic[:vlan_id].nil?

                    add_flow(base_rule,:drop)
                end
            end
        end

        # ICMP
        if @nic[:icmp]
            if %w(no drop).include? @nic[:icmp].downcase
                base_rule = "icmp,dl_dst=#{@nic[:mac]}"
                base_rule << ",dl_vlan=#{vlan}" if !@nic[:vlan_id].nil?

                add_flow(base_rule,:drop)
            end
        end
    end

    def del_flows
        the_ports = ports

        in_port = ""

        dump_flows = "#{command(:ovs_ofctl)} dump-flows #{@nic[:bridge]}"
        `#{dump_flows}`.lines do |flow|
            next unless flow.match("#{@nic[:mac]}")

            if (m = flow.match(/in_port=(\d+)/))
                in_port_tmp = m[1]

                if !the_ports.include?(in_port_tmp)
                    in_port = in_port_tmp
                    break
                end
            end
        end

        del_flow "in_port=#{in_port}" if !in_port.empty?
    end

    def add_flow(filter,action,priority=nil)
        priority = (priority.to_s.empty? ? "" : "priority=#{priority},")

        run "#{command(:ovs_ofctl)} add-flow " <<
            "#{@nic[:bridge]} #{filter},#{priority}actions=#{action}"
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

    def range?(range)
        !range.to_s.match(/^\d+(,\d+)*$/).nil?
    end
end
