# -------------------------------------------------------------------------- *
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    *
# not use this file except in compliance with the License. You may obtain    *
# a copy of the License at                                                   *
#                                                                            *
# http://www.apache.org/licenses/LICENSE-2.0                                 *
#                                                                            *
# Unless required by applicable law or agreed to in writing, software        *
# distributed under the License is distributed on an "AS IS" BASIS,          *
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
# See the License for the specific language governing permissions and        *
# limitations under the License.                                             *
# -------------------------------------------------------------------------- *

require "rexml/document"
include REXML

module Migrator
    def db_version
        "3.1.0"
    end

    def one_version
        "OpenNebula 3.1.0"
    end

    def up
        [   [:group_pool,   "group"],
            [:host_pool,    "host"],
            [:image_pool,   "image"],
            [:network_pool, "network"],
            [:template_pool,"template"],
            [:user_pool,    "user"],
            [:vm_pool,      "vm"]
        ].each { |pair|
            # Check that all objects have names shorter that 128
            check_names(pair[0], pair[1])

            # Change the name column to 128 chars. In SQLite, ALTER COLUMN is
            # not supported, but since the char limit is ignored,
            # VARCHAR(128) and VARCHAR(256) are the same type
            if ( self.class == BackEndMySQL )
                @db.run "ALTER TABLE #{pair[0]} CHANGE name name VARCHAR(128);"
            end
        }

        @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"
        @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, public INTEGER, UNIQUE(name,uid) );"

        @db.fetch("SELECT * FROM old_image_pool") do |row|
            doc = Document.new(row[:body])

            fstype = ""
            doc.root.each_element("TEMPLATE/FSTYPE") { |e|
                fstype = e.text
            }

            fstype_elem      = doc.root.add_element("FSTYPE")
            fstype_elem.text = fstype

            path = ""
            doc.root.each_element("TEMPLATE/PATH") { |e|
                path = e.text
            }

            path_elem       = doc.root.add_element("PATH")
            path_elem.text  = path

            @db[:image_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :public     => row[:public])
        end

        @db.run "DROP TABLE old_image_pool;"


        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_user_pool") do |row|
            doc = Document.new(row[:body])

            # TODO: Try to guess if the password contains a DN and set the
            # driver to 'x509', or assume ssh if the password is not hex
            auth_elem      = doc.root.add_element("AUTH_DRIVER")
            auth_elem.text = "core"

            doc.root.add_element("TEMPLATE")

            @db[:user_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s)
        end

        @db.run "DROP TABLE old_user_pool;"


        return true
    end

    def check_names(table, elem)
        @db.run "CREATE TABLE migrator_tmp (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT);"

        @db.fetch("SELECT * FROM #{table}") do |row|
            if ( row[:name].length > 128 )
                # Element name is bigger than 128 chars
                new_name = "#{elem}-#{row[:oid]}-#{row[:name][0..99]}"

                doc = Document.new(row[:body])

                doc.root.each_element("NAME") { |e|
                    e.text = new_name
                }

                @db[:migrator_tmp].insert(
                    :oid        => row[:oid],
                    :name       => new_name,
                    :body       => doc.root.to_s)

                puts "    > #{elem} ##{row[:oid]} had a name bigger than 128 chars and has been renamed to #{new_name[0..10]}..."
            end
        end

        @db.fetch("SELECT * FROM migrator_tmp") do |row|
            @db[table].filter(:oid => row[:oid]).update(
                :name => row[:name],
                :body => row[:body])
        end

        @db.run "DROP TABLE migrator_tmp"
    end
end
