# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
        "4.0.0"
    end

    def one_version
        "OpenNebula 4.0.0"
    end

    def up

        ########################################################################
        # Feature #1631: Add ACTION to history entries
        ########################################################################

        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.fetch("SELECT * FROM old_vm_pool") do |row|
            doc = Document.new(row[:body])

            doc.root.each_element("HISTORY_RECORDS/HISTORY") do |e|
                update_history(e)
            end

            @db[:vm_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
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

        @db.run "ALTER TABLE history RENAME TO old_history;"
        @db.run "CREATE TABLE history (vid INTEGER, seq INTEGER, body MEDIUMTEXT, stime INTEGER, etime INTEGER,PRIMARY KEY(vid,seq));"

        @db.fetch("SELECT * FROM old_history") do |row|
            doc = Document.new(row[:body])

            doc.root.each_element("/HISTORY") do |e|
                update_history(e)
            end

            @db[:history].insert(
                :vid    => row[:vid],
                :seq    => row[:seq],
                :body   => doc.root.to_s,
                :stime  => row[:stime],
                :etime  => row[:etime])
        end

        @db.run "DROP TABLE old_history;"


        return true
    end

    def update_history(history_elem)
        history_elem.add_element("ACTION").text = "0" # NONE_ACTION

        # History reason enum has changed from
        # NONE, ERROR, STOP_RESUME, USER, CANCEL   to
        # NONE, ERROR, USER
        history_elem.each_element("REASON") do |reason_e|
            reason = reason_e.text.to_i

            if reason > 1           # STOP_RESUME, USER, CANCEL
                reason_e.text = "2" # USER
            end
        end
    end
end
