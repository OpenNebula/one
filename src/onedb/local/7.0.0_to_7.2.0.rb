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

require 'json'
require 'nokogiri'
require 'yaml'

$: << File.dirname(__FILE__)

include OpenNebula

module Migrator
    def db_version
        "7.2.0"
    end

    def one_version
        "OpenNebula 7.2.0"
    end

    def up
        init_log_time

        feature_951

        log_time

        true
    end

    def update_quota(doc, limit)
        doc.root.xpath("VM_QUOTA/VM").each do |vm_quota|
            vm_quota.add_child(doc.create_element('PCI_DEV')).content = limit
            vm_quota.add_child(doc.create_element('PCI_NIC')).content = limit
            vm_quota.add_child(doc.create_element('RUNNING_PCI_DEV')).content = limit
            vm_quota.add_child(doc.create_element('RUNNING_PCI_NIC')).content = limit

            vm_quota.add_child(doc.create_element('PCI_DEV_USED')).content = 0
            vm_quota.add_child(doc.create_element('PCI_NIC_USED')).content = 0
            vm_quota.add_child(doc.create_element('RUNNING_PCI_DEV_USED')).content = 0
            vm_quota.add_child(doc.create_element('RUNNING_PCI_NIC_USED')).content = 0
        end
    end

    # Add PCI, PCI_NIC quotas to all users, groups and defaults
    def feature_951
        # Update User Quotas
        @db.run 'DROP TABLE IF EXISTS old_user_quotas;'
        @db.run 'ALTER TABLE user_quotas RENAME TO old_user_quotas;'

        create_table(:user_quotas)

        @db.transaction do
            @db[:old_user_quotas].each do |row|
                doc = nokogiri_doc(row[:body], 'old_user_quotas')

                update_quota(doc, -1)

                row[:body] = doc.root.to_s
                @db[:user_quotas].insert(row)
            end
        end

        @db.run 'DROP TABLE old_user_quotas;'

        # Update Group Quotas
        @db.run 'DROP TABLE IF EXISTS old_group_quotas;'
        @db.run 'ALTER TABLE group_quotas RENAME TO old_group_quotas;'

        create_table(:group_quotas)

        @db.transaction do
            @db[:old_group_quotas].each do |row|
                doc = nokogiri_doc(row[:body], 'old_group_quotas')

                update_quota(doc, -1)

                row[:body] = doc.root.to_s
                @db[:group_quotas].insert(row)
            end
        end

        @db.run 'DROP TABLE old_group_quotas;'

        # Update Default Quotas
        @db.transaction do
            default_quotas = ['DEFAULT_USER_QUOTAS', 'DEFAULT_GROUP_QUOTAS']

            @db[:system_attributes].filter(name: default_quotas).each do |row|
                doc = nokogiri_doc(row[:body], 'system_attributes')

                update_quota(doc, -2)

                @db[:system_attributes].filter(name: row[:name]).update(body: doc.root.to_s)
            end
        end
    end

end
