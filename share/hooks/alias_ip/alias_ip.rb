#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    PACKET_LOCATION = '/usr/lib/one/ruby/vendors/packethost/lib'
    LOG_FILE = '/var/log/one/hook-alias_ip.log'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    PACKET_LOCATION = '/usr/lib/one/ruby/vendors/packethost/lib'
    LOG_FILE = ONE_LOCATION + '/var/hook-alias_ip.log'
end

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << PACKET_LOCATION

# rubocop:disable Style/MixinUsage
require 'opennebula'
include OpenNebula
# rubocop:enable Style/MixinUsage

require 'base64'
require 'open3'
require 'packet'

###

VM_ID  = ARGV[0]
VM_XML = Base64.decode64(ARGV[1])

if VM_ID.nil? || VM_ID.empty? || VM_XML.nil? || VM_XML.empty?
    STDERR.puts 'USAGE: <VM ID> <VM XML>'
    exit(-1)
end

##########
# Helpers

def log(msg, level = 'I')
    File.open(LOG_FILE, 'a') do |f|
        msg.lines do |l|
            f.puts "[#{Time.now}][VM #{VM_ID}][#{level}] #{l}"
        end
    end
end

def log_error(msg)
    log(msg, 'E')
end

def one_fetch(client, type, id)
    object = type.new_with_id(id, client)
    rc = object.info

    if OpenNebula.is_error?(rc)
        STDERR.puts(rc.message)
        exit(-1)
    end

    object
end

def find_packet_ip_assignment(packet_client, id, cidr)
    packet_client.get_ip(id).assignments.each do |a|
        assignment_id = a['href'].split('/')[-1]

        begin
            packet_ip = packet_client.get_ip(assignment_id)
        rescue StandardError
            next
        end

        packet_cidr = "#{packet_ip.network}/#{packet_ip.cidr}"

        if packet_cidr == cidr
            return packet_ip
        end
    end

    nil
end

def device_has_ip?(packet_client, device_id, ip_id)
    packet_client.get_device(device_id).ip_addresses.each do |ip_address|
        return true if ip_address['id'] == ip_id
    end

    false
end

def manage_packet(host, ip, address_range, assign = true)
    cidr = "#{ip}/32"

    system = OpenNebula::System.new(OpenNebula::Client.new)
    config = system.get_configuration

    if OpenNebula.is_error?(config)
        STDERR.puts("Error getting oned configuration : #{config.message}")
        exit(-1)
    end

    token = config['ONE_KEY']
    ar_token = OpenNebula.decrypt({ :value => address_range['PACKET_TOKEN'] },
                                  token)[:value]
    ar_deploy_id = address_range['DEPLOY_ID']

    packet_client = Packet::Client.new(ar_token)
    packet_ip = find_packet_ip_assignment(packet_client, ar_deploy_id, cidr)

    if assign == true
        unless host
            log("Packet: Unable to assign IP #{ip} to unknown host")
            return
        end

        device_id = host['/HOST/TEMPLATE/PROVISION/DEPLOY_ID']

        if packet_ip
            if device_has_ip?(packet_client, device_id, packet_ip.id)
                log("Packet: Already assigned IP #{ip}")
                return
            else
                log("Packet: Unassign IP #{ip}")
                packet_client.delete_ip(packet_ip)
            end
        end

        log("Packet: Assign IP #{ip}")
        packet_client.assign_cidr_device(cidr, device_id)

    elsif packet_ip
        log("Packet: Unassign IP #{ip}")
        packet_client.delete_ip(packet_ip)
    end
end

##########
# Main

begin
    client = Client.new
rescue StandardError => e
    STDERR.puts(e.to_s)
    exit(-1)
end

host = nil
assign = false

xml_vm = OpenNebula::XMLElement.new
xml_vm.initialize_xml(VM_XML, 'VM')
vm_state_str = OpenNebula::VirtualMachine::VM_STATE[xml_vm['/VM/STATE'].to_i]

log("Alias hook triggered for state=#{vm_state_str}")

# if VM is associated with particular host, get the
# metadata and force the operation to assign
# the aliased IPs to the host
if %w[ACTIVE SUSPENDED POWEROFF].include? vm_state_str
    assign  = true
    host_id = xml_vm['/VM/HISTORY_RECORDS/HISTORY[last()]/HID']
    host    = one_fetch(client, OpenNebula::Host, host_id)
end

# process each NIC_ALIAS and check each address host assignment
xml_vm.each('/VM/TEMPLATE/NIC_ALIAS') do |nic|
    next unless nic['IP'] # or nic['IP6']

    nic_ip  = nic['IP']
    vnet_id = nic['NETWORK_ID']
    ar_id   = nic['AR_ID']

    nic_assign = assign

    if nic['ATTACH'] == 'YES'
        # we have to detect NIC hot detach, fetch latest VM
        # template and check last 2 history entries
        # (last entry tends to contain ACTION=0)
        vm = one_fetch(client, OpenNebula::VirtualMachine, xml_vm['/VM/ID'])

        last_seq = xml_vm['/VM/HISTORY_RECORDS/HISTORY[last()]/SEQ'].to_i

        [last_seq, last_seq - 1].each do |seq|
            action_id = vm["/VM/HISTORY_RECORDS/HISTORY[SEQ=#{seq}]/ACTION"]
            action_id = action_id.to_i

            case OpenNebula::VirtualMachine::HISTORY_ACTION[action_id]
            when 'none'
                next
            when 'alias-detach'
                nic_assign = false
            else
                break
            end
        end
    end

    vnet = one_fetch(client, OpenNebula::VirtualNetwork, vnet_id)
    vnet.each("/VNET/AR_POOL/AR[AR_ID=#{ar_id}]") do |ar|
        case ar['IPAM_MAD']
        when 'packet'
            manage_packet(host, nic_ip, ar, nic_assign)
        end
    end
end

log('Alias hook done')
exit 0
