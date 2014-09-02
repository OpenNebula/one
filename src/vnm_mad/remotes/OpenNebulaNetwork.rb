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

$: << File.dirname(__FILE__)
$: << File.join(File.dirname(__FILE__), '..')

require 'rexml/document'
require 'OpenNebulaNic'
require 'base64'
require 'yaml'

require 'scripts_common'

include OpenNebula

begin
    CONF =  YAML.load_file(
                File.join(File.dirname(__FILE__), "OpenNebulaNetwork.conf")
            )
rescue
    CONF = {
        :start_vlan => 2
    }
end

def get_xen_command
    if system("ps axuww | grep -v grep | grep '\\bxen\\b'")
        "sudo xm"
    else
        "sudo xl"
    end
end


COMMANDS = {
  :ebtables => "sudo ebtables",
  :iptables => "sudo iptables",
  :brctl    => "sudo brctl",
  :ip       => "sudo ip",
  :virsh    => "virsh -c qemu:///system",
  :xm       => get_xen_command,
  :ovs_vsctl=> "sudo ovs-vsctl",
  :ovs_ofctl=> "sudo ovs-ofctl",
  :lsmod    => "lsmod"
}



# Set PATH
ENV['PATH'] = "#{ENV['PATH']}:/bin:/sbin:/usr/bin"

class VM
    attr_accessor :nics, :vm_info, :deploy_id

    def initialize(vm_root, xpath_filter, deploy_id, hypervisor)
        @vm_root      = vm_root
        @xpath_filter = xpath_filter
        @deploy_id    = deploy_id
        @hypervisor   = hypervisor
        @vm_info      = Hash.new

        @deploy_id = nil if deploy_id == "-"

        nics = Nics.new(@hypervisor)

        @vm_root.elements.each(@xpath_filter) do |nic_element|
            nic =  nics.new_nic

            nic_element.elements.each('*') do |nic_attribute|
                key      = nic_attribute.xpath.split('/')[-1].downcase.to_sym
                nic[key] = nic_attribute.text
            end

            nic.get_info(self)
            nic.get_tap(self)

            nics << nic
        end

        @nics = nics
    end

    def each_nic(block)
        if @nics != nil
            @nics.each do |the_nic|
                block.call(the_nic)
            end
        end
    end

    def [](element)
        if @vm_root
            val = @vm_root.elements[element]
            if !val.nil? and val.text
                return val.text
            end
        end
        nil
    end
end

class OpenNebulaNetwork
    attr_reader :hypervisor, :vm

    def self.from_base64(vm_64, deploy_id = nil, hypervisor = nil)
        vm_xml =  Base64::decode64(vm_64)
        self.new(vm_xml, deploy_id, hypervisor)
    end

    def initialize(vm_tpl, xpath_filter, deploy_id = nil, hypervisor = nil)
        @locking = false

        if !hypervisor
            @hypervisor = detect_hypervisor
        else
            @hypervisor = hypervisor
        end

        @vm = VM.new(REXML::Document.new(vm_tpl).root, xpath_filter, deploy_id, @hypervisor)
    end

    def lock
        if @locking
            driver_name = self.class.name.downcase
            @locking_file = File.open("/tmp/onevnm-#{driver_name}-lock","w")
            @locking_file.flock(File::LOCK_EX)
        end
    end

    def unlock
        if @locking
           @locking_file.close
        end
    end

    def process(&block)
        @vm.each_nic(block)
    end

    def detect_hypervisor
        lsmod       = `#{COMMANDS[:lsmod]}`
        xen_file    = "/proc/xen/capabilities"

        if File.exists?(xen_file)
            "xen"
        elsif lsmod.match(/kvm/)
            "kvm"
        else
            nil
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
                bridges[cur_bridge] << l[3] if l[3]
            else
                bridges[cur_bridge] << l[0]
            end
        end

        bridges
    end
end
