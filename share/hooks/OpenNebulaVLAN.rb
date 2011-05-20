#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

$: << File.dirname(__FILE__)

require 'rexml/document'

CONF = {
    :start_vlan => 2
}

COMMANDS = {
  :ebtables => "sudo /sbin/ebtables",
  :iptables => "sudo /usr/sbin/iptables",
  :brctl    => "/usr/sbin/brctl",
  :virsh    => "virsh -c qemu:///system",
  :xm       => "sudo /usr/sbin/xm",
  :ovs_vsctl=> "sudo /usr/local/bin/ovs-vsctl",
  :lsmod    => "/bin/lsmod"
}

class Nics < Array
    # finds nics that match 'args'
    # 'args' can be a Hash, or an array
    #  args example:
    #       {:mac => "02:00:C0:A8:01:01", :bridge => "br0"}
    #       :mac,  "02:00:C0:A8:01:01"
    #  key values may also be an array:
    #       {:mac => "02:00:C0:A8:01:01", :bridge => ["br0","br1"]}
    def get(*args)
        if args.length == 2
            dict = Hash.new
            dict[args[0]] = args[1]
        elsif args.length == 1
            dict = args[0]
        else
            return nil
        end

        matching = Array.new
        self.each do |e|
            e_filter = Hash.new
            dict.each_key{|k| e_filter[k] = e[k]}
            if compare(e_filter,dict)
                matching << e
            end
        end

        if matching.empty?
            nil
        else
            matching
        end
    end

    def compare(hash1, hash2)
        #hash1 has a single value per key
        #hash2 may contain an array of values
        hash1.each do |k,v|
            return false if !hash2[k]
            v2 = hash2[k]
            if hash2[k].kind_of?(Array)
                return false if !v2.include? v
            else
                return false if v != v2
            end
        end
        true
    end
end

class VM
    def initialize(vm_root)
        @vm_root = vm_root
    end

    def [](element)
        if @vm_root
            val = @vm_root.elements[element]
                if val.text
                    return val.text
                end
        end
        nil
    end
end

class OpenNebulaVLAN
    attr_reader :vm_info, :hypervisor, :nics

    def initialize(vm_tpl, hypervisor=nil)
        @vm_root = REXML::Document.new(vm_tpl).root
        @vm      = VM.new(@vm_root)
        @vm_info = Hash.new

        if !hypervisor
            hypervisor = detect_hypervisor
        end
        @hypervisor = hypervisor

        case hypervisor
        when "kvm"
            require 'KVMVLAN'
            class <<self
                include OpenNebulaVLANKVM
            end
        when "xen"
            require 'XenVLAN'
            class <<self
                include OpenNebulaVLANXen
            end
        end

        @vm_info = get_info

        @nics = get_nics
        @filtered_nics = @nics
    end

    def filter(*filter)
        @filtered_nics = @nics.get(*filter)
        self
    end

    def unfilter
        @filtered_nics = @nics
        self
    end

    def process(&block)
        if @filtered_nics
            @filtered_nics.each do |n|
                yield(n)
            end
        end
    end

    def detect_hypervisor
        uname_a = `uname -a`
        lsmod   = `#{COMMANDS[:lsmod]}`

        if uname_a.match(/xen/i)
            "xen"
        elsif lsmod.match(/kvm/)
            "kvm"
        end
    end

    def get_nics
        nics = Nics.new
        @vm_root.elements.each("TEMPLATE/NIC") do |nic_element|
            nic =  new_nic(@hypervisor)
            nic_element.elements.each('*') do |nic_attribute|
                key = nic_attribute.xpath.split('/')[-1].downcase.to_sym
                nic[key] = nic_attribute.text
            end
            nic.get_tap(self)
            nics << nic
        end
        nics
    end

    def get_interfaces
        bridges    = Hash.new
        brctl_exit =`#{COMMANDS[:brctl]} show`
        
        cur_bridge = ""

        brctl_exit.split("\n")[1..-1].each do |l|
            l = l.split

            if l.length > 1
                cur_bridge = l[0]

                bridges[cur_bridge] = Array.new
                bridges[cur_bridge] << l[3]
            else
                bridges[cur_bridge] << l[0]
            end
        end

        bridges
    end
end

class OpenvSwitchVLAN < OpenNebulaVLAN
    def initialize(vm, hypervisor = nil)
        super(vm,hypervisor)
    end

    def activate
        process do |nic|
            cmd =   "#{COMMANDS[:ovs_vsctl]} set Port #{nic[:tap]} "
            cmd <<  "tap=#{nic[:network_id].to_i + CONF[:start_vlan]}"

            system(cmd)
        end
    end
end

class EbtablesVLAN < OpenNebulaVLAN
    def initialize(vm, hypervisor = nil)
        super(vm,hypervisor)
    end

    def ebtables(rule)
        system("#{COMMANDS[:ebtables]} -A #{rule}")
    end

    def activate
        process do |nic|
            tap = nic[:tap]
            if tap
                iface_mac = nic[:mac]

                mac     = iface_mac.split(':')
                mac[-1] = '00'

                net_mac = mac.join(':')

                in_rule="FORWARD -s ! #{net_mac}/ff:ff:ff:ff:ff:00 " <<
                        "-o #{tap} -j DROP"
                out_rule="FORWARD -s ! #{iface_mac} -i #{tap} -j DROP"

                ebtables(in_rule)
                ebtables(out_rule)
            end
        end
    end

    def deactivate
        process do |nic|
            mac = nic[:mac]
            # remove 0-padding
            mac = mac.split(":").collect{|e| e.hex.to_s(16)}.join(":")

            tap = ""
            rules.each do |rule|
                if m = rule.match(/#{mac} -i (\w+)/)
                    tap = m[1]
                    break
                end
            end
            remove_rules(tap)
        end
    end

    def rules
        `#{COMMANDS[:ebtables]} -L FORWARD`.split("\n")[3..-1]
    end

    def remove_rules(tap)
        rules.each do |rule|
            if rule.match(tap)
                remove_rule(rule)
            end
        end
    end

    def remove_rule(rule)
        system("#{COMMANDS[:ebtables]} -D FORWARD #{rule}")
    end
end

class OpenNebulaFirewall < OpenNebulaVLAN
    def initialize(vm, hypervisor = nil)
        super(vm,hypervisor)
    end
    def activate
        vm_id =  @vm['ID']
        process do |nic|
            #:white_ports_tcp => iptables_range
            #:white_ports_udp => iptables_range
            #:black_ports_tcp => iptables_range
            #:black_ports_udp => iptables_range
            #:icmp            => 'DROP' or 'NO'
            
            nic_rules = Array.new
            
            chain   = "one-#{vm_id}-#{nic[:network_id]}"
            tap     = nic[:tap]
            
            if tap
                #TCP
                if range = nic[:white_ports_tcp]
                    nic_rules << filter_ports(chain, :tcp, range, :accept)
                    nic_rules << filter_protocol(chain, :tcp, :drop)
                elsif range = nic[:black_ports_tcp]
                    nic_rules << filter_ports(chain, :tcp, range, :drop)
                end

                #UDP
                if range = nic[:white_ports_udp]
                    nic_rules << filter_ports(chain, :ucp, range, :accept)
                    nic_rules << filter_protocol(chain, :ucp, :drop)
                elsif range = nic[:black_ports_udp]
                    nic_rules << filter_ports(chain, :ucp, range, :drop)
                end

                #ICMP
                if nic[:icmp]
                    if %w(no drop).include? nic[:icmp].downcase
                        nic_rules << filter_protocol(chain, :icmp, :drop)
                    end
                end

                process_chain(chain, tap, nic_rules)
            end
        end
    end

    def deactivate
        vm_id =  @vm['ID']
        process do |nic|
            chain   = "one-#{vm_id}-#{nic[:network_id]}"
            iptables_out = `#{COMMANDS[:iptables]} -n -v --line-numbers -L FORWARD`
            if m = iptables_out.match(/.*#{chain}.*/)
                rule_num = m[0].split(/\s+/)[0]
                purge_chain(chain, rule_num)
            end
        end
    end

    def purge_chain(chain, rule_num)
        rules = Array.new
        rules << rule("-D FORWARD #{rule_num}")
        rules << rule("-F #{chain}")
        rules << rule("-X #{chain}")
        run_rules rules
    end

    def process_chain(chain, tap, nic_rules)
        rules = Array.new
        if !nic_rules.empty?
            # new chain
            rules << new_chain(chain)
            # move tap traffic to chain
            rules << tap_to_chain(tap, chain)

            rules << nic_rules
        end
        run_rules rules
    end

    def run_rules(rules)
        rules.flatten.each do |rule|
            system(rule)
            puts(rule)
        end
    end

    def range?(range)
        range.match(/^(?:(?:\d+|\d+:\d+),)*(?:\d+|\d+:\d+)$/)
    end

    def filter_protocol(chain, protocol, policy)
        policy   = policy.to_s.upcase
        rule "-A #{chain} -p #{protocol} -j #{policy}"
    end

    def filter_ports(chain, protocol, range, policy)
        policy   = policy.to_s.upcase
        if range? range
           rule "-A #{chain} -p #{protocol} -m multiport --dports #{range} -j #{policy}"
        end
    end

    def tap_to_chain(tap, chain)
        rule "-A FORWARD -m physdev --physdev-in #{tap} -j #{chain}"
    end

    def new_chain(chain)
        rule "-N #{chain}"
    end

    def rule(rule)
        "#{COMMANDS[:iptables]} #{rule}"
    end
end
