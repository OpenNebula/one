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

        return true
    end

    def check_names(table, elem)
        @db.fetch("SELECT * FROM #{table}") do |row|
            if ( row[:name].length > 128 )
                # Element name is bigger than 128 chars
                new_name = "#{elem}-#{row[:oid]}-#{row[:name][0..99]}"

                doc = Document.new(row[:body])

                doc.root.each_element("NAME") { |e|
                    e.text = new_name

                    @db[table].filter(:oid => row[:oid]).update(
                        :name => new_name,
                        :body => doc.root.to_s)
                }

                puts "    > #{elem} ##{row[:oid]} had a name bigger than 128 chars and has been renamed to #{new_name[0..10]}..."
            end
        end
    end
end
