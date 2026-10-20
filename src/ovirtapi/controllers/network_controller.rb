# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require 'json'
require 'base64'
require 'ipaddr'
require 'opennebula'
require_relative 'vm_controller'
require_relative 'helper_functions'

# ------------------------------------------------------------------
# OpenNebula VNets are split into two parts in oVirt: Networks and
# VNIC Profiles. The network represents the logical or physical
# network on the host, while the VNIC Profile represents the configuration
# on the VM to connect to said network.
# ------------------------------------------------------------------

# NetworkController manages OpenNebula VNets
class NetworkController

    # Decode guest-agent interfaces without inferring NIC ownership from IP order.
    class GuestNetwork

        def self.normalize_mac(value)
            return unless value.is_a?(String)

            mac = value.strip.downcase.tr('-', ':')
            return unless mac.match?(/\A(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\z/)
            return if mac == '00:00:00:00:00:00'

            mac
        end

        def self.ipv4(value)
            return unless value.is_a?(String)

            value = value.strip
            return unless value.match?(/\A(?:\d{1,3}\.){3}\d{1,3}\z/)

            address = IPAddr.new(value)
            return unless address.ipv4? && !address.loopback?

            address.to_s
        rescue IPAddr::InvalidAddressError
            nil
        end

        def self.ipv6(value)
            return unless value.is_a?(String)

            value = value.strip
            return if value.include?('/') || value.include?('%')

            address = IPAddr.new(value)
            address if address.ipv6?
        rescue IPAddr::InvalidAddressError
            nil
        end

        def initialize(monitoring, vm_id)
            @interfaces = {}
            @malformed = false
            encoded = monitoring.is_a?(Hash) ? monitoring['VM_GUEST_INTERFACES_B64'] : nil
            return if encoded.nil? || encoded == ''

            raise TypeError unless encoded.is_a?(String)

            interfaces = JSON.parse(Base64.strict_decode64(encoded))
            raise TypeError unless interfaces.is_a?(Array)

            parsed = interfaces.map {|interface| parse_interface(interface) }.compact
            @interfaces = parsed.group_by {|interface| interface[:mac] }
            warn_malformed(vm_id) if @malformed
        rescue ArgumentError, TypeError, JSON::ParserError
            warn_malformed(vm_id)
        end

        # A MAC must identify exactly one guest interface and one template NIC.
        def match(nics)
            matches = {}
            nics.group_by {|nic| self.class.normalize_mac(nic['MAC']) }.each do |mac, group|
                guest = @interfaces[mac]
                next unless mac && group.length == 1 && guest && guest.length == 1

                matches[mac] = guest.first
            end
            matches
        end

        private

        def parse_interface(interface)
            unless interface.is_a?(Hash)
                @malformed = true
                return
            end
            return if interface['name'] == 'lo'

            mac = self.class.normalize_mac(interface['hardware-address'])
            addresses = interface.fetch('ip-addresses', [])
            unless mac && addresses.is_a?(Array)
                @malformed = true
                return
            end

            name = interface['name']
            name = name.is_a?(String) ? name.strip : nil
            ips = addresses.map {|address| parse_address(address) }.compact.uniq
            { :mac => mac, :name => name, :ips => ips }
        end

        def parse_address(address)
            unless address.is_a?(Hash)
                @malformed = true
                return
            end
            if address['ip-address-type'] == 'ipv6'
                ip = self.class.ipv6(address['ip-address'])
                # Skip loopback and link-local guest addresses.
                return if ip && (ip.loopback? || ip.link_local?)
                return ip.to_s if ip
            end

            if address['ip-address-type'] == 'ipv4'
                ip = self.class.ipv4(address['ip-address'])
                return ip if ip

                # Loopback is deliberately excluded, not a malformed monitoring value.
                return if address['ip-address'].to_s.match?(/\A127\./)
            end

            @malformed = true
            nil
        end

        def warn_malformed(vm_id)
            LOGGER.warn("Ignoring malformed guest interface monitoring for VM #{vm_id}")
        end

    end

    # Struct Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#types/vnic_profile
    def self.onevnet_to_ovirtvnic(onevnet)
        {
            :name => onevnet.name,
          :id => Helper.int_to_uuid(onevnet.id.to_i).to_s,
          :href => "/ovirt-engine/api/vnicprofiles/#{Helper.int_to_uuid(onevnet.id.to_i)}",
          :network => {
              :id => Helper.int_to_uuid(onevnet.id.to_i).to_s
          }
        }
    end

    # Struct Reference: https://ovirt.github.io/ovirt-engine-api-model/master/#types/network
    def self.onevnet_to_ovirtnetwork(onevnet)
        vnet_hash = onevnet.to_hash
        vnet_dc_id = vnet_hash['VNET']['CLUSTERS']['ID']
        if vnet_dc_id.is_a?(Array)
            vnet_dc_id = vnet_dc_id.first.to_i
        end
        {
            :name => onevnet.name,
          :id => Helper.int_to_uuid(onevnet.id.to_i).to_s,
          :usages => {
              :usage => ['vm']
          },
          :data_center => {
              :id => Helper.int_to_uuid(vnet_dc_id).to_s,
            :href => '/ovirt-engine/api/datacenters/' \
                "#{Helper.int_to_uuid(vnet_dc_id)}"
          }
        }
    end

    # Auxiliary function to get a list of OpenNebula VNets or
    # a single VNet if an id is provided
    def self.get_one_vnets(client, id = nil)
        if client.is_a?(Helper::Inventory)
            return client.pool(:vnets, id) { get_one_vnets(client.client) }
        end

        vnets = OpenNebula::VirtualNetworkPool.new(client)
        rc = vnets.info_all

        if OpenNebula.is_error?(rc)
            LOGGER.error("Error: #{rc.message}")
            return
        end

        id ? vnets.find {|vnet| vnet.id == id } : vnets
    end

    # Return list of formatted oVirt VNIC Profiles
    def self.get_ovirt_vnicprofiles(client, id: nil)
        if id
            LOGGER.info("Getting VNIC Profile with ID #{id}")
            vnet = get_one_vnets(client, id)
            return 200, onevnet_to_ovirtvnic(vnet) unless vnet.nil?

            LOGGER.error("Error obtaining OpenNebula vnet: #{id}")
            return 500, Helper.fault_response("Error obtaining OpenNebula vnet: #{id}")
        end

        vnets = get_one_vnets(client)
        if vnets.nil?
            LOGGER.error('Error obtaining OpenNebula vnets')
            return 500, Helper.fault_response('Error obtaining OpenNebula vnets.')
        end

        vnics = []
        vnets.each do |vn|
            vnics << onevnet_to_ovirtvnic(vn)
        end
        return 200, { :vnic_profile => vnics }
    end

    # Convert OpenNebula NIC to oVirt NIC
    def self.one_nic_to_ovirt_nic(one_nic, vm_id, reported_device: nil)
        response = {
            :id => Helper.int_to_uuid(one_nic['NIC_ID'].to_i).to_s,
          :href => "/ovirt-engine/api/vms/#{Helper.int_to_uuid(vm_id)}/nics/" \
            "#{Helper.int_to_uuid(one_nic['NIC_ID'].to_i)}",
          :mac => {
              :address => one_nic['MAC']
          },
          :name => one_nic['NETWORK'],
          :interface => 'virtio',
          :linked => 'true',
          :plugged => 'true',
          :synced => 'true',
          :vnic_profile => {
              :href => '/ovirt-engine/api/vnicprofiles/' \
                "#{Helper.int_to_uuid(one_nic['NETWORK_ID'].to_i)}",
            :id => Helper.int_to_uuid(one_nic['NETWORK_ID'].to_i).to_s
          },
          :vm => {
              :href => "/ovirt-engine/api/vms/#{Helper.int_to_uuid(vm_id.to_i)}",
            :id => Helper.int_to_uuid(vm_id.to_i).to_s
          }
        }

        if reported_device
            response['reported_devices'] = { :reported_device => [reported_device] }
        end

        return response
    end

    def self.resolve_nic_ips(one_nic, veeam_worker, guest_interface)
        ips = veeam_worker ? [] : [GuestNetwork.ipv4(one_nic['IP'])].compact
        ips.concat(guest_interface[:ips]) if guest_interface
        ips.uniq
    end

    def self.one_nic_to_reported_device(nic, vm_id, veeam_worker, guest_interface)
        vm_uuid = Helper.int_to_uuid(vm_id).to_s
        nic_uuid = Helper.int_to_uuid(nic['NIC_ID'].to_i).to_s
        name = [guest_interface && guest_interface[:name], nic['NAME']].find do |value|
            value.is_a?(String) && !value.strip.empty?
        end

        {
            :id => nic_uuid,
            :href => "/ovirt-engine/api/vms/#{vm_uuid}/reporteddevices/#{nic_uuid}",
            :ips => {
                :ip => resolve_nic_ips(nic, veeam_worker, guest_interface).map do |ip|
                    { :address => ip, :version => (IPAddr.new(ip).ipv6? ? 'v6' : 'v4') }
                end
            },
            :mac => { :address => nic['MAC'] },
            :type => 'network',
            :vm => { :id => vm_uuid, :href => "/ovirt-engine/api/vms/#{vm_uuid}" },
            :name => name || "eth#{nic['NIC_ID']}",
            :description => ''
        }
    end

    def self.reported_devices_follow?(follows)
        follows.to_s.split(',').any? {|follow| follow.split('.').first == 'reporteddevices' }
    end

    def self.nic_templates(vm_hash)
        nics = vm_hash.dig('VM', 'TEMPLATE', 'NIC')
        (nics.is_a?(Hash) ? [nics] : Array(nics)).reject(&:empty?)
    end

    def self.require_nic(vm_hash, nic_id)
        nic = nic_templates(vm_hash).find do |item|
            id = item['NIC_ID'].to_s
            id.match?(/\A\d+\z/) && id.to_i == nic_id.to_i
        end
        return nic if nic

        raise VmController::LookupError.new(404, "NIC #{nic_id} not found")
    end

    # Return NICs for a VM. The inventory shares full information and parsed
    # interfaces across all expansions within this request.
    def self.get_ovirt_nics(client, vm_id, nic_id: nil, follows: nil)
        client = Helper::Inventory.wrap(client)
        vm = VmController.get_one_vms(client, :vm_id => vm_id)
        vm_hash = Helper.resource_hash(client, vm)
        return { :nic => [] } if nic_id.nil? && nic_templates(vm_hash).empty?

        reported = reported_devices_follow?(follows)
        if reported
            vm = VmController.get_one_vms(client, :vm_id => vm_id, :full => true)
            vm_hash = Helper.resource_hash(client, vm)
        end
        nics = nic_id ? [require_nic(vm_hash, Helper.uuid_to_int(nic_id))] : nic_templates(vm_hash)
        return { :nic => [] } if nics.empty?

        worker_flag = vm_hash.dig('VM', 'USER_TEMPLATE', 'VEEAM_WORKER')
        veeam_worker = worker_flag.to_s.strip.casecmp('true').zero?
        interfaces = if reported
                         client.guest_interfaces(vm) do
                             GuestNetwork.new(vm_hash.dig('VM', 'MONITORING'), vm_id).match(nics)
                         end
                     else
                         {}
                     end

        ovirt_nics = nics.map do |nic|
            device = if reported
                         guest = interfaces[GuestNetwork.normalize_mac(nic['MAC'])]
                         one_nic_to_reported_device(nic, vm_id, veeam_worker, guest)
                     end
            one_nic_to_ovirt_nic(nic, vm_id, :reported_device => device)
        end
        nic_id ? ovirt_nics.first : { :nic => ovirt_nics }
    end

    def self.get_ovirt_reported_devices(client, vm_id, device_id: nil, max: nil)
        pagination = Helper::Pagination.new(:max => max)
        nics = get_ovirt_nics(client, vm_id, :follows => 'reporteddevices')
        devices = nics[:nic].flat_map {|nic| nic['reported_devices'][:reported_device] }
        if device_id
            device = devices.find {|item| item[:id] == device_id.to_s }
            unless device
                raise VmController::LookupError.new(404, "Reported device #{device_id} not found")
            end

            return device
        end

        { :reported_device => pagination.apply(devices) }
    end

    # Attach a NIC
    def self.attach_ovirt_nic(client, vm_id, nic_id)
        vm = VmController.get_one_vms(client, :vm_id => vm_id)
        vm_hash = vm.to_hash
        nics = vm_hash.dig('VM', 'TEMPLATE', 'NIC')
        nics = if nics.nil?
                   []
               else
                   (nics.is_a?(Hash) ? [nics] : nics)
               end
        nic_index = nics.length

        # Extract the WORKER_IP from the VM's user template
        worker_ip = vm['USER_TEMPLATE/WORKER_IP']
        worker_ips = worker_ip.to_s.split(',').map(&:strip)
        worker_ip = worker_ips[nic_index]

        # If the WORKER_IP attribute exists and isn't empty, inject it into the NIC block
        if worker_ip && !worker_ip.strip.empty?
            template = "NIC = [ NETWORK_ID = \"#{nic_id}\", IP = \"#{worker_ip}\" ]"
        else
            template = "NIC = [ NETWORK_ID = \"#{nic_id}\" ]"
        end

        (1..360).each do |attempt|
            rc = vm.nic_attach(template)
            if !OpenNebula.is_error?(rc)
                LOGGER.info('NIC attached successfully.')
                vm.info
                attached_nic = vm.to_hash.dig('VM', 'TEMPLATE', 'NIC')
                attached_nics = attached_nic.is_a?(Array) ? attached_nic : [attached_nic].compact
                attached_nic = attached_nics.reverse.find do |nic|
                    nic['NETWORK_ID'].to_i == nic_id.to_i
                end
                return one_nic_to_ovirt_nic(attached_nic, vm_id) if attached_nic

                return get_ovirt_nics(client, vm_id)
            end
            LOGGER.info("NIC attach: attempt #{attempt}/360 failed...")
            sleep 5
        end
    end

    def self.detach_ovirt_nic(client, vm_id, nic_id)
        vm = VmController.get_one_vms(client, :vm_id => vm_id)
        require_nic(vm.to_hash, nic_id)

        rc = vm.nic_detach(nic_id)
        Helper.check_lookup_error(rc, "Unable to detach NIC #{nic_id} from VM #{vm_id}")
    end

end
