#!/usr/bin/env ruby

require 'base64'
require 'rexml/xpath'
require 'rexml/document'

#TODO: hypervisor arg?
$hypervisor = "kvm"

#TODO: start vlan arg?
$start_vlan = 2

#TODO: other possible args?

def tag(nic, hypervisor)
    if hypervisor == "kvm"
        tag_kvm(nic)
    #TODO:
    #elsif hypervisor == "xen"
    #    tag_xen(nic)
    end
end

def tag_kvm(nic)
    tag_id = $start_vlan + nic[:network_id].to_i
    #TODO: real tag command
    puts "sudo ovs-vsctl set Port #{nic[:tap]} tag=#{tag_id}"
end

#TODO:
#def tag_xen(nic)
#end

def get_tap(nic, hypervisor)
    if hypervisor == "kvm"
        get_tap_kvm(nic)
    #TODO:
    #elsif hypervisor == "xen"
    #    get_tap_xen(nic)
    end
end

def get_tap_kvm(nic)
    dumpxml = File.read('vm_dumpxml') # virsh dumpxml
    dumpxml_root = REXML::Document.new(dumpxml).root

    xpath = "devices/interface[@type='bridge']/"
    xpath << "mac[@address='#{nic[:mac]}']/../target"
    tap = dumpxml_root.elements[xpath]

    if tap
        nic[:tap] = tap.attributes['dev']
    end
    nic
end

#TODO:
#def get_tap_xen(nic)
#end

vm_xml = File.read('vm_xml') # Base64::decode64(ARGV[0])
vm_doc = REXML::Document.new(vm_xml)
vm_root = vm_doc.root

vm_id = vm_root.elements["ID"]

#nics = Array.new #TODO: not needed
vm_root.elements.each("TEMPLATE/NIC") do |nic_element|
    nic = Hash.new
    nic_element.elements.each('*') do |nic_attribute|
        key = nic_attribute.xpath.split('/')[-1].downcase.to_sym
        nic[key] = nic_attribute.text
    end

    next if !(nic[:bridge] and nic[:network_id])

    nic = get_tap(nic, $hypervisor)

    if nic[:tap]
        tag(nic, $hypervisor)
    end
    #nics << nic #TODO: not needed
end
