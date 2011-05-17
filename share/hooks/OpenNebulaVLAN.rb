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
            if e_filter == dict
                matching << e
            end
        end

        if matching.empty?
            nil
        else
            matching
        end
    end
end


class OpenNebulaVLAN
    attr_reader :vm_info, :hypervisor, :nics

    def initialize(vm_tpl, hypervisor=nil)
        @vm_root = REXML::Document.new(vm_tpl).root
        @vm_info = Hash.new

        if !hypervisor
            hypervisor = detect_hypervisor
        end
        @hypervisor = hypervisor

        @deploy_id = @vm_root.elements['DEPLOY_ID'].text

        case hypervisor
        when "kvm"
            require 'KVMVLAN'
            @nic_class = NicKVM
        when "xen"
            require 'XenVLAN'
            @nic_class = NicXen
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
            nic =  @nic_class.new(@hypervisor)
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
