# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require "rexml/document"
include REXML

module Migrator
    def db_version
        "3.0.0"
    end

    def one_version
        "OpenNebula 3.0.0"
    end

    def up
        # The tm_nfs driver has been renamed to tm_shared
        # CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, state INTEGER, last_mon_time INTEGER, UNIQUE(name));

        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
        @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, state INTEGER, last_mon_time INTEGER, UNIQUE(name));"
        @db.run "INSERT INTO host_pool SELECT * FROM old_host_pool;"

        @db.fetch("SELECT * FROM old_host_pool") do |row|
            doc = Document.new(row[:body])

            source = nil
            doc.root.each_element("TM_MAD") { |e|
                if e.text.downcase == "tm_nfs"
                    e.text = "tm_shared"

                    @db[:host_pool].filter(:oid => row[:oid]).update(
                        :body => doc.root.to_s)
                end
            }
        end

        @db.run "DROP TABLE old_host_pool;"

        return true
    end
end
