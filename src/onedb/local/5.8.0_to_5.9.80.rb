# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
        '5.9.80'
    end

    def one_version
        'OpenNebula 5.9.80'
    end

    def up
        feature_2722
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
    end

end
