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
require 'OpenNebulaNic'

CONF = {
    :start_vlan => 2
}

COMMANDS = {
  :ebtables => "sudo /sbin/ebtables",
  :iptables => "sudo /sbin/iptables",
  :brctl    => "sudo /usr/sbin/brctl",
  :ip       => "sudo /sbin/ip",
  :vconfig  => "sudo /sbin/vconfig",
  :virsh    => "virsh -c qemu:///system",
  :xm       => "sudo /usr/sbin/xm",
  :ovs_vsctl=> "sudo /usr/local/bin/ovs-vsctl",
  :lsmod    => "/sbin/lsmod"
}

class VM
    attr_accessor :nics, :filtered_nics

    def initialize(vm_root, hypervisor)
        @vm_root = vm_root
        @hypervisor = hypervisor
        get_nics
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

    def get_nics
        nics = Nics.new(@hypervisor)

        @vm_root.elements.each("TEMPLATE/NIC") do |nic_element|
            nic =  nics.new_nic
            nic_element.elements.each('*') do |nic_attribute|
                key = nic_attribute.xpath.split('/')[-1].downcase.to_sym
                nic[key] = nic_attribute.text
            end
            nic.get_info(self)
            nic.get_tap
            nics << nic
        end

        @nics = nics
        @filtered_nics = nics
    end
end

class OpenNebulaNetwork
    attr_reader :hypervisor, :vm

    def initialize(vm_tpl, hypervisor=nil)
        @hypervisor = detect_hypervisor if !hypervisor
        @vm      = VM.new(REXML::Document.new(vm_tpl).root, @hypervisor)
    end

    def filter(*filter)
        @vm.filtered_nics = @vm.nics.get(*filter)
        self
    end

    def unfilter
        @vm.filtered_nics = @vm.nics
        self
    end

    def process(&block)
        if @vm.filtered_nics
            @vm.filtered_nics.each do |n|
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






