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

require "rexml/document"
include REXML

module Migrator
    def db_version
        "3.8.0"
    end

    def one_version
        "OpenNebula 3.8.0"
    end

    def up

        ########################################################################
        # Bug #1480 Add new attribute CONTEXT/DISK_ID
        ########################################################################

        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.fetch("SELECT * FROM old_vm_pool") do |row|
            if ( row[:state] != 6 )     # DONE
                doc = Document.new(row[:body])

                # Get max ID
                max_id = -1

                doc.root.each_element("TEMPLATE/DISK/DISK_ID") { |e|
                    disk_id = e.text.to_i

                    max_id = disk_id if disk_id > max_id
                }

                doc.root.each_element("TEMPLATE/CONTEXT") { |e|
                    e.delete_element("DISK_ID")
                    e.add_element("DISK_ID").text = (max_id + 1).to_s
                }

                row[:body] = doc.root.to_s
            end

            @db[:vm_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => row[:body],
                :uid        => row[:uid],
                :gid        => row[:gid],
                :last_poll  => row[:last_poll],
                :state      => row[:state],
                :lcm_state  => row[:lcm_state],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.run "DROP TABLE old_vm_pool;"


        return true
    end
end
