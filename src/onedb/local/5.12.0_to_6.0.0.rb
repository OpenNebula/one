# -------------------------------------------------------------------------- #
# Copyright 2019-2021, OpenNebula Systems S.L.                               #
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

require 'nokogiri'

$LOAD_PATH << File.dirname(__FILE__)

include OpenNebula

module Migrator

    def db_version
        '6.0.0'
    end

    def one_version
        'OpenNebula 6.0.0'
    end

    def up
        feature_4989
        bug_5020
        feature_664
        true
    end

    private

    def feature_4989
        @db.run 'DROP TABLE IF EXISTS old_image_pool;'
        @db.run 'ALTER TABLE image_pool RENAME TO old_image_pool;'

        create_table(:image_pool)

        @db.transaction do
            @db.fetch('SELECT * FROM old_image_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_image_pool')

                driver    = doc.xpath('/IMAGE/TEMPLATE/DRIVER').text.strip
                fmt       = doc.xpath('/IMAGE/TEMPLATE/FORMAT').text.strip
                fs_type   = doc.xpath('/IMAGE/FSTYPE').text.strip
                disk_type = doc.xpath('/IMAGE/DISK_TYPE').text.strip

                fmt_new = 'raw' # default format raw

                if Integer(disk_type) != 0 # If DISK_TYPE != FILE
                    doc.search('/IMAGE/TEMPLATE/DRIVER').remove if driver
                elsif !driver.empty?
                    fmt_new = driver
                elsif !fs_type.empty?
                    fmt_new = fs_type
                elsif !fmt.empty?
                    fmt_new = fmt
                else
                    ds_id = Integer(doc.xpath('/IMAGE/DATASTORE_ID').text)
                    ds_query = 'SELECT body FROM datastore_pool ' \
                                "WHERE oid = #{ds_id}"

                    @db.fetch(ds_query) do |ds_row|
                        ds = nokogiri_doc(ds_row[:body], 'datastore_pool')

                        ds_driver = ds.xpath('/DATASTORE/TEMPLATE/DRIVER').text

                        fmt_new = ds_driver unless ds_driver.empty?
                    end
                end

                # Add new format node
                fmt_node = doc.create_element('FORMAT', fmt_new)
                doc.root.at_xpath('/IMAGE').add_child(fmt_node)

                # Remove old format node
                doc.search('/IMAGE/TEMPLATE/FORMAT').remove

                # Remove deprecated FS_TYPE
                doc.search('/IMAGE/FSTYPE').remove

                row[:body] = doc.root.to_s

                @db[:image_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE IF EXISTS old_image_pool;'
    end

    def bug_5020
        @db.run 'DROP TABLE IF EXISTS old_history;'
        @db.run 'ALTER TABLE history RENAME TO old_history;'

        create_table(:history)

        @db.transaction do
            @db.fetch('SELECT oid,body FROM vm_pool') do |row_vm|
                doc_vm = nokogiri_doc(row_vm[:body], 'vm_pool')

                vm_id     = row_vm[:oid];
                uid       = doc_vm.xpath('/VM/UID').text.strip
                uname     = doc_vm.xpath('/VM/UNAME').text.strip
                gid       = doc_vm.xpath('/VM/GID').text.strip
                gname     = doc_vm.xpath('/VM/GNAME').text.strip

                max = true;
                @db.fetch("SELECT * FROM old_history WHERE VID = #{vm_id} ORDER BY seq DESC") do |row_his|
                    if max
                        # Alter only record with max sequence number
                        max = false

                        doc_his = nokogiri_doc(row_his[:body], 'old_history')

                        doc_his.xpath('/HISTORY/VM/UID')[0].content = uid
                        doc_his.xpath('/HISTORY/VM/UNAME')[0].content = uname
                        doc_his.xpath('/HISTORY/VM/GID')[0].content = gid
                        doc_his.xpath('/HISTORY/VM/GNAME')[0].content = gname

                        row_his[:body] = doc_his.root.to_s
                    end

                    @db[:history].insert(row_his)
                end
            end
        end

        @db.run 'DROP TABLE IF EXISTS old_history;'
    end

    def feature_664
        @db.run 'DROP TABLE IF EXISTS old_image_pool;'
        @db.run 'ALTER TABLE image_pool RENAME TO old_image_pool;'

        create_table(:image_pool)

        @db.transaction do
            # Add PREV_STATE to each image
            @db.fetch('SELECT * FROM old_image_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_image_pool')

                state      = doc.xpath('//STATE').text
                prev_state = doc.create_element('PREV_STATE', state)

                doc.root.at_xpath('//IMAGE').add_child(prev_state)

                row[:body] = doc.root.to_s

                @db[:image_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE IF EXISTS old_image_pool;'
    end

end
