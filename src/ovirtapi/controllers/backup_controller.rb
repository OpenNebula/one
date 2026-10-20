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
require 'logger'
require 'fileutils'

require_relative 'vm_controller'
require_relative 'disk_controller'
require_relative 'storage_controller'
require_relative 'helper_functions'

IMAGE_STATES = {
    0  => { :name => 'INIT', :short => 'init' },
  1  => { :name => 'READY', :short => 'rdy' },
  2  => { :name => 'USED', :short => 'used' },
  3  => { :name => 'DISABLED', :short => 'disa' },
  4  => { :name => 'LOCKED', :short => 'lock' },
  5  => { :name => 'ERROR', :short => 'err' },
  6  => { :name => 'CLONE', :short => 'clon' },
  7  => { :name => 'DELETE', :short => 'dele' },
  8  => { :name => 'USED_PERS', :short => 'used' },
  9  => { :name => 'LOCKED_USED', :short => 'lock' },
  10 => { :name => 'LOCKED_USED_PERS', :short => 'lock' }
}

# BackupController is responsible for managing backups in OpenNebula.
class BackupController

    def self.is_backup_finalized?(client, vm_id, backup_id, increment_source)
        uuid = find_uuid_by_details(client, vm_id, backup_id, increment_source)
        return false if uuid.nil?

        mapping_path = get_mapping_file_path(client)
        return false unless mapping_path && File.exist?(mapping_path)

        mapping = read_backup_mapping(mapping_path)
        finalized = mapping.dig(uuid, 'finalized') || false
        LOGGER.info("Finalize check: vm_id=#{vm_id} backup_id=#{backup_id} " \
            "increment_source=#{increment_source} uuid=#{uuid} finalized=#{finalized}")
        finalized
    end

    # Veeam backup datastore will be the one containing the attribute VEEAM_DS=YES
    def self.find_backup_ds(client)
        if defined?(VEEAM_DATASTORE) && VEEAM_DATASTORE
            return VEEAM_DATASTORE.to_i
        end

        ds_pool = OpenNebula::DatastorePool.new(client)
        rc = ds_pool.info_all

        if OpenNebula.is_error?(rc)
            LOGGER.error "Error: #{rc.message}"
            return '401_error' # Returning as string to avoid issues if ds ID is really 401
        end
        # puts ds_pool.to_xml
        ds_hash = ds_pool.to_hash
        ds_list = ds_hash['DATASTORE_POOL']['DATASTORE']

        ds_list.each do |ds|
            if ds.dig('TEMPLATE', 'VEEAM_DS') == 'YES'
                return ds['ID'].to_i
            end
        end
        LOGGER.error 'No datastore with attribute VEEAM_DS=YES found.'
        return
    end

    def self.get_datastore_base_path(client, ds_id)
        datastore = OpenNebula::Datastore.new_with_id(ds_id, client)
        rc = datastore.info(true)
        if OpenNebula.is_error?(rc)
            LOGGER.error "Error fetching datastore info: #{rc.message}"
            return '/var/lib/one/datastores'
        end

        ds_hash = datastore.to_hash['DATASTORE']
        ds_hash['BASE_PATH'] || '/var/lib/one/datastores'
    end

    # Helper method to get the path to the Veeam mapping file
    def self.get_mapping_file_path(client)
        ds_id = find_backup_ds(client)
        return if ds_id.nil? || ds_id == '401_error'

        base_path = get_datastore_base_path(client, ds_id)
        FileUtils.mkdir_p(base_path) unless Dir.exist?(base_path)

        "#{base_path}/veeam_mapping.json"
    end

    # Lock a separate file so opening the JSON for writing cannot truncate it
    # before the lock is acquired. Keep this lock file in place between calls.
    def self.with_mapping_lock(mapping_path, mode = File::LOCK_EX)
        File.open("#{mapping_path}.lock", File::RDWR | File::CREAT, 0o644) do |lock|
            lock.flock(mode)
            yield
        ensure
            lock.flock(File::LOCK_UN)
        end
    end

    def self.read_backup_mapping(mapping_path)
        with_mapping_lock(mapping_path, File::LOCK_SH) do
            File.exist?(mapping_path) ? JSON.parse(File.read(mapping_path)) : {}
        end
    end

    def self.generate_uuid_only(client, vm_id)
        require 'securerandom'
        uuid = SecureRandom.uuid
        mapping_path = get_mapping_file_path(client)
        if mapping_path.nil?
            raise 'Backup datastore not found'
        end

        with_mapping_lock(mapping_path) do
            mapping = if File.exist?(mapping_path)
                          JSON.parse(File.read(mapping_path))
                      else
                          {}
                      end
            mapping[uuid] = {
                'vm_id' => vm_id,
                'backup_id' => '',
                'increment_src' => '',
                'finalized' => false
            }
            File.write(mapping_path, JSON.pretty_generate(mapping))
        end
        uuid
    end

    def self.backup_state(state_number)
        # OpenNebula ImageState enum:
        # 0: INIT, 1: READY, 2: USED, 3: DISABLED, 4: LOCKED, 5: ERROR,
        # 6: CLONE, 7: DELETE, 8: USED_PERS, 9: LOCKED_USED, 10: LOCKED_USED_PERS
        # RHV backup phases: failed, finalizing, initializing, ready, starting, succeeded
        phase = case state_number
                when 0
                    'starting'
                when 1
                    'ready'
                when 2, 6, 8
                    'unknown'
                when 3, 5, 7
                    'failed'
                when 4, 9, 10
                    'finalizing'
                else
                    'unknown'
                end
        LOGGER.info("backup_state: state_number=#{state_number} phase=#{phase}")
        phase
    end

    def self.get_backup(client, backup_id)
        # Sometimes only the image id is provided
        if backup_id.include?('-')
            begin
                decoded = decrypt_backup_uuid(client, backup_id)
                backup_id = decoded[:id]
            rescue StandardError => e
                LOGGER.error "Invalid backup UUID: #{e.message}"
                return 404
            end
        end

        backup_image = OpenNebula::Image.new(OpenNebula::Image.build_xml(backup_id), client)
        rc = backup_image.info
        if OpenNebula.is_error?(rc)
            LOGGER.error "Error: #{rc.message}"
            return 401 # Most common cause
        end
        return backup_image
    end

    # An interactive backup stays in BACKUP/BACKUP_POWEROFF until finalized.
    # Returning to a normal VM state before finalize means the operation ended
    # unsuccessfully, even if OneBEX still has stale export status.
    def self.pending_backup_phase(vm, entry, status_response)
        if entry
            finalized = entry['finalized'] == true ||
                        entry['finalized'].to_s.downcase == 'true'
            return vm.status == 'back' ? 'finalizing' : 'succeeded' if finalized
            return 'failed' if ['runn', 'poff'].include?(vm.status)
        end

        return 'ready' if status_response && status_response['STATUS'].to_s == 'executing'

        'starting'
    end

    def self.update_backup_mapping(client, uuid, backup_id, increment_src, checkpoint = '0')
        mapping_path = get_mapping_file_path(client)
        return if mapping_path.nil?

        with_mapping_lock(mapping_path) do
            return unless File.exist?(mapping_path)

            mapping = JSON.parse(File.read(mapping_path))
            if mapping[uuid]
                mapping[uuid]['backup_id'] = backup_id
                mapping[uuid]['increment_src'] = increment_src
                mapping[uuid]['finalized'] ||= false
                current_checkpoint = mapping[uuid]['checkpoint'].to_s

                if current_checkpoint.empty? || current_checkpoint == '0'
                    mapping[uuid]['checkpoint'] = checkpoint
                end
                File.write(mapping_path, JSON.pretty_generate(mapping))
            end
        end
        LOGGER.info("Updated backup mapping: uuid=#{uuid} " \
            "backup_id=#{backup_id} increment_src=#{increment_src}")
    end

    def self.find_uuid_by_details(client, vm_id, backup_id, increment_src)
        mapping_path = get_mapping_file_path(client)
        return unless mapping_path && File.exist?(mapping_path)

        mapping = read_backup_mapping(mapping_path)
        # First try exact match
        mapping.each do |uuid, details|
            if details['vm_id'] == vm_id &&
                details['backup_id'] == backup_id &&
                details['increment_src'] == increment_src
                return uuid
            end
        end
        # If not found, find latest entry with matching vm_id and empty backup_id and increment_src
        latest_uuid = nil
        mapping.each do |uuid, details|
            next unless details['vm_id'] == vm_id &&
                details['backup_id'] == '' &&
                details['increment_src'] == ''

            latest_uuid = uuid
        end
        latest_uuid
    end

    def self.decrypt_backup_uuid(client, uuid)
        mapping_path = get_mapping_file_path(client)
        if mapping_path.nil? || !File.exist?(mapping_path)
            raise 'Mapping file not found'
        end

        mapping = read_backup_mapping(mapping_path)
        entry = mapping[uuid]
        if entry.nil?
            raise 'UUID not found in mapping'
        end

        LOGGER.info("Decrypted backup UUID #{uuid}: vm_id=#{entry['vm_id']} " \
            "backup_id=#{entry['backup_id']} increment_src=#{entry['increment_src']} " \
            "checkpoint=#{entry['checkpoint']}")
        { :id => entry['backup_id'], :increment => entry['increment_src'],
:vm_id => entry['vm_id'], :checkpoint => entry['checkpoint'] }
    end

    def self.onebackup_to_ovirtbackup(client, onebackup, increment, full_backup_id = nil)
        # Update backup info
        rc = onebackup.info
        if OpenNebula.is_error?(rc)
            LOGGER.error "Error: #{rc.message}"
            return 401, 'Unauthenticated'
        end

        if onebackup.nil?
            LOGGER.error('Unable to retrieve backup.')
            return 404, 'VM not found'
        end

        # Convert to hash
        backup_hash = onebackup.to_hash['IMAGE']
        vm_id = backup_hash['VMS']['ID'].to_i

        increments = backup_hash.dig('BACKUP_INCREMENTS', 'INCREMENT')
        increments = [increments] if increments.is_a?(Hash)
        increment_hash = get_increment_by_source(increment, increments)

        source_for_uuid = if increment_hash && increment_hash['SOURCE']
                              increment_hash['SOURCE']
                          elsif backup_hash['SOURCE']
                              backup_hash['SOURCE']
                          elsif increment
                              increment.to_s
                          else
                              '0'
                          end

        # Build full deterministic UUID that will be returned to Veeam
        full_backup_id ||= find_uuid_by_details(client, vm_id, backup_hash['ID'],
                                                source_for_uuid)
        LOGGER.info("Full backup ID: #{full_backup_id}")
        # Normalize source by removing leading zeros for attribute key
        normalized_source = source_for_uuid.to_s.sub(/^0+/, '')
        normalized_source = '0' if normalized_source.empty?
        normalized_source.upcase
        finalized = is_backup_finalized?(client, vm_id, backup_hash['ID'], source_for_uuid)
        phase = finalized ? 'succeeded' : backup_state(backup_hash['STATE'].to_i)

        # If phase is unknown, retry for up to 30 attempts
        if phase == 'unknown'
            retries = 0
            max_retries = 30
            while retries < max_retries && phase == 'unknown'
                sleep 5
                refreshed = get_backup(client, backup_hash['ID'].to_s) rescue nil
                break if refreshed.nil? || refreshed == 401 || refreshed == 404

                # Update working hash and re-evaluate finalized/state
                backup_hash = refreshed.to_hash['IMAGE']
                finalized = is_backup_finalized?(client, vm_id, backup_hash['ID'], source_for_uuid)
                phase = finalized ? 'succeeded' : backup_state(backup_hash['STATE'].to_i)
                retries += 1
            end
            LOGGER.info("Backup phase resolved after #{retries} retries: #{phase}")
        else
            LOGGER.info("Backup phase: #{phase}")
        end

        backup_data = {
            :creation_date => backup_hash['REGTIME'],
          :modification_date => backup_hash['REGTIME'],
          :phase => phase,
          :to_checkpoint_id => full_backup_id.to_s,
          :snapshot => {
              :id => '7c6fc411-a58b-4892-bcb1-dfdf8db257fb'
          },
          :vm => {
              :href => "/ovirt-engine/api/vms/#{Helper.int_to_uuid(backup_hash['VMS']['ID'].to_i)}",
              :id => Helper.int_to_uuid(backup_hash['VMS']['ID'].to_i).to_s
          },
          :actions => {
              :link => [
                  {
                      :href => '/ovirt-engine/api/vms/' \
                        "#{Helper.int_to_uuid(backup_hash['VMS']['ID'].to_i)}" \
                        "/backups/#{full_backup_id}/finalize",
                      :rel => 'finalize'
                  }
              ]
          },
          :description => backup_hash['TEMPLATE']['VEEAM_DESCRIPTION'].to_s,
          :link => [
              {
                  :href => '/ovirt-engine/api/vms/' \
                    "#{Helper.int_to_uuid(backup_hash['VMS']['ID'].to_i)}" \
                    "/backups/#{full_backup_id}/disks",
                  :rel => 'disks'
              }
          ],
          :href => "/ovirt-engine/api/vms/#{Helper.int_to_uuid(backup_hash['VMS']['ID'].to_i)}" \
            "/backups/#{full_backup_id}",
          :id => full_backup_id.to_s
        }

        if increment_hash && increment_hash['PARENT_ID'] && increment_hash['PARENT_ID'] != '-1'
            LOGGER.info("Backup is incremental, parent ID: #{increment_hash['PARENT_ID']}")
            parent_increment = get_increment_by_id(increment_hash['PARENT_ID'], increments)
            if parent_increment && parent_increment['SOURCE']
                backup_data[:from_checkpoint_id] =
                    find_uuid_by_details(client, vm_id, backup_hash['ID'],
                                         parent_increment['SOURCE'])
            else
                LOGGER.warn 'Parent increment metadata not found for' \
                    " #{increment_hash['PARENT_ID']}, skipping from_checkpoint_id"
            end
        end

        return backup_data.to_json
    end

    def self.onebackup_to_ovirtbackup_pending(_client, vm_id, full_backup_id, increment_source,
                                              veeam_description = '')
        require 'time'

        creation_date = Time.now.to_i

        vm_uuid = Helper.int_to_uuid(vm_id)

        backup_data = {
            :creation_date => creation_date,
            :modification_date => creation_date,
            :phase => 'starting',
            :to_checkpoint_id => full_backup_id.to_s,
            :snapshot => {
                :id => '7c6fc411-a58b-4892-bcb1-dfdf8db257fb'
            },
            :vm => {
                :href => "/ovirt-engine/api/vms/#{vm_uuid}",
                :id => vm_uuid.to_s
            },
            :actions => {
                :link => [
                    {
                        :href => "/ovirt-engine/api/vms/#{vm_uuid}/backups" \
                            "/#{full_backup_id}/finalize",
                        :rel => 'finalize'
                    }
                ]
            },
            :description => veeam_description,
            :link => [
                {
                    :href => "/ovirt-engine/api/vms/#{vm_uuid}/backups/#{full_backup_id}/disks",
                    :rel => 'disks'
                }
            ],
            :href => "/ovirt-engine/api/vms/#{vm_uuid}/backups/#{full_backup_id}",
            :id => full_backup_id.to_s
        }

        if increment_source != '0'
            backup_data[:from_checkpoint_id] = increment_source
        end

        return backup_data.to_json
    end

    # Convert a full OpenNebula backup image into one or more oVirt-style
    # backup entries. Some backups contain multiple increments; this helper
    # returns an array of parsed JSON objects suitable for inclusion in the
    # API response.
    def self.backup_image_to_ovirt_backups(client, onebackup)
        return [] if onebackup.nil?

        full_backup_hash = onebackup.to_hash

        increments = full_backup_hash.dig('IMAGE', 'BACKUP_INCREMENTS', 'INCREMENT')
        increments = [increments] if increments.is_a?(Hash)

        sources = if increments && !increments.empty?
                      increments.sort_by {|increment| increment['ID'].to_i }
                                .map {|increment| increment['SOURCE'] }
                  else
                      [full_backup_hash.dig('IMAGE', 'SOURCE')]
                  end

        results = []
        sources.compact.each do |source|
            parsed = BackupController.onebackup_to_ovirtbackup(client, onebackup, source)
            begin
                results << JSON.parse(parsed)
            rescue StandardError
                # If parsing fails (e.g., error tuple returned), skip.
            end
        end

        results
    end

    # High-level helper to return oVirt-style backups for a VM.
    # Returns [status_code, json_string]
    def self.get_ovirt_backups_for_vm(client, vm_id)
        vm = VmController.get_one_vms(client, :vm_id => vm_id)

        vm_hash = vm.to_hash

        unless vm_hash['VM'] && vm_hash['VM']['BACKUPS'] &&
                vm_hash['VM']['BACKUPS']['BACKUP_IDS'] &&
                vm_hash['VM']['BACKUPS']['BACKUP_IDS']['ID']
            # No backups metadata present
            return 200, { :backup => [] }.to_json
        end

        backup_ids = vm_hash['VM']['BACKUPS']['BACKUP_IDS']['ID']

        backup_list = if backup_ids.is_a?(String)
                          [backup_ids]
                      else
                          backup_ids
                      end

        ovirt_backups = []
        backup_list.each do |backup|
            full_backup = get_backup(client, backup)
            next if full_backup.nil? || full_backup == 401 || full_backup == 404

            entries = backup_image_to_ovirt_backups(client, full_backup)
            ovirt_backups.concat(entries) if entries.is_a?(Array)
        end

        return 200, { :backup => ovirt_backups }.to_json
    end

    def self.increment_available?(_client, vm)
        # Check if the VM has any RAW disks that are NOT in a ceph or lvm_thin
        # environment. If a raw disk lives on LVM_THIN or CEPH (RBD),
        # incremental backups are available.
        vm_hash = vm.to_hash
        disks = vm_hash['VM']['TEMPLATE']['DISK']
        return true if disks.nil?

        if disks.is_a?(Hash)
            disks = [disks]
        end

        disks.each do |disk|
            # LVM_THIN_ENABLE attribute must be included in oned.conf as INHERIT_DATASTORE_ATTR
            is_lvmthin = Helper.lvm_thin_enabled?(disk['TM_MAD'], disk['LVM_THIN_ENABLE'])
            is_ceph    = disk['TYPE'] == 'RBD'
            is_netapp = disk['TM_MAD'] == 'netapp'

            # If the disk is RAW and not on lvm_thin nor ceph/netapp, incremental backups
            # are NOT available.
            if disk['FORMAT'] == 'raw' && !is_lvmthin && !is_ceph && !is_netapp
                LOGGER.info "VM #{vm.id} has RAW disk(s), incremental backup not available."
                return false
            end
        end

        LOGGER.info "VM #{vm.id} has no RAW disks or RAW disks are on" \
            ' LVM_THIN/CEPH/NETAPP, incremental backup available.'
        return true
    end

    def self.perform_backup(client, vm_id, checkpoint_id, veeam_description = '')
        unless veeam_description.is_a?(String) && !veeam_description.strip.empty?
            return 400, Helper.fault_response('A JSON backup description is required.').to_json
        end

        begin
            metadata = JSON.parse(veeam_description)
        rescue JSON::ParserError
            return 400, Helper.fault_response('Invalid JSON backup description.').to_json
        end

        unless metadata.is_a?(Hash)
            return 400, Helper.fault_response('Backup description must contain' \
                ' a JSON object.').to_json
        end

        LOGGER.info "Starting backup operation for VM #{vm_id}, checkpoint_id:" \
            " #{checkpoint_id}, description present: #{!veeam_description.empty?}"
        # Retrieve the VM object
        vm = VmController.get_one_vms(client, :vm_id => vm_id)

        old_state = vm.status

        if checkpoint_id.nil?
            is_incremental = false
        else
            is_incremental = true
            # If an incremental backup was requested, ensure the checkpoint exists
            rc, body = get_ovirt_checkpoints(client, vm_id)
            if rc != 200
                LOGGER.error "Error retrieving checkpoints for VM #{vm_id}."
                return 500, Helper.fault_response("Error retrieving checkpoints for VM #{vm_id}.")
            end

            parsed = JSON.parse(body) rescue { 'checkpoint' => [] }
            checkpoints = parsed['checkpoint'] || []

            found = checkpoints.any? do |c|
                # Each checkpoint should be a hash with an 'id' field
                c.is_a?(Hash) && c['id'].to_s == checkpoint_id.to_s
            end

            unless found
                LOGGER.error "Requested checkpoint #{checkpoint_id} not found for VM #{vm_id}."
                fault = {
                    :fault => {
                        :reason => 'Operation Failed',
                      :detail => '[Cannot start backup. The specified checkpoint' \
                        " '#{checkpoint_id}' does not exist.]"
                    }
                }
                return 409, fault.to_json
            end
        end

        increment_available = increment_available?(client, vm)
        LOGGER.info "Incremental backup available for VM #{vm_id}:" \
            " #{increment_available}, is_incremental: #{is_incremental}"

        if !increment_available && is_incremental
            LOGGER.error "Incremental backup not available for VM #{vm_id}. VM has RAW disks."
            fault = {
                :fault => {
                    :reason => 'Operation Failed',
                    :detail => 'Incremental backup requested but not available. ' \
                        'This VM has RAW disks that do not support incremental backups.'
                }
            }
            return 409, fault.to_json
        end

        # Handle backup mode
        if vm.has_elements?('/VM/BACKUPS/BACKUP_CONFIG')
            backup_volatiles = vm['/VM/BACKUPS/BACKUP_CONFIG/BACKUP_VOLATILE'].to_s
        end
        LOGGER.info 'Requested backup for VM ' + vm_id.to_s
        LOGGER.info "Modifying VM #{vm_id} backup configuration..."
        if increment_available
            if backup_volatiles == 'YES'
                rc = vm.updateconf('BACKUP_CONFIG = ["MODE"="INCREMENT", "KEEP_LAST"="0",' \
                    ' "INTERACTIVE"="YES",' \
                    " \"BACKUP_VOLATILE\"=\"YES\", \"FS_FREEZE\"=\"#{BACKUP_FREEZE}\"]", true)
            else
                rc = vm.updateconf('BACKUP_CONFIG = ["MODE"="INCREMENT", "KEEP_LAST"="0",' \
                    ' "INTERACTIVE"="YES",' \
                    " \"FS_FREEZE\"=\"#{BACKUP_FREEZE}\"]", true)
            end
        else
            if backup_volatiles == 'YES'
                rc = vm.updateconf('BACKUP_CONFIG = ["BACKUP_VOLATILE"="YES",' \
                    ' "INTERACTIVE"="YES",' \
                    " \"FS_FREEZE\"=\"#{BACKUP_FREEZE}\"]", true)
            else
                rc = vm.updateconf('BACKUP_CONFIG = ["INTERACTIVE"="YES",' \
                    " \"FS_FREEZE\"=\"#{BACKUP_FREEZE}\"]", true)
            end
        end

        if OpenNebula.is_error?(rc)
            LOGGER.error "Failed to set BACKUP_CONFIG for VM #{vm_id}: #{rc.message}"
            return 409, Helper.fault_response(rc.message).to_json
        end

        ds_id = find_backup_ds(client)
        if ds_id == '401_error'
            LOGGER.error "Authentication error when finding backup datastore for VM #{vm_id}"
            return 401, 'Unauthenticated'
        elsif ds_id.nil?
            error_message = 'Veeam backup datastore not found. ' \
                            'Please, make sure a Backup datastore is present ' \
                            'with the attribute VEEAM_DS=YES.'
            LOGGER.error error_message
            return 404, error_message
        end
        LOGGER.info "Found Veeam backup datastore: #{ds_id} for VM #{vm_id}"

        # Edge case: the VM is already in backup state.
        # Can happen when the backup request is retried (network issue, auth token expired, etc.)
        if old_state == 'back'
            LOGGER.info "VM #{vm_id} already in backup state."
        else
            # If the backup is not incremental, the chain should
            # be reset => reset[bool] = ! is_incremental[bool]
            LOGGER.info "Initiating backup for VM #{vm_id} with " \
                "datastore #{ds_id}, reset=#{!is_incremental}"
            rc = vm.backup(ds_id, !is_incremental)
            if OpenNebula.is_error?(rc)
                LOGGER.error "Failed to initiate backup for VM #{vm_id}: #{rc.message}"
                return 400, "Failed to initiate backup: #{rc.message}"
            end
            LOGGER.info "Backup initiated successfully for VM #{vm_id}"
        end

        full_backup_id = generate_uuid_only(client, vm_id)

        increment_source = is_incremental ? checkpoint_id : '0'

        update_backup_mapping(client, full_backup_id, '', '', increment_source)

        save_last_backup_description(vm, veeam_description, full_backup_id)

        LOGGER.info "Backup operation initiated successfully for VM #{vm_id}," \
            ' returning pending backup data'
        return 201, onebackup_to_ovirtbackup_pending(client, vm_id, full_backup_id,
                                                     increment_source, veeam_description)
    end

    def self.save_last_backup_description(vm, veeam_description, backup_identifier)
        parsed_veeam_description = JSON.parse(veeam_description)
        date = Time.now.strftime('%Y-%m-%d %H:%M:%S')
        backup_description = "Last Backup Date: #{date}; Last Backup ID: #{backup_identifier};" \
            " Job: #{parsed_veeam_description['job_uuid']};" \
            " Session ID: #{parsed_veeam_description['session_id']}"
        rc = vm.update("VEEAM_BACKUP_JOB=\"#{backup_description}\"", true)
        return unless OpenNebula.is_error?(rc)

        LOGGER.error("Error saving Veeam Description into VM #{vm.id}: #{rc.message}")
        return
    end

    def self.get_veeam_description(vm)
        vm.info

        vm_hash = vm.to_hash
        vm_hash.dig('VM', 'USER_TEMPLATE', 'VEEAM_BACKUP_JOB').to_s
    rescue StandardError => e
        LOGGER.warn "Could not get Veeam description for VM #{vm.id}: #{e.message}"
        ''
    end

    def self.get_increment_by_id(increment_id, increments)
        increments.each do |increment|
            if increment['ID']==increment_id
                return increment
            end
        end
        return
    end

    def self.get_increment_by_parent_id(parent_id, increments)
        increments.each do |increment|
            if increment['PARENT_ID']==parent_id
                return increment
            end
        end
        return
    end

    def self.get_increment_by_source(source, increments)
        return if increments.nil?

        # First try exact match
        increments.each do |increment|
            return increment if increment['SOURCE'] == source
        end

        # Try normalized match: strip leading zeros from both sides and compare
        normalized_source = source.to_s.sub(/^0+/, '')
        normalized_source = '0' if normalized_source == ''

        increments.each do |increment|
            inc_src = increment['SOURCE'].to_s
            inc_norm = inc_src.sub(/^0+/, '')
            inc_norm = '0' if inc_norm == ''

            return increment if inc_src == normalized_source || inc_norm == normalized_source
        end

        nil
    end

    def self.get_ovirt_checkpoints(client, vm_id)
        # Delegate retrieval of backups to the high-level helper which returns
        # a JSON body with a :backup array. This centralizes backup parsing.
        rc, body = get_ovirt_backups_for_vm(client, vm_id)
        return rc, body if rc != 200

        parsed = JSON.parse(body) rescue { 'backup' => [] }
        backups = parsed['backup'] || []

        # Prepare base zero checkpoint
        zero_id = '00000000-0000-0000-0000-000000000000'
        checkpoints = []
        checkpoints << {
            :creation_date => Time.now.to_i,
            :state => 'created',
            :vm => {
                :href => "/ovirt-engine/api/vms/#{Helper.int_to_uuid(vm_id)}",
                :id => Helper.int_to_uuid(vm_id).to_s
            },
            :description => '{"type":"veeam","job_uuid":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"' \
                ',"session_id":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"}',
            :href => "/ovirt-engine/api/vms/#{Helper.int_to_uuid(vm_id)}/checkpoints/#{zero_id}",
            :id => zero_id
        }

        backups.each do |b|
            # b is expected to be a Hash (parsed from onebackup_to_ovirtbackup)
            next unless b.is_a?(Hash)

            # Determine checkpoint id: prefer to_checkpoint_id, fallback to id
            checkpoint_id = b['to_checkpoint_id'] || b['id']
            next if checkpoint_id.nil?

            # creation_date may be seconds or milliseconds; normalize to ms
            ts = (b['creation_date'] || b['creationDate'] || 0).to_i
            creation_ms = ts > 1_000_000_000_000 ? ts : ts * 1000

            checkpoints << {
                :creation_date => creation_ms,
                :parent_id => b['from_checkpoint_id'] || zero_id,
                :state => 'created',
                :vm => {
                    :href => "/ovirt-engine/api/vms/#{Helper.int_to_uuid(vm_id)}",
                    :id => Helper.int_to_uuid(vm_id).to_s
                },
                :description => '{"type":"veeam","job_uuid"' \
                    ':"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"' \
                    ',"session_id":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"}',
                :href => "/ovirt-engine/api/vms/#{Helper.int_to_uuid(vm_id)}/" \
                    "checkpoints/#{checkpoint_id}",
                :id => checkpoint_id
            }
        end

        return 200, { :checkpoint => checkpoints }.to_json
    end

    def self.mark_backup_finalized(client, uuid, backup_id = nil, increment_src = nil)
        mapping_path = get_mapping_file_path(client)
        return false if mapping_path.nil?

        with_mapping_lock(mapping_path) do
            return false unless File.exist?(mapping_path)

            mapping = JSON.parse(File.read(mapping_path))
            if mapping[uuid]
                mapping[uuid]['backup_id'] = backup_id if backup_id
                mapping[uuid]['increment_src'] = increment_src if increment_src
                mapping[uuid]['finalized'] = true
                File.write(mapping_path, JSON.pretty_generate(mapping))
                LOGGER.info("Backup #{uuid} marked as finalized in mapping")
                return true
            else
                LOGGER.error("UUID #{uuid} not found in mapping")
                return false
            end
        end
    end

    # Compute disk UUIDs for a VM (used to annotate backups with disk list)
    def self.compute_disk_uuids_for_vm(client, vm_id)
        begin
            vm = VmController.get_one_vms(client, :vm_id => vm_id)

            vm_hash = vm.to_hash
            disks = vm_hash.dig('VM', 'TEMPLATE', 'DISK')
            backup_volatiles = vm_hash.dig('VM', 'BACKUPS', 'BACKUP_CONFIG', 'BACKUP_VOLATILE')

            return [] if disks.nil?

            disks = [disks] if disks.is_a?(Hash)

            uuids = []
            disks.each do |disk|
                if disk['PERSISTENT'] == 'YES'
                    uuid = DiskController.generate_disk_uuid(0, 0, disk['IMAGE_ID'].to_i)
                    uuids << uuid
                elsif disk.key?('IMAGE_ID') && disk['PERSISTENT'] != 'YES'
                    uuid = DiskController.generate_disk_uuid(1, vm_id, disk['DISK_ID'].to_i)
                    uuids << uuid
                elsif backup_volatiles && backup_volatiles == 'YES' && !disk.key?('IMAGE_ID')
                    uuid = DiskController.generate_disk_uuid(2, vm_id, disk['DISK_ID'].to_i)
                    uuids << uuid
                end
            end

            uuids
        rescue StandardError => e
            LOGGER.error("Error computing disk UUIDs for VM #{vm_id}: #{e.message}")
            return []
        end
    end

    # Retrieve the latest backup ID from VM metadata with retries
    # Returns the latest backup ID string or nil if not found within timeout
    def self.get_latest_backup_id_from_vm(vm, max_retries = 15)
        meta_retries = 0
        loop do
            vm.info
            vm_hash = vm.to_hash

            # Safe navigation to check if ID exists
            if vm_hash['VM']['BACKUPS'] &&
            vm_hash['VM']['BACKUPS']['BACKUP_IDS'] &&
            vm_hash['VM']['BACKUPS']['BACKUP_IDS']['ID']

                backup_ids = vm_hash['VM']['BACKUPS']['BACKUP_IDS']['ID']
                latest_id = backup_ids.is_a?(Array) ? backup_ids.last : backup_ids
                return latest_id
            end

            if meta_retries >= max_retries
                LOGGER.error 'Timeout: Backup ID not found in metadata.'
                return
            end

            LOGGER.info 'Waiting for backup ID update...'
            sleep 2
            meta_retries += 1
        end
    end

    # Extract the increment source from a backup image
    # Returns the increment source string
    def self.extract_increment_source(backup)
        backup_hash = backup.to_hash
        inc = backup_hash.dig('IMAGE', 'BACKUP_INCREMENTS', 'INCREMENT')

        if inc.nil?
            backup_hash['IMAGE']['SOURCE']
        else
            inc = [inc] if inc.is_a?(Hash)
            last_inc = inc.is_a?(Array) ? inc.last : inc
            last_inc.is_a?(Hash) ? last_inc['SOURCE'] : last_inc.to_s
        end
    end

    def self.update_vm_backup(client, vm, encrypted_backup_id, vm_uuid_id)
        LOGGER.info("Checking for backup ID update for VM #{vm_uuid_id}")

        rc = vm.info
        if OpenNebula.is_error?(rc)
            LOGGER.error "Error refreshing VM #{vm_uuid_id}: #{rc.message}"
            return
        end

        latest_id = get_latest_backup_id_from_vm(vm)
        if latest_id.nil?
            LOGGER.error 'Failed to retrieve backup ID from VM metadata'
            return
        end

        backup = get_backup(client, latest_id.to_s)
        if backup.nil? || backup == 401
            LOGGER.error "Failed to retrieve backup #{latest_id}"
            return
        end

        increment_src = extract_increment_source(backup)

        # Update the mapping with the actual backup_id and increment_src
        update_backup_mapping(client, encrypted_backup_id, latest_id, increment_src)
    end

    def self.onebex_backup_to_ovirtbackup(vm_id, backup_id,
                                          checkpoint = '0',
                                          veeam_description = '',
                                          phase = 'starting')
        creation_date = Time.now.to_i
        vm_uuid = Helper.int_to_uuid(vm_id)

        backup_data = {
            :creation_date => creation_date,
            :modification_date => creation_date,
            :phase => phase,
            :to_checkpoint_id => backup_id.to_s,
            :snapshot => {
                :id => '7c6fc411-a58b-4892-bcb1-dfdf8db257fb'
            },
            :vm => {
                :href => "/ovirt-engine/api/vms/#{vm_uuid}",
                :id => vm_uuid.to_s
            },
            :actions => {
                :link => [
                    {
                        :href => "/ovirt-engine/api/vms/#{vm_uuid}/backups" \
                            "/#{backup_id}/finalize",
                        :rel => 'finalize'
                    }
                ]
            },
            :description => veeam_description.to_s,
            :link => [
                {
                    :href => "/ovirt-engine/api/vms/#{vm_uuid}/backups" \
                        "/#{backup_id}/disks",
                    :rel => 'disks'
                }
            ],
            :href => "/ovirt-engine/api/vms/#{vm_uuid}/backups/#{backup_id}",
            :id => backup_id.to_s
        }

        if checkpoint != '0' && checkpoint != backup_id.to_s
            backup_data[:from_checkpoint_id] = checkpoint
        end

        backup_data.to_json
    end

end
