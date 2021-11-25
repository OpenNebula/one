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

require 'set'
require 'base64'
require 'zlib'
require 'pathname'
require 'yaml'
require 'opennebula'
require 'vcenter_driver'

$LOAD_PATH << File.dirname(__FILE__)

include OpenNebula

module Migrator

    def db_version
        '5.10.0'
    end

    def one_version
        'OpenNebula 5.9.80'
    end

    def up
        feature_2722
        feature_3380
        true
    end

    private

    def feature_2722
        @db.run 'DROP TABLE IF EXISTS old_logdb;'
        @db.run 'ALTER TABLE logdb RENAME TO old_logdb;'

        create_table(:logdb)

        @db.run 'INSERT INTO system_attributes (name, body)' <<
                'SELECT \'RAFT_STATE\', sqlcmd FROM old_logdb WHERE log_index = -1;'

        @db.run 'DELETE FROM old_logdb WHERE log_index = -1;'

        db.transaction do
            # update virtual networks
            @db.fetch('SELECT * FROM old_logdb') do |row|
                row[:fed_index] = 18446744073709551615 if row[:fed_index] < 0

                @db[:logdb].insert(row)
            end
        end

        @db.run 'DROP TABLE IF EXISTS old_logdb;'
    end

    def feature_3380
        @db.run 'DROP TABLE IF EXISTS old_host_pool;'
        @db.run 'ALTER TABLE host_pool RENAME TO old_host_pool;'

        create_table(:host_pool)

        db.transaction do
            # Add PREV_STATE to each host
            @db.fetch('SELECT * FROM old_host_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_host_pool')

                state = doc.xpath('//STATE').text

                prev_state = doc.create_element('PREV_STATE', state)
                doc.root.at_xpath('//HOST').add_child(prev_state)

                row[:body] = doc.root.to_s

                @db[:host_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE IF EXISTS old_host_pool;'

        @db.run 'CREATE TABLE IF NOT EXISTS hook_pool '\
                '(oid INTEGER PRIMARY KEY,name VARCHAR(128), '\
                'body MEDIUMTEXT, uid INTEGER, gid INTEGER, '\
                'owner_u INTEGER, group_u INTEGER, other_u INTEGER, '\
                'type INTEGER);'

        @db.run 'CREATE TABLE IF NOT EXISTS hook_log'\
                '(hkid INTEGER, exeid INTEGER, timestamp INTEGER, rc INTEGER,'\
                ' body MEDIUMTEXT,PRIMARY KEY(hkid, exeid))'
    end

end
