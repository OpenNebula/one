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
require 'opennebula'
require 'open3'
require 'securerandom'
require 'socket'
require 'pstore'
require 'net/http'
require 'uri'

require_relative 'backup_controller'
require_relative 'disk_controller'
require_relative 'helper_functions'

# Controller for managing image transfers
class ImageTransferController

    TRANSFER_RETENTION = 60 * 60
    SLOW_FINALIZE_WARNING = 5 * 60

    @db = nil

    def self.start
        db_path = File.join(TMP_IMAGES_PATH, 'active_transfers.pstore')
        @db = PStore.new(db_path, true)
        LOGGER.info "ImageTransfers db initialized at #{db_path}"
    end

    def self.active_transfers
        @db.transaction(true) do
            @db.fetch(:transfers, [])
        end
    end

    def self.create_transfer_download(client, image_id, disk, transfer_format)
        # veeam_ds = BackupController.find_backup_ds(client)
        # return 401, 'Unauthenticated' if veeam_ds == 401

        disk_id = nil
        vm_id = nil
        backup = nil

        if [1, 2].include?(disk[:type])
            # Non-persistent disk: UUID already contains the VM DISK_ID.
            vm_id = disk[:vm_id]
            disk_id = disk[:disk_id].to_i
        elsif disk[:type] == 0
            decoded = BackupController.decrypt_backup_uuid(client, image_id) rescue nil
            unless decoded
                LOGGER.error "Invalid backup UUID: #{image_id}"
                return 400, 'Invalid backup UUID'
            end

            backup_id = decoded[:id].to_s

            if !backup_id.empty?
                backup = BackupController.get_backup(client, backup_id)
                if backup.nil? || backup == 401 || backup == 404
                    LOGGER.warn "Unable to load backup #{backup_id} for #{image_id}, " \
                                'falling back to VM mapping metadata'
                    backup = nil
                end
            end

            if backup
                backup_hash = backup.to_hash['IMAGE']

                if backup_hash['VMS'].is_a?(Array)
                    LOGGER.error 'Backup is assigned to more than one VM'
                    return 500, Helper.fault_response('Backup is assigned to more than one VM')
                end

                vm_id = backup_hash.dig('VMS', 'ID').to_i
            else
                vm_id = decoded[:vm_id].to_i
            end

            if vm_id <= 0
                LOGGER.error "Invalid VM ID in backup UUID #{image_id}: #{decoded.inspect}"
                return 500, Helper.fault_response('Unable to determine VM ID from backup UUID')
            end

            # Persistent disk: UUID contains IMAGE_ID, so map IMAGE_ID -> VM DISK_ID.
            pimage_id = disk[:disk_id].to_i

            if backup && !backup_includes_disk?(backup, disk)
                LOGGER.error "Backup #{backup_id} does not include persistent disk #{pimage_id}"
                return 404, Helper.fault_response(
                    "Backup metadata not found for disk #{pimage_id}"
                )
            end

            vm = VmController.get_one_vms(client, :vm_id => vm_id)

            vm_hash = vm.to_hash
            vm_disks = vm_hash.dig('VM', 'TEMPLATE', 'DISK')
            vm_disks = [vm_disks] if vm_disks.is_a?(Hash)
            vm_disks ||= []

            vm_disk = vm_disks.find do |d|
                d['PERSISTENT'] == 'YES' &&
                    d['IMAGE_ID'].to_i == pimage_id
            end

            disk_id = vm_disk['DISK_ID'].to_i if vm_disk
        end

        return 500, Helper.fault_response('Unable to determine VM ID') if vm_id.nil?
        return 500, Helper.fault_response('Unable to determine VM disk ID') if disk_id.nil?

        vm ||= VmController.get_one_vms(client, :vm_id => vm_id)

        if (fault = BackupController.raw_disk_backup_fault(vm))
            LOGGER.error "Download transfer rejected for VM #{vm_id}: #{fault[:fault][:detail]}"
            return 409, fault
        end

        clean_expired_transfers
        vm_hash = vm.to_hash

        hist = vm_hash['VM']['HISTORY_RECORDS']['HISTORY']
        host = hist.is_a?(Array) ? hist.last['HOSTNAME'] : hist['HOSTNAME']

        if host.nil?
            LOGGER.error "Unable to find host for VM #{vm_id}"
            return 500, Helper.fault_response("Unable to find host for VM #{vm_id}")
        end

        if ONEBEX_PORT == ''
            LOGGER.error 'OneBEX Port not defined. Please configure it in config/environment.rb.'
            return 500, Helper.fault_response('OneBEX Port not defined.')
        end

        onebex_url = "http://#{host}:#{ONEBEX_PORT}"
        onebex_url_ssl = ONEBEX_PORT_SSL ? "https://#{host}:#{ONEBEX_PORT_SSL}" : nil
        transfer_endpoint = onebex_url_ssl || onebex_url

        export_id = get_onebex_export(URI(onebex_url), vm_id, disk_id)

        if export_id.nil?
            LOGGER.error "Unable to find export for VM #{vm_id} and disk #{disk_id}"
            return 500, Helper.fault_response(
                "Unable to find export for VM #{vm_id} and disk #{disk_id}"
            )
        end

        LOGGER.info "Found export #{export_id} for VM #{vm_id} and disk #{disk_id}"

        if PUBLIC_IP == ''
            LOGGER.error 'Public IP not defined. Please configure it in config/environment.rb.'
            return 500, Helper.fault_response('Bind IP not defined.')
        end

        proxy_url = "#{transfer_endpoint}/images/#{export_id}"

        file_size = get_onebex_size(URI(onebex_url), export_id)

        add_to_active_transfers(export_id, 'download', proxy_url, transfer_format,
                                file_size, :image_id => image_id,
                                :onebex_url => transfer_endpoint, :vm_id => vm_id)

        imagetransfer_data = {
            :active => 'false',
  :direction => 'download',
  :format => transfer_format.to_s,
  :inactivity_timeout => '3600',
  :phase => 'transferring',
  :proxy_url => proxy_url.to_s,
  :shallow => 'false',
  :timeout_policy => 'legacy',
  :transfer_url => proxy_url.to_s,
  :transferred => '0',
  :host => {
      :id => '-'
  },
  :image => {
      :id => image_id.to_s
  },
  :actions => {
      :link => [
          {
              :href => "/ovirt-engine/api/imagetransfers/#{export_id}/cancel",
              :rel => 'cancel'
          },
          {
              :href => "/ovirt-engine/api/imagetransfers/#{export_id}/finalize",
              :rel => 'finalize'
          }
      ]
  },
  :href => "/ovirt-engine/api/imagetransfers/#{export_id}",
  :id => export_id.to_s
        }
        # Uncomment for debugging
        # puts "Active imagetransfers: #{active_transfers}"
        return 201, imagetransfer_data
    end

    def self.create_transfer_upload(client, image_id, transfer_format)
        clean_expired_transfers
        transfer_uuid = SecureRandom.uuid
        LOGGER.info "Creating transfer #{transfer_uuid} for image #{image_id}"

        disk = OpenNebula::Image.new(OpenNebula::Image.build_xml(image_id.to_i), client)

        # Retrieve the image information
        rc = disk.info

        # Check if the image information was successfully retrieved
        if OpenNebula.is_error?(rc)
            LOGGER.info "Failed to retrieve disk info. Image ID: #{image_id.to_i}"
            return 401, 'Unauthorized' # Most usual case is unauthorized as token expired
        end

        disk_hash = disk.to_hash

        image_path = disk_hash['IMAGE']['PATH']
        port = image_path.split(':')[2].to_i

        if PUBLIC_IP == ''
            LOGGER.error 'Public IP not defined. Please configure it in config/environment.rb.'
            return 500, Helper.fault_response('Bind IP not defined.')
        end

        proxy_url = "https://#{PUBLIC_IP}/images/#{transfer_uuid}"

        file_size = disk_hash['IMAGE']['SIZE'].to_i

        # New transfer is saved in memory. uuid is random and 128bit, we assume it will never
        # collide (with 100 concurrent imagetransfers per day, it would take 26 quadrillion years)
        add_to_active_transfers(transfer_uuid, 'upload', proxy_url, transfer_format,
                                file_size, :image_id => image_id.to_i, :port => port)

        imagetransfer_data = {
            :active => 'false',
          :direction => 'upload',
          :format => transfer_format.to_s,
          :inactivity_timeout => '3600',
          :phase => 'transferring',
          :proxy_url => proxy_url.to_s,
          :shallow => 'false',
          :timeout_policy => 'legacy',
          :transfer_url => proxy_url.to_s,
          :transferred => '0',
          :host => {
              :id => '-'
          },
          :image => {
              :id => image_id.to_s
          },
          :actions => {
              :link => [
                  {
                      :href => "/ovirt-engine/api/imagetransfers/#{transfer_uuid}/cancel",
                      :rel => 'cancel'
                  },
                  {
                      :href => "/ovirt-engine/api/imagetransfers/#{transfer_uuid}/finalize",
                      :rel => 'finalize'
                  }
              ]
          },
          :href => "/ovirt-engine/api/imagetransfers/#{transfer_uuid}",
          :id => transfer_uuid.to_s
        }

        # LOGGER.info "Active imagetransfers: #{active_transfers}"
        return 201, imagetransfer_data
    end

    # Finalize a transfer
    def self.finalize_transfer(client, transfer_uuid, cancel: false)
        # If the transfer was already finalized, return success
        existing_transfer = active_transfers.find {|t| t[:uuid] == transfer_uuid }
        if existing_transfer.nil?
            LOGGER.info "Transfer #{transfer_uuid} already finalized."
            return 200, { :status => 'complete' }
        end

        if existing_transfer[:phase].to_s.start_with?('finished_')
            if existing_transfer[:direction] == 'upload'
                DiskController.release_port(existing_transfer[:port])
            end
            LOGGER.info "Transfer #{transfer_uuid} already finalized."
            return 200, { :status => 'complete' }
        end

        # Find the transfer in active transfers
        transfer = active_transfers.find {|t| t[:uuid] == transfer_uuid }
        update_transfer_timestamp(transfer_uuid)
        clean_expired_transfers

        if transfer.nil?
            return 404, { :error => 'Transfer not found' }
        end

        port = transfer[:port]

        # Finalize backup operation
        if transfer[:direction] == 'download'
            return finalize_onebex_transfer(client, transfer_uuid, :cancel => cancel)
        end

        # Finalize restore operation
        if !cancel && !send_finalize_marker(transfer)
            LOGGER.error "Finalize marker was not processed for transfer #{transfer_uuid}"

            return 500, Helper.fault_response(
                'Interactive restore writer did not process the finalize marker'
            )
        end

        unless send_finish_message(transfer)
            LOGGER.error "Finish message was not processed for transfer #{transfer_uuid}"

            return 500, Helper.fault_response(
                'Interactive restore writer did not process the finish message'
            )
        end

        # FINISH closes the OneBEX writer socket. Conversion may continue for a
        # long time, but it no longer needs the reserved listening port.
        begin
            DiskController.release_port(port)
        rescue StandardError => e
            LOGGER.warn "Could not release writer port #{port}: #{e.message}"
        end

        image_id = transfer[:image_id].to_i

        # If the transfer was cancelled, delete the image
        if cancel == true
            disk = OpenNebula::Image.new(OpenNebula::Image.build_xml(image_id), client)

            rc = disk.info
            if OpenNebula.is_error?(rc)
                LOGGER.error "Failed to retrieve disk info. Image ID: #{image_id}"
                return 500, Helper.fault_response(
                    "Failed to retrieve disk info. Image ID: #{image_id}"
                )
            end

            rc = disk.delete

            phase = nil

            if OpenNebula.is_error?(rc)
                phase = 'finished_failure'
                LOGGER.error "Failed to delete image #{image_id}: #{rc.message}"
            else
                phase = 'finished_cleanup'
                LOGGER.info "Deleted image #{image_id} after cancelling " \
                            "transfer #{transfer_uuid}."
            end

            @db.transaction do
                transfers = @db.fetch(:transfers, [])
                t_to_update = transfers.find {|t| t[:uuid] == transfer_uuid }

                if t_to_update
                    t_to_update[:phase] = phase
                    t_to_update[:updated_at] = Time.now.to_i
                    t_to_update[:sync_error] = nil
                    t_to_update[:proxy_url] = nil

                    @db[:transfers] = transfers
                end
            end

            LOGGER.info("Successfully cancelled transfer #{transfer_uuid}.")

            return 200, { :status => 'complete' }
        end

        # Finalize the transfer
        @db.transaction do
            transfers = @db.fetch(:transfers, [])
            t_to_update = transfers.find {|t| t[:uuid] == transfer_uuid }

            if t_to_update
                t_to_update[:phase] = 'finalizing_success'
                t_to_update[:updated_at] = Time.now.to_i
                t_to_update[:sync_error] = nil

                @db[:transfers] = transfers
            end
        end

        Thread.new { monitor_upload_finalize(client, transfer_uuid, image_id) }

        LOGGER.info("Transfer #{transfer_uuid} is finalizing asynchronously.")

        return 200, { :status => 'complete' }
    end

    def self.monitor_upload_finalize(client, transfer_uuid, image_id)
        sleep 5
        next_warning = Process.clock_gettime(Process::CLOCK_MONOTONIC) + SLOW_FINALIZE_WARNING

        loop do
            begin
                transfer = active_transfers.find {|t| t[:uuid] == transfer_uuid }
                break unless transfer && transfer[:phase] == 'finalizing_success'

                disk = OpenNebula::Image.new(OpenNebula::Image.build_xml(image_id), client)
                rc = disk.info

                if OpenNebula.is_error?(rc)
                    if rc.errno == OpenNebula::Error::ENO_EXISTS
                        if store_upload_result(transfer_uuid, 'finished_failure', rc.message)
                            LOGGER.error "Image #{image_id} no longer exists. " \
                                         "Transfer #{transfer_uuid} failed."
                        end
                        break
                    end

                    LOGGER.warn "Could not retrieve image #{image_id} during finalize: #{rc.message}"
                else
                    phase = case disk.state.to_i
                            when 1 then 'finished_success'
                            when 5 then 'finished_failure'
                            end

                    if phase
                        if store_upload_result(transfer_uuid, phase)
                            if phase == 'finished_success'
                                LOGGER.info "Image #{image_id} is READY. " \
                                            "Transfer #{transfer_uuid} finished successfully."
                            else
                                LOGGER.error "Image #{image_id} entered ERROR state. " \
                                             "Transfer #{transfer_uuid} failed."
                            end
                        end
                        break
                    end
                end
            rescue StandardError => e
                LOGGER.warn "Could not check image #{image_id} during finalize: #{e.message}"
            end

            now = Process.clock_gettime(Process::CLOCK_MONOTONIC)
            if now >= next_warning
                LOGGER.warn "Image #{image_id} is still finalizing for transfer #{transfer_uuid}."
                next_warning = now + SLOW_FINALIZE_WARNING
            end
            sleep 1
        end
    end

    def self.store_upload_result(transfer_uuid, phase, error = nil)
        stored = false
        @db.transaction do
            transfers = @db.fetch(:transfers, [])
            transfer = transfers.find {|t| t[:uuid] == transfer_uuid }
            if transfer && transfer[:phase] == 'finalizing_success'
                transfer[:phase] = phase
                transfer[:updated_at] = Time.now.to_i
                transfer[:sync_error] = error
                transfer[:proxy_url] = nil
                @db[:transfers] = transfers
                stored = true
            end
        end
        stored
    end

    def self.finalize_backup(client, vm_id)
        vm = VmController.get_one_vms(client, :vm_id => vm_id)

        vm_hash = vm.to_hash

        hist = vm_hash['VM']['HISTORY_RECORDS']['HISTORY']
        host = hist.is_a?(Array) ? hist.last['HOSTNAME'] : hist['HOSTNAME']

        if host.nil?
            LOGGER.error "Unable to find host for VM #{vm_id}"
            return 500, Helper.fault_response("Unable to find host for VM #{vm_id}")
        end

        if ONEBEX_PORT == ''
            LOGGER.error 'OneBEX Port not defined. Please configure it in config/environment.rb.'
            return 500, Helper.fault_response('OneBEX Port not defined.')
        end

        onebex_uri = URI("http://#{host}:#{ONEBEX_PORT}")

        res = finish_onebex_vm(onebex_uri, vm_id)

        unless res
            return 500, Helper.fault_response(
                "Failed to finish OneBEX transfers for VM #{vm_id}"
            )
        end

        case res.code.to_i
        when 200
            LOGGER.info "Successfully finished OneBEX transfers for VM #{vm_id}"

        when 409
            LOGGER.info "Ongoing backup detected for VM #{vm_id}, cancelling backup"

            cancel_rc = vm.backup_cancel

            if OpenNebula.is_error?(cancel_rc)
                LOGGER.error "Failed to cancel backup for VM #{vm_id}: #{cancel_rc.message}"
                return 500, Helper.fault_response(
                    "Failed to cancel backup for VM #{vm_id}: #{cancel_rc.message}"
                )
            end

            LOGGER.info "Successfully cancelled backup for VM #{vm_id}"

        else
            LOGGER.error "Failed to finish OneBEX transfers for VM #{vm_id}: " \
                        "HTTP #{res.code} #{res.body}"

            return 500, Helper.fault_response(
                "Failed to finish OneBEX transfers for VM #{vm_id}"
            )
        end

        return 200, { :status => 'complete' }
    end

    def self.get_transfer(transfer_uuid)
        update_transfer_timestamp(transfer_uuid)
        clean_expired_transfers
        transfer = active_transfers.find {|t| t[:uuid] == transfer_uuid }

        if transfer.nil?
            return 404, { :error => 'Transfer not found' }
        end

        LOGGER.info "Retrieving transfer #{transfer_uuid}, current phase: #{transfer[:phase]}"

        imagetransfer_data = {
            :active => 'false',
          :direction => transfer[:direction],
          :format => transfer[:format].to_s,
          :inactivity_timeout => '3600',
          :phase => transfer[:phase],
          :proxy_url => transfer[:proxy_url],
          :shallow => 'false',
          :timeout_policy => 'legacy',
          :transfer_url => transfer[:proxy_url],
          :transferred => '0',
          :host => {
              :id => '-'
          },
          :image => {
              :id => '-'
          },
          :actions => {
              :link => [
                  {
                      :href => "/ovirt-engine/api/imagetransfers/#{transfer_uuid}/cancel",
                      :rel => 'cancel'
                  },
                  {
                      :href => "/ovirt-engine/api/imagetransfers/#{transfer_uuid}/finalize",
                      :rel => 'finalize'
                  }
              ]
          },
          :href => "/ovirt-engine/api/imagetransfers/#{transfer_uuid}",
          :id => transfer[:uuid].to_s
        }

        # Return success
        return 200, imagetransfer_data
    end

    # rubocop:disable-next Metrics/ParameterLists
    def self.add_to_active_transfers(transfer_uuid, direction, proxy_url, transfer_format,
                                     file_size, image_id: nil, onebex_url: nil,
                                     port: nil, vm_id: nil)
        new_transfer = {
            :uuid => transfer_uuid.to_s,
            :direction => direction.to_s,
            :proxy_url => proxy_url.to_s,
            :format => transfer_format.to_s, # "raw" or "cow"
            :file_size => file_size.to_i,
            :phase => 'transferring',
            :created_at => Time.now, # Add timestamp for debugging
            :updated_at => Time.now.to_i, # Adds last update timestamp to detect old transfers
            :image_id => image_id.to_s,
            :onebex_url => onebex_url,
            :port => port,
            :vm_id => vm_id # only for backup transfers
        }

        @db.transaction do
            transfers = @db.fetch(:transfers, [])
            transfers << new_transfer
            @db[:transfers] = transfers
        end

        LOGGER.info "Added transfer #{transfer_uuid} to active transfers"
    end

    def self.update_transfer_timestamp(uuid)
        updated_transfer = nil
        @db.transaction do
            transfers = @db.fetch(:transfers, [])
            transfer = transfers.find {|t| t[:uuid].to_s == uuid.to_s }

            if transfer && transfer[:phase] == 'transferring'
                transfer[:updated_at] = Time.now.to_i
                @db[:transfers] = transfers
            elsif transfer.nil?
                LOGGER.warn "Warning: Transfer with UUID #{uuid} not found."
            end
            updated_transfer = transfer
        end
        updated_transfer
    end

    # Read a specific byte range
    def self.write_disk_range(transfer_id, start_byte, end_byte, body, total_size = 0)
        begin
            # Find the transfer in active transfers
            transfer = active_transfers.find {|t| t[:uuid].to_s == transfer_id.to_s }

            if transfer.nil?
                LOGGER.warn "Transfer #{transfer_id} not found in active transfers"
                return 404, { :error => 'Transfer not found' }
            end

            # Calculate the size of data to write
            bytes_to_write = end_byte - start_byte + 1

            if bytes_to_write.negative?
                return 400, { :error => 'Content-Length mismatch' }.to_json
            end

            # Check if write is misaligned (N*512 sector size)
            if start_byte % 512 != 0 || bytes_to_write % 512 != 0
                LOGGER.error "Unaligned write: offset=#{start_byte}, size=#{bytes_to_write}"
                return 400, { :error => 'Writes must be 512-byte aligned' }.to_json
            end

            # Get total file size for Content-Range header
            file_size_mib = transfer[:file_size]

            if file_size_mib.nil? || file_size_mib <= 0
                LOGGER.error "Invalid or missing file_size (#{file_size_mib}) in transfer" \
                             " data for #{transfer_id}."

                return 500, Helper.fault_response(
                    'Could not determine device size from transfer'
                )
            end

            file_size = file_size_mib * 1024 * 1024

            # Validate range
            if start_byte >= file_size
                LOGGER.error "Start byte #{start_byte} bigger or equal than file" \
                             " size #{file_size}."

                return 416, { :error => 'Range Not Satisfiable' }.to_json
            end

            if end_byte >= file_size
                LOGGER.error "End byte #{end_byte} bigger or equal than file size #{file_size}."

                return 416, { :error => 'Range Not Satisfiable' }.to_json
            end

            port = transfer[:port]

            sent = send_writer_message(port, 0x00) do |connection|
                header = [
                    start_byte,
                    bytes_to_write,
                    total_size
                ].pack('Q>Q>Q>')

                header_written = connection.write(header)

                if header_written != header.bytesize
                    LOGGER.error 'Partial interactive restore header write: ' \
                                 "#{header_written}/#{header.bytesize} bytes written"

                    return 500, Helper.fault_response(
                        'Partial interactive restore header write'
                    )
                end

                # Preserve the wire framing while bounding memory usage.
                # A body length error may be detected after a partial backend write.
                remaining = bytes_to_write
                buffer = ''

                while remaining.positive?
                    chunk = body.read([1024 * 1024, remaining].min, buffer)

                    if chunk.nil? || chunk.empty?
                        return 400, {
                            :error => 'Content-Length mismatch'
                        }.to_json
                    end

                    bytes_written = connection.write(chunk)

                    if bytes_written != chunk.bytesize
                        LOGGER.error 'Partial interactive restore write: ' \
                                     "#{bytes_written}/#{chunk.bytesize} bytes written"

                        return 500, Helper.fault_response(
                            'Partial interactive restore write occurred'
                        )
                    end

                    remaining -= chunk.bytesize
                end

                extra = body.read(1)

                unless extra.nil? || extra.empty?
                    return 400, { :error => 'Content-Length mismatch' }.to_json
                end
            end

            unless sent
                return 500, Helper.fault_response(
                    'Could not send data to interactive restore writer'
                )
            end

            return 200, {}.to_json
        rescue Errno::ENOENT
            LOGGER.error 'Device file not found.'
            return 404, { :error => 'Device file not found' }.to_json
        rescue Errno::EACCES
            LOGGER.error 'Permission denied accessing device file.'
            return 403, { :error => 'Permission denied accessing device file' }.to_json
        rescue StandardError => e
            LOGGER.error("Error: #{e.message}")
            LOGGER.error("Backtrace: #{e.backtrace.join("\n")}")
            return 500, { :error => 'Internal server error.' }.to_json
        end
    end

    def self.clean_expired_transfers
        now = Time.now.to_i
        expired_uuids = []
        removed_uuids = []
        @db.transaction do
            transfers = @db.fetch(:transfers, [])
            transfers.reject! do |transfer|
                age = now - transfer[:updated_at].to_i
                if transfer[:phase].to_s.start_with?('finished_')
                    if age >= TRANSFER_RETENTION
                        removed_uuids << transfer[:uuid]
                        next true
                    end
                elsif transfer[:phase] != 'finalizing_success' && age >= TRANSFER_RETENTION
                    transfer[:phase] = 'finished_failure'
                    transfer[:updated_at] = now
                    transfer[:proxy_url] = nil
                    expired_uuids << transfer[:uuid]
                end
                false
            end
            @db[:transfers] = transfers unless expired_uuids.empty? && removed_uuids.empty?
        end

        expired_uuids.each {|uuid| LOGGER.info "Expired ImageTransfer #{uuid} marked failed." }
        removed_uuids.each {|uuid| LOGGER.info "Removed finished ImageTransfer #{uuid}." }
    end

    def self.backup_includes_disk?(backup, disk)
        backup_hash = backup.to_hash['IMAGE']
        veeam_disks_attr = backup_hash.dig('TEMPLATE', 'VEEAM_DISKS')
        return true if veeam_disks_attr.nil? || veeam_disks_attr.to_s.empty?

        disk_uuids = JSON.parse(veeam_disks_attr)
        disk_uuid = DiskController.generate_disk_uuid(disk[:type], disk[:vm_id], disk[:disk_id])

        disk_uuids.include?(disk_uuid)
    rescue JSON::ParserError => e
        LOGGER.warn "Invalid VEEAM_DISKS metadata on backup #{backup.id}: #{e.message}"
        true
    rescue StandardError => e
        LOGGER.warn "Unable to validate backup disk metadata for backup #{backup.id}: #{e.message}"
        true
    end

    # Communicates the logical image size to the interactive restore even when the image
    # contains no data chunks and therefore no PUTs were received.
    def self.send_finalize_marker(transfer)
        file_size_mib = transfer[:file_size]

        if file_size_mib.nil? || file_size_mib <= 0
            LOGGER.warn "Cannot send finalize marker for transfer #{transfer[:uuid]}: " \
                        "invalid file_size=#{file_size_mib.inspect}"
            return false
        end

        total_size = file_size_mib * 1024 * 1024

        send_writer_message(
            transfer[:port],
            0x00,
            :timeout => FINALIZE_MARKER_TIMEOUT
        ) do |connection|
            header = [0, 0, total_size].pack('Q>Q>Q>')

            header_written = connection.write(header)

            if header_written != header.bytesize
                LOGGER.warn "Partial finalize marker for transfer #{transfer[:uuid]}: " \
                            "#{header_written}/#{header.bytesize} bytes written"

                return false
            end
        end
    rescue StandardError => e
        LOGGER.warn "Could not send finalize marker for transfer #{transfer[:uuid]}: " \
                    "#{e.message}"

        false
    end

    # Tell the OneBEX writer that no more data frames will arrive.
    def self.send_finish_message(transfer)
        send_writer_message(
            transfer[:port],
            0x01,
            :timeout => FINALIZE_MARKER_TIMEOUT
        )
    rescue StandardError => e
        LOGGER.warn "Could not finish transfer #{transfer[:uuid]}: #{e.message}"

        false
    end

    # Send a framed message to the OneBEX writer.
    #
    # Frame format:
    #   DATA:   <0x00><START><SIZE><TOTAL><PAYLOAD>
    #   FINISH: <0x01>
    #
    # When timeout is specified, wait for the writer to close the connection.
    def self.send_writer_message(port, frame_type, timeout: nil)
        TCPSocket.open(ONE_XMLRPC, port) do |connection|
            connection.binmode

            frame = [frame_type].pack('C')

            bytes_written = connection.write(frame)

            if bytes_written != frame.bytesize
                LOGGER.warn 'Partial OneBEX frame type write: ' \
                            "#{bytes_written}/#{frame.bytesize} bytes written"
                return false
            end

            yield connection if block_given?

            connection.flush
            connection.close_write

            if timeout
                unless IO.select([connection], nil, nil, timeout)
                    LOGGER.warn 'Timed out waiting for OneBEX writer'

                    return false
                end

                # The writer acknowledges processing by closing the connection.
                unless connection.read(1).nil?
                    LOGGER.warn 'Unexpected data received from OneBEX writer'

                    return false
                end
            end
        end

        true
    end

    # This method returns the OneBEX transfer ID for the given VM and disk
    def self.get_onebex_export(onebex_uri, vm_id, disk_id, timeout: 30)
        started_at = Time.now
        error = nil

        until Time.now - started_at > timeout
            begin
                status = onebex_status(onebex_uri, vm_id)
                transfers = status['TRANSFERS'] || []

                error = nil

                transfer = transfers.find do |t|
                    transfer_id = (t['TRANSFER_ID'] || t['transfer_id']).to_s
                    match = transfer_id.match(/^one-#{vm_id}-(\d+)-/)
                    match && match[1].to_i == disk_id.to_i
                end

                if transfer
                    return (transfer['TRANSFER_ID'] || transfer['transfer_id']).to_s
                end
            rescue StandardError => e
                error = e.message
            end

            sleep 1
        end

        LOGGER.warn 'Timeout waiting for OneBEX transfer for ' \
                    "VM #{vm_id}, disk #{disk_id}"

        LOGGER.warn "Last OneBEX status error: #{error}" unless error.nil?

        nil
    end

    def self.get_onebex_size(onebex_uri, export_id)
        path = "/transfers/#{export_id}/info"
        data = onebex_get(onebex_uri, path)

        unless data.code.to_i == 200
            LOGGER.error "Failed to get OneBEX transfer info for #{export_id}: " \
                         "HTTP #{data.code} #{data.body}"
            return
        end

        info = JSON.parse(data.body)
        size_mib = info['SIZE'].to_i

        return if size_mib <= 0

        size_mib * 1024 * 1024
    rescue StandardError => e
        LOGGER.error "Failed to get OneBEX transfer size for #{export_id}: #{e.message}"
        nil
    end

    def self.finalize_onebex_transfer(client, export_id, cancel: false)
        transfer = active_transfers.find {|t| t[:uuid] == export_id }
        update_transfer_timestamp(export_id)
        clean_expired_transfers

        if transfer.nil?
            return 404, { :error => 'Transfer not found' }
        end

        if cancel
            vm_id = transfer[:vm_id]
            vm = VmController.get_one_vms(client, :vm_id => vm_id)

            rc = vm.backup_cancel

            phase = if OpenNebula.is_error?(rc)
                        LOGGER.error "Failed to cancel backup for VM #{vm_id}: #{rc.message}"
                        'finished_failure'
                    else
                        LOGGER.info "Cancelled backup for VM #{vm_id}"
                        'finished_cleanup'
                    end

            @db.transaction do
                transfers = @db.fetch(:transfers, [])
                t_to_update = transfers.find {|t| t[:uuid] == export_id }

                if t_to_update
                    t_to_update[:phase] = phase
                    t_to_update[:updated_at] = Time.now.to_i
                    t_to_update[:proxy_url] = nil
                    t_to_update[:sync_error] = rc.message if OpenNebula.is_error?(rc)
                    @db[:transfers] = transfers
                end
            end

            if phase == 'finished_cleanup'
                return 200, { :status => 'complete' }
            end

            return 500, { :error => 'Failed to cancel backup' }
        end

        onebex_url = transfer[:onebex_url].to_s

        if onebex_url.empty?
            LOGGER.error "Missing OneBEX URL for transfer #{export_id}"
            return 500, { :error => 'Missing OneBEX URL' }
        end

        onebex_uri = URI(onebex_url)
        uri = onebex_uri + "/transfer/#{export_id}/finalize"

        success = transfer[:phase] != 'finished_failure'

        req = Net::HTTP::Post.new(uri)
        req['Content-Type'] = 'application/json'
        req.body = JSON.generate(
            :SUCCESS => success,
            :MESSAGE => 'Transfer finalized from oVirt server'
        )

        use_ssl = uri.scheme == 'https'

        res = Net::HTTP.start(
            uri.host,
            uri.port,
            :use_ssl => use_ssl,
            :verify_mode => OpenSSL::SSL::VERIFY_NONE,
            :open_timeout => 2,
            :read_timeout => 5
        ) do |http|
            http.request(req)
        end

        unless res.code.to_i == 200
            LOGGER.error "Failed to finalize OneBEX transfer #{export_id}: " \
                         "HTTP #{res.code} #{res.body}"

            @db.transaction do
                transfers = @db.fetch(:transfers, [])
                t_to_update = transfers.find {|t| t[:uuid] == export_id }

                if t_to_update
                    t_to_update[:phase] = 'finished_failure'
                    t_to_update[:updated_at] = Time.now.to_i
                    t_to_update[:sync_error] = res.body
                    @db[:transfers] = transfers
                end
            end

            return 500, { :error => 'Failed to finalize OneBEX transfer' }
        end

        phase = success ? 'finished_success' : 'finished_failure'

        @db.transaction do
            transfers = @db.fetch(:transfers, [])
            t_to_update = transfers.find {|t| t[:uuid] == export_id }

            if t_to_update
                t_to_update[:phase] = phase
                t_to_update[:updated_at] = Time.now.to_i
                t_to_update[:proxy_url] = nil
                @db[:transfers] = transfers
            end
        end

        LOGGER.info "Finalized OneBEX transfer #{export_id}: #{res.body}"

        return 200, { :status => 'complete' }
    rescue VmController::LookupError
        raise
    rescue StandardError => e
        LOGGER.error "Failed to finalize OneBEX transfer #{export_id}: #{e.message}"

        return 500, { :error => 'Failed to finalize OneBEX transfer' }
    end

    def self.finish_onebex_vm(onebex_uri, vm_id)
        uri = onebex_uri + "/vms/#{vm_id}/finish"

        req = Net::HTTP::Post.new(uri)
        req['Content-Type'] = 'application/json'
        req.body = JSON.generate({})

        use_ssl = uri.scheme == 'https'

        res = Net::HTTP.start(
            uri.host,
            uri.port,
            :use_ssl => use_ssl,
            :verify_mode => OpenSSL::SSL::VERIFY_NONE,
            :open_timeout => 2,
            :read_timeout => 5
        ) do |http|
            http.request(req)
        end

        return res
    rescue StandardError => e
        LOGGER.error "Failed to finish OneBEX VM #{vm_id}: #{e.message}"
        return
    end

    def self.onebex_status(onebex_uri, vm_id)
        JSON.parse(onebex_get(onebex_uri, "/status?VM_ID=#{vm_id}").body)
    end

    def self.onebex_get(onebex_uri, path, headers = {})
        uri = onebex_uri + path

        use_ssl = uri.scheme == 'https'

        Net::HTTP.start(uri.host, uri.port, :use_ssl => use_ssl,
:verify_mode => OpenSSL::SSL::VERIFY_NONE, :open_timeout => 2, :read_timeout => 5) do |http|
            req = Net::HTTP::Get.new(uri.request_uri)

            headers.each do |key, value|
                req[key] = value
            end

            http.request(req)
        end
    end

end
