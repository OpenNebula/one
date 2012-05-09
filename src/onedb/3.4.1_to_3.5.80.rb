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
        "3.5.80"
    end

    def one_version
        "OpenNebula 3.5.80"
    end

    def up

        @db.run "ALTER TABLE datastore_pool RENAME TO old_datastore_pool;"
        @db.run "CREATE TABLE datastore_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_datastore_pool") do |row|
            doc = Document.new(row[:body])

            doc.root.add_element("DISK_TYPE").text = "0"

            @db[:datastore_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.run "DROP TABLE old_datastore_pool;"


        @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"
        @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

        @db.fetch("SELECT * FROM old_image_pool") do |row|
            doc = Document.new(row[:body])

            ds_id = ""
            doc.root.each_element("DATASTORE_ID") { |e|
                ds_id = e.text
            }

            doc.root.add_element("DISK_TYPE").text = "0"

            @db[:image_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.run "DROP TABLE old_image_pool;"


        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.fetch("SELECT * FROM old_vm_pool") do |row|
            doc = Document.new(row[:body])

            doc.root.add_element("RESCHED").text = "0"

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
        @db.run "CREATE TABLE history (vid INTEGER, seq INTEGER, body TEXT, stime INTEGER, etime INTEGER, PRIMARY KEY(vid,seq));"

        @db.fetch("SELECT * FROM old_history") do |row|
            doc = Document.new(row[:body])

            doc.root.add_element("OID").text = row[:vid].to_s

            stime = "0"
            doc.root.each_element("STIME") { |e|
                stime = e.text
            }

            etime = "0"
            doc.root.each_element("ETIME") { |e|
                etime = e.text
            }

            @db.fetch("SELECT body FROM vm_pool WHERE oid = #{row[:vid]}") do |vm_row|
                vm_doc = Document.new(vm_row[:body])

                vm_doc.root.delete_element( '/VM/HISTORY_RECORDS/HISTORY' )

                ["MEMORY", "CPU", "NET_TX", "NET_RX"].each { |elem_name|
                    vm_doc.root.each_element(elem_name) { |e|
                        e.text = "0"
                    }
                }

                doc.root.add_element( vm_doc )
            end

            @db[:history].insert(
                :vid        => row[:vid],
                :seq        => row[:seq],
                :body       => doc.root.to_s,
                :stime      => stime,
                :etime      => etime)
        end

        @db.run "DROP TABLE old_history;"


        return true
    end
end
