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
require 'fileutils'
require 'opennebula'
require 'socket'

require_relative 'vm_controller'
require_relative 'storage_controller'
require_relative 'helper_functions'

# DiskController is responsible for managing disks in OpenNebula.
class DiskController

    PORTS_FILE = File.join(PORTS_PATH, '.interactive_ports.json')
    PORTS_LOCK = "#{PORTS_FILE}.lock"

    def self.reserve_port(port)
        with_ports_lock do
            ports = read_ports
            return false if ports.include?(port.to_i)

            ports << port.to_i
            write_ports(ports)
            true
        end
    end

    def self.release_port(port)
        return true if port.nil?

        with_ports_lock do
            ports = read_ports
            ports.delete(port.to_i)
            write_ports(ports)
            true
        end
    end

    def self.used_port?(port)
        with_ports_lock do
            read_ports.include?(port.to_i)
        end
    end

    def self.generate_disk_uuid(type, vm_id, disk_id)
        part1 = disk_id.to_s.rjust(8, '0')[0, 8]
        part2 = 0.to_s.rjust(4, '0')[0, 4]
        part3 = 0.to_s.rjust(4, '0')[0, 4]
        part4 = type.to_s.rjust(4, '0')[0, 4]
        part5 = vm_id.to_s.rjust(12, '0')[0, 12]

        LOGGER.debug("Generated disk UUID: #{part1}-#{part2}-#{part3}-#{part4}-#{part5}")
        "#{part1}-#{part2}-#{part3}-#{part4}-#{part5}"
    end

    # Disk UUID reference:
    # General format: <ID>-0000-0000-<TYPE>-<VM>
    #
    # Type: 0 => persistent disk. Persistent disks are mapped to ONE persistent images.
    # disk_id indicates the image ID.
    # e.g. 00000090-0000-0000-0000-000000000000 => persistent disk,
    # referes to persistent image with ID 90
    #
    # Type: 1 => non-persistent disk. These disks are referenced using VM ID and
    # disk ID relative to that VM.
    # e.g. 00000001-0000-0000-0001-000000000119 => non-persistent disk,
    # referes to disk 1 of VM with ID 119
    #
    # Type: 2 => volatile disk. These disks are referenced using VM ID and
    # disk ID relative to that VM.
    # e.g. 00000001-0000-0000-0002-000000000119 => volatile disk,
    # referes to disk 1 of VM with ID 119
    def self.decrypt_disk_uuid(uuid)
        hash = {}
        parts = uuid.split('-')

        hash[:disk_id] = parts[0].to_i
        hash[:type] = parts[3].to_i
        hash[:vm_id] = parts[4].to_i
        LOGGER.info("Decrypted disk UUID #{uuid} to: #{hash}")

        return hash
    end

    # Struct Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#types/disk
    def self.persistentdisk_to_ovirtdisk(client, onedisk)
        disk_hash = Helper.resource_hash(client, onedisk)

        path = disk_hash.dig('IMAGE', 'PATH').to_s
        state = disk_hash.dig('IMAGE', 'STATE').to_s

        # OneBEX waits for upload data while OpenNebula keeps the image locked.
        # Veeam waits for 'ok' before starting that upload.
        ready_for_upload = state == '4' && path.start_with?('onebex://')
        status = ['1', '2', '8'].include?(state) || ready_for_upload ? 'ok' : 'locked'

        if status == 'locked'
            LOGGER.info("Disk #{onedisk.id} is in a locked status " \
                "(persistentdisk_to_ovirtdisk). State: #{state}")
        end

        ds_id = disk_hash['IMAGE']['DATASTORE_ID'].to_i
        ds_uuid = Helper.int_to_uuid(ds_id).to_s

        # Retrieve datastore to determine if is lvm_thin
        ds = StorageController.get_one_datastores(client, ds_id)
        if ds.nil?
            LOGGER.error('Unable to retrieve datastore...')
            return
        end
        ds_hash = Helper.resource_hash(client, ds)

        is_lvmthin = Helper.lvm_thin_enabled?(
            ds_hash.dig('DATASTORE', 'TM_MAD'),
            ds_hash.dig('DATASTORE', 'TEMPLATE', 'LVM_THIN_ENABLE')
        )
        is_ceph = ds_hash.dig('DATASTORE', 'TM_MAD')&.include?('ceph')
        is_netapp = ds_hash.dig('DATASTORE', 'TM_MAD')&.include?('netapp')

        # Determine disk and backup format. lvm_thin disks will be presented
        # as qcow2 as that's required by Veeam to perform incremental backups
        is_raw_format = disk_hash['IMAGE']['FORMAT'] == 'raw'
        disk_format = is_raw_format && !is_lvmthin && !is_ceph && !is_netapp ? 'raw' : 'cow'
        backup_mode = if is_raw_format && !is_lvmthin && !is_ceph && !is_netapp
                          'full'
                      else
                          'incremental'
                      end

        vm_id = disk_hash['IMAGE']['VM_ID'].to_i
        if backup_mode == 'incremental' && vm_id > 0
            vm = VmController.get_one_vms(client, :vm_id => vm_id)
            vm_hash = Helper.resource_hash(client, vm)
            backup_ids = vm_hash.dig('VM', 'BACKUPS', 'BACKUP_IDS', 'ID')
            if backup_ids.nil?
                backup_mode = 'full'
            end
        end

        disk_id = generate_disk_uuid(0, 0, onedisk.id.to_i)

        return {
            :name => onedisk.name,
          :id => disk_id,
          :href => "/ovirt-engine/api/disks/#{disk_id}",
          :alias => onedisk.name,
          :backup => 'incremental',
          :backup_mode => backup_mode,
          :content_type => 'data',
          :format => disk_format,
          :image_id => disk_id,
          :qcow_version => 'qcow2_v3',
          :disk_profile => {
              :id => '2faa8038-67a6-4056-afbc-68961cec8aea'
          },
          :quota => {
              :id => 'a2727770-e47d-11ef-a861-a45d36fcdb34'
          },
          :storage_domains => {
              :storage_domain => [
                  {
                      :id => ds_uuid
                  }
              ]
          },
          :provisioned_size => disk_hash['IMAGE']['SIZE'].to_i * 1024 * 1024, # MB to bytes
          :actual_size => disk_hash['IMAGE']['SIZE'].to_i * 1024 * 1024, # MB to bytes
          :status => status
        }
    end

    def self.nonpersistentdisk_to_ovirtdisk(client, disk_hash, uuid, vm_id)
        if ['1', '2'].include?(disk_hash['IMAGE_STATE'])
            status = 'ok'
        else
            status = 'locked'
            LOGGER.info("Disk #{uuid} is in a locked status (nonpersistentdisk_to_ovirtdisk). " \
                "State: #{disk_hash['IMAGE_STATE']}")
        end

        ds_id = Helper.int_to_uuid(disk_hash['DATASTORE_ID'].to_i).to_s

        is_lvmthin = Helper.lvm_thin_enabled?(disk_hash['TM_MAD'], disk_hash['LVM_THIN_ENABLE'])
        is_ceph = disk_hash['TYPE'] == 'RBD'
        is_netapp = disk_hash['TM_MAD']&.include?('netapp')

        # Determine disk and backup format. lvm_thin disks will be presented
        # as qcow2 as that's required by Veeam to perform incremental backups
        is_raw_format = disk_hash['FORMAT'] == 'raw'
        disk_format = is_raw_format && !is_lvmthin && !is_ceph && !is_netapp ? 'raw' : 'cow'
        backup_mode = if is_raw_format && !is_lvmthin && !is_ceph && !is_netapp
                          'full'
                      else
                          'incremental'
                      end

        if backup_mode == 'incremental' && vm_id > 0
            vm = VmController.get_one_vms(client, :vm_id => vm_id)
            vm_hash = Helper.resource_hash(client, vm)
            backup_ids = vm_hash.dig('VM', 'BACKUPS', 'BACKUP_IDS', 'ID')
            if backup_ids.nil?
                backup_mode = 'full'
            end
        end

        return {
            :name => disk_hash['IMAGE'],
          :id => uuid,
          :href => "/ovirt-engine/api/disks/#{uuid}",
          :alias => disk_hash['IMAGE'],
          :backup => 'incremental',
          :backup_mode => backup_mode,
          :content_type => 'data',
          :format => disk_format,
          :image_id => Helper.int_to_uuid(disk_hash['IMAGE_ID'].to_i).to_s,
          :qcow_version => 'qcow2_v3',
          :disk_profile => {
              :id => '2faa8038-67a6-4056-afbc-68961cec8aea'
          },
          :quota => {
              :id => 'a2727770-e47d-11ef-a861-a45d36fcdb34'
          },
          :storage_domains => {
              :storage_domain => [
                  {
                      :id => ds_id
                  }
              ]
          },
          :provisioned_size => disk_hash['SIZE'].to_i * 1024 * 1024, # MB to bytes
          :actual_size => disk_hash['SIZE'].to_i * 1024 * 1024, # MB to bytes
          :status => status
        }
    end

    def self.volatiledisk_to_ovirtdisk(client, disk_hash, uuid, vm_id)
        vm = VmController.get_one_vms(client, :vm_id => vm_id)
        vm_hash = Helper.resource_hash(client, vm)
        disks = vm_hash['VM']['TEMPLATE']['DISK']
        if disks.is_a?(Hash)
            disks = [disks]
        end

        # Search the disks for the first one that isn't volatile
        ds_id = 0
        disks.each do |d|
            # check if the disk has the image_id key
            if d.key?('IMAGE_ID')
                ds_id = d['DATASTORE_ID']
                break
            end
        end

        if ds_id.to_i.zero?
            tm_mad = disk_hash['TM_MAD']
            if tm_mad && !tm_mad.to_s.empty?
                datastores = StorageController.get_one_datastores(client)
                if datastores
                    datastore = datastores.find do |ds|
                        ds_hash = Helper.resource_hash(client, ds)['DATASTORE']
                        ds_hash['TYPE'].to_i == 0 && ds_hash['TM_MAD']&.include?(tm_mad)
                    end
                    if datastore
                        ds_id = datastore.id
                        LOGGER.info("Using datastore #{ds_id} for volatile disk lookup based "\
                                    "on TM_MAD #{tm_mad}")
                    else
                        LOGGER.info("No image datastore found matching TM_MAD #{tm_mad} for "\
                                    'volatile disk lookup')
                    end
                end
            end
        end

        ds_id = Helper.int_to_uuid(ds_id).to_s

        is_lvmthin = disks.any? {|d| Helper.lvm_thin_enabled?(d['TM_MAD'], d['LVM_THIN_ENABLE']) }
        is_netapp = disk_hash['TM_MAD']&.include?('netapp')

        # Determine disk and backup format. lvm_thin disks will be presented
        # as qcow2 as that's required by Veeam to perform incremental backups
        is_raw_format = disk_hash['FORMAT'] == 'raw'
        disk_format = is_raw_format && !is_lvmthin && !is_netapp ? 'raw' : 'cow'
        backup_mode = is_raw_format && !is_lvmthin && !is_netapp ? 'full' : 'incremental'

        if backup_mode == 'incremental'
            vm = VmController.get_one_vms(client, :vm_id => vm_id)
            vm_hash = Helper.resource_hash(client, vm)
            backup_ids = vm_hash.dig('VM', 'BACKUPS', 'BACKUP_IDS', 'ID')
            if backup_ids.nil?
                backup_mode = 'full'
            end
        end

        status = 'ok'
        if disk_hash['IMAGE_STATE'] && !['1', '2'].include?(disk_hash['IMAGE_STATE'])
            status = 'locked'
            LOGGER.info("Disk #{uuid} is in a locked status (volatiledisk_to_ovirtdisk)." \
                " State: #{disk_hash['IMAGE_STATE']}")
        end
        return {
            :name => "volatile_#{vm_id}_#{disk_hash['DISK_ID']}",
          :id => uuid,
          :href => "/ovirt-engine/api/disks/#{uuid}",
          :alias => "volatile_#{vm_id}_#{disk_hash['DISK_ID']}",
          :backup => 'incremental',
          :backup_mode => backup_mode,
          :content_type => 'data',
          :format => disk_format,
          :image_id => Helper.int_to_uuid(0).to_s,
          :qcow_version => 'qcow2_v3',
          :disk_profile => {
              :id => '2faa8038-67a6-4056-afbc-68961cec8aea'
          },
          :quota => {
              :id => 'a2727770-e47d-11ef-a861-a45d36fcdb34'
          },
          :storage_domains => {
              :storage_domain => [
                  {
                      :id => ds_id
                  }
              ]
          },
          :provisioned_size => disk_hash['SIZE'].to_i * 1024 * 1024, # MB to bytes
          :actual_size => disk_hash['SIZE'].to_i * 1024 * 1024, # MB to bytes
          :status => status
        }
    end

    # Auxiliary function to get a list of OpenNebula Disks or
    # a single Disk if an id is provided
    def self.get_onedisks(client, id = nil)
        if client.is_a?(Helper::Inventory)
            return client.pool(:images, id) { get_onedisks(client.client) }
        end

        images = OpenNebula::ImagePool.new(client)
        rc = images.info_all

        if OpenNebula.is_error?(rc)
            LOGGER.error("Error: #{rc.message}")
            return
        end

        id ? images.find {|image| image.id.to_i == id.to_i } : images
    end

    # Return list of formatted oVirt Disks
    def self.get_ovirt_disks(client, max: nil, search: nil)
        client = Helper::Inventory.wrap(client)
        pagination = Helper::Pagination.new(:max => max, :search => search)
        disks = []

        # Get persistent images
        images = get_onedisks(client)
        if images.nil?
            LOGGER.error('Unable to obtain OpenNebula images.')
            return 500, Helper.fault_response('Unable to obtain OpenNebula images.')
        end

        # Load complete VM bodies once, including backup metadata and monitoring.
        # Disk formatters and VM relationships reuse this authorized snapshot.
        vms = VmController.get_one_vms(client)
        if vms.nil?
            LOGGER.error('Unable to obtain OpenNebula VMs')
            return 500, Helper.fault_response('Unable to obtain OpenNebula VMs')
        end

        images.each do |image|
            if image['PERSISTENT'] == '1'
                disks << persistentdisk_to_ovirtdisk(client, image)
            end
        rescue VmController::LookupError => e
            raise unless [401, 404].include?(e.status)

            LOGGER.info("Skipping image #{image.id}: #{e.message}")
        end

        # Get non-persistent images and volatile disks
        vms.each do |pool_vm|
            vm = VmController.get_one_vms(client, :vm_id => pool_vm.id)
            vm_hash = Helper.resource_hash(client, vm)
            backup_volatiles = vm_hash['VM']['BACKUPS']['BACKUP_CONFIG']['BACKUP_VOLATILE']
            vm_disks = vm_hash['VM']['TEMPLATE']['DISK']
            next if vm_disks.nil?

            if vm_disks.is_a?(Hash)
                vm_disks = [vm_disks]
            end
            vm_disks_formatted = []
            vm_disks.each do |disk|
                if disk.key?('IMAGE_ID') && disk['PERSISTENT'] != 'YES'
                    # Non-persistent disks
                    uuid = generate_disk_uuid(1, vm.id, disk['DISK_ID'].to_i)
                    vm_disks_formatted << nonpersistentdisk_to_ovirtdisk(client, disk, uuid, vm.id)
                elsif backup_volatiles && backup_volatiles == 'YES' && !disk.key?('IMAGE_ID')
                    # Volatile disks
                    uuid = generate_disk_uuid(2, vm.id, disk['DISK_ID'].to_i)
                    vm_disks_formatted << volatiledisk_to_ovirtdisk(client, disk, uuid, vm.id)
                end
            end
            disks.concat(vm_disks_formatted)
        rescue VmController::LookupError => e
            raise unless [401, 404].include?(e.status)

            LOGGER.info("Skipping unavailable VM #{pool_vm.id}: #{e.message}")
        end
        return 200, { :disk => pagination.apply(disks) }
    end

    # Return a single formatted oVirt Disk
    def self.get_ovirt_disk(client, uuid)
        client = Helper::Inventory.wrap(client)
        disk_info = decrypt_disk_uuid(uuid)
        LOGGER.info("Disk info: #{disk_info}")

        if disk_info[:type] == 0
            onedisk = get_onedisks(client, disk_info[:disk_id])

            if onedisk.nil?
                LOGGER.error('Unable to obtain OpenNebula disk')
                return 404, Helper.fault_response('Disk not found')
            end

            return 200, persistentdisk_to_ovirtdisk(client, onedisk)
        else
            vm = VmController.get_one_vms(client, :vm_id => disk_info[:vm_id])
            disks = vm.to_hash['VM']['TEMPLATE']['DISK']
            if disks.is_a?(Hash)
                disk = disks
            else
                disk = disks.find {|d| d['DISK_ID'].to_i == disk_info[:disk_id].to_i }
                LOGGER.info("Disk found: #{disk}")
            end
            if disk.nil?
                LOGGER.error('Unable to obtain disk')
                return 500, Helper.fault_response('Unable to obtain disk')
            end
            if disk_info[:type] == 1
                return 200, nonpersistentdisk_to_ovirtdisk(client, disk, uuid, disk_info[:vm_id])
            elsif disk_info[:type] == 2
                return 200, volatiledisk_to_ovirtdisk(client, disk, uuid, vm.id)
            else
                LOGGER.error("Unknown disk type: #{disk_info[:type]}")
                return 500, Helper.fault_response("Unknown disk type: #{disk_info[:type]}")
            end
        end
    end

    # Create a new empty disk
    def self.create_disk(client, name, storage_id, size, backup_ds)
        size = size.to_i / (1024*1024)
        base_name = name.sub(/\s*restore_\d+$/, '')
        name_rand = "#{base_name} restore_#{Time.now.to_i}"

        ds_id = Helper.uuid_to_int(storage_id)
        if ds_id == 0
            LOGGER.error('Error: Storage ID is not valid.')
            return 500, Helper.fault_response('Storage ID is not valid.')
        end

        image = nil

        port_min = Integer(PORT_MIN)
        port_max = Integer(PORT_MAX)

        if port_min <= 0 || port_max <= 0 || port_min > port_max
            raise "Invalid port range: PORT_MIN=#{PORT_MIN.inspect}, PORT_MAX=#{PORT_MAX.inspect}"
        end

        port = reserve_available_port(port_min, port_max)

        begin
            template = <<-EOT
        NAME = "#{name_rand}"
        TYPE = "OS"
        PUBLIC = "YES"
        PERSISTENT = "YES"
        DRIVER = "qcow2"
        SIZE = "#{size}"
        FORMAT = "qcow2"
        PATH = "onebex://#{ds_id}:#{port}"
        FROM_BACKUP_DS = "#{backup_ds}"
            EOT

            xml = OpenNebula::Image.build_xml
            image = OpenNebula::Image.new(xml, client)

            rc = image.allocate(template, ds_id)

            if OpenNebula.is_error?(rc)
                LOGGER.error "Error: #{rc.message}"
                release_port(port)
                return 500, Helper.fault_response(rc.message)
            end

            rc = image.info

            if OpenNebula.is_error?(rc)
                LOGGER.error "Error: #{rc.message}"
                release_port(port)
                return 500, Helper.fault_response(rc.message)
            end

            if image.state.to_i != 4
                LOGGER.error "Error creating image #{image.id}. State: #{image.state}"
                image.delete
                release_port(port)
                return 500, Helper.fault_response(
                    "Image #{image.id} was not created in ready state"
                )
            end
        rescue StandardError
            release_port(port)
            raise
        end

        return 200, persistentdisk_to_ovirtdisk(client, image)
    end

    # Struct Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#types/disk_attachment
    # rubocop:disable-next Metrics/ParameterLists
    def self.format_diskattachment(client, disk, disk_uuid, vm_id, type, disk_follow: nil)
        response = {
            :active => 'true',
          :interface => 'virtio_scsi',
          :read_only => disk['READONLY'] == 'YES' ? 'true' : 'false',
          :disk => {
              :id => disk_uuid,
            :href => "/ovirt-engine/api/disks/#{disk_uuid}"
          },
          :vm => {
              :id => Helper.int_to_uuid(vm_id.to_i).to_s,
            :href => "/ovirt-engine/api/vms/#{Helper.int_to_uuid(vm_id.to_i)}"
          },
          :href => "/ovirt-engine/api/vms/#{Helper.int_to_uuid(vm_id.to_i)}" \
            "/diskattachments/#{disk_uuid}",
          :id => disk_uuid
        }

        if disk_follow
            # LOGGER.info("Disk ID: #{disk_uuid}")
            # LOGGER.info("Image ID: #{image_id}")
            case type
            when 'PERSISTENT'
                response[:disk] = persistentdisk_to_ovirtdisk(
                    client,
                    get_onedisks(client, disk['IMAGE_ID'].to_i)
                )
            when 'NONPERSISTENT'
                response[:disk] = nonpersistentdisk_to_ovirtdisk(client, disk, disk_uuid, vm_id)
            when 'VOLATILE'
                response[:disk] = volatiledisk_to_ovirtdisk(client, disk, disk_uuid, vm_id)
            else
                LOGGER.error("Unknown disk type: #{type}")
                return 500, Helper.fault_response("Unknown disk type: #{type}")
            end
        end

        return response
    end

    # Return a list of disks (ONE images) attached to a VM.
    # Only disks related to a persistent image are returned.
    def self.get_vm_diskattachments(client, vm_id, follows: nil)
        client = Helper::Inventory.wrap(client)
        vm = VmController.get_one_vms(client, :vm_id => vm_id)
        vm_hash = Helper.resource_hash(client, vm)
        disks = vm_hash['VM']['TEMPLATE']['DISK']
        backup_volatiles = vm_hash['VM']['BACKUPS']['BACKUP_CONFIG']['BACKUP_VOLATILE']

        if disks.nil?
            return { :disk_attachment => [] }
        end

        # Check if there are any follow parameters
        disk_follow = nil

        if follows
            follows = follows.split(',')
            follows.each do |follow|
                follow_array = follow.split('.')
                if follow_array.first == 'disk'
                    disk_follow = follow
                end
            end
        end

        if disks.is_a?(Hash)
            disks = [disks]
        end

        attachments = []
        disks.each do |disk|
            if disk['PERSISTENT'] == 'YES'
                disk_uuid = generate_disk_uuid(0, 0, disk['IMAGE_ID'].to_i)
                attachments << format_diskattachment(client, disk, disk_uuid, vm_id, 'PERSISTENT',
                                                     :disk_follow => disk_follow)
            elsif disk.key?('IMAGE_ID') && disk['PERSISTENT'] != 'YES'
                disk_uuid = generate_disk_uuid(1, vm.id, disk['DISK_ID'].to_i)
                attachments << format_diskattachment(client, disk, disk_uuid,
                                                     vm.id, 'NONPERSISTENT',
                                                     :disk_follow => disk_follow)
            elsif backup_volatiles && backup_volatiles == 'YES' && !disk.key?('IMAGE_ID')
                disk_uuid = generate_disk_uuid(2, vm.id, disk['DISK_ID'].to_i)
                attachments << format_diskattachment(client, disk, disk_uuid,
                                                     vm.id, 'VOLATILE',
                                                     :disk_follow => disk_follow)
            end
        end

        return { :disk_attachment => attachments }
    end

    # Return a single disk attachment (ONE image) attached to a VM.
    def self.get_vm_diskattachment(client, vm_id, disk_uuid)
        client = Helper::Inventory.wrap(client)
        disk_info = decrypt_disk_uuid(disk_uuid)
        vm = VmController.get_one_vms(client, :vm_id => vm_id)

        disks = vm.to_hash['VM']['TEMPLATE']['DISK']
        if disks.is_a?(Hash)
            disks = [disks]
        end

        case disk_info[:type]
        when 0
            disk = disks.find {|d| d['IMAGE_ID'].to_i == disk_info[:disk_id].to_i }
            return format_diskattachment(client, disk, disk_uuid, vm_id, 'PERSISTENT',
                                         :disk_follow => nil)
        when 1
            disk = disks.find {|d| d['DISK_ID'].to_i == disk_info[:disk_id].to_i }
            return format_diskattachment(client, disk, disk_uuid, vm_id, 'NONPERSISTENT',
                                         :disk_follow => nil)
        when 2
            disk = disks.find {|d| d['DISK_ID'].to_i == disk_info[:disk_id].to_i }
            return format_diskattachment(client, disk, disk_uuid, vm_id, 'VOLATILE',
                                         :disk_follow => nil)
        else
            LOGGER.error("Unknown disk type: #{disk_info[:type]}")
            return 500, Helper.fault_response("Unknown disk type: #{disk_info[:type]}")
        end
    end

    # Attach a persistent image to a VM
    def self.create_vm_diskattachment(client, vm_id, image_id)
        LOGGER.info("Attaching image #{image_id} to VM #{vm_id}")
        vm = VmController.get_one_vms(client, :vm_id => vm_id)

        image = get_onedisks(client, image_id.to_i)
        unless image
            LOGGER.error "Requested image #{image_id} not found"
            return 404, Helper.fault_response('Requested image not found')
        end
        real_image_id = image.id.to_i

        diskless = vm.to_hash.dig('VM', 'TEMPLATE', 'DISK').nil?
        if diskless && [2, 9].include?(vm.to_hash['VM']['STATE'].to_i)
            error = prepare_diskless_vm_for_disk(client, vm, image)
            return error if error
        elsif vm.to_hash.dig('VM', 'USER_TEMPLATE', 'OVIRTAPI_FIRST_DISK_SETUP') == 'YES' &&
              diskless
            error = finish_first_disk_setup(vm)
            return error if error
        end

        # If the VM user template has DISK_DEV_PREFIXES, we need to
        # add the DEV_PREFIX to the disk_template
        disk_dev_prefixes_str = vm.to_hash['VM']['USER_TEMPLATE']['DISK_DEV_PREFIXES']
        if disk_dev_prefixes_str
            disk_dev_prefixes = disk_dev_prefixes_str.split(',')
            n_disks = vm.to_hash['VM']['TEMPLATE']['DISK']

            if n_disks.nil?
                n_disks = 0
            elsif n_disks.is_a?(Hash)
                n_disks = 1
            else
                n_disks = n_disks.size
            end

            dev_prefix = disk_dev_prefixes[n_disks % disk_dev_prefixes.size]
            disk_template = "
                DISK = [
                IMAGE_ID = \"#{real_image_id}\",
                DEV_PREFIX = \"#{dev_prefix}\"
            ]"
        else
            disk_template = "
                DISK = [
                IMAGE_ID = \"#{real_image_id}\"
            ]"
        end

        find_attached_disk = lambda do
            disks = vm.to_hash['VM']['TEMPLATE']['DISK']
            disks = [disks] if disks.is_a?(Hash)
            (disks || []).find do |d|
                d.key?('IMAGE_ID') && d['IMAGE_ID'].to_i == real_image_id.to_i
            end
        end

        disk = find_attached_disk.call
        n_retries = 360
        n_retries.times do |i|
            break if disk

            LOGGER.info("Attempting disk attach. Attempt #{i}/#{n_retries}")
            rc = vm.disk_attach(disk_template)

            # Another request may have attached the disk while this one was waiting.
            info_rc = vm.info
            if OpenNebula.is_error?(info_rc)
                return 500, Helper.fault_response(info_rc.message)
            end

            disk = find_attached_disk.call
            break if disk
            break unless OpenNebula.is_error?(rc)

            LOGGER.error(rc.message)
            return 500, Helper.fault_response(rc.message) if i == n_retries - 1

            sleep 5
        end

        unless disk
            return 500, Helper.fault_response('Attached disk not found on requested VM')
        end

        disk_uuid = generate_disk_uuid(0, 0, real_image_id)
        return 201, format_diskattachment(client, disk, disk_uuid, vm_id, 'PERSISTENT')
    end

    def self.prepare_diskless_vm_for_disk(client, vm, image)
        vm_hash = vm.to_hash['VM']
        requirements = vm_hash.dig('USER_TEMPLATE', 'SCHED_REQUIREMENTS').to_s
        requirements = vm_hash.dig('TEMPLATE', 'SCHED_REQUIREMENTS').to_s if requirements.empty?
        cluster_id = requirements[/CLUSTER_ID\s*=\s*"?(\d+)/, 1]&.to_i
        return 500, Helper.fault_response('VM has no requested cluster') unless cluster_id

        image_ds_id = image.to_hash.dig('IMAGE', 'DATASTORE_ID').to_i
        datastores = StorageController.get_one_datastores(client)
        return 500, Helper.fault_response('Unable to retrieve datastores') unless datastores

        image_ds = datastores.find {|ds| ds.id.to_i == image_ds_id }
        return 500, Helper.fault_response('Image datastore not found') unless image_ds

        image_data = image_ds.to_hash['DATASTORE']
        image_clusters = Array(image_data.dig('CLUSTERS', 'ID')).map(&:to_i)
        if !image_clusters.empty? && !image_clusters.include?(cluster_id)
            return 409, Helper.fault_response('Image datastore is not available in the VM cluster')
        end

        tm_mad = image_data['TM_MAD']
        return 500, Helper.fault_response('Image datastore has no TM_MAD') if tm_mad.to_s.empty?

        compatible_system_ds = datastores.any? do |ds|
            data = ds.to_hash['DATASTORE']
            next unless data['TYPE'].to_i == 1 && data['STATE'].to_s == '0'
            next unless data['TM_MAD'] == tm_mad

            clusters = Array(data.dig('CLUSTERS', 'ID')).map(&:to_i)
            clusters.empty? || clusters.include?(cluster_id)
        end
        unless compatible_system_ds
            return 409, Helper.fault_response('No compatible system datastore in the VM cluster')
        end

        ds_requirements = "TM_MAD = \\\"#{tm_mad}\\\""
        update = "SCHED_DS_REQUIREMENTS = \"#{ds_requirements}\"\n" \
                 'OVIRTAPI_FIRST_DISK_SETUP = "YES"'
        rc = vm.update(update, true)
        return 500, Helper.fault_response(rc.message) if OpenNebula.is_error?(rc)

        rc = vm.info
        return 500, Helper.fault_response(rc.message) if OpenNebula.is_error?(rc)

        actual_requirement = vm.to_hash.dig('VM', 'USER_TEMPLATE', 'SCHED_DS_REQUIREMENTS')
        expected_requirement = "TM_MAD = \"#{tm_mad}\""
        if actual_requirement != expected_requirement
            return 500, Helper.fault_response('Unable to replace VM datastore requirement')
        end

        finish_first_disk_setup(vm)
    end

    def self.finish_first_disk_setup(vm)
        state = vm.to_hash['VM']['STATE'].to_i
        return nil if state == 8

        if [2, 9].include?(state)
            rc = state == 2 ? vm.release : vm.resume
            return 500, Helper.fault_response(rc.message) if OpenNebula.is_error?(rc)
        end

        deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 210
        poweroff_requested = false
        loop do
            rc = vm.info
            return 500, Helper.fault_response(rc.message) if OpenNebula.is_error?(rc)

            data = vm.to_hash['VM']
            return nil if data['STATE'].to_i == 8
            if [6, 11].include?(data['STATE'].to_i)
                return 500, Helper.fault_response("VM entered state #{data['STATE']} during disk setup")
            end
            if data['STATE'].to_i == 3 && data['LCM_STATE'].to_i == 3 && !poweroff_requested
                rc = vm.poweroff(true)
                return 500, Helper.fault_response(rc.message) if OpenNebula.is_error?(rc)

                poweroff_requested = true
                next
            end
            return 500, Helper.fault_response('Timed out waiting for VM during disk setup') if
                Process.clock_gettime(Process::CLOCK_MONOTONIC) >= deadline

            sleep 3
        end
    end

    # Detach a disk from a VM (disk attachment removal)
    def self.delete_vm_diskattachment(client, vm_id, disk_uuid)
        disk_info = decrypt_disk_uuid(disk_uuid)
        vm = VmController.get_one_vms(client, :vm_id => vm_id)

        disks = vm.to_hash['VM']['TEMPLATE']['DISK']
        if disks.nil?
            return 404, Helper.fault_response('Disk attachment not found for' \
                " VM #{vm_id} and uuid #{disk_uuid}")
        end

        disks = [disks] if disks.is_a?(Hash)

        case disk_info[:type]
        when 0
            disk = disks.find {|d| d['IMAGE_ID'].to_i == disk_info[:disk_id].to_i }
        else
            disk = disks.find {|d| d['DISK_ID'].to_i == disk_info[:disk_id].to_i }
        end

        if disk.nil?
            LOGGER.error("Disk attachment not found for VM #{vm_id} and uuid #{disk_uuid}")
            return 404, Helper.fault_response('Disk attachment not found for' \
                " VM #{vm_id} and uuid #{disk_uuid}")
        end

        disk_id_for_detach = (disk['DISK_ID'] || disk_info[:disk_id]).to_i

        (1..120).each do |_attempt|
            rc = vm.disk_detach(disk_id_for_detach)
            if !OpenNebula.is_error?(rc)
                LOGGER.info('NIC attached successfully.')
                return 200
            end
            sleep 3
        end

        return 500, Helper.fault_response('Failed to detach disk')
    end

    def self.delete_disk(client, disk_uuid)
        disk_data = decrypt_disk_uuid(disk_uuid)
        # non-persistent and volatile disks do not need to be deleted
        return completed_delete_action if [1, 2].include?(disk_data[:type])

        image = get_onedisks(client, disk_data[:disk_id])
        # If image retrieval fails, return OK => disk will not be deleted
        return completed_delete_action if image.nil?

        port = pending_onebex_port(image)
        writer_closed = false

        if port
            deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 5
            writer_closed = finish_pending_writer(port)
            info_error = wait_for_image_unlock(image, deadline)
            if OpenNebula.is_error?(info_error)
                if info_error.errno == OpenNebula::Error::ENO_EXISTS
                    release_port(port) if writer_closed
                    return completed_delete_action
                end

                return 500, Helper.fault_response(info_error.message)
            end
        end

        force = port && image.state.to_i == 4
        LOGGER.warn("Force deleting locked OneBEX image #{image.id}") if force
        rc = force ? image.delete(true) : image.delete

        if OpenNebula.is_error?(rc)
            LOGGER.error("Error: #{rc.message}")
            return 500, Helper.fault_response(rc.message)
        end

        release_port(port) if writer_closed
        completed_delete_action
    end

    def self.pending_onebex_port(image)
        image_data = image.to_hash['IMAGE']
        return unless image_data['STATE'].to_i == 4

        template = image_data['TEMPLATE']
        return unless template.is_a?(Hash) && template.key?('FROM_BACKUP_DS')

        match = %r{\Aonebex://(\d+):(\d+)\z}.match(image_data['PATH'].to_s)
        return unless match && match[1].to_i == image_data['DATASTORE_ID'].to_i

        port = match[2].to_i
        return unless (Integer(PORT_MIN)..Integer(PORT_MAX)).cover?(port)

        port
    end

    def self.finish_pending_writer(port)
        Socket.tcp(ONE_XMLRPC, port, :connect_timeout => 1) do |connection|
            connection.write([0x01].pack('C'))
            connection.close_write

            return false unless IO.select([connection], nil, nil, 1)

            return connection.read(1).nil?
        end
    rescue SystemCallError, IOError, SocketError => e
        LOGGER.warn("Could not close pending OneBEX writer on port #{port}: #{e.message}")
        false
    end

    def self.wait_for_image_unlock(image, deadline)
        loop do
            rc = image.info
            return rc if OpenNebula.is_error?(rc) || image.state.to_i != 4

            remaining = deadline - Process.clock_gettime(Process::CLOCK_MONOTONIC)
            return if remaining <= 0

            sleep [remaining, 0.25].min
        end
    end

    def self.completed_delete_action
        job = JobsController.add_job('finished')
        return 200, {
            'job' => {
                'href' => job['href'],
                'id' => job['id']
            },
            'status' => 'complete'
        }
    end

    def self.with_ports_lock
        FileUtils.mkdir_p(File.dirname(PORTS_FILE))

        File.open(PORTS_LOCK, File::RDWR | File::CREAT, 0o644) do |lock|
            lock.flock(File::LOCK_EX)
            yield
        ensure
            lock.flock(File::LOCK_UN)
        end
    end

    def self.read_ports
        return [] unless File.exist?(PORTS_FILE)

        JSON.parse(File.read(PORTS_FILE)).map(&:to_i)
    rescue JSON::ParserError
        []
    end

    def self.write_ports(ports)
        tmp = "#{PORTS_FILE}.tmp.#{$$}" # rubocop:disable Style/SpecialGlobalVars
        File.write(tmp, JSON.pretty_generate(ports.uniq.sort))
        File.rename(tmp, PORTS_FILE)
    end

    def self.reserve_available_port(port_min, port_max)
        (port_min..port_max).to_a.shuffle.each do |port|
            return port if reserve_port(port)
        end

        raise 'No free interactive restore ports available'
    end

end
