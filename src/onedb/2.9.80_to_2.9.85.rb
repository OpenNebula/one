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
        "2.9.85"
    end

    def one_version
        "OpenNebula 2.9.85"
    end

    def up
        # There are no DB schema changes from 2.9.80 to 2.9.85, but the Images
        # now have a <SIZE> element

        # Image pool table:
        # CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, uid INTEGER, gid INTEGER, public INTEGER, UNIQUE(name,uid) );

        @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"
        @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, uid INTEGER, gid INTEGER, public INTEGER, UNIQUE(name,uid) );"

        @db.fetch("SELECT * FROM old_image_pool") do |row|
            doc = Document.new(row[:body])

            source = nil
            doc.root.each_element("SOURCE") { |e|
                source = e.text
            }

            du_output = `du -m #{source} 2>/dev/null`
            size = du_output.split[0]

            size = "0" if ( size == nil )

            size_elem = doc.root.add_element("SIZE")
            size_elem.text = size

            @db[:image_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :public     => row[:public])
        end

        @db.run "DROP TABLE old_image_pool;"

        return true
    end
end
