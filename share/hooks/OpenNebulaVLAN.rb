#!/usr/bin/env ruby

require 'rexml/document'

CONF = {
    :start_vlan => 2
}

COMMANDS = {
  :ebtables => "sudo /sbin/ebtables",
  :brctl    => "/usr/sbin/brctl",
  :virsh    => "virsh -c qemu:///system",
  :xm       => "sudo /usr/sbin/xm",
  :ovs_vsctl => "sudo /usr/local/bin/ovs-vsctl",
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

class Nic < Hash
    def initialize(hypervisor)
        @hypervisor = hypervisor
    end

    def get_tap(vm)
        case vm.hypervisor
        when "kvm"
            get_tap_kvm(vm)
        when "xen"
            get_tap_xen(vm)
        end
    end

    def get_tap_kvm(vm)
        dumpxml = vm.vm_info[:dumpxml]
        dumpxml_root = REXML::Document.new(dumpxml).root

        xpath = "devices/interface[@type='bridge']/"
        xpath << "mac[@address='#{self[:mac]}']/../target"
        tap = dumpxml_root.elements[xpath]

        if tap
            self[:tap] = tap.attributes['dev']
        end
        self
    end

    #TODO:
    #def get_tap_xen(nic)
    #end
end


class OpenNebulaVLAN
    attr_reader :vm_info, :hypervisor

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
            @vm_info[:dumpxml] = `#{COMMANDS[:virsh]} dumpxml #{@deploy_id}`
        when "xen"
        end

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
            nic = Nic.new(@hypervisor)
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
            cmd <<  "tap=#{nic[:network_id].to_i+CONF[:start_vlan]}"

            #TODO: execute command
            puts cmd
            #system(cmd)
        end
    end
end

class EbtablesVLAN < OpenNebulaVLAN
    def initialize(vm, hypervisor = nil)
        super(vm,hypervisor)
    end
end
