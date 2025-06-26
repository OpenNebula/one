# -------------------------------------------------------------------------- #
# Copyright 2019-2022, OpenNebula Systems S.L.                               #
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

    def db_version
        '6.8.0'
    end

    def one_version
        'OpenNebula 6.8.0'
    end

    def up
        init_log_time

        bug_6027

        bug_6002

        feature_6063

        log_time

        true
    end

    # Remove FREE from HOST/HOST_SHARE/NUMA_NODES/NODE/HUGEPAGE
    # Remove FREE, USED from HOST/HOST_SHARE/NUMA_NODES/NODE/MEMORY
    def bug_6027
        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
        create_table(:host_pool)

        @db.transaction do
          @db.fetch("SELECT * FROM old_host_pool") do |row|
            doc = nokogiri_doc(row[:body], 'old_host_pool')

            # Get all hugepages
            doc.root.xpath('HOST_SHARE/NUMA_NODES/NODE/HUGEPAGE/FREE').each do |att|
                att.remove
            end

            doc.root.xpath('HOST_SHARE/NUMA_NODES/NODE/MEMORY/FREE').each do |att|
                att.remove
            end

            doc.root.xpath('HOST_SHARE/NUMA_NODES/NODE/MEMORY/USED').each do |att|
                att.remove
            end

            row[:body] = doc.root.to_s
            @db[:host_pool].insert(row)
          end
        end

        @db.run "DROP TABLE old_host_pool;"
    end

    def upper_case_labels(xml, table)
        doc = nokogiri_doc(xml, 'vm_pool')

        doc.xpath('VM/USER_TEMPLATE/LABELS').each do |att|
            att.content = att.child.text.strip.upcase unless att.child.nil?
        end

        doc.root.to_s
    end

    # Modify all occurrences to uppercase for LABEL attribute in template_pool and vm_pool db tables
    def bug_6002
        @db.run "ALTER TABLE template_pool RENAME TO old_template_pool;"
        @db.run "CREATE TABLE template_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.transaction do
            # VMTEMPLATE/TEMPLATE/LABELS from template_pool to uppercase
            @db.fetch("SELECT * FROM old_template_pool") do |row|
                doc = nokogiri_doc(row[:body], 'template_pool')

                doc.xpath('VMTEMPLATE/TEMPLATE/LABELS').each do |att|
                    att.content = att.child.text.strip.upcase unless att.child.nil?
                end

                row[:body] = doc.root.to_s
                @db[:template_pool].insert(row)
            end
        end

        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        create_table(:vm_pool)

        @db.transaction do
            # VM/USER_TEMPLATES/LABELS from vm_pool to uppercase
            @db.fetch("SELECT * FROM old_vm_pool;") do |row|
                row[:body] = upper_case_labels(row[:body], 'vm_pool')
                row[:short_body] = upper_case_labels(row[:short_body], 'vm_pool')

                @db[:vm_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE old_template_pool;'
        @db.run 'DROP TABLE old_vm_pool;'
    end

    # Create new tables for Backup Jobs and Scheduled Actions
    # Transfer old VM Scheduled Actions to new table
    def feature_6063
        create_table(:backupjob_pool)
        create_table(:schedaction_pool)

        # Migrate VM Scheduled Actions
        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        create_table(:vm_pool)

        sa_id = 0

        @db.transaction do
            @db.fetch("SELECT * FROM old_vm_pool;") do |row|
                doc = nokogiri_doc(row[:body], 'vm_pool')

                vm_id = doc.xpath('VM/ID').text
                stime = doc.xpath('VM/STIME').text.to_i

                # Update the SA only if the VM is not DONE

                sched_actions = doc.create_element('SCHED_ACTIONS')
                doc.at_xpath('VM').add_child(sched_actions)

                # For VMs not in DONE state
                if doc.xpath('VM/STATE').text.to_i != 6
                    doc.xpath('VM/TEMPLATE/SCHED_ACTION').each do |att|
                        # Add ID to SCHED_ACTIONS
                        sched_actions.add_child(doc.create_element('ID')).content = sa_id

                        # Update Scheduled Action values and store it in schedaction_pool

                        # Replace ID with new unique Scheduled Action ID
                        att.at_xpath('ID').content = sa_id

                        # Add type and parent_id => reference to this VM
                        att.add_child(doc.create_element('TYPE')).content = 'VM'
                        att.add_child(doc.create_element('PARENT_ID')).content = vm_id

                        # Replace relative time by absolute value
                        sa_time = att.at_xpath('TIME').text

                        if sa_time[0] == '+'
                            action_time = stime + sa_time[1..-1].to_i
                            att.at_xpath('TIME').content = action_time
                        end

                        # Remove not used WARNING attribute
                        warn = att.at_xpath('WARNING')
                        warn.remove unless warn.nil?

                        optional_args = { 'MESSAGE' => '',
                                          'ARGS' => '',
                                          'DONE' => -1,
                                          'REPEAT' => -1,
                                          'DAYS' => '',
                                          'END_TYPE' => -1,
                                          'END_VALUE' => -1 }

                        optional_args.each do |att_name, default_value|
                            opt_att = att.at_xpath(att_name)

                            next unless opt_att.nil?

                            att.add_child(doc.create_element(att_name)).content = default_value
                        end

                        done = att.at_xpath('DONE').text

                        # Store new Scheduled Action to DB
                        @db[:schedaction_pool].insert(
                            :oid        => sa_id,
                            :parent_id  => vm_id,
                            :type       => 'VM',
                            :body       => att.to_s,
                            :time       => att.at_xpath('TIME').text,
                            :done       => done)

                        sa_id += 1
                    end
                end

                old_sched_actions = doc.xpath('VM/TEMPLATE/SCHED_ACTION')
                old_sched_actions.remove unless old_sched_actions.nil?

                row[:body] = doc.root.to_s
                @db[:vm_pool].insert(row)
            end

            # Update last object ID for schedaction_pool
            @db.run "INSERT INTO pool_control VALUES('schedaction_pool', #{sa_id});"
        end

        @db.run 'DROP TABLE old_vm_pool;'
    end
end
