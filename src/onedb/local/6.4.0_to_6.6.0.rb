# -------------------------------------------------------------------------- #
# Copyright 2019-2025, OpenNebula Systems S.L.                               #
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

require 'opennebula'

$LOAD_PATH << File.dirname(__FILE__)

# OpenNebula DB migrator to 6.10
module Migrator

    IS_VM = 0x0000001000000000
    MASK = 0xFFFFFFFF

    include OpenNebula

    def db_version
        '6.6.0'
    end

    def one_version
        'OpenNebula 6.6.0'
    end

    def up
        init_log_time

        feature_backup

        log_time

        feature_5986

        log_time

        true
    end

    def feature_backup
        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        create_table(:vm_pool)

        @db.transaction do
          @db.fetch("SELECT * FROM old_vm_pool") do |row|
            doc = nokogiri_doc(row[:body], 'old_vm_pool')

            backups = doc.create_element('BACKUPS')
            backups.add_child(doc.create_element('BACKUP_CONFIG'))
            backups.add_child(doc.create_element('BACKUP_IDS'))

            doc.root.add_child(backups)

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
                :search_token => row[:search_token])
          end
        end

        @db.run "DROP TABLE old_vm_pool;"
    end

    # Hot Virtual Network Update
    def feature_5986
        # Add UPDATED_VMS, OUTDATED_VMS, UPDATING_VMS and ERROR_VMS to all VNs
        @db.run 'ALTER TABLE network_pool RENAME TO old_network_pool;'
        create_table(:network_pool)

        @db.transaction do
            @db.fetch('SELECT * FROM old_network_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_network_pool')

                doc.root.add_child(doc.create_element('OUTDATED_VMS'))
                doc.root.add_child(doc.create_element('UPDATING_VMS'))
                doc.root.add_child(doc.create_element('ERROR_VMS'))

                updated = doc.create_element('UPDATED_VMS')
                doc.root.add_child(updated)

                # Get VM ID from leases and put it to UPDATED_VMS
                doc.root.xpath('AR_POOL/AR/ALLOCATED').each do |ar|
                    allocated = ar.content.split(' ')

                    allocated.each_with_index do |value,index|
                        next if index.even?

                        next if (value.to_i & IS_VM) == 0

                        vm_id = value.to_i & MASK

                        id = doc.create_element('ID')
                        id.content = vm_id

                        updated.add_child(id);
                    end
                end

                row[:body] = doc.root.to_s
                @db[:network_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE old_network_pool;'
    end

end
