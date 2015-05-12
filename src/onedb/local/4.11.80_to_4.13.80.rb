# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

module Migrator
    def db_version
        "4.13.80"
    end

    def one_version
        "OpenNebula 4.13.80"
    end

    def up

        init_log_time()

        # 3805

        @db.run "ALTER TABLE document_pool RENAME TO old_document_pool;"
        @db.run "CREATE TABLE document_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, type INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.transaction do
            @db.fetch("SELECT * FROM old_document_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                lock_elem = doc.create_element("LOCK")
                lock_elem.add_child(doc.create_element("LOCKED")).content = "0"
                lock_elem.add_child(doc.create_element("OWNER")).content = ""
                lock_elem.add_child(doc.create_element("EXPIRES")).content = "0"

                doc.root.add_child(lock_elem)

                @db[:document_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :type       => row[:type],
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u])
            end
        end

        @db.run "DROP TABLE old_document_pool;"

        log_time()

        return true
    end
end