# -------------------------------------------------------------------------- #
# Copyright 2019-2023, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

require 'active_support'
require 'active_support/core_ext/hash'
require 'json'
require 'opennebula'

$LOAD_PATH << File.dirname(__FILE__)

# OpenNebula DB migrator to 7.0
module Migrator

    def db_version
        '6.10.0'
    end

    def one_version
        'OpenNebula 6.10.0'
    end

    def up
        init_log_time

        feature_6523

        feature_5861

        feature_sched_warning

        log_time

        true
    end

    # Add VM disk IDs to Backup Image metadata
    def feature_6523
        @db.run 'DROP TABLE IF EXISTS old_image_pool;'
        @db.run 'ALTER TABLE image_pool RENAME TO old_image_pool;'

        create_table(:image_pool)

        @db.transaction do
            @db.fetch('SELECT * FROM old_image_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_image_pool')

                type = doc.xpath('IMAGE/TYPE').text

                if type == '6' # Backup Image
                    # Read VM disk IDs
                    vm_id = doc.xpath('IMAGE/VMS/ID').text
                    vm_query = "SELECT body FROM vm_pool WHERE oid = #{vm_id}"

                    disk_ids = []

                    @db.fetch(vm_query) do |vm_row|
                        vm = nokogiri_doc(vm_row[:body], 'vm_pool')

                        do_volatile = vm.xpath('VM/BACKUPS/BACKUP_CONFIG/BACKUP_VOLATILE').text || 'NO'
                        do_volatile = do_volatile.strip.upcase == 'YES'

                        vm.xpath('VM/TEMPLATE/DISK').each do |disk|
                            disk_type = disk.xpath('TYPE').text.upcase

                            next if disk_type == 'SWAP' || (disk_type == 'FS' && !do_volatile)

                            disk_ids << disk.xpath('DISK_ID').text
                        end
                    end

                    # Add disk IDs to Image
                    ids_node = doc.create_element('BACKUP_DISK_IDS')
                    doc.at_xpath('IMAGE').add_child(ids_node)

                    disk_ids.each do |disk_id|
                        ids_node.add_child(doc.create_element('ID')).content = disk_id
                    end

                    row[:body] = doc.root.to_s
                end

                @db[:image_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE IF EXISTS old_image_pool;'
    end

    # Replace FTS index with body_json
    def feature_5861
        @db.run 'ALTER TABLE vm_pool RENAME TO old_vm_pool;'
        @db.run 'CREATE TABLE vm_pool (
                oid INTEGER PRIMARY KEY,
                name VARCHAR(128),
                body MEDIUMTEXT,
                uid INTEGER,
                gid INTEGER,
                state INTEGER,
                lcm_state INTEGER,
                owner_u INTEGER,
                group_u INTEGER,
                other_u INTEGER,
                short_body MEDIUMTEXT,
                body_json JSON
            );'

        @db.transaction do
            @db.fetch('SELECT * FROM old_vm_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_vm_pool')

                json = Hash.from_xml(doc.root.to_s)

                # Create array from single DISK/NIC attributes stored as hash
                ['DISK', 'NIC'].each do |e|
                    next unless json['VM']['TEMPLATE'][e].class == Hash

                    json['VM']['TEMPLATE'][e] = [json['VM']['TEMPLATE'][e]]
                end

                @db[:vm_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :state      => row[:state],
                    :lcm_state  => row[:lcm_state],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u],
                    :short_body => row[:short_body],
                    :body_json  => json.to_json
                )
            end
        end

        @db.run 'DROP TABLE old_vm_pool;'
    end

    # Add WARNING attribute to Scheduled Action
    def feature_sched_warning
        @db.run 'DROP TABLE IF EXISTS old_schedaction_pool;'
        @db.run 'ALTER TABLE schedaction_pool RENAME TO old_schedaction_pool;'

        create_table(:schedaction_pool)

        @db.transaction do
            @db.fetch('SELECT * FROM old_schedaction_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_schedaction_pool')

                elem = doc.at_xpath("/SCHED_ACTION")

                elem.add_child(doc.create_element('WARNING')).content = 0

                row[:body] = doc.root.to_s

                @db[:schedaction_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE IF EXISTS old_schedaction_pool;'
    end

end
